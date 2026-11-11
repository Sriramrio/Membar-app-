using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Sethu.Domain.Entities;
using Sethu.Domain;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Layered;

namespace Sethu.Api.Controllers;

public sealed record CreateMemberVisitorInvitationDto(string? FirstName, string? LastName,
    string? CompanyName, string? Email, string? Mobile, string? IdempotencyKey);

[ApiController]
[Authorize]
[Route("api/v1/me/visitor-invitations")]
public sealed class MemberVisitorInvitationsController(
    ICurrentNetworkMember current, 
    SethuDbContext db,
    ILogger<MemberVisitorInvitationsController> logger) : ControllerBase
{
    // Schema creation belongs to EF Core migrations, not an authenticated HTTP request.
    // Missing tables therefore fail visibly through the existing API error pipeline.

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        try
        {
            var actor = await current.ResolveAsync(User, ct);
            if (actor is null)
            {
                logger.LogWarning("List invitations forbidden: actor is null");
                return Forbid();
            }
            if (page < 1 || page > 100000 || pageSize is < 1 or > 100 || ((long)(page - 1) * pageSize) > int.MaxValue) return BadRequest(new { code = "INVALID_PAGE" });
            var items = await db.VisitorInvitations.AsNoTracking()
                .Where(x => x.TenantId == actor.TenantId && x.InviterMemberId == actor.MemberId)
                .OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .Select(x => new { x.Id, x.Reference, x.FirstName, x.LastName, x.CompanyName,
                    x.Email, x.Mobile, x.Status, x.CreatedAt, x.ExpiresAt, x.ChapterId })
                .ToListAsync(ct);
            return Ok(new { items, page, pageSize });
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return StatusCode(499);
        }
    }

    // UTC half-open range: reporting is based on persisted invitation creation time.
    [HttpGet("summary")]
    public async Task<IActionResult> Summary([FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? toExclusive, CancellationToken ct)
    {
        try
        {
            var actor = await current.ResolveAsync(User, ct);
            if (actor is null) return Forbid();
            if (!from.HasValue || !toExclusive.HasValue || from.Value >= toExclusive.Value ||
                toExclusive.Value - from.Value > TimeSpan.FromDays(3660))
                return BadRequest(new { code = "INVALID_REPORT_RANGE" });
            var query = db.VisitorInvitations.AsNoTracking().Where(x =>
                x.TenantId == actor.TenantId && x.InviterMemberId == actor.MemberId &&
                x.CreatedAt >= from.Value && x.CreatedAt < toExclusive.Value);
            var invitationsCreated = await query.CountAsync(ct);
            var deliveryPending = await query.CountAsync(x => x.Status == "DeliveryPending", ct);
            var cancelled = await query.CountAsync(x => x.Status == "Cancelled", ct);
            // A visitor registration or membership conversion must never be inferred from
            // invitation status. Report only facts supported by the current persisted model.
            var officialConversions = await db.VisitorConversionCredits.AsNoTracking().CountAsync(x =>
                x.TenantId == actor.TenantId && x.InviterMemberId == actor.MemberId &&
                x.ActivatedAt >= from.Value && x.ActivatedAt < toExclusive.Value, ct);
            return Ok(new { invitationsCreated, deliveryPending, cancelled,
                officialConversions, conversionPeriodBasis = "activation", from, toExclusive });
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return StatusCode(499);
        }
    }

    // Paginated, member-owned official conversion history. No visitor contact PII.
    [HttpGet("conversions")]
    public async Task<IActionResult> MyConversions([FromQuery] DateTimeOffset from,
        [FromQuery] DateTimeOffset toExclusive, [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25, CancellationToken ct = default)
    {
        try
        {
            var actor = await current.ResolveAsync(User, ct);
            if (actor is null) return Forbid();
            if (from == default || toExclusive <= from ||
                toExclusive - from > TimeSpan.FromDays(3660) || page < 1 || page > 100000 ||
                pageSize is < 1 or > 100 || (long)(page - 1) * pageSize > int.MaxValue)
                return BadRequest(new { code = "INVALID_CONVERSION_HISTORY_QUERY" });
            var query = db.VisitorConversionCredits.AsNoTracking().Where(x =>
                x.TenantId == actor.TenantId && x.InviterMemberId == actor.MemberId &&
                x.ActivatedAt >= from && x.ActivatedAt < toExclusive);
            var total = await query.CountAsync(ct);
            var items = await query.OrderByDescending(x => x.ActivatedAt).ThenBy(x => x.Id)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .Select(x => new { x.Id, x.InvitationId, x.ActivatedAt, x.ChapterId })
                .ToListAsync(ct);
            return Ok(new { from, toExclusive, total, page, pageSize,
                periodBasis = "canonical_activation", items });
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return StatusCode(499);
        }
    }

    // Cancellation is an atomic, member-owned state transition. An invitation that has
    // progressed beyond DeliveryPending cannot be cancelled by this endpoint.
    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken ct)
    {
        if (id == Guid.Empty) return BadRequest(new { code = "INVALID_INVITATION" });
        var actor = await current.ResolveAsync(User, ct);
        if (actor is null) return Forbid();
        var record = await db.VisitorInvitations.AsNoTracking().Where(x =>
            x.Id == id && x.TenantId == actor.TenantId && x.InviterMemberId == actor.MemberId)
            .Select(x => new { x.Status }).FirstOrDefaultAsync(ct);
        if (record is null) return NotFound(new { code = "INVITATION_NOT_FOUND" });
        if (record.Status == "Cancelled") return Ok(new { id, status = "Cancelled", replayed = true });
        if (record.Status != "DeliveryPending") return Conflict(new { code = "INVITATION_NOT_CANCELLABLE" });
        await using var cancellationTx = await db.Database.BeginTransactionAsync(ct);
        var updated = await db.VisitorInvitations.Where(x => x.Id == id &&
            x.TenantId == actor.TenantId && x.InviterMemberId == actor.MemberId &&
            x.Status == "DeliveryPending")
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.Status, "Cancelled"), ct);
        if (updated != 1) return Conflict(new { code = "INVITATION_CHANGED_RETRY" });
        // A delivery worker must check the invitation state before invoking the provider.
        // A cancelled intent is explicitly dead-lettered to avoid unbounded retries.
        await db.Outbox.Where(x => x.ResourceId == id && x.TenantId == actor.TenantId &&
                x.Event == "visitor.invitation.delivery-requested.v1" && x.DispatchedAt == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.DeadLettered, true)
                .SetProperty(x => x.LastErrorCode, "invitation_cancelled"), ct);
        await cancellationTx.CommitAsync(ct);
        return Ok(new { id, status = "Cancelled", replayed = false });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMemberVisitorInvitationDto? dto, CancellationToken ct)
    {
        try
        {
            var actor = await current.ResolveAsync(User, ct);
            if (actor is null)
            {
                logger.LogWarning("Create invitation forbidden: actor could not be resolved");
                return Forbid();
            }
            if (dto is null || string.IsNullOrWhiteSpace(dto.FirstName) ||
                string.IsNullOrWhiteSpace(dto.LastName) || string.IsNullOrWhiteSpace(dto.CompanyName) ||
                string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Mobile) ||
                string.IsNullOrWhiteSpace(dto.IdempotencyKey))
                return BadRequest(new { code = "REQUIRED_FIELDS_MISSING" });
            var first = dto.FirstName.Trim(); var last = dto.LastName.Trim();
            var company = dto.CompanyName.Trim(); var email = dto.Email.Trim().ToLowerInvariant();
            var mobile = dto.Mobile.Trim(); var key = dto.IdempotencyKey.Trim();
            if (first.Length > 100 || last.Length > 100 || company.Length > 200 ||
                email.Length > 254 || mobile.Length > 32 || key.Length > 120 ||
                !System.Net.Mail.MailAddress.TryCreate(email, out var address) ||
                !string.Equals(address.Address, email, StringComparison.OrdinalIgnoreCase) ||
                mobile.Length < 7 || mobile.Count(char.IsDigit) < 7 ||
                mobile.Any(c => !char.IsDigit(c) && c != '+' && c != '-' && c != ' '))
                return BadRequest(new { code = "INVALID_VISITOR_INPUT" });

            // No invitation may create, reactivate, or provision a membership/Parivar affiliation.
            // The session's MemberId must match a real, active canonical member record.
            var member = await db.Set<MemberRecord>().AsNoTracking()
                .SingleOrDefaultAsync(m => m.Id == actor.MemberId &&
                    m.UserId == actor.UserId && m.TenantId == actor.TenantId, ct);
            if (member is null || member.Status != MemberRecordStatus.Active)
                return Conflict(new { code = "ACTIVE_MEMBERSHIP_REQUIRED" });

            var affiliations = await db.Set<MemberChapterAffiliation>().AsNoTracking()
                .Where(a => a.MemberId == member.Id && a.TenantId == actor.TenantId &&
                    a.Status == AffiliationStatus.Active).Take(2).ToListAsync(ct);
            if (affiliations.Count != 1)
                return Conflict(new { code = "ACTIVE_PARIVAR_NOT_UNAMBIGUOUS" });
            var chapterId = affiliations[0].ChapterId;
            var isChapterActive = await db.Units.AsNoTracking().AnyAsync(
                u => u.Id == chapterId && u.Active, ct)
                || await db.Chapters.AsNoTracking().AnyAsync(
                c => c.Id == chapterId && c.Status == "ACTIVE", ct);
            if (!isChapterActive) return Conflict(new { code = "PARIVAR_NOT_ACTIVE" });

            // Persisted per-member quotas also apply after process restarts. The check is
            // advisory under concurrency; the idempotency unique index remains authoritative.
            // Replay is resolved first so a harmless retry is not blocked by quota.
            var existing = await db.VisitorInvitations.AsNoTracking().FirstOrDefaultAsync(x =>
                x.TenantId == actor.TenantId && x.InviterMemberId == member.Id && x.IdempotencyKey == key, ct);
            if (existing is not null && (existing.Email != email || existing.Mobile != mobile || existing.FirstName != first || existing.LastName != last || existing.CompanyName != company))
                return Conflict(new { code = "IDEMPOTENCY_PAYLOAD_MISMATCH" });
            if (existing is not null)
                return Ok(new { existing.Id, existing.Reference, existing.Status, existing.CreatedAt, replayed = true });

            var now = DateTimeOffset.UtcNow;
            var dailyCount = await db.VisitorInvitations.AsNoTracking().CountAsync(x =>
                x.TenantId == actor.TenantId && x.InviterMemberId == member.Id &&
                x.CreatedAt >= now.AddHours(-24), ct);
            if (dailyCount >= 25) return StatusCode(429, new { code = "INVITATION_RATE_LIMIT" });
            var invitation = new VisitorInvitation {
                Id = Guid.NewGuid(), TenantId = actor.TenantId, InviterMemberId = member.Id,
                ChapterId = chapterId, FirstName = first, LastName = last, CompanyName = company,
                Email = email, Mobile = mobile, IdempotencyKey = key,
                Reference = "INV-" + Convert.ToHexString(RandomNumberGenerator.GetBytes(8)),
                Status = "DeliveryPending", CreatedAt = now, ExpiresAt = now.AddDays(14)
            };
            db.VisitorInvitations.Add(invitation);
            // The invitation and its delivery intent are persisted atomically in one EF save.
            // This event is not proof of delivery. No mail transport or registration token is
            // configured here; workers must fail closed until a verified provider exists.
            db.Outbox.Add(new Outbox {
                Id = Guid.NewGuid(), TenantId = actor.TenantId, ResourceId = invitation.Id,
                Event = "visitor.invitation.delivery-requested.v1", OccurredAt = now
            });
            try { await db.SaveChangesAsync(ct); }
            catch (DbUpdateException)
            {
                db.ChangeTracker.Clear();
                var replay = await db.VisitorInvitations.AsNoTracking().FirstOrDefaultAsync(x =>
                    x.TenantId == actor.TenantId && x.InviterMemberId == member.Id && x.IdempotencyKey == key, ct);
                if (replay is not null && (replay.Email != email || replay.Mobile != mobile || replay.FirstName != first || replay.LastName != last || replay.CompanyName != company))
                    return Conflict(new { code = "IDEMPOTENCY_PAYLOAD_MISMATCH" });
                if (replay is not null) return Ok(new { replay.Id, replay.Reference, replay.Status, replay.CreatedAt, replayed = true });
                throw;
            }
            // DeliveryPending is not Sent. No registration credential is issued until
            // a durable delivery worker, suppression policy and secure token lifecycle exist.
            return Created($"/api/v1/me/visitor-invitations/{invitation.Id}",
                new { invitation.Id, invitation.Reference, invitation.Status, invitation.CreatedAt, replayed = false });
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return StatusCode(499);
        }
    }
}

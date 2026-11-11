using System;
using System.Data;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Infrastructure.Persistence;
using Sethu.Domain.Entities;
using Sethu.Service.Abstractions.Organisation;
using Sethu.Service.Security;

namespace Sethu.Api.Controllers.Organisation;

[ApiController]
[Authorize]
[TypeFilter(typeof(Sethu.Api.Security.OrgLegacyAuthorizationFilter))]
[Route("api/organisational")]
public sealed class OrgMembersController : ControllerBase
{
    private readonly IOrgMembersService _service;
    private readonly SethuDbContext _db;
    private readonly IAuthenticatedActorResolver _actorResolver;
    private Guid GetTenantId() => HttpContext.Items.TryGetValue("Sethu.TrustedTenantId", out var tenant) && tenant is Guid id && id != Guid.Empty ? id : throw new UnauthorizedAccessException("Trusted tenant not resolved");

    public OrgMembersController(IOrgMembersService service, SethuDbContext db, IAuthenticatedActorResolver actorResolver) { _service = service; _db = db; _actorResolver = actorResolver; }

    // The legacy organisation filter only admits explicit tenant-wide organisation.members.read/write
    // grants. Do not interpret a caller-supplied chapter as an authorization grant.
    [HttpGet("visitors/registrations")]
    public async Task<IActionResult> VisitorRegistrations([FromQuery] Guid chapterId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25, CancellationToken ct = default)
    {
        if (chapterId == Guid.Empty || page < 1 || page > 100000 || pageSize is < 1 or > 100 ||
            (long)(page - 1) * pageSize > int.MaxValue)
            return BadRequest(new { code = "INVALID_VISITOR_QUERY" });
        var tenant = GetTenantId();
        var chapterExists = await _db.Units.AsNoTracking().AnyAsync(
            u => u.Id == chapterId && u.TenantId == tenant && u.Active, ct);
        if (!chapterExists) return NotFound(new { code = "CHAPTER_NOT_FOUND" });
        var query = _db.VisitorRegistrations.AsNoTracking().Where(
            r => r.TenantId == tenant && r.ChapterId == chapterId);
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(r => r.CreatedAt).ThenBy(r => r.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(r => new { r.Id, r.FullName, r.BusinessName, r.Verified,
                r.VisitingDate, r.CreatedAt }) .ToListAsync(ct);
        return Ok(new { items, total, page, pageSize, chapterId });
    }

    [HttpGet("visitors/invitations/summary")]
    public async Task<IActionResult> VisitorInvitationSummary([FromQuery] Guid chapterId,
        [FromQuery] DateTimeOffset? from, [FromQuery] DateTimeOffset? toExclusive,
        CancellationToken ct = default)
    {
        if (chapterId == Guid.Empty || !from.HasValue || !toExclusive.HasValue ||
            from.Value >= toExclusive.Value || toExclusive.Value - from.Value > TimeSpan.FromDays(3660))
            return BadRequest(new { code = "INVALID_VISITOR_REPORT_RANGE" });
        var tenant = GetTenantId();
        if (!await _db.Units.AsNoTracking().AnyAsync(u =>
            u.Id == chapterId && u.TenantId == tenant && u.Active, ct))
            return NotFound(new { code = "CHAPTER_NOT_FOUND" });
        var invitations = _db.VisitorInvitations.AsNoTracking().Where(i =>
            i.TenantId == tenant && i.ChapterId == chapterId &&
            i.CreatedAt >= from.Value && i.CreatedAt < toExclusive.Value);
        var created = await invitations.CountAsync(ct);
        var cancelled = await invitations.CountAsync(i => i.Status == "Cancelled", ct);
        var linked = await invitations.CountAsync(i => i.VisitorRegistrationId != null, ct);
        var attendance = await _db.VisitorEventAttendances.AsNoTracking().CountAsync(a =>
            a.TenantId == tenant && a.ChapterId == chapterId &&
            a.VerifiedAt >= from.Value && a.VerifiedAt < toExclusive.Value, ct);
        var followUps = await _db.VisitorFollowUps.AsNoTracking().CountAsync(f =>
            f.TenantId == tenant && f.ChapterId == chapterId &&
            f.CreatedAt >= from.Value && f.CreatedAt < toExclusive.Value, ct);
        return Ok(new { chapterId, from, toExclusive, invitationsCreated = created,
            cancelled, verifiedRegistrationLinked = linked, attendanceVerified = attendance, followUpsCreated = followUps });
    }

    // Composite lifecycle view: reports only canonical persisted facts. Membership conversion
    // remains unasserted until an approved cross-domain identity/activation linkage exists.
    [HttpGet("visitors/lifecycle")]
    public async Task<IActionResult> VisitorLifecycle([FromQuery] Guid chapterId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25, CancellationToken ct = default)
    {
        if (chapterId == Guid.Empty || page < 1 || page > 100000 || pageSize is < 1 or > 100 ||
            (long)(page - 1) * pageSize > int.MaxValue)
            return BadRequest(new { code = "INVALID_VISITOR_QUERY" });
        var tenant = GetTenantId();
        if (!await _db.Units.AsNoTracking().AnyAsync(u =>
            u.Id == chapterId && u.TenantId == tenant && u.Active, ct))
            return NotFound(new { code = "CHAPTER_NOT_FOUND" });
        var registrations = _db.VisitorRegistrations.AsNoTracking().Where(r =>
            r.TenantId == tenant && r.ChapterId == chapterId);
        var total = await registrations.CountAsync(ct);
        var rows = await registrations.OrderByDescending(r => r.CreatedAt).ThenBy(r => r.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(r => new {
                r.Id, r.FullName, r.BusinessName, r.Verified, r.CreatedAt,
                InvitationReference = _db.VisitorInvitations.AsNoTracking()
                    .Where(i => i.TenantId == tenant && i.ChapterId == chapterId &&
                        i.VisitorRegistrationId == r.Id)
                    .Select(i => i.Reference).FirstOrDefault(),
                VerifiedAttendanceCount = _db.VisitorEventAttendances.AsNoTracking()
                    .Count(a => a.TenantId == tenant && a.ChapterId == chapterId &&
                        a.RegistrationId == r.Id),
                FollowUpCount = _db.VisitorFollowUps.AsNoTracking()
                    .Count(f => f.TenantId == tenant && f.ChapterId == chapterId &&
                        f.RegistrationId == r.Id),
                LastFollowUpOutcome = _db.VisitorFollowUps.AsNoTracking()
                    .Where(f => f.TenantId == tenant && f.ChapterId == chapterId &&
                        f.RegistrationId == r.Id)
                    .OrderByDescending(f => f.CreatedAt).ThenByDescending(f => f.Id)
                    .Select(f => f.Outcome).FirstOrDefault()
            }).ToListAsync(ct);
        return Ok(new { items = rows, total, page, pageSize, chapterId,
            applicationLinkVerified = false, conversionAttributionAvailable = false });
    }

    public sealed record VisitorIntakeLinkRequest(Guid RegistrationId, Guid IntakeId);

    // Manual, audited-by-operator provenance link: does not create, submit, approve or activate an intake.
    // The two records must be in the same tenant and chapter. Applicant identity is verified from
    // the intake's canonical user identity, rather than from a client-supplied name.
    [HttpPost("visitors/intake-links")]
    public async Task<IActionResult> LinkVisitorIntake([FromBody] VisitorIntakeLinkRequest? request,
        CancellationToken ct = default)
    {
        if (request is null || request.RegistrationId == Guid.Empty || request.IntakeId == Guid.Empty)
            return BadRequest(new { code = "INVALID_INTAKE_LINK" });
        var tenant = GetTenantId();
        var actor = await _actorResolver.ResolveAsync(User, ct);
        if (!actor.Succeeded || actor.Actor is null || actor.Actor.TenantId != tenant)
            return Unauthorized(new { code = "IDENTITY_UNVERIFIED" });
        var visitor = await _db.VisitorRegistrations.AsNoTracking().SingleOrDefaultAsync(r =>
            r.Id == request.RegistrationId && r.TenantId == tenant && r.Verified, ct);
        var intake = await _db.Set<Sethu.Domain.Membership.MemberIntake>().AsNoTracking().SingleOrDefaultAsync(i =>
            i.Id == request.IntakeId && i.TenantId == tenant, ct);
        if (visitor is null || intake is null || visitor.ChapterId != intake.ChapterId)
            return Conflict(new { code = "INTAKE_VISITOR_SCOPE_OR_VERIFICATION_MISMATCH" });
        var identity = await _db.UserIdentities.AsNoTracking().SingleOrDefaultAsync(u =>
            u.Id == intake.ApplicantUserId && u.TenantId == tenant && u.Active, ct);
        // Contact matching is an eligibility safeguard, not sufficient proof for automated merging.
        // Verified links still require an authorised officer action and retain provenance.
        if (identity is null || !identity.IsContactVerified || string.IsNullOrWhiteSpace(identity.Email) ||
            !string.Equals(identity.Email.Trim(), visitor.Email.Trim(), StringComparison.OrdinalIgnoreCase))
            return Conflict(new { code = "APPLICANT_CONTACT_NOT_VERIFIED" });
        var existing = await _db.VisitorIntakeLinks.AsNoTracking().SingleOrDefaultAsync(x =>
            x.TenantId == tenant && (x.RegistrationId == request.RegistrationId || x.IntakeId == request.IntakeId), ct);
        if (existing is not null)
            return existing.RegistrationId == request.RegistrationId && existing.IntakeId == request.IntakeId
                ? Ok(new { linkId = existing.Id, replayed = true })
                : Conflict(new { code = "INTAKE_LINK_CONFLICT" });
        var link = new VisitorIntakeLink { Id = Guid.NewGuid(), TenantId = tenant,
            ChapterId = visitor.ChapterId, RegistrationId = visitor.Id, IntakeId = intake.Id,
            LinkedByUserId = actor.Actor.UserId, LinkedAt = DateTimeOffset.UtcNow };
        _db.VisitorIntakeLinks.Add(link);
        try { await _db.SaveChangesAsync(ct); }
        catch (DbUpdateException)
        {
            _db.Entry(link).State = EntityState.Detached;
            return Conflict(new { code = "INTAKE_LINK_CONCURRENT_CONFLICT" });
        }
        return Ok(new { linkId = link.Id, replayed = false, membershipActivated = false });
    }

    // Read-only evidence: credit is recognized only if the governed intake and canonical
    // member record BOTH show actual activation, not a legacy stage or browser flag.
    [HttpGet("visitors/conversions")]
    public async Task<IActionResult> VisitorConversions([FromQuery] Guid chapterId,
        [FromQuery] DateTimeOffset from, [FromQuery] DateTimeOffset toExclusive,
        CancellationToken ct = default)
    {
        if (chapterId == Guid.Empty || from == default || toExclusive <= from ||
            toExclusive - from > TimeSpan.FromDays(3660))
            return BadRequest(new { code = "INVALID_CONVERSION_RANGE" });
        var tenant = GetTenantId();
        if (!await _db.Units.AsNoTracking().AnyAsync(x => x.Id == chapterId && x.TenantId == tenant && x.Active, ct))
            return NotFound(new { code = "CHAPTER_NOT_FOUND" });
        var active = await (from link in _db.VisitorIntakeLinks.AsNoTracking()
            join intake in _db.Set<Sethu.Domain.Membership.MemberIntake>().AsNoTracking() on link.IntakeId equals intake.Id
            join member in _db.Set<Sethu.Domain.MemberBusiness.MemberRecord>().AsNoTracking()
                on intake.ApplicantUserId equals member.UserId
            where link.TenantId == tenant && link.ChapterId == chapterId &&
                intake.TenantId == tenant && member.TenantId == tenant &&
                intake.State == Sethu.Domain.Membership.IntakeState.Activated &&
                member.Status == Sethu.Domain.MemberBusiness.MemberRecordStatus.Active &&
                link.LinkedAt >= @from && link.LinkedAt < toExclusive
            select member.Id).Distinct().CountAsync(ct);
        var credits = await _db.VisitorConversionCredits.AsNoTracking().CountAsync(x =>
            x.TenantId == tenant && x.ChapterId == chapterId &&
            x.ActivatedAt >= from && x.ActivatedAt < toExclusive, ct);
        return Ok(new { chapterId, from, toExclusive, verifiedActiveLinkedMembers = active,
            periodBasis = "activation_for_official_credit;link_creation_for_linked_evidence",
            officialConversionCredits = credits,
            officialCreditSource = "governed_finance_activation_transaction" });
    }

    // Official credits only; activation-time range is separate from invitation cohort dates.
    [HttpGet("visitors/conversions/history")]
    public async Task<IActionResult> VisitorConversionHistory([FromQuery] Guid chapterId,
        [FromQuery] DateTimeOffset from, [FromQuery] DateTimeOffset toExclusive,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        if (chapterId == Guid.Empty || from == default || toExclusive <= from ||
            toExclusive - from > TimeSpan.FromDays(3660) || page < 1 || page > 100000 ||
            pageSize is < 1 or > 100 || (long)(page - 1) * pageSize > int.MaxValue)
            return BadRequest(new { code = "INVALID_CONVERSION_HISTORY_QUERY" });
        var tenant = GetTenantId();
        if (!await _db.Units.AsNoTracking().AnyAsync(x =>
            x.TenantId == tenant && x.Id == chapterId && x.Active, ct))
            return NotFound(new { code = "CHAPTER_NOT_FOUND" });
        var query = _db.VisitorConversionCredits.AsNoTracking().Where(x =>
            x.TenantId == tenant && x.ChapterId == chapterId &&
            x.ActivatedAt >= from && x.ActivatedAt < toExclusive);
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(x => x.ActivatedAt).ThenBy(x => x.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new { x.Id, x.RegistrationId, x.IntakeId, x.MemberId,
                x.InvitationId, x.InviterMemberId, x.ActivatedAt })
            .ToListAsync(ct);
        return Ok(new { chapterId, from, toExclusive, total, page, pageSize,
            periodBasis = "canonical_activation", items });
    }

    // Read-only reconciliation queue. Never awards credit or infers activation time from
    // intake creation, visitor linkage, or the member's current Active state.
    // The existing Organisation filter currently requires a tenant-wide permission.
    [HttpGet("visitors/conversions/reconciliation")]
    public async Task<IActionResult> VisitorConversionReconciliation([FromQuery] Guid chapterId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        if (chapterId == Guid.Empty || page < 1 || page > 100000 || pageSize is < 1 or > 100 ||
            (long)(page - 1) * pageSize > int.MaxValue)
            return BadRequest(new { code = "INVALID_RECONCILIATION_QUERY" });
        var tenant = GetTenantId();
        if (!await _db.Units.AsNoTracking().AnyAsync(x =>
            x.TenantId == tenant && x.Id == chapterId && x.Active, ct))
            return NotFound(new { code = "CHAPTER_NOT_FOUND" });

        // Limit records to tenant and chapter before projecting. Never surface private
        // applicant documents, payment evidence, or arbitrary identity information.
        // An Activated intake alone is not evidence of a canonical active Member.
        // Restrict reconciliation to actual active Member records before offering it to an officer.
        var query = from link in _db.VisitorIntakeLinks.AsNoTracking()
                    join intake in _db.Set<Sethu.Domain.Membership.MemberIntake>().AsNoTracking()
                        on link.IntakeId equals intake.Id
                    join member in _db.Set<Sethu.Domain.MemberBusiness.MemberRecord>().AsNoTracking()
                        on new { UserId = intake.ApplicantUserId, TenantId = intake.TenantId }
                        equals new { UserId = member.UserId, TenantId = member.TenantId }
                    where link.TenantId == tenant && link.ChapterId == chapterId &&
                        intake.TenantId == tenant && intake.ChapterId == chapterId &&
                        intake.State == Sethu.Domain.Membership.IntakeState.Activated &&
                        member.Status == Sethu.Domain.MemberBusiness.MemberRecordStatus.Active &&
                        !_db.VisitorConversionCredits.Any(c =>
                            c.TenantId == tenant && c.IntakeId == link.IntakeId)
                    select link;
        var total = await query.CountAsync(ct);
        var links = await query.OrderBy(x => x.LinkedAt).ThenBy(x => x.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new { x.Id, x.RegistrationId, x.IntakeId, x.LinkedAt })
            .ToListAsync(ct);
        var ids = links.Select(x => x.RegistrationId).ToArray();
        var invitationGroups = await _db.VisitorInvitations.AsNoTracking()
            .Where(x => x.TenantId == tenant && x.ChapterId == chapterId &&
                x.VisitorRegistrationId.HasValue && ids.Contains(x.VisitorRegistrationId.Value) &&
                x.Status != "Cancelled")
            .GroupBy(x => x.VisitorRegistrationId!.Value)
            .Select(g => new { RegistrationId = g.Key, Count = g.Count() })
            .ToListAsync(ct);
        var counts = invitationGroups.ToDictionary(x => x.RegistrationId, x => x.Count);
        var items = links.Select(x => new {
            linkId = x.Id, x.RegistrationId, x.IntakeId, x.LinkedAt,
            eligibleInvitationCount = counts.GetValueOrDefault(x.RegistrationId),
            reason = counts.GetValueOrDefault(x.RegistrationId) switch {
                0 => "NO_ELIGIBLE_INVITATION", 1 => "ACTIVATED_WITHOUT_CREDIT_REQUIRES_ACTIVATION_EVIDENCE",
                _ => "MULTIPLE_INVITERS_REQUIRE_GOVERNED_DECISION"
            }
        });
        return Ok(new { chapterId, items, total, page, pageSize,
            officialCreditsCreated = false, activationTimestampInferred = false });
    }

    // Tenant-wide institutional rollup only. The legacy filter requires an explicit
    // organisation.members.read grant; scoped users must not obtain network totals.
    // Counts derive exclusively from persisted credits, not intake/link status.
    [HttpGet("visitors/conversions/rollup")]
    public async Task<IActionResult> OfficialConversionRollup(
        [FromQuery] DateTimeOffset from, [FromQuery] DateTimeOffset toExclusive,
        CancellationToken ct = default)
    {
        if (from == default || toExclusive <= from ||
            toExclusive - from > TimeSpan.FromDays(3660))
            return BadRequest(new { code = "INVALID_CONVERSION_RANGE" });
        var tenant = GetTenantId();
        var credits = _db.VisitorConversionCredits.AsNoTracking().Where(x =>
            x.TenantId == tenant && x.ActivatedAt >= from && x.ActivatedAt < toExclusive);
        var total = await credits.CountAsync(ct);
        var byParivar = await credits.GroupBy(x => x.ChapterId)
            .Select(g => new { chapterId = g.Key, officialCredits = g.Count() })
            .OrderBy(x => x.chapterId).ToListAsync(ct);
        // These groups partition the same persisted official-credit table.
        // Never aggregate uncredited applications, attendance or business references.
        return Ok(new { from, toExclusive, periodBasis = "canonical_activation",
            officialCredits = total, parivars = byParivar,
            source = "visitor_conversion_credits", uncreditedIntakesIncluded = false });
    }

    public sealed record HistoricalConversionDecisionRequest(Guid LinkId, Guid InvitationId);

    // A reviewed, activation-evidence-backed reconciliation. This action NEVER activates
    // a member or changes document/committee/finance approval state. Organisation-wide
    // write authority is required by the existing filter; the link creator cannot decide.
    [HttpPost("visitors/conversions/historical-credit")]
    public async Task<IActionResult> CreditHistoricalConversion(
        [FromBody] HistoricalConversionDecisionRequest? request, CancellationToken ct = default)
    {
        if (request is null || request.LinkId == Guid.Empty || request.InvitationId == Guid.Empty)
            return BadRequest(new { code = "INVALID_HISTORICAL_CONVERSION_DECISION" });
        var tenant = GetTenantId();
        var resolved = await _actorResolver.ResolveAsync(User, ct);
        if (!resolved.Succeeded || resolved.Actor is null || resolved.Actor.TenantId != tenant)
            return Unauthorized(new { code = "IDENTITY_UNVERIFIED" });
        var reviewer = resolved.Actor.UserId;
        // Serializable transaction plus the existing credit unique indexes protect concurrent
        // adjudications; no credit may exist without canonical activation evidence.
        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        var link = await _db.VisitorIntakeLinks.AsNoTracking().SingleOrDefaultAsync(x =>
            x.Id == request.LinkId && x.TenantId == tenant, ct);
        if (link is null) return NotFound(new { code = "VISITOR_INTAKE_LINK_NOT_FOUND" });
        if (link.LinkedByUserId == reviewer)
            return Conflict(new { code = "INDEPENDENT_ATTRIBUTION_REVIEW_REQUIRED" });
        var intake = await _db.Set<Sethu.Domain.Membership.MemberIntake>().AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == link.IntakeId && x.TenantId == tenant &&
                x.ChapterId == link.ChapterId &&
                x.State == Sethu.Domain.Membership.IntakeState.Activated, ct);
        if (intake is null) return Conflict(new { code = "CANONICAL_INTAKE_NOT_ACTIVATED" });
        var visitor = await _db.VisitorRegistrations.AsNoTracking().SingleOrDefaultAsync(x =>
            x.Id == link.RegistrationId && x.TenantId == tenant &&
            x.ChapterId == link.ChapterId && x.Verified, ct);
        if (visitor is null) return Conflict(new { code = "VERIFIED_VISITOR_NOT_FOUND" });
        var identity = await _db.UserIdentities.AsNoTracking().SingleOrDefaultAsync(x =>
            x.Id == intake.ApplicantUserId && x.TenantId == tenant && x.Active && x.IsContactVerified, ct);
        if (identity is null || string.IsNullOrWhiteSpace(identity.Email) ||
            !string.Equals(identity.Email.Trim(), visitor.Email.Trim(), StringComparison.OrdinalIgnoreCase))
            return Conflict(new { code = "CANONICAL_APPLICANT_VISITOR_MISMATCH" });
        var members = await _db.Set<Sethu.Domain.MemberBusiness.MemberRecord>().AsNoTracking()
            .Where(x => x.TenantId == tenant && x.UserId == intake.ApplicantUserId &&
                x.Status == Sethu.Domain.MemberBusiness.MemberRecordStatus.Active)
            .Select(x => x.Id).ToListAsync(ct);
        if (members.Count != 1) return Conflict(new { code = "CANONICAL_ACTIVE_MEMBER_NOT_UNIQUE" });
        var memberId = members[0];
        // Historic activation timestamps come only from the canonical finance worker
        // committed audit record, NEVER the link, application or current clock date.
        var activationEvents = await _db.Audits.AsNoTracking().Where(x =>
            x.TenantId == tenant && x.ResourceId == intake.Id &&
            x.Operation == "finance.internal.business.effect" && x.Event == "activated")
            .Select(x => x.OccurredAt).ToListAsync(ct);
        if (activationEvents.Count != 1 || activationEvents[0] == default)
            return Conflict(new { code = "UNIQUE_FINANCE_ACTIVATION_EVIDENCE_REQUIRED" });
        var invitation = await _db.VisitorInvitations.AsNoTracking().SingleOrDefaultAsync(x =>
            x.Id == request.InvitationId && x.TenantId == tenant &&
            x.ChapterId == link.ChapterId && x.VisitorRegistrationId == link.RegistrationId &&
            x.Status != "Cancelled", ct);
        if (invitation is null || invitation.InviterMemberId == Guid.Empty ||
            string.IsNullOrWhiteSpace(invitation.Email) ||
            !string.Equals(invitation.Email.Trim(), visitor.Email.Trim(), StringComparison.OrdinalIgnoreCase) ||
            invitation.CreatedAt > activationEvents[0] || visitor.CreatedAt > activationEvents[0])
            return Conflict(new { code = "ORIGINATING_INVITATION_INVALID" });
        if (!await _db.Set<Sethu.Domain.MemberBusiness.MemberRecord>().AsNoTracking().AnyAsync(x =>
            x.Id == invitation.InviterMemberId && x.TenantId == tenant, ct))
            return Conflict(new { code = "ORIGINAL_INVITER_NOT_CANONICAL" });
        var existing = await _db.VisitorConversionCredits.AsNoTracking().AnyAsync(x =>
            x.TenantId == tenant && (x.MemberId == memberId || x.IntakeId == intake.Id ||
                x.RegistrationId == link.RegistrationId || x.InvitationId == invitation.Id), ct);
        if (existing) return Conflict(new { code = "CONVERSION_ALREADY_CREDITED_REVIEW_REQUIRED" });
        var credit = new VisitorConversionCredit {
            Id = Guid.NewGuid(), TenantId = tenant, ChapterId = link.ChapterId,
            RegistrationId = link.RegistrationId, IntakeId = intake.Id, MemberId = memberId,
            InvitationId = invitation.Id, InviterMemberId = invitation.InviterMemberId,
            ActivatedAt = activationEvents[0]
        };
        _db.VisitorConversionCredits.Add(credit);
        _db.Audits.Add(new Audit {
            Id = Guid.NewGuid(), TenantId = tenant, ActorId = reviewer, ResourceId = intake.Id,
            Operation = "visitor.conversion.historical-attribution", Event = "credited",
            CorrelationId = credit.Id.ToString("D"), OccurredAt = DateTimeOffset.UtcNow
        });
        try {
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is Npgsql.PostgresException pg && pg.SqlState == "23505") {
            return Conflict(new { code = "CONCURRENT_CONVERSION_ATTRIBUTION_CONFLICT" });
        }
        catch (Npgsql.PostgresException ex) when (ex.SqlState is "40001" or "40P01") {
            return Conflict(new { code = "CONVERSION_TRANSACTION_RETRY_REQUIRED" });
        }
        return Ok(new { creditId = credit.Id, memberId, invitationId = invitation.Id,
            activationEffectiveAt = credit.ActivatedAt, reviewed = true });
    }

    public sealed record ReconcileVisitorInvitationRequest(Guid RegistrationId);

    // This does NOT activate membership or assert that an email was delivered.
    // A registration can be attributed to one originating invitation only; conflicts
    // remain visible for governed human review instead of being silently merged.
    [HttpPost("visitors/invitations/{invitationId:guid}/reconcile")]
    public async Task<IActionResult> ReconcileVisitorInvitation(Guid invitationId,
        [FromBody] ReconcileVisitorInvitationRequest? request, CancellationToken ct = default)
    {
        if (invitationId == Guid.Empty || request is null || request.RegistrationId == Guid.Empty)
            return BadRequest(new { code = "INVALID_RECONCILIATION" });
        var tenant = GetTenantId();
        var invitation = await _db.VisitorInvitations.AsNoTracking().Where(i =>
            i.Id == invitationId && i.TenantId == tenant)
            .Select(i => new { i.Id, i.ChapterId, i.Email, i.Mobile, i.VisitorRegistrationId, i.Status })
            .SingleOrDefaultAsync(ct);
        if (invitation is null) return NotFound(new { code = "INVITATION_NOT_FOUND" });
        if (invitation.Status == "Cancelled") return Conflict(new { code = "INVITATION_CANCELLED" });
        if (invitation.VisitorRegistrationId == request.RegistrationId)
            return Ok(new { invitationId, registrationId = request.RegistrationId, replayed = true });
        if (invitation.VisitorRegistrationId is not null)
            return Conflict(new { code = "INVITATION_ALREADY_LINKED" });
        var registration = await _db.VisitorRegistrations.AsNoTracking().Where(r =>
            r.Id == request.RegistrationId && r.TenantId == tenant && r.ChapterId == invitation.ChapterId && r.Verified)
            .Select(r => new { r.Email, r.Phone }).SingleOrDefaultAsync(ct);
        if (registration is null) return Conflict(new { code = "VERIFIED_REGISTRATION_NOT_FOUND_IN_CHAPTER" });
        // Cross-check both contacts; shared/recycled contacts must be manually resolved,
        // never inferred from a visitor's name or an arbitrary reference.
        static string Digits(string value) => new(value.Where(char.IsDigit).ToArray());
        if (!string.Equals(invitation.Email.Trim(), registration.Email.Trim(), StringComparison.OrdinalIgnoreCase) ||
            Digits(invitation.Mobile) != Digits(registration.Phone))
            return Conflict(new { code = "VISITOR_CONTACT_IDENTITY_MISMATCH" });
        if (await _db.VisitorInvitations.AsNoTracking().AnyAsync(i =>
            i.TenantId == tenant && i.Id != invitationId && i.VisitorRegistrationId == request.RegistrationId, ct))
            return Conflict(new { code = "REGISTRATION_ALREADY_ATTRIBUTED" });
        try
        {
            var updated = await _db.VisitorInvitations.Where(i =>
                i.Id == invitationId && i.TenantId == tenant &&
                i.VisitorRegistrationId == null && i.Status != "Cancelled")
                .ExecuteUpdateAsync(updates => updates.SetProperty(i => i.VisitorRegistrationId, request.RegistrationId), ct);
            if (updated != 1) return Conflict(new { code = "INVITATION_CHANGED" });
        }
        catch (DbUpdateException)
        {
            return Conflict(new { code = "REGISTRATION_ATTRIBUTION_CONFLICT" });
        }
        return Ok(new { invitationId, registrationId = request.RegistrationId, replayed = false });
    }


    // Existing legacy filter requires a tenant-wide Organisation grant. Never treat a supplied chapter as authorization.
    public sealed record VerifyVisitorAttendanceRequest(Guid ChapterId, Guid RegistrationId, Guid EventId);
    [HttpPost("visitors/attendance/verify")]
    public async Task<IActionResult> VerifyVisitorAttendance([FromBody] VerifyVisitorAttendanceRequest? input, CancellationToken ct)
    {
        if (input is null || input.ChapterId == Guid.Empty || input.RegistrationId == Guid.Empty || input.EventId == Guid.Empty)
            return BadRequest(new { code = "INVALID_VISITOR_ATTENDANCE" });
        var tenant = GetTenantId();
        var resolved = await _actorResolver.ResolveAsync(User, ct);
        if (!resolved.Succeeded || resolved.Actor is null || resolved.Actor.TenantId != tenant) return Forbid();
        var registration = await _db.VisitorRegistrations.AsNoTracking().AnyAsync(r =>
            r.Id == input.RegistrationId && r.TenantId == tenant && r.ChapterId == input.ChapterId && r.Verified, ct);
        var programme = await _db.Set<NetworkFreeEvent>().AsNoTracking().AnyAsync(e =>
            e.Id == input.EventId && e.TenantId == tenant && e.ChapterId == input.ChapterId && e.Status == "Published" && e.StartsAt <= DateTimeOffset.UtcNow, ct);
        if (!registration || !programme) return Conflict(new { code = "VERIFIED_REGISTRATION_OR_EVENT_NOT_ELIGIBLE" });
        var existing = await _db.VisitorEventAttendances.AsNoTracking().FirstOrDefaultAsync(x =>
            x.TenantId == tenant && x.RegistrationId == input.RegistrationId && x.EventId == input.EventId, ct);
        if (existing is not null) return Ok(new { id = existing.Id, replayed = true });
        var record = new VisitorEventAttendance { Id = Guid.NewGuid(), TenantId = tenant, ChapterId = input.ChapterId,
            RegistrationId = input.RegistrationId, EventId = input.EventId,
            VerifiedByUserId = resolved.Actor.UserId, VerifiedAt = DateTimeOffset.UtcNow };
        _db.VisitorEventAttendances.Add(record);
        try { await _db.SaveChangesAsync(ct); }
        catch (DbUpdateException)
        {
            _db.Entry(record).State = EntityState.Detached;
            var duplicate = await _db.VisitorEventAttendances.AsNoTracking().AnyAsync(x => x.TenantId == tenant &&
                x.RegistrationId == input.RegistrationId && x.EventId == input.EventId, ct);
            if (!duplicate) throw;
            return Ok(new { replayed = true });
        }
        return Ok(new { id = record.Id, replayed = false });
    }

    [HttpGet("visitors/attendance")]
    public async Task<IActionResult> ListVisitorAttendance([FromQuery] Guid chapterId, [FromQuery] int page = 1, CancellationToken ct = default)
    {
        if (chapterId == Guid.Empty || page < 1 || page > 100000) return BadRequest(new { code = "INVALID_VISITOR_QUERY" });
        var tenant = GetTenantId();
        var rows = await _db.VisitorEventAttendances.AsNoTracking().Where(x => x.TenantId == tenant && x.ChapterId == chapterId)
            .OrderByDescending(x => x.VerifiedAt).ThenBy(x => x.Id).Skip((page - 1) * 25).Take(25)
            .Select(x => new { x.Id, x.RegistrationId, x.EventId, x.VerifiedAt }).ToListAsync(ct);
        return Ok(new { items = rows, chapterId, page });
    }

    public sealed record CreateVisitorFollowUpRequest(Guid ChapterId, Guid RegistrationId, string? Notes);
    [HttpPost("visitors/follow-ups")]
    public async Task<IActionResult> CreateVisitorFollowUp([FromBody] CreateVisitorFollowUpRequest? input, CancellationToken ct)
    {
        if (input is null || input.ChapterId == Guid.Empty || input.RegistrationId == Guid.Empty ||
            string.IsNullOrWhiteSpace(input.Notes) || input.Notes.Length > 2000)
            return BadRequest(new { code = "INVALID_VISITOR_FOLLOW_UP" });
        var tenant = GetTenantId();
        var resolved = await _actorResolver.ResolveAsync(User, ct);
        if (!resolved.Succeeded || resolved.Actor is null || resolved.Actor.TenantId != tenant) return Forbid();
        var found = await _db.VisitorRegistrations.AsNoTracking().AnyAsync(r => r.Id == input.RegistrationId &&
            r.TenantId == tenant && r.ChapterId == input.ChapterId && r.Verified, ct);
        if (!found) return Conflict(new { code = "VERIFIED_VISITOR_NOT_FOUND_IN_CHAPTER" });
        var now = DateTimeOffset.UtcNow;
        var record = new VisitorFollowUp { Id = Guid.NewGuid(), TenantId = tenant, ChapterId = input.ChapterId,
            RegistrationId = input.RegistrationId, AssignedUserId = resolved.Actor.UserId,
            Notes = input.Notes.Trim(), CreatedAt = now, UpdatedAt = now };
        _db.VisitorFollowUps.Add(record);
        await _db.SaveChangesAsync(ct);
        return Ok(new { record.Id, record.RegistrationId, record.Outcome, record.CreatedAt });
    }

    [HttpGet("visitors/follow-ups")]
    public async Task<IActionResult> ListVisitorFollowUps([FromQuery] Guid chapterId, [FromQuery] int page = 1, CancellationToken ct = default)
    {
        if (chapterId == Guid.Empty || page < 1 || page > 100000) return BadRequest(new { code = "INVALID_VISITOR_QUERY" });
        var tenant = GetTenantId();
        var rows = await _db.VisitorFollowUps.AsNoTracking().Where(x => x.TenantId == tenant && x.ChapterId == chapterId)
            .OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id).Skip((page - 1) * 25).Take(25)
            .Select(x => new { x.Id, x.RegistrationId, x.Outcome, x.Notes, x.CreatedAt, x.AssignedUserId }).ToListAsync(ct);
        return Ok(new { items = rows, chapterId, page });
    }

    [HttpGet("members")]
    public async Task<IActionResult> GetMembers([FromQuery] string? scopeId, [FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetMembersAsync(GetTenantId(), scopeId, limit, ct);
        return Ok(result);
    }

    [HttpGet("members/{id}")]
    public async Task<IActionResult> GetMemberById(string id, CancellationToken ct = default)
    {
        var result = await _service.GetMemberByIdAsync(id, GetTenantId(), ct);
        return Ok(result);
    }

    public record TransitionMemberRequest(string Status);

    [HttpPost("members/{id}/transition")]
    public async Task<IActionResult> TransitionMember(string id, [FromBody] TransitionMemberRequest req, CancellationToken ct = default)
    {
        return StatusCode(501, new { code = "CANONICAL_MEMBERSHIP_TRANSITION_REQUIRED", detail = "Legacy transition is unavailable. Use the governed membership lifecycle." });
    }

    public record TransferMemberRequest(string TargetChapterId);

    [HttpPost("members/{id}/transfer")]
    public async Task<IActionResult> TransferMember(string id, [FromBody] TransferMemberRequest req, CancellationToken ct = default)
    {
        return StatusCode(501, new { code = "EFFECTIVE_CHAPTER_TRANSFER_REQUIRED", detail = "Legacy transfer is unavailable until the canonical effective-dated affiliation service is connected." });
    }

    [HttpGet("member-cases")]
    public async Task<IActionResult> GetMemberCases([FromQuery] string? scopeId, [FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetMemberCasesAsync(GetTenantId(), scopeId, limit, ct);
        return Ok(result);
    }

    [HttpPost("member-cases")]
    public async Task<IActionResult> CreateMemberCase([FromBody] MemberCaseRecord memberCase, CancellationToken ct = default)
    {
        memberCase.TenantId = GetTenantId();
        if (string.IsNullOrWhiteSpace(memberCase.MemberId) || string.IsNullOrWhiteSpace(memberCase.Title))
            return UnprocessableEntity(new { code = "REQUIRED_INSTITUTIONAL_FIELDS" });
        memberCase.Id = Guid.Empty; // IDs must be generated server-side, never supplied by the caller.
        var result = await _service.CreateMemberCaseAsync(memberCase, ct);
        return Ok(result);
    }

    public record UpdateMemberCaseBody(string? Status);

    [HttpPut("member-cases/{id:guid}")]
    public async Task<IActionResult> UpdateMemberCase(Guid id, [FromBody] UpdateMemberCaseBody body, CancellationToken ct = default)
    {
        var result = await _service.UpdateMemberCaseAsync(id, body.Status, GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("growth")]
    [HttpGet("member-growth")]
    public async Task<IActionResult> GetGrowth([FromQuery] string? scopeId, CancellationToken ct = default)
    {
        var result = await _service.GetGrowthPipelineAsync(GetTenantId(), scopeId, ct);
        return Ok(result);
    }

    [HttpGet("networking")]
    [HttpGet("growth-networking")]
    public async Task<IActionResult> GetNetworking([FromQuery] string? scopeId, CancellationToken ct = default)
    {
        var result = await _service.GetNetworkingMetricsAsync(GetTenantId(), scopeId, ct);
        return Ok(result);
    }

    [HttpGet("kyt")]
    public async Task<IActionResult> GetKyts([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetKytsAsync(GetTenantId(), limit, ct);
        return Ok(result);
    }

    [HttpPost("kyt")]
    public async Task<IActionResult> CreateKyt([FromBody] KytRecord kyt, CancellationToken ct = default)
    {
        kyt.TenantId = GetTenantId();
        if (string.IsNullOrWhiteSpace(kyt.MemberId))
            return UnprocessableEntity(new { code = "REQUIRED_INSTITUTIONAL_FIELDS" });
        kyt.Id = Guid.Empty; // IDs must be generated server-side, never supplied by the caller.
        var result = await _service.CreateKytAsync(kyt, ct);
        return Ok(result);
    }

    public record UpdateKytBody(string Status);

    [HttpPut("kyt/{id:guid}")]
    public async Task<IActionResult> UpdateKyt(Guid id, [FromBody] UpdateKytBody body, CancellationToken ct = default)
    {
        var result = await _service.UpdateKytAsync(id, body.Status, GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("presentations")]
    [HttpGet("member-presentations")]
    public async Task<IActionResult> GetPresentations([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetPresentationsAsync(GetTenantId(), limit, ct);
        return Ok(result);
    }

    [HttpPost("presentations")]
    [HttpPost("member-presentations")]
    public async Task<IActionResult> CreatePresentation([FromBody] MemberPresentationRecord presentation, CancellationToken ct = default)
    {
        presentation.TenantId = GetTenantId();
        if (string.IsNullOrWhiteSpace(presentation.MemberId) || string.IsNullOrWhiteSpace(presentation.Topic))
            return UnprocessableEntity(new { code = "REQUIRED_INSTITUTIONAL_FIELDS" });
        presentation.Id = Guid.Empty; // IDs must be generated server-side, never supplied by the caller.
        var result = await _service.CreatePresentationAsync(presentation, ct);
        return Ok(result);
    }

    public record UpdatePresentationBody(string Status);

    [HttpPut("presentations/{id:guid}")]
    [HttpPut("member-presentations/{id:guid}")]
    public async Task<IActionResult> UpdatePresentation(Guid id, [FromBody] UpdatePresentationBody body, CancellationToken ct = default)
    {
        var result = await _service.UpdatePresentationAsync(id, body.Status, GetTenantId(), ct);
        return Ok(result);
    }
}

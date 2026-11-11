using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Layered;

namespace Sethu.Api.Controllers;

public record CreateThankYouNoteDto(
    Guid ToMemberId,
    string Message,
    decimal? Amount
);

[ApiController]
[Authorize]
[Route("api/thank-you-notes")]
[Route("thank-you-notes")]
public class ThankYouNotesController : ControllerBase
{
    private readonly SethuDbContext _db;
    private readonly ICurrentNetworkMember _currentMember;

    public ThankYouNotesController(SethuDbContext db, ICurrentNetworkMember currentMember)
    {
        _db = db;
        _currentMember = currentMember;
    }

    [HttpGet]
    public async Task<IActionResult> GetThankYouNotes(
        [FromQuery] string? filter, // "sent", "received"
        [FromQuery] int page = 1,
        [FromQuery] int size = 20,
        CancellationToken ct = default)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var query = _db.ThankYouNotes
            .AsNoTracking()
            .Where(n => n.TenantId == actor.TenantId);

        if (string.Equals(filter, "sent", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(n => n.AuthorMemberId == actor.MemberId);
        }
        else if (string.Equals(filter, "received", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(n => n.RecipientMemberId == actor.MemberId);
        }
        else
        {
            query = query.Where(n => n.AuthorMemberId == actor.MemberId || n.RecipientMemberId == actor.MemberId);
        }

        var total = await query.CountAsync(ct);
        var notes = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * size)
            .Take(size)
            .ToListAsync(ct);

        var memberIds = notes.Select(n => n.AuthorMemberId).Concat(notes.Select(n => n.RecipientMemberId)).Distinct().ToList();
        var memberNamesRows = await _db.UserIdentities
            .AsNoTracking()
            .Where(u => u.TenantId == actor.TenantId && u.MemberId.HasValue && memberIds.Contains(u.MemberId.Value))
            .ToListAsync(ct);
        var memberNames = memberNamesRows
            .GroupBy(u => u.MemberId!.Value)
            .ToDictionary(g => g.Key, g => g.First().Name ?? "Member");

        var result = notes.Select(n => new
        {
            id = n.Id,
            authorMemberId = n.AuthorMemberId,
            authorMemberName = memberNames.TryGetValue(n.AuthorMemberId, out var fn) ? fn : "Member",
            recipientMemberId = n.RecipientMemberId,
            recipientMemberName = memberNames.TryGetValue(n.RecipientMemberId, out var tn) ? tn : "Member",
            message = n.Message,
            amount = n.Amount,
            status = n.Status,
            createdAt = n.CreatedAt
        });

        return Ok(new { items = result, page, size, total });
    }

    [HttpPost]
    public async Task<IActionResult> SendThankYouNote([FromBody] CreateThankYouNoteDto dto, CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        if (dto.ToMemberId == Guid.Empty || dto.ToMemberId == actor.MemberId)
        {
            return BadRequest(new { code = "INVALID_RECIPIENT", detail = "Recipient member cannot be empty or self." });
        }

        if (string.IsNullOrWhiteSpace(dto.Message))
        {
            return BadRequest(new { code = "EMPTY_MESSAGE", detail = "Message cannot be empty." });
        }

        var idempotencyKey = Request.Headers["Idempotency-Key"].FirstOrDefault();
        if (!string.IsNullOrEmpty(idempotencyKey))
        {
            var existingRecord = await _db.Idempotency.FirstOrDefaultAsync(
                r => r.TenantId == actor.TenantId && r.ActorId == actor.MemberId && r.Operation == "thankyou.create" && r.Key == idempotencyKey, ct);

            if (existingRecord != null)
            {
                return Ok(new { duplicate = true, message = "Thank you note already submitted." });
            }
        }

        var note = new ThankYouNote
        {
            Id = Guid.NewGuid(),
            TenantId = actor.TenantId,
            AuthorMemberId = actor.MemberId,
            RecipientMemberId = dto.ToMemberId,
            Message = dto.Message.Trim(),
            Amount = dto.Amount,
            Status = "sent",
            CreatedAt = DateTimeOffset.UtcNow
        };

        var payloadHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(JsonSerializer.Serialize(dto))));

        _db.ThankYouNotes.Add(note);

        if (!string.IsNullOrEmpty(idempotencyKey))
        {
            _db.Idempotency.Add(new Idempotency
            {
                TenantId = actor.TenantId,
                ActorId = actor.MemberId,
                Operation = "thankyou.create",
                Key = idempotencyKey,
                PayloadSha256 = payloadHash,
                ResultJson = JsonSerializer.Serialize(new { note.Id }),
                CreatedAt = DateTimeOffset.UtcNow
            });
        }

        await _db.SaveChangesAsync(ct);
        return Created($"/api/thank-you-notes/{note.Id}", note);
    }
}

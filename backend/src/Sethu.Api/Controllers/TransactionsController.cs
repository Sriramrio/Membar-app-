using Sethu.Domain.MemberBusiness;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Layered;

namespace Sethu.Api.Controllers;

public record CreateTransactionDto(
    Guid? BuyerBusinessId,
    Guid? CounterpartyBusinessId,
    Guid? ReferenceId,
    Guid? OpportunityId,
    decimal Amount,
    string? Currency,
    string? Notes
);

public record UpdateTransactionStatusDto(string Status);

[ApiController]
[Authorize]
[Route("api/transactions")]
[Route("transactions")]
public class TransactionsController : ControllerBase
{
    private readonly SethuDbContext _db;
    private readonly ICurrentNetworkMember _currentMember;

    private static readonly HashSet<string> ConfirmedStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "verified", "confirmed", "won"
    };

    private static readonly Dictionary<string, string[]> AllowedTransitions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["draft"] = new[] { "recorded", "closed" },
        ["recorded"] = new[] { "acknowledged", "correction-requested", "disputed", "closed" },
        ["acknowledged"] = new[] { "verified", "confirmed", "won", "disputed", "correction-requested" },
        ["correction-requested"] = new[] { "recorded", "closed" },
        ["verified"] = new[] { "confirmed", "won", "closed" },
        ["confirmed"] = new[] { "won", "closed" },
        ["disputed"] = new[] { "recorded", "closed" },
        ["won"] = new[] { "closed" },
        ["closed"] = Array.Empty<string>()
    };

    public TransactionsController(SethuDbContext db, ICurrentNetworkMember currentMember)
    {
        _db = db;
        _currentMember = currentMember;
    }

    [HttpGet]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int size = 20,
        CancellationToken ct = default)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var memberBusinessIds = await _db.Set<BusinessRecord>()
            .AsNoTracking()
            .Where(b => b.TenantId == actor.TenantId && b.OwnerMemberId == actor.MemberId)
            .Select(b => b.Id)
            .ToListAsync(ct);

        var query = _db.Transactions
            .AsNoTracking()
            .Where(t => t.TenantId == actor.TenantId && (
                t.MemberId == actor.MemberId ||
                t.BuyerBusinessId == actor.MemberId ||
                t.CounterpartyBusinessId == actor.MemberId ||
                memberBusinessIds.Contains(t.BuyerBusinessId) ||
                memberBusinessIds.Contains(t.CounterpartyBusinessId)));

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(t => t.Status.ToLower() == status.ToLower());
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * size)
            .Take(size)
            .ToListAsync(ct);

        var latestVersion = items.FirstOrDefault()?.Version ?? 0;
        Response.Headers.ETag = $"\"{latestVersion}\"";

        var totalRecordedAmount = await query.SumAsync(t => (decimal?)t.Amount, ct) ?? 0;
        var confirmedAmount = await query
            .Where(t => t.Status == "verified" || t.Status == "confirmed" || t.Status == "won")
            .SumAsync(t => (decimal?)t.Amount, ct) ?? 0;

        return Ok(new
        {
            items,
            page,
            size,
            total,
            totalAmount = totalRecordedAmount,
            confirmedAmount
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var t = await _db.Transactions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == actor.TenantId && (x.MemberId == actor.MemberId || x.BuyerBusinessId == actor.MemberId || x.CounterpartyBusinessId == actor.MemberId), ct);

        if (t == null) return NotFound();

        Response.Headers.ETag = $"\"{t.Version}\"";
        return Ok(t);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionDto dto, CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        if (dto.Amount <= 0)
        {
            return BadRequest(new { code = "INVALID_AMOUNT", detail = "Amount must be greater than zero." });
        }

        // Canonical payload representation and SHA-256 digest calculation (TX-01)
        var canonicalPayload = JsonSerializer.Serialize(new
        {
            dto.BuyerBusinessId,
            dto.CounterpartyBusinessId,
            dto.ReferenceId,
            dto.OpportunityId,
            dto.Amount,
            Currency = string.IsNullOrWhiteSpace(dto.Currency) ? "INR" : dto.Currency,
            dto.Notes
        });
        var payloadHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonicalPayload)));

        var idempotencyKey = Request.Headers["Idempotency-Key"].FirstOrDefault();
        if (!string.IsNullOrEmpty(idempotencyKey))
        {
            var existingRecord = await _db.Idempotency.FirstOrDefaultAsync(
                r => r.TenantId == actor.TenantId && r.ActorId == actor.MemberId && r.Operation == "transaction.create" && r.Key == idempotencyKey, ct);

            if (existingRecord != null)
            {
                // Reject key reuse with conflicting payload (TX-01)
                if (!string.IsNullOrEmpty(existingRecord.PayloadSha256) && existingRecord.PayloadSha256 != payloadHash)
                {
                    return Conflict(new
                    {
                        code = "IDEMPOTENCY_PAYLOAD_MISMATCH",
                        detail = "Idempotency key was previously submitted with a different payload."
                    });
                }

                // Return previously committed transaction
                try
                {
                    var resultDoc = JsonSerializer.Deserialize<JsonElement>(existingRecord.ResultJson);
                    if (resultDoc.TryGetProperty("Id", out var idProp) && Guid.TryParse(idProp.GetString(), out var existingId))
                    {
                        var existingTx = await _db.Transactions.AsNoTracking().FirstOrDefaultAsync(t => t.Id == existingId, ct);
                        if (existingTx != null)
                        {
                            Response.Headers.ETag = $"\"{existingTx.Version}\"";
                            return Ok(existingTx);
                        }
                    }
                }
                catch
                {
                    // Fall through if parsing stored result fails
                }

                return Ok(new { duplicate = true, message = "Transaction slip already recorded." });
            }
        }

        var tx = new NetworkTransaction
        {
            Id = Guid.NewGuid(),
            TenantId = actor.TenantId,
            MemberId = actor.MemberId,
            BuyerBusinessId = dto.BuyerBusinessId ?? Guid.Empty,
            CounterpartyBusinessId = dto.CounterpartyBusinessId ?? Guid.Empty,
            ReferenceId = dto.ReferenceId,
            OpportunityId = dto.OpportunityId,
            Amount = dto.Amount,
            Currency = string.IsNullOrWhiteSpace(dto.Currency) ? "INR" : dto.Currency,
            Status = "recorded",
            Notes = dto.Notes,
            CreatedAt = DateTimeOffset.UtcNow,
            Version = 1
        };

        _db.Transactions.Add(tx);

        if (!string.IsNullOrEmpty(idempotencyKey))
        {
            _db.Idempotency.Add(new Idempotency
            {
                TenantId = actor.TenantId,
                ActorId = actor.MemberId,
                Operation = "transaction.create",
                Key = idempotencyKey,
                PayloadSha256 = payloadHash,
                ResultJson = JsonSerializer.Serialize(new { tx.Id }),
                CreatedAt = DateTimeOffset.UtcNow
            });
        }

        await _db.SaveChangesAsync(ct);
        Response.Headers.ETag = $"\"{tx.Version}\"";

        return Created($"/api/transactions/{tx.Id}", tx);
    }

    [HttpPost("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateTransactionStatusDto dto, CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var tx = await _db.Transactions.FirstOrDefaultAsync(
            x => x.Id == id && x.TenantId == actor.TenantId && (x.MemberId == actor.MemberId || x.BuyerBusinessId == actor.MemberId || x.CounterpartyBusinessId == actor.MemberId), ct);

        if (tx == null) return NotFound();

        // Optimistic concurrency verification (TX-02)
        var ifMatch = Request.Headers.IfMatch.FirstOrDefault();
        if (!string.IsNullOrEmpty(ifMatch) && ifMatch.Trim('"') != tx.Version.ToString())
        {
            return StatusCode(StatusCodes.Status412PreconditionFailed, new
            {
                code = "VERSION_MISMATCH",
                detail = "Precondition failed: transaction row version has changed."
            });
        }

        var newStatus = dto.Status.Trim().ToLowerInvariant();
        var currentStatus = tx.Status.Trim().ToLowerInvariant();

        // Self-verification prevention (TX-03): Recording member CANNOT verify their own transaction
        if (newStatus == "verified" && tx.MemberId == actor.MemberId)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                code = "UNAUTHORIZED_TRANSITION",
                detail = "The recording Member cannot verify their own outcome slip. Verification requires the counterparty or authorised officer."
            });
        }

        // Validate allowed status transitions
        if (AllowedTransitions.TryGetValue(currentStatus, out var allowed) && !allowed.Contains(newStatus))
        {
            return BadRequest(new
            {
                code = "INVALID_STATUS_TRANSITION",
                detail = $"Transition from '{currentStatus}' to '{newStatus}' is not permitted."
            });
        }

        tx.Status = newStatus;
        tx.Version++;
        await _db.SaveChangesAsync(ct);

        Response.Headers.ETag = $"\"{tx.Version}\"";
        return Ok(tx);
    }
}

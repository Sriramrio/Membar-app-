using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Security;

namespace Sethu.Api.Controllers;

/// <summary>Scoped attendance correction decision. Never derives authority from the supplied record or browser role.</summary>
[ApiController]
[Authorize]
[Route("api/attendance/reviews")]
[Route("attendance/reviews")]
public sealed class AttendanceReviewController : ControllerBase
{
    private readonly SethuDbContext _db;
    private readonly IAuthenticatedActorResolver _actors;
    private readonly ITrustedPermissionStore _permissions;
    public AttendanceReviewController(SethuDbContext db, IAuthenticatedActorResolver actors, ITrustedPermissionStore permissions)
    { _db = db; _actors = actors; _permissions = permissions; }

    public sealed record DecisionBody(bool Approve, string ProposedStatus, string Reason);

    [HttpPost("{attendanceId:guid}/decision")]
    public async Task<IActionResult> Decide(Guid attendanceId, [FromBody] DecisionBody body, CancellationToken ct)
    {
        if (attendanceId == Guid.Empty || body == null || string.IsNullOrWhiteSpace(body.Reason) ||
            body.Reason.Trim().Length < 10 || body.Reason.Length > 2000 ||
            !new[] { "present", "absent", "late", "excused" }.Contains(body.ProposedStatus?.Trim().ToLowerInvariant()))
            return UnprocessableEntity(new { code = "INVALID_ATTENDANCE_DECISION" });
        var resolved = await _actors.ResolveAsync(User, ct);
        if (!resolved.Succeeded || resolved.Actor == null) return Unauthorized(new { code = "TRUSTED_SESSION_REQUIRED" });
        var actor = resolved.Actor;
        var attendance = await _db.AttendanceRecords.AsNoTracking()
            .SingleOrDefaultAsync(a => a.Id == attendanceId && a.TenantId == actor.TenantId, ct);
        if (attendance == null) return NotFound();
        var ev = await _db.Set<NetworkFreeEvent>().AsNoTracking()
            .SingleOrDefaultAsync(e => e.Id == attendance.EventId && e.TenantId == actor.TenantId, ct);
        if (ev == null || ev.ChapterId == Guid.Empty) return Conflict(new { code = "EVENT_CHAPTER_UNRESOLVED" });
        var grants = await _permissions.ReadGrantsAsync(actor.UserId, actor.TenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (grants == null || !grants.Any(g => g.UserId == actor.UserId && g.TenantId == actor.TenantId &&
            g.Permission == "organisation.operations.write" && !g.Revoked && g.StartsAt <= now &&
            (!g.EndsAt.HasValue || g.EndsAt > now) && (g.ChapterId == ev.ChapterId || g.ChapterId == null)))
            return Forbid();
        if (attendance.CorrectionStatus != "pending") return Conflict(new { code = "CORRECTION_NOT_PENDING" });
        if (body.Approve && string.Equals(body.ProposedStatus.Trim(), attendance.Status, StringComparison.OrdinalIgnoreCase))
            return UnprocessableEntity(new { code = "UNCHANGED_STATUS" });
        // The original applicant's requested target must be validated by an approved request model.
        // The existing AttendanceRecord does not persist that target separately; do not allow
        // this reviewer API to infer it from free-text support tickets.
        if (body.Approve) return StatusCode(501, new { code = "REQUESTED_STATUS_NOT_CANONICAL", detail = "A governed requested-status field and migration are required before approval." });
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        var count = await _db.AttendanceRecords
            .Where(a => a.Id == attendanceId && a.TenantId == actor.TenantId && a.CorrectionStatus == "pending")
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.CorrectionStatus, "rejected")
                .SetProperty(a => a.UpdatedAt, now), ct);
        if (count != 1) { await tx.RollbackAsync(ct); return Conflict(new { code = "CONCURRENT_DECISION" }); }
        _db.Audits.Add(new Audit { Id = Guid.NewGuid(), TenantId = actor.TenantId, ActorId = actor.UserId,
            ResourceId = attendanceId, Operation = "attendance.correction.reject", Event = body.Reason.Trim(),
            CorrelationId = HttpContext.TraceIdentifier, OccurredAt = now });
        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return Ok(new { status = "rejected", attendanceId });
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Layered;

namespace Sethu.Api.Controllers;

/// <summary>Read-only member Home projection. Identity and tenant are resolved on the server.</summary>
[ApiController]
[Authorize]
[Route("api/v6/member/home")]
[Route("v6/member/home")]
public sealed class MemberHomeController(SethuDbContext db, ICurrentNetworkMember currentMember) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string scope = "for-you", CancellationToken ct = default)
    {
        if (scope is not ("for-you" or "chapter" or "network")) return BadRequest(new { code = "invalid_home_scope" });
        var actor = await currentMember.ResolveAsync(User, ct);
        if (actor is null) return Forbid();
        var member = await db.Set<MemberRecord>().AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == actor.MemberId && x.TenantId == actor.TenantId && x.Status == MemberRecordStatus.Active, ct);
        if (member is null) return Forbid();
        var identity = await db.UserIdentities.AsNoTracking()
            .Where(x => x.Id == actor.UserId && x.TenantId == actor.TenantId && x.Active)
            .Select(x => new { x.Name }).SingleOrDefaultAsync(ct);
        if (identity is null) return Forbid();
        var chapterId = await db.Set<MemberChapterAffiliation>().AsNoTracking()
            .Where(x => x.TenantId == actor.TenantId && x.MemberId == actor.MemberId && x.Status == AffiliationStatus.Active)
            .Select(x => (Guid?)x.ChapterId).FirstOrDefaultAsync(ct);
        if (scope == "chapter" && chapterId is null) return Ok(new { scope, generatedAt = DateTimeOffset.UtcNow, member = new { displayName = identity.Name, chapterId }, available = false, reason = "no_active_chapter" });
        var chapterName = chapterId is null ? null : await db.Chapters.AsNoTracking()
            .Where(c => c.Id == chapterId.Value).Select(c => c.Name).FirstOrDefaultAsync(ct);
        var connections = db.Set<Connection>().AsNoTracking().Where(c => c.TenantId == actor.TenantId && (c.LowerMemberId == actor.MemberId || c.UpperMemberId == actor.MemberId));
        var references = db.Set<NetworkReference>().AsNoTracking().Where(r => r.TenantId == actor.TenantId && (r.FromMemberId == actor.MemberId || r.ToMemberId == actor.MemberId));
        var meetings = db.Set<NetworkMeeting>().AsNoTracking().Where(m => m.TenantId == actor.TenantId && (m.FromMemberId == actor.MemberId || m.ToMemberId == actor.MemberId));
        var opportunities = db.Set<NetworkOpportunity>().AsNoTracking().Where(o => o.TenantId == actor.TenantId && o.OwnerMemberId == actor.MemberId);
        var now = DateTimeOffset.UtcNow;
        var connectionCount = await connections.CountAsync(c => c.State == ConnectionState.Accepted, ct);
        var pendingConnections = await connections.CountAsync(c => c.State == ConnectionState.Pending && c.InitiatorId != actor.MemberId, ct);
        var referenceCount = await references.CountAsync(ct);
        var pendingReferences = await references.CountAsync(r => r.ToMemberId == actor.MemberId && (r.Status == "Pending" || r.Status == "Sent"), ct);
        var meetingCount = await meetings.CountAsync(m => m.Status == "Completed", ct);
        var pendingMeetings = await meetings.CountAsync(m => m.Status == "Requested" && m.ProposedByMemberId != actor.MemberId, ct);
        var openOpportunities = await opportunities.CountAsync(o => o.Status == "Open" || o.Status == "Published", ct);
        var unreadNotifications = await db.Notifications.AsNoTracking().CountAsync(n => n.TenantId == actor.TenantId && n.MemberId == actor.MemberId && !n.IsRead, ct);
        var nextNotifications = await db.Notifications.AsNoTracking()
            .Where(n => n.TenantId == actor.TenantId && n.MemberId == actor.MemberId && !n.IsRead)
            .OrderByDescending(n => n.CreatedAt).Take(4)
            .Select(n => new { n.Id, n.Title, n.CreatedAt, n.Type }).ToListAsync(ct);
        var announcements = await db.Announcements.AsNoTracking()
            .Where(a => a.TenantId == actor.TenantId && (a.ChapterId == null || (chapterId != null && a.ChapterId == chapterId)) && a.PublishedAt <= now && (a.ExpiresAt == null || a.ExpiresAt > now))
            .OrderByDescending(a => a.PublishedAt).Take(3)
            .Select(a => new { a.Id, a.Title, a.PublishedAt }).ToListAsync(ct);
        var outcomes = await db.Transactions.AsNoTracking().CountAsync(t => t.TenantId == actor.TenantId && t.MemberId == actor.MemberId && (t.Status == "verified" || t.Status == "won" || t.Status == "closed"), ct);
        return Ok(new {
            scope, generatedAt = now, available = true,
            member = new { displayName = identity.Name, chapterId, chapterName },
            metrics = new { connections = connectionCount, oneToOnes = meetingCount, references = referenceCount, opportunities = openOpportunities, outcomes },
            pending = new { connections = pendingConnections, references = pendingReferences, meetings = pendingMeetings, unreadNotifications },
            notifications = nextNotifications, announcements,
            sections = new { followUps = "not_integrated", schedule = "not_integrated", recommendations = "not_integrated", chapterProgrammes = "not_integrated" }
        });
    }
}

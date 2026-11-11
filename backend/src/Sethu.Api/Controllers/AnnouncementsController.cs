using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Layered;

namespace Sethu.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/announcements")]
[Route("announcements")]
public class AnnouncementsController : ControllerBase
{
    private readonly SethuDbContext _db;
    private readonly ICurrentNetworkMember _currentMember;
    private readonly Sethu.Service.Abstractions.Organisation.IScopeResolver _scopeResolver;

    public AnnouncementsController(
        SethuDbContext db,
        ICurrentNetworkMember currentMember,
        Sethu.Service.Abstractions.Organisation.IScopeResolver scopeResolver)
    {
        _db = db;
        _currentMember = currentMember;
        _scopeResolver = scopeResolver;
    }

    [HttpGet]
    public async Task<IActionResult> GetAnnouncements(CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var memberScope = await _scopeResolver.ResolveMemberAsync(User, actor.TenantId, ct);

        var now = DateTimeOffset.UtcNow;
        var defaultTenant = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var announcements = await _db.Announcements
            .AsNoTracking()
            .Where(a => (a.TenantId == actor.TenantId || a.TenantId == defaultTenant) && (a.ExpiresAt == null || a.ExpiresAt > now))
            .OrderByDescending(a => a.PublishedAt)
            .ToListAsync(ct);

        announcements = announcements.Where(a =>
            (string.IsNullOrWhiteSpace(a.ScopeId) && !a.ChapterId.HasValue) ||
            (!string.IsNullOrWhiteSpace(a.ScopeId) && memberScope.IsInAncestry(a.ScopeId)) ||
            (a.ChapterId.HasValue && memberScope.IsInAncestry(a.ChapterId.Value.ToString("D"))) ||
            (a.ChapterId.HasValue && memberScope.ChapterId.HasValue && a.ChapterId.Value == memberScope.ChapterId.Value)
        ).ToList();

        var acks = await _db.AnnouncementAcknowledgements
            .AsNoTracking()
            .Where(x => (x.TenantId == actor.TenantId || x.TenantId == defaultTenant) && x.MemberId == actor.MemberId)
            .Select(x => x.AnnouncementId)
            .ToHashSetAsync(ct);

        var result = announcements.Select(a => new
        {
            id = a.Id,
            title = a.Title,
            content = a.Content,
            priority = a.Priority,
            acknowledgementRequired = true,
            chapterId = a.ChapterId,
            chapterName = memberScope.ChapterName ?? "Chapter",
            publishedAt = a.PublishedAt,
            acknowledged = acks.Contains(a.Id)
        }).ToList();

        // Also merge published communications from OrganisationCommunications
        try
        {
            var comms = await _db.OrganisationCommunications
                .AsNoTracking()
                .ToListAsync(ct);

            var activeComms = comms.Where(c => 
                string.Equals(c.Status, "Published", StringComparison.OrdinalIgnoreCase) || 
                string.Equals(c.Status, "Active", StringComparison.OrdinalIgnoreCase)
            ).ToList();

            var scopedComms = activeComms.Where(c =>
                string.IsNullOrWhiteSpace(c.ScopeId) ||
                c.ScopeId.Equals("all", StringComparison.OrdinalIgnoreCase) ||
                c.ScopeLevel?.Equals("NATIONAL", StringComparison.OrdinalIgnoreCase) == true ||
                memberScope.MatchesChapter(c.ScopeId, c.ScopeName)
            ).ToList();

            foreach (var c in scopedComms)
            {
                if (result.All(r => r.id != c.Id))
                {
                    var dt = DateTimeOffset.TryParse(c.PublishedAt, out var p) ? p : DateTimeOffset.UtcNow;
                    Guid? chGuid = Guid.TryParse(c.ScopeId, out var g) ? g : memberScope.ChapterId;
                    var parts = (c.Audience ?? "").Split('|');
                    var prio = parts.Length >= 3 ? parts[0] : (c.Title.Contains("Urgent", StringComparison.OrdinalIgnoreCase) ? "urgent" : (c.Title.Contains("Important", StringComparison.OrdinalIgnoreCase) ? "important" : "normal"));
                    var ackReq = parts.Length >= 3 ? bool.TryParse(parts[1], out var b) && b : true;

                    result.Add(new
                    {
                        id = c.Id,
                        title = c.Title,
                        content = !string.IsNullOrEmpty(c.Body) ? c.Body : c.Title,
                        priority = prio,
                        acknowledgementRequired = ackReq,
                        chapterId = chGuid,
                        chapterName = !string.IsNullOrEmpty(c.ScopeName) ? (c.ScopeName.Contains("Chapter", StringComparison.OrdinalIgnoreCase) ? c.ScopeName : $"{c.ScopeName} Chapter") : (memberScope.ChapterName ?? "Namakkal Chapter"),
                        publishedAt = dt,
                        acknowledged = acks.Contains(c.Id)
                    });
                }
            }
        }
        catch
        {
            // Fallback silently if OrganisationCommunications has transient schema mismatch
        }

        return Ok(result);
    }

    [HttpPost("{id:guid}/acknowledge")]
    public async Task<IActionResult> Acknowledge(Guid id, CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var existing = await _db.AnnouncementAcknowledgements.FirstOrDefaultAsync(
            x => x.TenantId == actor.TenantId && x.AnnouncementId == id && x.MemberId == actor.MemberId, ct);

        if (existing == null)
        {
            _db.AnnouncementAcknowledgements.Add(new AnnouncementAcknowledgement
            {
                Id = Guid.NewGuid(),
                TenantId = actor.TenantId,
                AnnouncementId = id,
                MemberId = actor.MemberId,
                AcknowledgedAt = DateTimeOffset.UtcNow
            });
            await _db.SaveChangesAsync(ct);
        }

        return Ok(new { success = true, announcementId = id });
    }
}

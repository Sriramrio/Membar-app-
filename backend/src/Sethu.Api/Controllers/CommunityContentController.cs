using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Layered;

namespace Sethu.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/news")]
[Route("news")]
public class NewsController : ControllerBase
{
    private readonly SethuDbContext _db;
    private readonly Sethu.Service.Abstractions.Organisation.IScopeResolver _scopeResolver;

    public NewsController(
        SethuDbContext db,
        Sethu.Service.Abstractions.Organisation.IScopeResolver scopeResolver)
    {
        _db = db;
        _scopeResolver = scopeResolver;
    }

    private Guid GetTenantId()
    {
        var tenantClaim = User.FindFirst("tenant_id")?.Value ?? User.FindFirst("tenantId")?.Value;
        if (!string.IsNullOrEmpty(tenantClaim) && Guid.TryParse(tenantClaim, out var tid))
        {
            return tid;
        }
        return Guid.Parse("11111111-1111-1111-1111-111111111111");
    }

    [HttpGet]
    public async Task<IActionResult> GetNews(CancellationToken ct)
    {
        var tenantId = GetTenantId();
        var memberScope = await _scopeResolver.ResolveMemberAsync(User, tenantId, ct);

        var items = await _db.NewsItems
            .AsNoTracking()
            .OrderByDescending(n => n.PublishedAt)
            .ToListAsync(ct);

        var scopedItems = items.Where(n =>
            string.IsNullOrWhiteSpace(n.ScopeId) ||
            n.ScopeLevel?.Equals("NATIONAL", StringComparison.OrdinalIgnoreCase) == true ||
            memberScope.IsInAncestry(n.ScopeId)
        ).Select(n => new
        {
            id = n.Id,
            title = n.Title,
            summary = n.Summary,
            content = n.Content,
            category = n.Category,
            priority = "normal",
            publishedAt = n.PublishedAt
        }).ToList<object>();

        // Merge published chapter communications
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
                var dt = DateTimeOffset.TryParse(c.PublishedAt, out var p) ? p : DateTimeOffset.UtcNow;
                var parts = (c.Audience ?? "").Split('|');
                var prio = parts.Length >= 3 ? parts[0] : (c.Title.Contains("Urgent", StringComparison.OrdinalIgnoreCase) ? "urgent" : (c.Title.Contains("Important", StringComparison.OrdinalIgnoreCase) ? "important" : "normal"));

                scopedItems.Add(new
                {
                    id = c.Id,
                    title = c.Title,
                    summary = !string.IsNullOrEmpty(c.Body) ? (c.Body.Length > 120 ? c.Body.Substring(0, 117) + "..." : c.Body) : c.Title,
                    content = !string.IsNullOrEmpty(c.Body) ? c.Body : c.Title,
                    category = !string.IsNullOrEmpty(c.ScopeName) ? c.ScopeName : "Chapter Announcement",
                    priority = prio,
                    publishedAt = dt
                });
            }
        }
        catch
        {
        }

        return Ok(scopedItems);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetNewsById(Guid id, CancellationToken ct)
    {
        var memberScope = await _scopeResolver.ResolveMemberAsync(User, GetTenantId(), ct);
        var item = await _db.NewsItems.AsNoTracking().FirstOrDefaultAsync(n => n.Id == id, ct);
        if (item == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(item.ScopeId) &&
            !item.ScopeLevel.Equals("NATIONAL", StringComparison.OrdinalIgnoreCase) &&
            !memberScope.IsInAncestry(item.ScopeId))
        {
            return Forbid();
        }

        return Ok(item);
    }
}

[ApiController]
[Authorize]
[Route("api/gallery")]
[Route("gallery")]
public class GalleryController : ControllerBase
{
    private readonly SethuDbContext _db;
    private readonly Sethu.Service.Abstractions.Organisation.IScopeResolver _scopeResolver;

    public GalleryController(
        SethuDbContext db,
        Sethu.Service.Abstractions.Organisation.IScopeResolver scopeResolver)
    {
        _db = db;
        _scopeResolver = scopeResolver;
    }

    private Guid GetTenantId()
    {
        var tenantClaim = User.FindFirst("tenant_id")?.Value ?? User.FindFirst("tenantId")?.Value;
        if (!string.IsNullOrEmpty(tenantClaim) && Guid.TryParse(tenantClaim, out var tid))
        {
            return tid;
        }
        return Guid.Parse("11111111-1111-1111-1111-111111111111");
    }

    [HttpGet]
    public async Task<IActionResult> GetGallery([FromQuery] string? chapterId, CancellationToken ct)
    {
        var tenantId = GetTenantId();
        var memberScope = await _scopeResolver.ResolveMemberAsync(User, tenantId, ct);

        var items = await _db.GalleryItems
            .AsNoTracking()
            .Where(g => g.Published && (g.TenantId == tenantId || g.TenantId == Guid.Parse("11111111-1111-1111-1111-111111111111") || g.TenantId == Guid.Parse("00000000-0000-0000-0000-000000000001")))
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync(ct);

        var chapters = await _db.Chapters.AsNoTracking().ToDictionaryAsync(c => c.Id, c => c.Name, ct);

        Guid? targetChapter = null;
        if (!string.IsNullOrWhiteSpace(chapterId) && Guid.TryParse(chapterId, out var parsedCh))
        {
            targetChapter = parsedCh;
        }

        var filtered = items.Where(g =>
            (targetChapter.HasValue ? g.ChapterId == targetChapter.Value :
                (!g.ChapterId.HasValue ||
                 (memberScope.ChapterId.HasValue && g.ChapterId.Value == memberScope.ChapterId.Value) ||
                 memberScope.IsInAncestry(g.ChapterId.Value.ToString("D")) ||
                 memberScope.IsInAncestry(g.ChapterId.Value.ToString("N")) ||
                 (chapters.TryGetValue(g.ChapterId.Value, out var chName) && !string.IsNullOrEmpty(memberScope.ChapterName) && (
                     chName.Trim().Equals(memberScope.ChapterName.Trim(), StringComparison.OrdinalIgnoreCase) ||
                     memberScope.ChapterName.ToLower().Contains(chName.ToLower()) ||
                     chName.ToLower().Contains(memberScope.ChapterName.ToLower())
                 ))))
        ).Select(g =>
        {
            var parts = (g.Title ?? "").Split('|');
            var title = parts.Length > 0 ? parts[0] : g.Title;
            var caption = parts.Length > 1 ? parts[1] : "";
            var mediaLabel = parts.Length > 2 ? parts[2] : (g.ChapterId.HasValue && chapters.TryGetValue(g.ChapterId.Value, out var chName) ? chName : "Chapter Gallery");

            return new
            {
                id = g.Id,
                title = title,
                caption = caption,
                mediaLabel = mediaLabel,
                imageUrl = g.ImageUrl,
                chapterId = g.ChapterId,
                eventId = g.EventId,
                published = g.Published,
                createdAt = g.CreatedAt
            };
        }).ToList();

        return Ok(filtered);
    }

    [HttpPost]
    public async Task<IActionResult> CreateGalleryItem([FromBody] CreateGalleryItemDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
            return BadRequest(new { message = "Title is required." });

        var tenantId = GetTenantId();
        var compoundTitle = !string.IsNullOrWhiteSpace(dto.Caption) || !string.IsNullOrWhiteSpace(dto.MediaLabel)
            ? $"{dto.Title.Trim()}|{(dto.Caption ?? "").Trim()}|{(dto.MediaLabel ?? "").Trim()}"
            : dto.Title.Trim();

        var item = new NetworkGalleryItem
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Title = compoundTitle,
            ImageUrl = dto.ImageUrl ?? "",
            ChapterId = dto.ChapterId,
            EventId = dto.EventId,
            Published = true,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.GalleryItems.Add(item);
        await _db.SaveChangesAsync(ct);

        return Ok(new { success = true, id = item.Id });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteGalleryItem(Guid id, CancellationToken ct)
    {
        var item = await _db.GalleryItems.FirstOrDefaultAsync(g => g.Id == id, ct);
        if (item != null)
        {
            _db.GalleryItems.Remove(item);
            await _db.SaveChangesAsync(ct);
        }
        return Ok(new { success = true });
    }
}

public class CreateGalleryItemDto
{
    public string Title { get; set; } = "";
    public string? Caption { get; set; }
    public string? ImageUrl { get; set; }
    public Guid? ChapterId { get; set; }
    public Guid? EventId { get; set; }
    public string? MediaLabel { get; set; }
}

[ApiController]
[Authorize]
[Route("api/partners")]
[Route("partners")]
public class PartnersController : ControllerBase
{
    private readonly SethuDbContext _db;

    public PartnersController(SethuDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetPartners(CancellationToken ct)
    {
        var items = await _db.Partners
            .AsNoTracking()
            .ToListAsync(ct);
        return Ok(items);
    }
}

[ApiController]
[Authorize]
[Route("api/resources")]
[Route("resources")]
public class ResourcesController : ControllerBase
{
    private readonly SethuDbContext _db;

    public ResourcesController(SethuDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetResources(CancellationToken ct)
    {
        var items = await _db.Resources
            .AsNoTracking()
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);
        return Ok(items);
    }
}

public record CreateSupportTicketDto(string Subject, string Description, string? Priority);

[ApiController]
[Authorize]
[Route("api/support")]
[Route("support")]
public class SupportController : ControllerBase
{
    private readonly SethuDbContext _db;
    private readonly ICurrentNetworkMember _currentMember;

    public SupportController(SethuDbContext db, ICurrentNetworkMember currentMember)
    {
        _db = db;
        _currentMember = currentMember;
    }

    [HttpGet("tickets")]
    public async Task<IActionResult> GetTickets(CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var tickets = await _db.SupportTickets
            .AsNoTracking()
            .Where(t => t.TenantId == actor.TenantId && t.MemberId == actor.MemberId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        return Ok(tickets);
    }

    [HttpPost("tickets")]
    public async Task<IActionResult> CreateTicket([FromBody] CreateSupportTicketDto dto, CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        if (string.IsNullOrWhiteSpace(dto.Subject))
        {
            return BadRequest(new { code = "SUBJECT_REQUIRED", detail = "Subject is required." });
        }

        var ticket = new SupportTicket
        {
            Id = Guid.NewGuid(),
            TenantId = actor.TenantId,
            MemberId = actor.MemberId,
            Subject = dto.Subject.Trim(),
            Description = dto.Description?.Trim() ?? "",
            Priority = string.IsNullOrWhiteSpace(dto.Priority) ? "Normal" : dto.Priority.Trim(),
            Status = "open",
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.SupportTickets.Add(ticket);
        await _db.SaveChangesAsync(ct);

        return Created($"/api/support/tickets/{ticket.Id}", ticket);
    }
}

public record MemberFamilyInfoDto(string? SpouseName, string? AnniversaryDate, string? Children, string? Notes);

[ApiController]
[Authorize]
[Route("api/family")]
[Route("family")]
public class FamilyController : ControllerBase
{
    private readonly SethuDbContext _db;
    private readonly ICurrentNetworkMember _currentMember;

    public FamilyController(SethuDbContext db, ICurrentNetworkMember currentMember)
    {
        _db = db;
        _currentMember = currentMember;
    }

    [HttpGet]
    public async Task<IActionResult> GetFamily(CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var family = await _db.FamilyInfos
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.TenantId == actor.TenantId && f.MemberId == actor.MemberId, ct);

        return Ok(family ?? new MemberFamilyInfo { MemberId = actor.MemberId, TenantId = actor.TenantId });
    }

    [HttpPut]
    public async Task<IActionResult> UpdateFamily([FromBody] MemberFamilyInfoDto dto, CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var family = await _db.FamilyInfos
            .FirstOrDefaultAsync(f => f.TenantId == actor.TenantId && f.MemberId == actor.MemberId, ct);

        if (family == null)
        {
            family = new MemberFamilyInfo
            {
                Id = Guid.NewGuid(),
                TenantId = actor.TenantId,
                MemberId = actor.MemberId
            };
            _db.FamilyInfos.Add(family);
        }

        family.SpouseName = dto.SpouseName;
        family.AnniversaryDate = dto.AnniversaryDate;
        family.Children = dto.Children;
        family.Notes = dto.Notes;

        await _db.SaveChangesAsync(ct);
        return Ok(family);
    }
}

public record MemberSettingsDto(string? PrivacySettingsJson, string? NotificationSettingsJson);

[ApiController]
[Authorize]
[Route("api/settings")]
[Route("settings")]
public class SettingsController : ControllerBase
{
    private readonly SethuDbContext _db;
    private readonly ICurrentNetworkMember _currentMember;

    public SettingsController(SethuDbContext db, ICurrentNetworkMember currentMember)
    {
        _db = db;
        _currentMember = currentMember;
    }

    [HttpGet]
    public async Task<IActionResult> GetSettings(CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var settings = await _db.MemberSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.TenantId == actor.TenantId && s.MemberId == actor.MemberId, ct);

        return Ok(settings ?? new MemberSettings
        {
            MemberId = actor.MemberId,
            TenantId = actor.TenantId,
            PrivacySettingsJson = "{\"showPhone\":true,\"showEmail\":true,\"profileVisibility\":\"Network\"}",
            NotificationSettingsJson = "{\"email\":true,\"sms\":false,\"push\":true,\"inApp\":true}"
        });
    }

    [HttpPut]
    public async Task<IActionResult> UpdateSettings([FromBody] MemberSettingsDto dto, CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var settings = await _db.MemberSettings
            .FirstOrDefaultAsync(s => s.TenantId == actor.TenantId && s.MemberId == actor.MemberId, ct);

        if (settings == null)
        {
            settings = new MemberSettings
            {
                Id = Guid.NewGuid(),
                TenantId = actor.TenantId,
                MemberId = actor.MemberId
            };
            _db.MemberSettings.Add(settings);
        }

        if (dto.PrivacySettingsJson != null) settings.PrivacySettingsJson = dto.PrivacySettingsJson;
        if (dto.NotificationSettingsJson != null) settings.NotificationSettingsJson = dto.NotificationSettingsJson;

        await _db.SaveChangesAsync(ct);
        return Ok(settings);
    }
}

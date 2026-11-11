using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Layered;

namespace Sethu.Api.Controllers;

public record NotificationDto(
    string Id,
    string MemberId,
    string Text,
    string Href,
    DateTimeOffset CreatedAt,
    bool Read,
    string? Title,
    string? Body,
    string? Type,
    bool IsRead,
    string? ReferenceId,
    bool AcknowledgementRequired = false,
    string? AcknowledgedAt = null,
    string? DeliveryMode = "Immediate"
);

[ApiController]
[Authorize]
[Route("api/notifications")]
[Route("notifications")]
public class NotificationsController : ControllerBase
{
    private readonly SethuDbContext _db;
    private readonly ICurrentNetworkMember _currentMember;

    public NotificationsController(SethuDbContext db, ICurrentNetworkMember currentMember)
    {
        _db = db;
        _currentMember = currentMember;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] bool? unreadOnly,
        [FromQuery] int page = 1,
        [FromQuery] int size = 20,
        CancellationToken ct = default)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var query = _db.Notifications
            .AsNoTracking()
            .Where(n => n.TenantId == actor.TenantId && n.MemberId == actor.MemberId);

        if (unreadOnly == true)
        {
            query = query.Where(n => !n.IsRead);
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * size)
            .Take(size)
            .Select(n => new NotificationDto(
                n.Id.ToString(),
                n.MemberId.ToString(),
                n.Title ?? n.Body ?? "Notification",
                n.ReferenceId != null && n.ReferenceId.StartsWith("/") ? n.ReferenceId : "/app/notifications",
                n.CreatedAt,
                n.IsRead,
                n.Title,
                n.Body,
                n.Type,
                n.IsRead,
                n.ReferenceId,
                false,
                null,
                "Immediate"))
            .ToListAsync(ct);

        var latest = items.FirstOrDefault()?.CreatedAt.ToUnixTimeSeconds() ?? 0;
        var etag = $"\"W/{total}-{latest}\"";
        Response.Headers.ETag = etag;

        if (Request.Headers.IfNoneMatch == etag)
        {
            return StatusCode(StatusCodes.Status304NotModified);
        }

        return Ok(new
        {
            items,
            page,
            size,
            total,
            unreadCount = await _db.Notifications.CountAsync(n => n.TenantId == actor.TenantId && n.MemberId == actor.MemberId && !n.IsRead, ct)
        });
    }

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var notification = await _db.Notifications.FirstOrDefaultAsync(
            n => n.Id == id && n.TenantId == actor.TenantId && n.MemberId == actor.MemberId, ct);

        if (notification == null) return NotFound();

        notification.IsRead = true;
        notification.ReadAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var unread = await _db.Notifications
            .Where(n => n.TenantId == actor.TenantId && n.MemberId == actor.MemberId && !n.IsRead)
            .ToListAsync(ct);

        foreach (var n in unread)
        {
            n.IsRead = true;
            n.ReadAt = DateTimeOffset.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
        return Ok(new { markedCount = unread.Count });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteNotification(Guid id, CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var notification = await _db.Notifications.FirstOrDefaultAsync(
            n => n.Id == id && n.TenantId == actor.TenantId && n.MemberId == actor.MemberId, ct);

        if (notification == null) return NotFound();

        _db.Notifications.Remove(notification);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("preferences")]
    public async Task<IActionResult> GetPreferences(CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var settings = await _db.MemberSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.TenantId == actor.TenantId && s.MemberId == actor.MemberId, ct);

        if (!string.IsNullOrWhiteSpace(settings?.NotificationSettingsJson))
        {
            try
            {
                var parsed = System.Text.Json.JsonSerializer.Deserialize<object>(settings.NotificationSettingsJson);
                return Ok(parsed);
            }
            catch
            {
                // Fallback to default structure
            }
        }

        return Ok(new
        {
            business = new { inApp = true, email = true, push = false },
            network = new { inApp = true, email = true, push = false },
            community = new { inApp = true, email = false, push = false },
            account = new { inApp = true, email = true, push = false }
        });
    }

    [HttpPut("preferences")]
    public async Task<IActionResult> UpdatePreferences([FromBody] System.Text.Json.JsonElement body, CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var settings = await _db.MemberSettings
            .FirstOrDefaultAsync(s => s.TenantId == actor.TenantId && s.MemberId == actor.MemberId, ct);

        if (settings == null)
        {
            settings = new Sethu.Domain.Entities.MemberSettings
            {
                Id = Guid.NewGuid(),
                TenantId = actor.TenantId,
                MemberId = actor.MemberId,
                PrivacySettingsJson = "{\"showPhone\":true,\"showEmail\":true,\"profileVisibility\":\"Network\"}",
                NotificationSettingsJson = body.GetRawText()
            };
            _db.MemberSettings.Add(settings);
        }
        else
        {
            settings.NotificationSettingsJson = body.GetRawText();
        }

        await _db.SaveChangesAsync(ct);
        return Ok(new { success = true });
    }
}

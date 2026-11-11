using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Layered;

namespace Sethu.Api.Controllers;

public record ToggleSavedItemDto(
    string ItemType, // "business", "opportunity", "resource"
    Guid ItemId
);

[ApiController]
[Authorize]
[Route("api/saved-items")]
[Route("saved-items")]
public class SavedItemsController : ControllerBase
{
    private readonly SethuDbContext _db;
    private readonly ICurrentNetworkMember _currentMember;

    public SavedItemsController(SethuDbContext db, ICurrentNetworkMember currentMember)
    {
        _db = db;
        _currentMember = currentMember;
    }

    [HttpGet]
    public async Task<IActionResult> GetSavedItems(
        [FromQuery] string? type,
        CancellationToken ct = default)
    {
        try
        {
            var actor = await _currentMember.ResolveAsync(User, ct);
            if (actor == null) return Forbid();

            var query = _db.SavedItems
                .AsNoTracking()
                .Where(s => s.TenantId == actor.TenantId && s.MemberId == actor.MemberId);

            if (!string.IsNullOrWhiteSpace(type))
            {
                query = query.Where(s => s.ItemType.ToLower() == type.ToLower());
            }

            var items = await query.OrderByDescending(s => s.SavedAt).ToListAsync(ct);
            return Ok(items);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return StatusCode(499);
        }
    }

    [HttpPost("toggle")]
    public async Task<IActionResult> ToggleSavedItem([FromBody] ToggleSavedItemDto dto, CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var existing = await _db.SavedItems.FirstOrDefaultAsync(
            s => s.TenantId == actor.TenantId && s.MemberId == actor.MemberId && s.ItemType.ToLower() == dto.ItemType.ToLower() && s.ItemId == dto.ItemId, ct);

        if (existing != null)
        {
            _db.SavedItems.Remove(existing);
            await _db.SaveChangesAsync(ct);
            return Ok(new { saved = false, itemId = dto.ItemId, message = "Item removed from bookmarks." });
        }

        var savedItem = new SavedItem
        {
            Id = Guid.NewGuid(),
            TenantId = actor.TenantId,
            MemberId = actor.MemberId,
            ItemType = dto.ItemType.Trim().ToLowerInvariant(),
            ItemId = dto.ItemId,
            SavedAt = DateTimeOffset.UtcNow
        };

        _db.SavedItems.Add(savedItem);
        await _db.SaveChangesAsync(ct);

        return Ok(new { saved = true, itemId = dto.ItemId, savedId = savedItem.Id, message = "Item saved to bookmarks." });
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.DTOs.Connections;
using Sethu.Service.Layered;

namespace Sethu.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/connections")]
[Route("api/v1/connections")]
[Route("connections")]
public class ConnectionsController : ControllerBase
{
    private readonly IConnectionService _service;
    private readonly ICurrentNetworkMember _currentMember;
    private readonly SethuDbContext _db;

    public ConnectionsController(
        IConnectionService service,
        ICurrentNetworkMember currentMember,
        SethuDbContext db)
    {
        _service = service;
        _currentMember = currentMember;
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] ConnectionQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var connections = await _service.GetAllAsync(actor, query.State, query.Page, query.Size, cancellationToken);
        var otherIds = connections.Select(c => c.OtherMemberId).Distinct().ToList();

        var userRows = await _db.UserIdentities
            .AsNoTracking()
            .Where(u => u.TenantId == actor.TenantId && u.MemberId.HasValue && otherIds.Contains(u.MemberId.Value))
            .ToListAsync(cancellationToken);
        var users = userRows
            .GroupBy(u => u.MemberId!.Value)
            .ToDictionary(g => g.Key, g => g.First());

        var businessRows = await _db.Set<BusinessRecord>()
            .AsNoTracking()
            .Where(b => b.TenantId == actor.TenantId && otherIds.Contains(b.OwnerMemberId))
            .ToListAsync(cancellationToken);

        var affiliationRows = await _db.Set<MemberChapterAffiliation>()
            .AsNoTracking()
            .Where(a => a.TenantId == actor.TenantId && otherIds.Contains(a.MemberId) && a.Status == AffiliationStatus.Active)
            .ToListAsync(cancellationToken);
        var affiliations = affiliationRows.GroupBy(a => a.MemberId).ToDictionary(g => g.Key, g => g.OrderBy(a => a.ChapterId).First().ChapterId);
        var businesses = businessRows.GroupBy(b => b.OwnerMemberId).ToDictionary(g => g.Key, g => g.OrderBy(b => b.Id).First());

        var chapterRows = await _db.Set<Chapter>()
            .AsNoTracking()
                        .ToListAsync(cancellationToken);
        var chapters = chapterRows
            .GroupBy(c => c.Id)
            .ToDictionary(g => g.Key, g => g.First().Name);

        var enriched = connections.Select(c =>
        {
            var u = users.TryGetValue(c.OtherMemberId, out var user) ? user : null;
            var b = businesses.TryGetValue(c.OtherMemberId, out var biz) ? biz : null;
            var chId = affiliations.TryGetValue(c.OtherMemberId, out var cid) ? cid : (Guid?)null;
            var chapter = chId.HasValue && chapters.TryGetValue(chId.Value, out var chName)
                ? (chName.Contains("Chapter", StringComparison.OrdinalIgnoreCase) ? chName : $"{chName} Chapter")
                : "Network Chapter";

            var city = chapter.Contains("Chennai", StringComparison.OrdinalIgnoreCase) ? "Chennai" :
                       chapter.Contains("Coimbatore", StringComparison.OrdinalIgnoreCase) ? "Coimbatore" :
                       chapter.Contains("Hosur", StringComparison.OrdinalIgnoreCase) ? "Hosur" :
                       chapter.Contains("Cuddalore", StringComparison.OrdinalIgnoreCase) ? "Cuddalore" : "Tamil Nadu";

            var rawInitials = string.Join("", (u?.Name ?? "NM").Split(' ', StringSplitOptions.RemoveEmptyEntries).Select(s => s[0])).ToUpperInvariant();
            var initials = rawInitials.Length > 2 ? rawInitials[..2] : (rawInitials.Length > 0 ? rawInitials : "NM");

            var designation = u?.Email?.Contains("secretary", StringComparison.OrdinalIgnoreCase) == true ? "Director" :
                              u?.Email?.Contains("treasurer", StringComparison.OrdinalIgnoreCase) == true ? "Finance Director" :
                              u?.Email?.Contains("regional", StringComparison.OrdinalIgnoreCase) == true ? "Managing Partner" :
                              u?.Email?.Contains("board", StringComparison.OrdinalIgnoreCase) == true ? "Executive Director" : "Managing Director";

            return new
            {
                id = c.Id,
                initiatorId = c.InitiatorId,
                otherMemberId = c.OtherMemberId,
                isInitiator = c.InitiatorId == actor.MemberId,
                currentMemberId = actor.MemberId,
                state = c.State,
                version = c.Version,
                updatedAt = c.UpdatedAt,
                otherMemberName = u?.Name ?? "Network Member",
                otherMemberEmail = u?.Email ?? "",
                otherMemberCompany = b?.Name ?? "Independent Enterprise",
                otherMemberChapter = chapter,
                otherMemberCity = city,
                otherMemberDesignation = designation,
                otherMemberAvatar = initials
            };
        });

        return Ok(enriched);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ConnectionDto>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var connection = await _service.GetByIdAsync(actor, id, cancellationToken);
        if (connection is null) return NotFound();

        return Ok(connection);
    }

    [HttpGet("{id:guid}/history")]
    public async Task<ActionResult<List<ConnectionTransitionDto>>> GetHistory(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int size = 20,
        CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var connection = await _service.GetByIdAsync(actor, id, cancellationToken);
        if (connection is null) return NotFound();

        var history = await _service.GetHistoryAsync(actor, id, page, size, cancellationToken);
        return Ok(history);
    }

    [HttpPost("actions")]
    public async Task<ActionResult<ConnectionOutcomeDto>> ChangeState(
        [FromBody] ConnectionActionRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var outcome = await _service.ChangeStateAsync(actor, dto, cancellationToken);
        return outcome.Accepted ? Ok(outcome) : Conflict(outcome);
    }
}

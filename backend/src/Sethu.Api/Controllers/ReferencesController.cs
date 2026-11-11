using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.DTOs.References;
using Sethu.Service.Layered;

namespace Sethu.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/references")]
[Route("api/v1/references")]
[Route("references")]
public class ReferencesController : ControllerBase
{
    private readonly IReferenceService _service;
    private readonly ICurrentNetworkMember _currentMember;
    private readonly SethuDbContext _db;

    public ReferencesController(
        IReferenceService service,
        ICurrentNetworkMember currentMember,
        SethuDbContext db)
    {
        _service = service;
        _currentMember = currentMember;
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] ReferenceQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var references = await _service.GetAllAsync(actor, query.Page, query.Size, cancellationToken);
        var memberIds = references.Select(r => r.FromMemberId)
            .Concat(references.Select(r => r.ToMemberId))
            .Concat(references.Where(r => r.IntroducedMemberId.HasValue).Select(r => r.IntroducedMemberId!.Value))
            .Distinct().ToList();

        var userRows = await _db.UserIdentities
            .AsNoTracking()
            .Where(u => u.TenantId == actor.TenantId && u.MemberId.HasValue && memberIds.Contains(u.MemberId.Value))
            .ToListAsync(cancellationToken);
        var users = userRows
            .GroupBy(u => u.MemberId!.Value)
            .ToDictionary(g => g.Key, g => g.First().Name ?? "Member");

        var businessRows = await _db.Set<BusinessRecord>()
            .AsNoTracking()
            .Where(b => b.TenantId == actor.TenantId && memberIds.Contains(b.OwnerMemberId))
            .ToListAsync(cancellationToken);

        var businesses = businessRows.GroupBy(b => b.OwnerMemberId).ToDictionary(g => g.Key, g => g.OrderBy(b => b.Id).First().Name);

        var enriched = references.Select(r => new
        {
            id = r.Id,
            fromMemberId = r.FromMemberId,
            fromMemberName = users.TryGetValue(r.FromMemberId, out var fn) ? fn : "Member",
            toMemberId = r.ToMemberId,
            toMemberName = users.TryGetValue(r.ToMemberId, out var tn) ? tn : "Member",
            introducedMemberId = r.IntroducedMemberId,
            introducedMemberName = r.IntroducedMemberId.HasValue && users.TryGetValue(r.IntroducedMemberId.Value, out var iname) ? iname : null,
            businessName = businesses.TryGetValue(r.ToMemberId, out var bname) ? bname : "Enterprise",
            status = r.Status,
            outcome = r.Outcome,
            followUpAt = r.FollowUpAt,
            createdAt = r.CreatedAt
        });

        return Ok(enriched);
    }

    [HttpPost]
    public async Task<ActionResult<ReferenceResultDto>> Create(
        [FromBody] CreateReferenceDto dto,
        CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var result = await _service.CreateReferenceAsync(actor, dto, cancellationToken);
        return result.Accepted ? Ok(result) : Conflict(result);
    }

    [HttpPost("actions")]
    public async Task<ActionResult<ReferenceResultDto>> Update(
        [FromBody] UpdateReferenceDto dto,
        CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var result = await _service.UpdateReferenceAsync(actor, dto, cancellationToken);
        return result.Accepted ? Ok(result) : Conflict(result);
    }
}

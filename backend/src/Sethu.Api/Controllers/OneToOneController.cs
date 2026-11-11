using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.DTOs.Common;
using Sethu.Service.DTOs.Meetings;
using Sethu.Service.Layered;

namespace Sethu.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/one-to-one")]
[Route("api/v1/one-to-one")]
[Route("one-to-one")]
public class OneToOneController : ControllerBase
{
    private readonly IMeetingService _service;
    private readonly ICurrentNetworkMember _currentMember;
    private readonly SethuDbContext _db;

    public OneToOneController(
        IMeetingService service,
        ICurrentNetworkMember currentMember,
        SethuDbContext db)
    {
        _service = service;
        _currentMember = currentMember;
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] MeetingQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var meetings = await _service.GetAllAsync(actor, query.Page, query.Size, cancellationToken);
        var partnerIds = meetings.Select(m => m.FromMemberId == actor.MemberId ? m.ToMemberId : m.FromMemberId).Distinct().ToList();

        var userRows = await _db.UserIdentities
            .AsNoTracking()
            .Where(u => u.TenantId == actor.TenantId && u.MemberId.HasValue && partnerIds.Contains(u.MemberId.Value))
            .ToListAsync(cancellationToken);
        var users = userRows
            .GroupBy(u => u.MemberId!.Value)
            .ToDictionary(g => g.Key, g => g.First());

        var businessRows = await _db.Set<BusinessRecord>()
            .AsNoTracking()
            .Where(b => b.TenantId == actor.TenantId && partnerIds.Contains(b.OwnerMemberId))
            .ToListAsync(cancellationToken);
        var businesses = businessRows
            .GroupBy(b => b.OwnerMemberId)
            .ToDictionary(g => g.Key, g => g.First());

        var affiliationRows = await _db.Set<MemberChapterAffiliation>()
            .AsNoTracking()
            .Where(a => a.TenantId == actor.TenantId && partnerIds.Contains(a.MemberId) && a.Status == AffiliationStatus.Active)
            .ToListAsync(cancellationToken);
        var affiliations = affiliationRows
            .GroupBy(a => a.MemberId)
            .ToDictionary(g => g.Key, g => g.First().ChapterId);

        var chapterRows = await _db.Set<Chapter>()
            .AsNoTracking()
                        .ToListAsync(cancellationToken);
        var chapters = chapterRows
            .GroupBy(c => c.Id)
            .ToDictionary(g => g.Key, g => g.First().Name);

        var enriched = meetings.Select(m =>
        {
            var otherId = m.FromMemberId == actor.MemberId ? m.ToMemberId : m.FromMemberId;
            var u = users.TryGetValue(otherId, out var user) ? user : null;
            var b = businesses.TryGetValue(otherId, out var biz) ? biz : null;
            var chId = affiliations.TryGetValue(otherId, out var cid) ? cid : (Guid?)null;
            var chapter = chId.HasValue && chapters.TryGetValue(chId.Value, out var chName) ? chName : "Network Chapter";

            return new
            {
                id = m.Id,
                fromMemberId = m.FromMemberId,
                toMemberId = m.ToMemberId,
                otherMemberId = otherId,
                status = m.Status,
                proposedAt = m.ProposedAt,
                confirmedAt = m.ConfirmedAt,
                timeZoneId = m.TimeZoneId,
                outcome = m.Outcome,
                followUpAt = m.FollowUpAt,
                otherMemberName = u?.Name ?? "Member",
                otherMemberCompany = b?.Name ?? "Enterprise",
                otherMemberChapter = chapter
            };
        });

        return Ok(enriched);
    }

    [HttpPost]
    public async Task<ActionResult<OperationResultDto>> Create(
        [FromBody] CreateMeetingDto dto,
        CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var result = await _service.CreateMeetingAsync(actor, dto, cancellationToken);
        return result.Accepted ? Ok(result) : Conflict(result);
    }

    [HttpPost("actions")]
    public async Task<ActionResult<OperationResultDto>> Change(
        [FromBody] MeetingActionDto dto,
        CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var result = await _service.ChangeMeetingAsync(actor, dto, cancellationToken);
        return result.Accepted ? Ok(result) : Conflict(result);
    }
}

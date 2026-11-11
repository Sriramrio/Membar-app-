using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Service.DTOs.Calendar;
using Sethu.Service.DTOs.Common;
using Sethu.Service.Layered;

namespace Sethu.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/calendar")]
[Route("api/v1/calendar")]
[Route("calendar")]
public class CalendarController : ControllerBase
{
    private readonly ICalendarService _service;
    private readonly ICurrentNetworkMember _currentMember;

    public CalendarController(
        ICalendarService service,
        ICurrentNetworkMember currentMember)
    {
        _service = service;
        _currentMember = currentMember;
    }

    [HttpGet("events")]
    public async Task<ActionResult<List<CalendarEventDto>>> GetAll(
        [FromQuery] CalendarQueryDto query,
        [FromServices] Sethu.Infrastructure.Persistence.SethuDbContext db,
        [FromServices] Sethu.Service.Abstractions.Organisation.IScopeResolver scopeResolver,
        CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var memberScope = await scopeResolver.ResolveMemberAsync(User, actor.TenantId, cancellationToken);

        var chapterRows = await db.Chapters
            .AsNoTracking()
                        .ToListAsync(cancellationToken);
        var chapters = chapterRows
            .GroupBy(c => c.Id)
            .ToDictionary(g => g.Key, g => g.First().Name);
        var events = await _service.GetAllAsync(actor, query.Page, query.Size, cancellationToken);
        var resultList = new List<CalendarEventDto>();

        foreach (var ev in events)
        {
            var chName = chapters.TryGetValue(ev.ChapterId, out var cName)
                ? (cName.Contains("Chapter", StringComparison.OrdinalIgnoreCase) ? cName : $"{cName} Chapter")
                : (!string.IsNullOrEmpty(memberScope.ChapterName) ? memberScope.ChapterName : "Chapter");
            var cityName = chapters.TryGetValue(ev.ChapterId, out var cn) ? cn : (!string.IsNullOrEmpty(memberScope.ChapterName) ? memberScope.ChapterName.Replace(" Chapter", "", StringComparison.OrdinalIgnoreCase).Trim() : "Salem");
            resultList.Add(ev with { Chapter = chName, City = cityName });
        }

        // Also include scoped meetings from MeetingRecord
        var meetings = await db.Set<MeetingRecord>()
            .AsNoTracking()
            .Where(m => m.TenantId == actor.TenantId)
            .ToListAsync(cancellationToken);

        var scopedMeetings = meetings
            .Where(m => string.IsNullOrWhiteSpace(m.ScopeId) ||
                        m.ScopeId.Equals("all", StringComparison.OrdinalIgnoreCase) ||
                        m.ScopeLevel?.Equals("NATIONAL", StringComparison.OrdinalIgnoreCase) == true ||
                        memberScope.MatchesChapter(m.ScopeId, m.ScopeName))
            .ToList();

        foreach (var m in scopedMeetings)
        {
            if (resultList.All(e => e.Id != m.Id))
            {
                var dt = DateTimeOffset.TryParse(m.ScheduledAt, out var parsedDt) ? parsedDt : DateTimeOffset.UtcNow.AddDays(7);
                var chapterGuid = Guid.TryParse(m.ScopeId, out var parsedScopeId) ? parsedScopeId : (memberScope.ChapterId ?? Guid.Empty);
                var resolvedChName = !string.IsNullOrEmpty(m.ScopeName)
                    ? (m.ScopeName.Contains("Chapter", StringComparison.OrdinalIgnoreCase) ? m.ScopeName : $"{m.ScopeName} Chapter")
                    : (chapters.TryGetValue(chapterGuid, out var dbCh) ? (dbCh.Contains("Chapter", StringComparison.OrdinalIgnoreCase) ? dbCh : $"{dbCh} Chapter") : (!string.IsNullOrEmpty(memberScope.ChapterName) ? memberScope.ChapterName : "Chapter"));
                var resolvedCity = !string.IsNullOrEmpty(m.ScopeName) 
                    ? m.ScopeName.Replace(" Chapter", "", StringComparison.OrdinalIgnoreCase).Trim() 
                    : (chapters.TryGetValue(chapterGuid, out var dbCity) ? dbCity : (!string.IsNullOrEmpty(memberScope.ChapterName) ? memberScope.ChapterName.Replace(" Chapter", "", StringComparison.OrdinalIgnoreCase).Trim() : "Salem"));

                resultList.Add(new CalendarEventDto(
                    m.Id,
                    chapterGuid,
                    m.Title,
                    dt,
                    dt.AddHours(2),
                    m.QuorumRequired > 0 ? m.QuorumRequired : 50,
                    0,
                    false,
                    m.Status,
                    resolvedChName,
                    resolvedCity
                ));
            }
        }

        return Ok(resultList);
    }

    [HttpPost("free-events")]
    public async Task<ActionResult<OperationResultDto>> Create(
        [FromBody] CreateCalendarEventDto dto,
        CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var result = await _service.CreateEventAsync(actor, dto, cancellationToken);
        return result.Accepted ? Ok(result) : Conflict(result);
    }

    [HttpPost("free-events/actions")]
    public async Task<ActionResult<OperationResultDto>> Register(
        [FromBody] RegisterCalendarEventDto dto,
        CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var result = await _service.RegisterEventAsync(actor, dto, cancellationToken);
        return result.Accepted ? Ok(result) : Conflict(result);
    }
}

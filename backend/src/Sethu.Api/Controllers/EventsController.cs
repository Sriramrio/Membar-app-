using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Domain.Organisation;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Abstractions.Organisation;

namespace Sethu.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/events")]
[Route("events")]
public class EventsController : ControllerBase
{
    private readonly SethuDbContext _db;
    private readonly IScopeResolver _scopeResolver;

    public EventsController(SethuDbContext db, IScopeResolver scopeResolver)
    {
        _db = db;
        _scopeResolver = scopeResolver;
    }

    private Guid GetTenantId() => Guid.Parse("00000000-0000-0000-0000-000000000001");

    private static bool _rsvpTableEnsured;
    private async Task EnsureRsvpTableAsync(CancellationToken ct)
    {
        if (_rsvpTableEnsured) return;
        try
        {
            await _db.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS public.event_rsvps (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""TenantId"" uuid NOT NULL,
                    ""EventId"" uuid NOT NULL,
                    ""MemberId"" text NOT NULL,
                    ""MemberName"" text NOT NULL,
                    ""MemberEmail"" text NOT NULL DEFAULT '',
                    ""MemberPhone"" text NOT NULL DEFAULT '',
                    ""ChapterId"" text NULL,
                    ""ChapterName"" text NULL,
                    ""Status"" text NOT NULL,
                    ""SubstituteName"" text NULL,
                    ""SubstitutePhone"" text NULL,
                    ""Notes"" text NULL,
                    ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT now(),
                    ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT now()
                );
                CREATE UNIQUE INDEX IF NOT EXISTS ix_event_rsvps_event_member ON public.event_rsvps(""EventId"", ""MemberId"");
            ", ct);
            _rsvpTableEnsured = true;
        }
        catch
        {
            // Silently ignore if already created or concurrent execution
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetEvents(CancellationToken ct)
    {
        try
        {
            var tenantId = GetTenantId();
            var memberScope = await _scopeResolver.ResolveMemberAsync(User, tenantId, ct);

            // Retrieve meetings & programmes from organisation storage
            var meetings = await _db.Set<MeetingRecord>()
                .AsNoTracking()
                .OrderByDescending(m => m.ScheduledAt)
                .ToListAsync(ct);

            var programmes = await _db.Set<ProgrammeRecord>()
                .AsNoTracking()
                .ToListAsync(ct);

            var freeEvents = await _db.Set<NetworkFreeEvent>()
                .AsNoTracking()
                .Where(e => e.Status == "Published")
                .ToListAsync(ct);

            // Filter: WHERE ScopeId/ScopeName matches member's chapter OR ScopeId IS NULL OR ScopeLevel = 'NATIONAL'
            var scopedMeetings = meetings
                .Where(m => string.IsNullOrWhiteSpace(m.ScopeId) ||
                            m.ScopeLevel?.Equals("NATIONAL", StringComparison.OrdinalIgnoreCase) == true ||
                            memberScope.MatchesChapter(m.ScopeId, m.ScopeName))
                .ToList();

            var scopedProgrammes = programmes
                .Where(p => string.IsNullOrWhiteSpace(p.ScopeId) ||
                            p.ScopeLevel?.Equals("NATIONAL", StringComparison.OrdinalIgnoreCase) == true ||
                            memberScope.MatchesChapter(p.ScopeId, p.ScopeName))
                .ToList();

            var scopedFreeEvents = freeEvents
                .Where(e => memberScope.IsInAncestry(e.ChapterId.ToString("D")) ||
                            (memberScope.ChapterId.HasValue && e.ChapterId == memberScope.ChapterId.Value))
                .ToList();

            await EnsureRsvpTableAsync(ct);
            var allRsvps = await _db.EventRsvps.AsNoTracking().ToListAsync(ct);
            var rsvpByEvent = allRsvps.GroupBy(r => r.EventId).ToDictionary(g => g.Key, g => g.ToList());
            var currentMemberIdStr = memberScope?.MemberId.ToString("D") ?? "";
            var memberChapterName = !string.IsNullOrEmpty(memberScope?.ChapterName) ? memberScope.ChapterName : "Chapter";
            var memberCityName = memberChapterName.Replace(" Chapter", "", StringComparison.OrdinalIgnoreCase).Trim();
            if (string.IsNullOrEmpty(memberCityName)) memberCityName = "Salem";

            var results = new List<object>();

            foreach (var m in scopedMeetings)
            {
                var chName = !string.IsNullOrEmpty(m.ScopeName)
                    ? (m.ScopeName.Contains("Chapter", StringComparison.OrdinalIgnoreCase) ? m.ScopeName : $"{m.ScopeName} Chapter")
                    : memberChapterName;
                var city = !string.IsNullOrEmpty(m.ScopeName)
                    ? m.ScopeName.Replace(" Chapter", "", StringComparison.OrdinalIgnoreCase).Trim()
                    : memberCityName;

                rsvpByEvent.TryGetValue(m.Id, out var mRsvps);
                var att = mRsvps?.Count(r => r.Status == "ATTENDING") ?? 0;
                var notAv = mRsvps?.Count(r => r.Status == "NOT_AVAILABLE") ?? 0;
                var sub = mRsvps?.Count(r => r.Status == "SUBSTITUTE") ?? 0;
                var myRsvp = mRsvps?.FirstOrDefault(r => r.MemberId == currentMemberIdStr);

                results.Add(new
                {
                    id = m.Id.ToString("D"),
                    name = m.Title,
                    title = m.Title,
                    type = !string.IsNullOrWhiteSpace(m.Type) ? m.Type : "Meeting",
                    date = m.ScheduledAt,
                    dateTime = m.ScheduledAt,
                    scheduledAt = m.ScheduledAt,
                    location = !string.IsNullOrWhiteSpace(m.Location) ? m.Location : "Main Hall",
                    venue = !string.IsNullOrWhiteSpace(m.Location) ? m.Location : "Main Hall",
                    city = city,
                    chapter = chName,
                    chapterName = chName,
                    status = m.Status,
                    quorumRequired = m.QuorumRequired,
                    attendingCount = att,
                    notAvailableCount = notAv,
                    substituteCount = sub,
                    totalResponses = mRsvps?.Count ?? 0,
                    myRsvp = myRsvp != null ? new
                    {
                        status = myRsvp.Status,
                        substituteName = myRsvp.SubstituteName,
                        substitutePhone = myRsvp.SubstitutePhone,
                        updatedAt = myRsvp.UpdatedAt
                    } : null,
                    scope = new
                    {
                        id = m.ScopeId,
                        name = m.ScopeName,
                        level = m.ScopeLevel
                    },
                    source = "MEETING"
                });
            }

            foreach (var p in scopedProgrammes)
            {
                var chName = !string.IsNullOrEmpty(p.ScopeName)
                    ? (p.ScopeName.Contains("Chapter", StringComparison.OrdinalIgnoreCase) ? p.ScopeName : $"{p.ScopeName} Chapter")
                    : memberChapterName;
                var city = !string.IsNullOrEmpty(p.ScopeName)
                    ? p.ScopeName.Replace(" Chapter", "", StringComparison.OrdinalIgnoreCase).Trim()
                    : memberCityName;

                rsvpByEvent.TryGetValue(p.Id, out var pRsvps);

                results.Add(new
                {
                    id = p.Id.ToString("D"),
                    name = p.Name,
                    title = p.Name,
                    type = "Programme",
                    date = p.NextMilestone ?? p.CreatedAt.ToString("yyyy-MM-dd"),
                    dateTime = p.NextMilestone ?? p.CreatedAt.ToString("o"),
                    scheduledAt = p.NextMilestone ?? p.CreatedAt.ToString("o"),
                    location = "Main Hall",
                    venue = "Main Hall",
                    city = city,
                    chapter = chName,
                    chapterName = chName,
                    status = p.Status,
                    quorumRequired = 10,
                    attendingCount = pRsvps?.Count(r => r.Status == "ATTENDING") ?? 0,
                    notAvailableCount = pRsvps?.Count(r => r.Status == "NOT_AVAILABLE") ?? 0,
                    substituteCount = pRsvps?.Count(r => r.Status == "SUBSTITUTE") ?? 0,
                    totalResponses = pRsvps?.Count ?? 0,
                    scope = new
                    {
                        id = p.ScopeId,
                        name = p.ScopeName,
                        level = p.ScopeLevel
                    },
                    source = "PROGRAMME"
                });
            }

            foreach (var f in scopedFreeEvents)
            {
                var chName = memberChapterName;
                var city = memberCityName;

                rsvpByEvent.TryGetValue(f.Id, out var fRsvps);

                results.Add(new
                {
                    id = f.Id.ToString("D"),
                    name = f.Title,
                    title = f.Title,
                    type = "Chapter Event",
                    date = f.StartsAt.ToString("o"),
                    dateTime = f.StartsAt.ToString("o"),
                    scheduledAt = f.StartsAt.ToString("o"),
                    location = "Main Hall",
                    venue = "Main Hall",
                    city = city,
                    chapter = chName,
                    chapterName = chName,
                    status = f.Status,
                    quorumRequired = f.Capacity,
                    attendingCount = fRsvps?.Count(r => r.Status == "ATTENDING") ?? 0,
                    notAvailableCount = fRsvps?.Count(r => r.Status == "NOT_AVAILABLE") ?? 0,
                    substituteCount = fRsvps?.Count(r => r.Status == "SUBSTITUTE") ?? 0,
                    totalResponses = fRsvps?.Count ?? 0,
                    scope = new
                    {
                        id = f.ChapterId.ToString("D"),
                        name = memberChapterName,
                        level = "CHAPTER"
                    },
                    source = "FREE_EVENT"
                });
            }

            return Ok(results);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return NoContent();
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetEventById(Guid id, CancellationToken ct)
    {
        try
        {
            var tenantId = GetTenantId();
            var memberScope = await _scopeResolver.ResolveMemberAsync(User, tenantId, ct);
            var currentMemberIdStr = memberScope?.MemberId.ToString("D") ?? User.FindFirst("sub")?.Value ?? "";

            var meeting = await _db.Set<MeetingRecord>()
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.Id == id, ct);

            if (meeting != null)
            {
                if (!string.IsNullOrWhiteSpace(meeting.ScopeId) &&
                    !string.Equals(meeting.ScopeLevel, "NATIONAL", StringComparison.OrdinalIgnoreCase) &&
                    memberScope != null &&
                    !memberScope.IsInAncestry(meeting.ScopeId))
                {
                    return Forbid();
                }

                var rsvps = await _db.EventRsvps.AsNoTracking().Where(r => r.EventId == id).ToListAsync(ct);
                var myRsvp = rsvps.FirstOrDefault(r => r.MemberId == currentMemberIdStr);

                return Ok(new
                {
                    id = meeting.Id.ToString("D"),
                    name = meeting.Title,
                    title = meeting.Title,
                    type = meeting.Type,
                    date = meeting.ScheduledAt,
                    dateTime = meeting.ScheduledAt,
                    scheduledAt = meeting.ScheduledAt,
                    location = !string.IsNullOrWhiteSpace(meeting.Location) ? meeting.Location : "TBD",
                    venue = !string.IsNullOrWhiteSpace(meeting.Location) ? meeting.Location : "TBD",
                    status = meeting.Status,
                    quorumRequired = meeting.QuorumRequired,
                    attendingCount = rsvps.Count(r => r.Status == "ATTENDING"),
                    notAvailableCount = rsvps.Count(r => r.Status == "NOT_AVAILABLE"),
                    substituteCount = rsvps.Count(r => r.Status == "SUBSTITUTE"),
                    totalResponses = rsvps.Count,
                    myRsvp = myRsvp != null ? new
                    {
                        status = myRsvp.Status,
                        substituteName = myRsvp.SubstituteName,
                        substitutePhone = myRsvp.SubstitutePhone,
                        notes = myRsvp.Notes,
                        updatedAt = myRsvp.UpdatedAt
                    } : null,
                    responses = rsvps.Select(r => new
                    {
                        id = r.Id,
                        memberId = r.MemberId,
                        memberName = r.MemberName,
                        status = r.Status,
                        substituteName = r.SubstituteName,
                        substitutePhone = r.SubstitutePhone,
                        notes = r.Notes,
                        updatedAt = r.UpdatedAt
                    }).ToList(),
                    scope = new
                    {
                        id = meeting.ScopeId,
                        name = meeting.ScopeName,
                        level = meeting.ScopeLevel
                    }
                });
            }

            var memberChapterName = !string.IsNullOrEmpty(memberScope?.ChapterName) ? memberScope.ChapterName : "Chapter";
            var memberCityName = memberChapterName.Replace(" Chapter", "", StringComparison.OrdinalIgnoreCase).Trim();
            if (string.IsNullOrEmpty(memberCityName)) memberCityName = "Salem";

            var freeEvent = await _db.Set<NetworkFreeEvent>()
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == id, ct);

            if (freeEvent != null)
            {
                var rsvps = await _db.EventRsvps.AsNoTracking().Where(r => r.EventId == id).ToListAsync(ct);
                var myRsvp = rsvps.FirstOrDefault(r => r.MemberId == currentMemberIdStr);

                return Ok(new
                {
                    id = freeEvent.Id.ToString("D"),
                    name = freeEvent.Title,
                    title = freeEvent.Title,
                    type = "Chapter Event",
                    date = freeEvent.StartsAt.ToString("o"),
                    dateTime = freeEvent.StartsAt.ToString("o"),
                    scheduledAt = freeEvent.StartsAt.ToString("o"),
                    location = "Main Hall",
                    venue = "Main Hall",
                    city = memberCityName,
                    chapter = memberChapterName,
                    chapterName = memberChapterName,
                    status = freeEvent.Status,
                    quorumRequired = freeEvent.Capacity,
                    attendingCount = rsvps.Count(r => r.Status == "ATTENDING"),
                    notAvailableCount = rsvps.Count(r => r.Status == "NOT_AVAILABLE"),
                    substituteCount = rsvps.Count(r => r.Status == "SUBSTITUTE"),
                    totalResponses = rsvps.Count,
                    myRsvp = myRsvp != null ? new
                    {
                        status = myRsvp.Status,
                        substituteName = myRsvp.SubstituteName,
                        substitutePhone = myRsvp.SubstitutePhone,
                        notes = myRsvp.Notes,
                        updatedAt = myRsvp.UpdatedAt
                    } : null,
                    responses = rsvps.Select(r => new
                    {
                        id = r.Id,
                        memberId = r.MemberId,
                        memberName = r.MemberName,
                        status = r.Status,
                        substituteName = r.SubstituteName,
                        substitutePhone = r.SubstitutePhone,
                        notes = r.Notes,
                        updatedAt = r.UpdatedAt
                    }).ToList(),
                    scope = new
                    {
                        id = freeEvent.ChapterId.ToString("D"),
                        name = memberChapterName,
                        level = "CHAPTER"
                    },
                    source = "FREE_EVENT"
                });
            }

            var programme = await _db.Set<ProgrammeRecord>()
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id, ct);

            if (programme != null)
            {
                var rsvps = await _db.EventRsvps.AsNoTracking().Where(r => r.EventId == id).ToListAsync(ct);
                var myRsvp = rsvps.FirstOrDefault(r => r.MemberId == currentMemberIdStr);

                var pDate = programme.NextMilestone ?? programme.CreatedAt.ToString("o");
                return Ok(new
                {
                    id = programme.Id.ToString("D"),
                    name = programme.Name,
                    title = programme.Name,
                    type = "Programme",
                    date = programme.NextMilestone ?? programme.CreatedAt.ToString("yyyy-MM-dd"),
                    dateTime = pDate,
                    scheduledAt = pDate,
                    location = "Main Hall",
                    venue = "Main Hall",
                    city = memberCityName,
                    chapter = memberChapterName,
                    chapterName = memberChapterName,
                    status = programme.Status,
                    quorumRequired = 50,
                    attendingCount = rsvps.Count(r => r.Status == "ATTENDING"),
                    notAvailableCount = rsvps.Count(r => r.Status == "NOT_AVAILABLE"),
                    substituteCount = rsvps.Count(r => r.Status == "SUBSTITUTE"),
                    totalResponses = rsvps.Count,
                    myRsvp = myRsvp != null ? new
                    {
                        status = myRsvp.Status,
                        substituteName = myRsvp.SubstituteName,
                        substitutePhone = myRsvp.SubstitutePhone,
                        updatedAt = myRsvp.UpdatedAt
                    } : null,
                    responses = rsvps.Select(r => new
                    {
                        id = r.Id,
                        memberId = r.MemberId,
                        memberName = r.MemberName,
                        status = r.Status,
                        substituteName = r.SubstituteName,
                        substitutePhone = r.SubstitutePhone,
                        notes = r.Notes,
                        updatedAt = r.UpdatedAt
                    }).ToList(),
                    source = "PROGRAMME"
                });
            }

            return NotFound();
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return NoContent();
        }
    }

    [HttpPost("{id:guid}/rsvp")]
    [HttpPost("/api/calendar/events/{id:guid}/rsvp")]
    public async Task<IActionResult> SubmitRsvp(Guid id, [FromBody] EventRsvpRequestDto dto, CancellationToken ct)
    {
        var tenantId = GetTenantId();
        var memberScope = await _scopeResolver.ResolveMemberAsync(User, tenantId, ct);

        var memberId = !string.IsNullOrWhiteSpace(dto.MemberId)
            ? dto.MemberId
            : (memberScope?.MemberId.ToString("D") ?? User.FindFirst("sub")?.Value ?? User.FindFirst("member_id")?.Value ?? "11111111-1111-1111-1111-111111111111");
        var memberName = !string.IsNullOrWhiteSpace(dto.MemberName)
            ? dto.MemberName
            : (User.FindFirst("name")?.Value ?? User.FindFirst("given_name")?.Value ?? User.Identity?.Name ?? (!string.IsNullOrWhiteSpace(memberScope?.ChapterName) ? $"{memberScope.ChapterName} Member" : "Member"));
        var memberEmail = !string.IsNullOrWhiteSpace(dto.MemberEmail) ? dto.MemberEmail : (User.FindFirst("email")?.Value ?? "");
        var memberPhone = !string.IsNullOrWhiteSpace(dto.MemberPhone) ? dto.MemberPhone : (User.FindFirst("phone")?.Value ?? User.FindFirst("mobile")?.Value ?? "");

        var normStatus = (dto.Status ?? "ATTENDING").Trim().ToUpperInvariant();
        if (normStatus != "ATTENDING" && normStatus != "NOT_AVAILABLE" && normStatus != "SUBSTITUTE")
        {
            normStatus = "ATTENDING";
        }

        var rsvp = await _db.EventRsvps.FirstOrDefaultAsync(r => r.EventId == id && r.MemberId == memberId, ct);
        if (rsvp == null)
        {
            rsvp = new EventRsvpRecord
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                EventId = id,
                MemberId = memberId,
                MemberName = memberName,
                MemberEmail = memberEmail,
                MemberPhone = memberPhone,
                ChapterId = memberScope?.ChapterId?.ToString("D"),
                ChapterName = memberScope?.ChapterName,
                Status = normStatus,
                SubstituteName = dto.SubstituteName,
                SubstitutePhone = dto.SubstitutePhone,
                Notes = dto.Notes,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            await _db.EventRsvps.AddAsync(rsvp, ct);
        }
        else
        {
            rsvp.Status = normStatus;
            rsvp.SubstituteName = dto.SubstituteName;
            rsvp.SubstitutePhone = dto.SubstitutePhone;
            rsvp.Notes = dto.Notes;
            rsvp.UpdatedAt = DateTimeOffset.UtcNow;
            if (!string.IsNullOrWhiteSpace(memberName)) rsvp.MemberName = memberName;
            if (!string.IsNullOrWhiteSpace(memberEmail)) rsvp.MemberEmail = memberEmail;
            if (!string.IsNullOrWhiteSpace(memberPhone)) rsvp.MemberPhone = memberPhone;
        }

        // Keep attendance record in sync
        var attendance = await _db.AttendanceRecords.FirstOrDefaultAsync(a => a.EventId == id && a.MemberId.ToString() == memberId, ct);
        if (attendance != null)
        {
            attendance.Status = normStatus.ToLowerInvariant();
            attendance.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await _db.SaveChangesAsync(ct);

        var allForEvent = await _db.EventRsvps.AsNoTracking().Where(r => r.EventId == id).ToListAsync(ct);
        var attending = allForEvent.Count(r => r.Status == "ATTENDING");
        var notAvailable = allForEvent.Count(r => r.Status == "NOT_AVAILABLE");
        var substitute = allForEvent.Count(r => r.Status == "SUBSTITUTE");

        return Ok(new
        {
            success = true,
            rsvp,
            summary = new
            {
                eventId = id.ToString("D"),
                attendingCount = attending,
                notAvailableCount = notAvailable,
                substituteCount = substitute,
                totalResponses = allForEvent.Count
            }
        });
    }

    [HttpGet("{id:guid}/rsvp-summary")]
    [HttpGet("/api/calendar/events/{id:guid}/rsvp-summary")]
    public async Task<IActionResult> GetRsvpSummary(Guid id, CancellationToken ct)
    {
        var tenantId = GetTenantId();
        var memberScope = await _scopeResolver.ResolveMemberAsync(User, tenantId, ct);
        var memberId = memberScope?.MemberId.ToString("D") ?? User.FindFirst("sub")?.Value ?? User.FindFirst("member_id")?.Value ?? "";

        var allForEvent = await _db.EventRsvps.AsNoTracking().Where(r => r.EventId == id).ToListAsync(ct);
        var attending = allForEvent.Count(r => r.Status == "ATTENDING");
        var notAvailable = allForEvent.Count(r => r.Status == "NOT_AVAILABLE");
        var substitute = allForEvent.Count(r => r.Status == "SUBSTITUTE");
        var myRsvp = allForEvent.FirstOrDefault(r => r.MemberId == memberId);

        return Ok(new
        {
            eventId = id.ToString("D"),
            attendingCount = attending,
            notAvailableCount = notAvailable,
            substituteCount = substitute,
            totalResponses = allForEvent.Count,
            myRsvp,
            responses = allForEvent.Select(r => new
            {
                id = r.Id,
                memberId = r.MemberId,
                memberName = r.MemberName,
                status = r.Status,
                substituteName = r.SubstituteName,
                substitutePhone = r.SubstitutePhone,
                notes = r.Notes,
                updatedAt = r.UpdatedAt
            }).ToList()
        });
    }

    [HttpGet("rsvp-summary/all")]
    [HttpGet("/api/calendar/events/rsvp-summary/all")]
    [HttpGet("/api/organisational/events/rsvp-summary/all")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllRsvpSummaries(CancellationToken ct)
    {
        var allRsvps = await _db.EventRsvps.AsNoTracking().ToListAsync(ct);
        var grouped = allRsvps.GroupBy(r => r.EventId)
            .ToDictionary(
                g => g.Key.ToString("D"),
                g => new
                {
                    eventId = g.Key.ToString("D"),
                    attendingCount = g.Count(r => r.Status == "ATTENDING"),
                    notAvailableCount = g.Count(r => r.Status == "NOT_AVAILABLE"),
                    substituteCount = g.Count(r => r.Status == "SUBSTITUTE"),
                    totalResponses = g.Count(),
                    responses = g.Select(r => new
                    {
                        id = r.Id,
                        memberId = r.MemberId,
                        memberName = r.MemberName,
                        status = r.Status,
                        substituteName = r.SubstituteName,
                        substitutePhone = r.SubstitutePhone,
                        notes = r.Notes,
                        updatedAt = r.UpdatedAt
                    }).ToList()
                }
            );

        return Ok(grouped);
    }

    [HttpDelete("{id:guid}")]
    [HttpDelete("/api/calendar/events/{id:guid}")]
    [HttpDelete("/api/organisational/operations/events/{id:guid}")]
    [HttpDelete("/api/organisational/operations/meetings/{id:guid}")]
    public async Task<IActionResult> DeleteEvent(Guid id, CancellationToken ct)
    {
        var meeting = await _db.Set<MeetingRecord>().FirstOrDefaultAsync(m => m.Id == id, ct);
        if (meeting != null)
        {
            _db.Set<MeetingRecord>().Remove(meeting);
        }

        var freeEvent = await _db.Set<NetworkFreeEvent>().FirstOrDefaultAsync(e => e.Id == id, ct);
        if (freeEvent != null)
        {
            _db.Set<NetworkFreeEvent>().Remove(freeEvent);
        }

        var rsvps = await _db.EventRsvps.Where(r => r.EventId == id).ToListAsync(ct);
        if (rsvps.Any())
        {
            _db.EventRsvps.RemoveRange(rsvps);
        }

        var attendances = await _db.AttendanceRecords.Where(a => a.EventId == id).ToListAsync(ct);
        if (attendances.Any())
        {
            _db.AttendanceRecords.RemoveRange(attendances);
        }

        await _db.SaveChangesAsync(ct);
        return Ok(new { success = true, message = "Event / Meeting deleted successfully.", eventId = id.ToString("D") });
    }

    [HttpDelete("/api/organisational/operations/programmes/{id:guid}")]
    public async Task<IActionResult> DeleteProgramme(Guid id, CancellationToken ct)
    {
        var programme = await _db.Set<ProgrammeRecord>().FirstOrDefaultAsync(p => p.Id == id, ct);
        if (programme != null)
        {
            _db.Set<ProgrammeRecord>().Remove(programme);
            await _db.SaveChangesAsync(ct);
            return Ok(new { success = true, message = "Programme deleted successfully.", id = id.ToString("D") });
        }
        return NotFound(new { success = false, message = "Programme not found." });
    }
}

public record EventRsvpRequestDto(
    string Status, // ATTENDING, NOT_AVAILABLE, SUBSTITUTE
    string? SubstituteName = null,
    string? SubstitutePhone = null,
    string? Notes = null,
    string? MemberId = null,
    string? MemberName = null,
    string? MemberEmail = null,
    string? MemberPhone = null
);
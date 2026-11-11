using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Layered;

namespace Sethu.Api.Controllers;

public record AttendanceCorrectionRequestDto(Guid AttendanceId, string Reason, string ProposedStatus);

[ApiController]
[Authorize]
[Route("api/attendance")]
[Route("attendance")]
public class AttendanceController : ControllerBase
{
    private readonly SethuDbContext _db;
    private readonly ICurrentNetworkMember _currentMember;

    public AttendanceController(SethuDbContext db, ICurrentNetworkMember currentMember)
    {
        _db = db;
        _currentMember = currentMember;
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyAttendance(
        [FromQuery] int page = 1,
        [FromQuery] int size = 20,
        CancellationToken ct = default)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        page = Math.Max(1, page);
        size = Math.Clamp(size, 1, 100);

        var query = _db.AttendanceRecords
            .AsNoTracking()
            .Where(a => a.TenantId == actor.TenantId && a.MemberId == actor.MemberId);

        var total = await query.CountAsync(ct);
        var records = await query
            .OrderByDescending(a => a.UpdatedAt)
            .Skip((page - 1) * size)
            .Take(size)
            .ToListAsync(ct);

        var eventIds = records.Select(r => r.EventId).Distinct().ToList();
        var events = await _db.Set<NetworkFreeEvent>()
            .AsNoTracking()
            .Where(e => e.TenantId == actor.TenantId && eventIds.Contains(e.Id))
            .ToDictionaryAsync(e => e.Id, ct);

        var items = records.Select(a =>
        {
            events.TryGetValue(a.EventId, out var ev);
            return new
            {
                id = a.Id,
                eventId = a.EventId,
                eventTitle = ev?.Title ?? "Chapter Meeting",
                meetingDate = ev?.StartsAt ?? a.UpdatedAt,
                status = a.Status,
                correctionReason = a.CorrectionReason,
                correctionStatus = a.CorrectionStatus
            };
        }).ToList();

        return Ok(new { items, page, size, total });
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetAttendanceSummary(CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var records = await _db.AttendanceRecords
            .AsNoTracking()
            .Where(a => a.TenantId == actor.TenantId && a.MemberId == actor.MemberId)
            .ToListAsync(ct);

        var total = records.Count;
        var present = records.Count(r => r.Status.Equals("present", StringComparison.OrdinalIgnoreCase));
        var late = records.Count(r => r.Status.Equals("late", StringComparison.OrdinalIgnoreCase));
        var excused = records.Count(r => r.Status.Equals("excused", StringComparison.OrdinalIgnoreCase));
        var absent = records.Count(r => r.Status.Equals("absent", StringComparison.OrdinalIgnoreCase));

        var percentage = total > 0 ? (double)(present + excused) / total * 100 : 0.0;

        return Ok(new
        {
            totalMeetings = total,
            presentCount = present,
            lateCount = late,
            excusedCount = excused,
            absentCount = absent,
            attendanceRate = Math.Round(percentage, 1)
        });
    }

    [HttpPost("correction-requests")]
    public async Task<IActionResult> SubmitCorrectionRequest([FromBody] AttendanceCorrectionRequestDto dto, CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();
        if (dto.AttendanceId == Guid.Empty || string.IsNullOrWhiteSpace(dto.Reason) ||
            dto.Reason.Trim().Length < 10 || dto.Reason.Length > 2000 ||
            !new[] { "present", "absent", "late", "excused" }.Contains(dto.ProposedStatus?.Trim().ToLowerInvariant()))
            return UnprocessableEntity(new { code = "INVALID_ATTENDANCE_CORRECTION", detail = "A valid record, proposed status and reason (10–2000 characters) are required." });

        var record = await _db.AttendanceRecords.FirstOrDefaultAsync(
            a => a.Id == dto.AttendanceId && a.TenantId == actor.TenantId && a.MemberId == actor.MemberId, ct);

        if (record == null) return NotFound(new { code = "RECORD_NOT_FOUND", detail = "Attendance record not found." });
        if (string.Equals(record.CorrectionStatus, "pending", StringComparison.OrdinalIgnoreCase))
            return Conflict(new { code = "CORRECTION_ALREADY_PENDING", detail = "A correction request is already awaiting review." });
        if (string.Equals(record.Status, dto.ProposedStatus.Trim(), StringComparison.OrdinalIgnoreCase))
            return UnprocessableEntity(new { code = "ATTENDANCE_STATUS_UNCHANGED", detail = "Requested status already matches the record." });

        record.PriorStatus = record.Status;
        record.CorrectionReason = dto.Reason.Trim();
        record.CorrectionStatus = "pending";
        record.UpdatedAt = DateTimeOffset.UtcNow;

        var ticket = new SupportTicket
        {
            Id = Guid.NewGuid(),
            TenantId = actor.TenantId,
            MemberId = actor.MemberId,
            Subject = $"Attendance Correction: Record {record.Id}",
            Description = $"Proposed Status: {dto.ProposedStatus}. Reason: {dto.Reason}",
            Priority = "Normal",
            Status = "open",
            CreatedAt = DateTimeOffset.UtcNow
        };
        _db.SupportTickets.Add(ticket);
        await _db.SaveChangesAsync(ct);

        return Ok(new { ticketId = ticket.Id, message = "Attendance correction request submitted to chapter secretary." });
    }
}

using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sethu.Domain.Entities;
using Sethu.Service.Abstractions.Organisation;

namespace Sethu.Api.Controllers.Organisation;

[ApiController]
[Authorize]
[TypeFilter(typeof(Sethu.Api.Security.OrgLegacyAuthorizationFilter))]
[Route("api/organisational/operations")]
public sealed class OrgOperationsController : ControllerBase
{
    private readonly IOrgOperationsService _service;
    private Guid GetTenantId() => HttpContext.Items.TryGetValue("Sethu.TrustedTenantId", out var tenant) && tenant is Guid id && id != Guid.Empty ? id : throw new UnauthorizedAccessException("Trusted tenant not resolved");

    public OrgOperationsController(IOrgOperationsService service) => _service = service;

    [HttpGet("calendar")]
    public async Task<IActionResult> GetCalendar([FromQuery] string? scopeId, [FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetCalendarAsync(GetTenantId(), scopeId, limit, ct);
        return Ok(result);
    }

    [HttpGet("events")]
    public async Task<IActionResult> GetEvents([FromQuery] string? scopeId, [FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetEventsAsync(GetTenantId(), scopeId, limit, ct);
        return Ok(result);
    }

    public sealed class MeetingInputDto
    {
        public string? Title { get; set; }
        public string? Type { get; set; }
        public string? ScheduledAt { get; set; }
        public string? Location { get; set; }
        public int? QuorumRequired { get; set; }
        public object? Participants { get; set; }
        public string? ScopeId { get; set; }
        public string? ScopeName { get; set; }
        public string? ScopeLevel { get; set; }
        public string? Status { get; set; }
    }

    private static MeetingRecord ToRecord(MeetingInputDto dto, Guid tenantId) => new()
    {
        TenantId = tenantId,
        Title = dto.Title?.Trim() ?? "",
        Type = dto.Type?.Trim() ?? "",
        ScheduledAt = dto.ScheduledAt ?? "",
        QuorumRequired = dto.QuorumRequired ?? 0,
        ScopeId = dto.ScopeId ?? "",
        ScopeName = dto.ScopeName ?? "",
        ScopeLevel = string.IsNullOrWhiteSpace(dto.ScopeLevel) ? "CHAPTER" : dto.ScopeLevel,
        Status = string.IsNullOrWhiteSpace(dto.Status) ? "SCHEDULED" : dto.Status,
        ParticipantsJson = dto.Participants != null ? System.Text.Json.JsonSerializer.Serialize(dto.Participants) : "[]"
    };

    [HttpPost("events")]
    public async Task<IActionResult> CreateEvent([FromBody] MeetingInputDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Type) ||
            string.IsNullOrWhiteSpace(dto.ScopeId) || dto.QuorumRequired is null or <= 0 ||
            !DateTimeOffset.TryParse(dto.ScheduledAt, out _))
            return BadRequest(new { code = "EVENT_REQUIRED_FIELDS", detail = "Title, type, valid scheduled time, authorised scope and approved quorum are required." });
        var record = ToRecord(dto, GetTenantId());
        var result = await _service.CreateEventAsync(record, ct);
        return Ok(result);
    }

    [HttpPut("events/{id:guid}")]
    public async Task<IActionResult> UpdateEvent(Guid id, [FromBody] MeetingInputDto dto, CancellationToken ct = default)
    {
        var record = ToRecord(dto, GetTenantId());
        var result = await _service.UpdateEventAsync(id, record, GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("meetings")]
    public async Task<IActionResult> GetMeetings([FromQuery] string? status, [FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetMeetingsAsync(GetTenantId(), status, limit, ct);
        return Ok(result);
    }

    [HttpPost("meetings")]
    public async Task<IActionResult> CreateMeeting([FromBody] MeetingInputDto dto, CancellationToken ct = default)
    {
        var record = ToRecord(dto, GetTenantId());
        var result = await _service.CreateMeetingAsync(record, ct);
        return Ok(result);
    }

    [HttpPut("meetings/{id:guid}")]
    public async Task<IActionResult> UpdateMeeting(Guid id, [FromBody] MeetingInputDto dto, CancellationToken ct = default)
    {
        var record = ToRecord(dto, GetTenantId());
        var result = await _service.UpdateMeetingAsync(id, record, GetTenantId(), ct);
        return Ok(result);
    }

    public record PublishMomRequest(string Minutes);

    [HttpPost("meetings/{id:guid}/mom")]
    public async Task<IActionResult> PublishMom(Guid id, [FromBody] PublishMomRequest req, CancellationToken ct = default)
    {
        var result = await _service.PublishMomAsync(id, req.Minutes, GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("attendance")]
    public async Task<IActionResult> GetAttendance([FromQuery] string? meetingId, [FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetAttendanceAsync(GetTenantId(), meetingId, limit, ct);
        return Ok(result);
    }

    public record CorrectAttendanceRequest(string ProposedStatus, string Reason);

    [HttpPost("attendance/{id:guid}/correct")]
    public async Task<IActionResult> CorrectAttendance(Guid id, [FromBody] CorrectAttendanceRequest req, CancellationToken ct = default)
    {
        return StatusCode(501, new { code = "CANONICAL_ATTENDANCE_CORRECTION_REQUIRED", detail = "Legacy correction is unavailable until an authorised, versioned attendance record mutation and audit are connected." });
    }
}

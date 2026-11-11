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
[Route("api/organisational")]
public sealed class OrgAdminController : ControllerBase
{
    private readonly IOrgAdminService _service;
    private Guid GetTenantId() => HttpContext.Items.TryGetValue("Sethu.TrustedTenantId", out var tenant) && tenant is Guid id && id != Guid.Empty ? id : throw new UnauthorizedAccessException("Trusted tenant not resolved");

    public OrgAdminController(IOrgAdminService service) => _service = service;

    [HttpGet("dashboard/today")]
    [HttpGet("today")]
    public async Task<IActionResult> GetToday([FromQuery] string? scopeId, CancellationToken ct = default)
    {
        var result = await _service.GetTodayAsync(GetTenantId(), scopeId, ct);
        return Ok(result);
    }

    [HttpGet("reports")]
    public async Task<IActionResult> GetReports([FromQuery] string? scopeId, CancellationToken ct = default)
    {
        var result = await _service.GetReportsAsync(GetTenantId(), scopeId, ct);
        return Ok(result);
    }

    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics([FromQuery] string? scopeId, CancellationToken ct = default)
    {
        var result = await _service.GetAnalyticsAsync(GetTenantId(), scopeId, ct);
        return Ok(result);
    }

    [HttpGet("jobs")]
    public async Task<IActionResult> GetJobs([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetJobsAsync(GetTenantId(), limit, ct);
        return Ok(result);
    }

    [HttpPost("jobs")]
    public async Task<IActionResult> RequestJob([FromBody] JobRecord job, CancellationToken ct = default)
    {
        job.TenantId = GetTenantId();
        var result = await _service.RequestJobAsync(job, ct);
        return Ok(result);
    }

    [HttpGet("data-quality")]
    public async Task<IActionResult> GetDataQuality([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetDataQualityAsync(GetTenantId(), limit, ct);
        return Ok(result);
    }

    public record UpdateDataQualityFindingBody(string Status);

    [HttpPut("data-quality/{id:guid}")]
    public async Task<IActionResult> UpdateDataQualityFinding(Guid id, [FromBody] UpdateDataQualityFindingBody body, CancellationToken ct = default)
    {
        var result = await _service.UpdateDataQualityFindingAsync(id, body.Status, GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("audit")]
    [HttpGet("audit-trail")]
    public async Task<IActionResult> GetAudit([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetAuditTrailAsync(GetTenantId(), limit, ct);
        return Ok(result);
    }

    [HttpGet("documents")]
    public async Task<IActionResult> GetDocuments([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetDocumentsAsync(GetTenantId(), limit, ct);
        return Ok(result);
    }

    [HttpGet("roles-access")]
    public async Task<IActionResult> GetRolesAndAccess(CancellationToken ct = default)
    {
        var result = await _service.GetRolesAndAccessAsync(GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("people")]
    public async Task<IActionResult> GetPeople([FromQuery] string? scopeId, [FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetPeopleDirectoryAsync(GetTenantId(), scopeId, limit, ct);
        return Ok(result);
    }
}

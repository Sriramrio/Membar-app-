using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sethu.Service.Abstractions.Organisation;

namespace Sethu.Api.Controllers.Organisation;

[ApiController]
[Authorize]
[TypeFilter(typeof(Sethu.Api.Security.OrgLegacyAuthorizationFilter))]
[Route("api/organisational")]
public sealed class OrgHierarchyController : ControllerBase
{
    private readonly IOrgHierarchyService _service;
    private Guid GetTenantId() => HttpContext.Items.TryGetValue("Sethu.TrustedTenantId", out var tenant) && tenant is Guid id && id != Guid.Empty ? id : throw new UnauthorizedAccessException("Trusted tenant not resolved");

    public OrgHierarchyController(IOrgHierarchyService service) => _service = service;

    [HttpGet("hierarchy/summary")]
    public async Task<IActionResult> GetHierarchySummary(CancellationToken ct = default)
    {
        var result = await _service.GetHierarchySummaryAsync(GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("hierarchy/rollup")]
    public async Task<IActionResult> GetHierarchyRollup(CancellationToken ct = default)
    {
        var result = await _service.GetHierarchyRollupAsync(GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("hierarchy/units")]
    public async Task<IActionResult> GetUnits([FromQuery] string? level, CancellationToken ct = default)
    {
        var result = await _service.GetUnitsAsync(GetTenantId(), level, ct);
        return Ok(result);
    }

    [HttpGet("chapters")]
    [HttpGet("hierarchy/chapters")]
    public async Task<IActionResult> GetChapters([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetChaptersAsync(GetTenantId(), limit, ct);
        return Ok(result);
    }

    [HttpGet("chapters/{id:guid}")]
    [HttpGet("hierarchy/chapters/{id:guid}")]
    public async Task<IActionResult> GetChapterById(Guid id, CancellationToken ct = default)
    {
        var result = await _service.GetChapterByIdAsync(id, GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("committees")]
    [HttpGet("hierarchy/committees")]
    public async Task<IActionResult> GetCommittees(CancellationToken ct = default)
    {
        var result = await _service.GetCommitteesAsync(GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("coordinators")]
    [HttpGet("hierarchy/coordinators")]
    public async Task<IActionResult> GetCoordinators(CancellationToken ct = default)
    {
        var result = await _service.GetCoordinatorsAsync(GetTenantId(), ct);
        return Ok(result);
    }
}

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
public sealed class OrgProgrammesController : ControllerBase
{
    private readonly IOrgProgrammesService _service;
    private Guid GetTenantId() => HttpContext.Items.TryGetValue("Sethu.TrustedTenantId", out var tenant) && tenant is Guid id && id != Guid.Empty ? id : throw new UnauthorizedAccessException("Trusted tenant not resolved");

    public OrgProgrammesController(IOrgProgrammesService service) => _service = service;

    [HttpGet("programmes")]
    public async Task<IActionResult> GetProgrammes([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetProgrammesAsync(GetTenantId(), limit, ct);
        return Ok(result);
    }

    [HttpPost("programmes")]
    public async Task<IActionResult> CreateProgramme([FromBody] ProgrammeRecord programme, CancellationToken ct = default)
    {
        programme.TenantId = GetTenantId();
        var result = await _service.CreateProgrammeAsync(programme, ct);
        return Ok(result);
    }

    public record UpdateProgrammeBody(string? Status);

    [HttpPut("programmes/{id:guid}")]
    public async Task<IActionResult> UpdateProgramme(Guid id, [FromBody] UpdateProgrammeBody body, CancellationToken ct = default)
    {
        var result = await _service.UpdateProgrammeAsync(id, body.Status, GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("plans")]
    public async Task<IActionResult> GetPlans([FromQuery] string? scopeId, CancellationToken ct = default)
    {
        var result = await _service.GetPlansAsync(GetTenantId(), scopeId, ct);
        return Ok(result);
    }

    [HttpGet("goals")]
    public async Task<IActionResult> GetGoals([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetGoalsAsync(GetTenantId(), limit, ct);
        return Ok(result);
    }

    [HttpPost("goals")]
    public async Task<IActionResult> CreateGoal([FromBody] GoalRecord goal, CancellationToken ct = default)
    {
        goal.TenantId = GetTenantId();
        var result = await _service.CreateGoalAsync(goal, ct);
        return Ok(result);
    }

    public record UpdateGoalBody(int? Target, int? Current, string? Status);

    [HttpPut("goals/{id:guid}")]
    public async Task<IActionResult> UpdateGoal(Guid id, [FromBody] UpdateGoalBody body, CancellationToken ct = default)
    {
        var result = await _service.UpdateGoalAsync(id, body.Target, body.Current, body.Status, GetTenantId(), ct);
        return Ok(result);
    }
}

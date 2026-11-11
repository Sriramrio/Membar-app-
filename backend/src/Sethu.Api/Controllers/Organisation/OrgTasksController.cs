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
public sealed class OrgTasksController : ControllerBase
{
    private readonly IOrgTasksService _service;
    private Guid GetTenantId() => HttpContext.Items.TryGetValue("Sethu.TrustedTenantId", out var tenant) && tenant is Guid id && id != Guid.Empty ? id : throw new UnauthorizedAccessException("Trusted tenant not resolved");

    public OrgTasksController(IOrgTasksService service) => _service = service;

    [HttpGet("tasks")]
    public async Task<IActionResult> GetTasks([FromQuery] string? scopeId, [FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetTasksAsync(GetTenantId(), scopeId, limit, ct);
        return Ok(result);
    }

    [HttpPost("tasks")]
    public async Task<IActionResult> CreateTask([FromBody] TaskRecord task, CancellationToken ct = default)
    {
        task.TenantId = GetTenantId();
        var result = await _service.CreateTaskAsync(task, ct);
        return Ok(result);
    }

    public record UpdateTaskBody(string? Status, string? Title);

    [HttpPut("tasks/{id:guid}")]
    public async Task<IActionResult> UpdateTask(Guid id, [FromBody] UpdateTaskBody body, CancellationToken ct = default)
    {
        var result = await _service.UpdateTaskAsync(id, body.Status, body.Title, GetTenantId(), ct);
        return Ok(result);
    }

    [HttpPut("tasks/{id:guid}/complete")]
    public async Task<IActionResult> CompleteTask(Guid id, CancellationToken ct = default)
    {
        var result = await _service.CompleteTaskAsync(id, GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("actions")]
    public async Task<IActionResult> GetActions([FromQuery] string? scopeId, [FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetActionsAsync(GetTenantId(), scopeId, limit, ct);
        return Ok(result);
    }

    [HttpPost("actions")]
    public async Task<IActionResult> CreateAction([FromBody] ActionItemRecord action, CancellationToken ct = default)
    {
        action.TenantId = GetTenantId();
        var result = await _service.CreateActionAsync(action, ct);
        return Ok(result);
    }

    public record UpdateActionBody(string? Status);

    [HttpPut("actions/{id:guid}")]
    public async Task<IActionResult> UpdateAction(Guid id, [FromBody] UpdateActionBody body, CancellationToken ct = default)
    {
        var result = await _service.UpdateActionAsync(id, body.Status, GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("action-centre")]
    public async Task<IActionResult> GetActionCentre([FromQuery] string? scopeId, CancellationToken ct = default)
    {
        var result = await _service.GetActionCentreAsync(GetTenantId(), scopeId, ct);
        return Ok(result);
    }
}

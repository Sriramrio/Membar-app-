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
[Route("api/organisational/continuity")]
[Route("api/organisational")]
public sealed class OrgContinuityController : ControllerBase
{
    private readonly IOrgContinuityService _service;
    private Guid GetTenantId() => HttpContext.Items.TryGetValue("Sethu.TrustedTenantId", out var tenant) && tenant is Guid id && id != Guid.Empty ? id : throw new UnauthorizedAccessException("Trusted tenant not resolved");

    public OrgContinuityController(IOrgContinuityService service) => _service = service;

    [HttpGet("continuity/summary")]
    public async Task<IActionResult> GetContinuitySummary(CancellationToken ct = default)
    {
        var result = await _service.GetContinuitySummaryAsync(GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("continuity/escalations")]
    [HttpGet("escalations")]
    public async Task<IActionResult> GetEscalations([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetEscalationsAsync(GetTenantId(), limit, ct);
        return Ok(result);
    }

    [HttpPost("continuity/escalations")]
    [HttpPost("escalations")]
    public async Task<IActionResult> RaiseEscalation([FromBody] EscalationRecord escalation, CancellationToken ct = default)
    {
        escalation.TenantId = GetTenantId();
        var result = await _service.RaiseEscalationAsync(escalation, ct);
        return Ok(result);
    }

    public record UpdateEscalationBody(string Status);

    [HttpPut("continuity/escalations/{id:guid}")]
    [HttpPut("escalations/{id:guid}")]
    public async Task<IActionResult> UpdateEscalation(Guid id, [FromBody] UpdateEscalationBody body, CancellationToken ct = default)
    {
        var result = await _service.UpdateEscalationAsync(id, body.Status, GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("continuity/risks")]
    [HttpGet("risks")]
    public async Task<IActionResult> GetRisks([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetRisksAsync(GetTenantId(), limit, ct);
        return Ok(result);
    }

    [HttpPost("continuity/risks")]
    [HttpPost("risks")]
    public async Task<IActionResult> CreateRisk([FromBody] RiskRecord risk, CancellationToken ct = default)
    {
        risk.TenantId = GetTenantId();
        var result = await _service.CreateRiskAsync(risk, ct);
        return Ok(result);
    }

    public record UpdateRiskBody(string Status, string? Impact);

    [HttpPut("continuity/risks/{id:guid}")]
    [HttpPut("risks/{id:guid}")]
    public async Task<IActionResult> UpdateRisk(Guid id, [FromBody] UpdateRiskBody body, CancellationToken ct = default)
    {
        var result = await _service.UpdateRiskAsync(id, body.Status, body.Impact, GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("continuity/issues")]
    [HttpGet("issues")]
    public async Task<IActionResult> GetIssues([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetIssuesAsync(GetTenantId(), limit, ct);
        return Ok(result);
    }

    [HttpPost("continuity/issues")]
    [HttpPost("issues")]
    public async Task<IActionResult> CreateIssue([FromBody] IssueRecord issue, CancellationToken ct = default)
    {
        issue.TenantId = GetTenantId();
        var result = await _service.CreateIssueAsync(issue, ct);
        return Ok(result);
    }

    public record UpdateIssueBody(string Status);

    [HttpPut("continuity/issues/{id:guid}")]
    [HttpPut("issues/{id:guid}")]
    public async Task<IActionResult> UpdateIssue(Guid id, [FromBody] UpdateIssueBody body, CancellationToken ct = default)
    {
        var result = await _service.UpdateIssueAsync(id, body.Status, GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("continuity/decisions")]
    [HttpGet("decisions")]
    public async Task<IActionResult> GetDecisions([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetDecisionsAsync(GetTenantId(), limit, ct);
        return Ok(result);
    }

    [HttpPost("continuity/decisions")]
    [HttpPost("decisions")]
    public async Task<IActionResult> CreateDecision([FromBody] DecisionRecord decision, CancellationToken ct = default)
    {
        decision.TenantId = GetTenantId();
        var result = await _service.CreateDecisionAsync(decision, ct);
        return Ok(result);
    }

    [HttpGet("continuity/exceptions")]
    [HttpGet("exceptions")]
    public async Task<IActionResult> GetExceptions([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetExceptionsAsync(GetTenantId(), limit, ct);
        return Ok(result);
    }

    [HttpPost("continuity/exceptions")]
    [HttpPost("exceptions")]
    public async Task<IActionResult> CreateException([FromBody] OperationalExceptionRecord exception, CancellationToken ct = default)
    {
        exception.TenantId = GetTenantId();
        var result = await _service.CreateExceptionAsync(exception, ct);
        return Ok(result);
    }

    public record UpdateExceptionBody(string Status);

    [HttpPut("continuity/exceptions/{id:guid}")]
    [HttpPut("exceptions/{id:guid}")]
    public async Task<IActionResult> UpdateException(Guid id, [FromBody] UpdateExceptionBody body, CancellationToken ct = default)
    {
        var result = await _service.UpdateExceptionAsync(id, body.Status, GetTenantId(), ct);
        return Ok(result);
    }

    public record DecideExceptionBody(string Decision);

    [HttpPost("continuity/exceptions/{id:guid}/decide")]
    [HttpPost("exceptions/{id:guid}/decide")]
    public async Task<IActionResult> DecideException(Guid id, [FromBody] DecideExceptionBody body, CancellationToken ct = default)
    {
        var result = await _service.DecideExceptionAsync(id, body.Decision, GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("continuity/availability")]
    [HttpGet("availability")]
    public async Task<IActionResult> GetAvailability(CancellationToken ct = default)
    {
        var result = await _service.GetAvailabilityAsync(GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("continuity/delegations")]
    [HttpGet("delegations")]
    public async Task<IActionResult> GetDelegations(CancellationToken ct = default)
    {
        var result = await _service.GetDelegationsAsync(GetTenantId(), ct);
        return Ok(result);
    }

    [HttpPost("continuity/delegations")]
    [HttpPost("delegations")]
    public async Task<IActionResult> CreateDelegation([FromBody] Delegation delegation, CancellationToken ct = default)
    {
        delegation.TenantId = GetTenantId();
        var result = await _service.CreateDelegationAsync(delegation, ct);
        return Ok(result);
    }

    [HttpGet("handoffs")]
    public async Task<IActionResult> GetHandoffs([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetHandoffsAsync(GetTenantId(), limit, ct);
        return Ok(result);
    }

    [HttpPost("handoffs")]
    public async Task<IActionResult> CreateHandoff([FromBody] HandoffRecord handoff, CancellationToken ct = default)
    {
        handoff.TenantId = GetTenantId();
        var result = await _service.CreateHandoffAsync(handoff, ct);
        return Ok(result);
    }
}

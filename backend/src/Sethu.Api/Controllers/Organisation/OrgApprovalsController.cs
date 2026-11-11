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
public sealed class OrgApprovalsController : ControllerBase
{
    private readonly IOrgApprovalsService _service;
    private Guid GetTenantId() => HttpContext.Items.TryGetValue("Sethu.TrustedTenantId", out var tenant) && tenant is Guid id && id != Guid.Empty ? id : throw new UnauthorizedAccessException("Trusted tenant not resolved");

    public OrgApprovalsController(IOrgApprovalsService service) => _service = service;

    [HttpGet("approvals")]
    public async Task<IActionResult> GetApprovals([FromQuery] string? status, [FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetApprovalsAsync(GetTenantId(), status, limit, ct);
        return Ok(result);
    }

    [HttpPost("approvals")]
    public async Task<IActionResult> CreateApproval([FromBody] ApprovalRecord approval, CancellationToken ct = default)
    {
        approval.TenantId = GetTenantId();
        var result = await _service.CreateApprovalAsync(approval, ct);
        return Ok(result);
    }

    public record DecideApprovalBody(string Decision, string? DecidedBy);

    [HttpPost("approvals/{id:guid}/decide")]
    public async Task<IActionResult> DecideApproval(Guid id, [FromBody] DecideApprovalBody body, CancellationToken ct = default)
    {
        if (id == Guid.Empty || body is null ||
            body.Decision is not ("APPROVED" or "REJECTED" or "RETURNED"))
            return BadRequest(new { code = "INVALID_APPROVAL_DECISION" });
        // The supplied DecidedBy field is legacy client data, never audit authority.
        if (!HttpContext.Items.TryGetValue("Sethu.TrustedActorId", out var actor) ||
            actor is not Guid actorId || actorId == Guid.Empty)
            return Unauthorized(new { code = "TRUSTED_ACTOR_REQUIRED" });
        var result = await _service.DecideApprovalAsync(id, body.Decision,
            actorId.ToString("D"), GetTenantId(), ct);
        return Ok(result);
    }
}

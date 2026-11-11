using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sethu.Service.MembershipIntake;
using Sethu.Service.Security;

namespace Sethu.Api.Controllers;

/// <summary>
/// Commands for the existing governed intake aggregate. This is NOT an alias for the
/// legacy public DbnMemberRegistration form: reconciliation must be separately approved.
/// Every command derives its actor and tenant from the authenticated session.
/// </summary>
[ApiController]
[Authorize]
[Route("api/v6/membership-intakes")]
public sealed class GovernedMembershipIntakeController : ControllerBase
{
    private readonly MembershipIntakeService _intakes;
    private readonly IntakeGovernedWorkflowService _workflow;
    private readonly TrustedFinanceEvidenceService _finance;
    private readonly IAuthenticatedActorResolver _actors;

    public GovernedMembershipIntakeController(MembershipIntakeService intakes,
        IntakeGovernedWorkflowService workflow, TrustedFinanceEvidenceService finance,
        IAuthenticatedActorResolver actors)
    {
        _intakes = intakes;
        _workflow = workflow;
        _finance = finance;
        _actors = actors;
    }

    [HttpPost("draft")]
    public async Task<IActionResult> Draft([FromBody] StartIntake request, CancellationToken ct)
        => Translate(await _intakes.StartAsync(User, request, ct));

    [HttpPost("{applicationId:guid}/submit")]
    public async Task<IActionResult> Submit(Guid applicationId, [FromBody] SubmitIntakeRequest request, CancellationToken ct)
        => Translate(await _intakes.SubmitAsync(User, applicationId, request.ExpectedVersion, request.IdempotencyKey, ct));

    [HttpPost("{applicationId:guid}/transition")]
    public async Task<IActionResult> Transition(Guid applicationId, [FromBody] IntakeWorkflowCommand command, CancellationToken ct)
    {
        if (applicationId != command.ApplicationId) return BadRequest(new { code = "APPLICATION_ID_MISMATCH" });
        return Translate(await _workflow.ExecuteAsync(User, command, ct));
    }

    [HttpPost("finance/evidence")]
    public async Task<IActionResult> AdmitEvidence([FromBody] BankEvidenceAdmission command, CancellationToken ct)
    {
        var actor = await _actors.ResolveAsync(User, ct);
        if (actor.Actor is null) return Unauthorized();
        if (actor.Actor.TenantId != command.TenantId) return Forbid();
        return Translate(await _finance.AdmitAsync(User, command, ct));
    }

    [HttpPost("finance/evidence/approve")]
    public async Task<IActionResult> ApproveEvidence([FromBody] BankEvidenceApproval command, CancellationToken ct)
    {
        var actor = await _actors.ResolveAsync(User, ct);
        if (actor.Actor is null) return Unauthorized();
        if (actor.Actor.TenantId != command.TenantId) return Forbid();
        return Translate(await _finance.ApproveAsync(User, command, ct));
    }

    private IActionResult Translate(IntakeResult result)
        => result.Accepted ? Ok(result) : Failure(result.Code, result);
    private IActionResult Translate(IntakeWorkflowOutcome result)
        => result.Accepted ? Ok(result) : Failure(result.Code, result);
    private IActionResult Translate(BankEvidenceResult result)
        => result.Accepted ? Ok(result) : Failure(result.Code, result);

    private IActionResult Failure(string code, object result)
    {
        if (code is "identity_invalid" or "session_invalid" or "session_revoked" or "unauthenticated") return Unauthorized(result);
        if (code is "stale_version" or "idempotency_conflict" or "duplicate_committee_decision" or "commit_outcome_indeterminate")
            return StatusCode(StatusCodes.Status409Conflict, result);
        if (code is "application_not_found") return NotFound(result);
        if (code is "validation_failed" or "invalid_finance_evidence") return UnprocessableEntity(result);
        if (code is "trusted_identity_unavailable" or "session_status_unavailable") return StatusCode(503, result);
        return StatusCode(StatusCodes.Status403Forbidden, result);
    }
}

public sealed record SubmitIntakeRequest(long ExpectedVersion, string IdempotencyKey);

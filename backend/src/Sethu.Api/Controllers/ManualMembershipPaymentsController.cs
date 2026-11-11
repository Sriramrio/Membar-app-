using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sethu.Service.Finance;

namespace Sethu.Api.Controllers;

/// <summary>
/// Manual bank-statement verification. Claims do not assert settlement; a currently
/// authorized finance officer must independently inspect an actual bank record.
/// No browser role, account id or tenant supplied by the caller grants authority.
/// </summary>
[ApiController]
[Authorize]
[Route("api/v6/manual-payments")]
public sealed class ManualMembershipPaymentsController(ManualPaymentService payments) : ControllerBase
{
    [HttpGet("mine")]
    public async Task<IActionResult> Mine(CancellationToken ct)
    {
        try { return Ok(await payments.ListMineAsync(User, ct)); }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
    }

    [HttpGet("finance-queue")]
    public async Task<IActionResult> FinanceQueue(CancellationToken ct)
    {
        try { return Ok(await payments.ListFinanceQueueAsync(User, ct)); }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
    }

    [HttpPost("claims")]
    public async Task<IActionResult> SubmitClaim([FromBody] ManualPaymentClaim request, CancellationToken ct)
        => Result(await payments.ReportAsync(User, request, ct));

    [HttpPost("verification")]
    public async Task<IActionResult> Verify([FromBody] FinanceManualCheck request, CancellationToken ct)
        => Result(await payments.VerifyAsync(User, request, ct));

    [HttpPost("release")]
    public async Task<IActionResult> ReleaseBusinessEffect([FromBody] ManualBusinessAction request, CancellationToken ct)
        => Result(await payments.ExecuteManualActionAsync(User, request, ct));

    private IActionResult Result(ManualPaymentResult result)
    {
        if (result.Accepted) return Ok(result);
        if (result.Code is "identity_invalid" or "session_invalid") return Unauthorized(result);
        if (result.Code is "stale_version" or "idempotency_conflict" or "commit_outcome_indeterminate"
            or "utr_already_allocated" or "effect_already_queued") return Conflict(result);
        if (result.Code is "payment_not_found") return NotFound(result);
        if (result.Code.StartsWith("invalid_", StringComparison.Ordinal)) return UnprocessableEntity(result);
        return StatusCode(StatusCodes.Status403Forbidden, result);
    }
}

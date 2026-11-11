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
public sealed class OrgFinanceController : ControllerBase
{
    private readonly IOrgFinanceService _service;
    private Guid GetTenantId() => HttpContext.Items.TryGetValue("Sethu.TrustedTenantId", out var tenant) && tenant is Guid id && id != Guid.Empty ? id : throw new UnauthorizedAccessException("Trusted tenant not resolved");

    public OrgFinanceController(IOrgFinanceService service) => _service = service;

    [HttpGet("finance/dues")]
    [HttpGet("member-dues")]
    public async Task<IActionResult> GetDues([FromQuery] string? scopeId, [FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetDuesAsync(GetTenantId(), scopeId, limit, ct);
        return Ok(result);
    }

    [HttpPost("finance/dues/{memberId}/reconcile")]
    [HttpPost("member-dues/{memberId}/reconcile")]
    [HttpPost("dues/{memberId}/reconcile")]
    public async Task<IActionResult> ReconcileDues(string memberId, CancellationToken ct = default)
    {
        var result = await _service.ReconcileDuesAsync(memberId, GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("finance/exceptions")]
    public async Task<IActionResult> GetPaymentExceptions([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetPaymentExceptionsAsync(GetTenantId(), limit, ct);
        return Ok(result);
    }

    [HttpGet("support")]
    [HttpGet("support-requests")]
    public async Task<IActionResult> GetSupportRequests([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetSupportRequestsAsync(GetTenantId(), limit, ct);
        return Ok(result);
    }

    [HttpPost("support")]
    [HttpPost("support-requests")]
    public async Task<IActionResult> CreateSupportRequest([FromBody] object payload, CancellationToken ct = default)
    {
        var result = await _service.CreateSupportRequestAsync(GetTenantId(), payload, ct);
        return Ok(result);
    }
}

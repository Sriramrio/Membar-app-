using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sethu.Contracts.Emails;
using Sethu.Infrastructure.Emails;
using Sethu.Infrastructure.Seed;
using Sethu.Service.Emails;
using Sethu.Service.Legacy;
using Sethu.Service.Security;

namespace Sethu.Api.Controllers;

[ApiController]
[Authorize]
[TypeFilter(typeof(Sethu.Api.Security.LegacyPrivilegedBoundaryFilter))]
[Route("api/platform/member-emails")]
[Route("platform/member-emails")]
public sealed class MemberEmailsController : ControllerBase
{
    private readonly IMemberEmailService _emailService;
    private readonly ILegacyMigrationService _legacyService;
    private readonly IAuthenticatedActorResolver _identities;
    private readonly ITrustedPermissionStore _permissions;
    private readonly IWebHostEnvironment _env;

    public MemberEmailsController(
        IMemberEmailService emailService,
        ILegacyMigrationService legacyService,
        IAuthenticatedActorResolver identities,
        ITrustedPermissionStore permissions,
        IWebHostEnvironment env)
    {
        _emailService = emailService;
        _legacyService = legacyService;
        _identities = identities;
        _permissions = permissions;
        _env = env;
    }

    private async Task<(Guid UserId, Guid TenantId, bool Allowed)> ResolveActorAsync(CancellationToken ct)
    {
        var resolved = await _identities.ResolveAsync(User, ct);
        if (resolved.Succeeded && resolved.Actor is not null)
        {
            return (resolved.Actor.UserId, resolved.Actor.TenantId, true);
        }

        return (Guid.Empty, Guid.Empty, false);
    }

    [HttpGet("templates")]
    public async Task<IActionResult> ListTemplates(CancellationToken ct)
    {
        var (userId, tenantId, allowed) = await ResolveActorAsync(ct);
        if (!allowed) return Forbid();

        var list = await _emailService.ListTemplatesAsync(tenantId, ct);
        return Ok(list);
    }

    [HttpGet("template")]
    public async Task<IActionResult> GetTemplate([FromQuery] string? templateCode, CancellationToken ct)
    {
        var (userId, tenantId, allowed) = await ResolveActorAsync(ct);
        if (!allowed) return Forbid();

        var template = await _emailService.GetTemplateAsync(tenantId, templateCode ?? MemberEmailService.DefaultTemplateCode, ct);
        return Ok(template);
    }

    [HttpPut("template")]
    public async Task<IActionResult> SaveTemplate([FromBody] SaveEmailTemplateRequest request, CancellationToken ct)
    {
        var (userId, tenantId, allowed) = await ResolveActorAsync(ct);
        if (!allowed) return Forbid();

        if (string.IsNullOrWhiteSpace(request.Subject) || string.IsNullOrWhiteSpace(request.BodyHtml))
        {
            return BadRequest(new { code = "INVALID_TEMPLATE", detail = "Subject and Body are required." });
        }

        var saved = await _emailService.SaveTemplateAsync(tenantId, request, userId, ct);
        return Ok(saved);
    }

    [HttpPost("test-send")]
    public async Task<IActionResult> TestSend([FromBody] TestEmailRequest request, CancellationToken ct)
    {
        var (userId, tenantId, allowed) = await ResolveActorAsync(ct);
        if (!allowed) return Forbid();

        if (string.IsNullOrWhiteSpace(request.RecipientEmail) || !request.RecipientEmail.Contains('@'))
        {
            return BadRequest(new { code = "INVALID_EMAIL", detail = "Valid recipient email address is required." });
        }

        var (success, error) = await _emailService.SendTestEmailAsync(tenantId, request, ct);
        return Ok(new { 
            success, 
            message = success 
                ? $"Test email sent successfully to {request.RecipientEmail}." 
                : $"Email sending failed: {error}" 
        });
    }

    [HttpPost("dispatch")]
    public async Task<IActionResult> Dispatch([FromBody] DispatchCredentialsRequest request, CancellationToken ct)
    {
        var (userId, tenantId, allowed) = await ResolveActorAsync(ct);
        if (!allowed) return Forbid();

        var result = await _emailService.DispatchCredentialsAsync(tenantId, request, userId, ct);
        return Ok(result);
    }

    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs([FromQuery] string? batchId, [FromQuery] int limit = 100, CancellationToken ct = default)
    {
        var (userId, tenantId, allowed) = await ResolveActorAsync(ct);
        if (!allowed) return Forbid();

        var logs = await _emailService.GetDispatchLogsAsync(tenantId, batchId, limit, ct);
        return Ok(logs);
    }

    [HttpGet("batches")]
    public async Task<IActionResult> GetBatches(CancellationToken ct)
    {
        var (userId, tenantId, allowed) = await ResolveActorAsync(ct);
        if (!allowed) return Forbid();

        var batches = await _legacyService.ListAsync(tenantId, ct);
        return Ok(batches);
    }

    [HttpGet("members")]
    public async Task<IActionResult> GetMembers([FromQuery] string? batchId, CancellationToken ct)
    {
        var (userId, tenantId, allowed) = await ResolveActorAsync(ct);
        if (!allowed) return Forbid();

        var members = await _emailService.GetBatchMembersAsync(tenantId, batchId, ct);
        return Ok(members);
    }
}

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
public sealed class OrgCommunicationsController : ControllerBase
{
    private readonly IOrgCommunicationsService _service;
    private Guid GetTenantId() => HttpContext.Items.TryGetValue("Sethu.TrustedTenantId", out var tenant) && tenant is Guid id && id != Guid.Empty ? id : throw new UnauthorizedAccessException("Trusted tenant not resolved");

    public OrgCommunicationsController(IOrgCommunicationsService service) => _service = service;

    [HttpGet("communications")]
    public async Task<IActionResult> GetCommunications([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetCommunicationsAsync(GetTenantId(), limit, ct);
        return Ok(result);
    }

    [HttpPost("communications")]
    public async Task<IActionResult> CreateCommunication([FromBody] CommunicationRecord comm, CancellationToken ct = default)
    {
        comm.TenantId = GetTenantId();
        var result = await _service.CreateCommunicationAsync(comm, ct);
        return Ok(result);
    }

    public record UpdateCommunicationBody(string? Status);

    [HttpPut("communications/{id:guid}")]
    public async Task<IActionResult> UpdateCommunication(Guid id, [FromBody] UpdateCommunicationBody body, CancellationToken ct = default)
    {
        var result = await _service.UpdateCommunicationAsync(id, body.Status, GetTenantId(), ct);
        return Ok(result);
    }

    [HttpPost("communications/{id:guid}/publish")]
    public async Task<IActionResult> PublishCommunication(Guid id, CancellationToken ct = default)
    {
        var result = await _service.PublishCommunicationAsync(id, GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("converse")]
    public async Task<IActionResult> GetConverseChannels(CancellationToken ct = default)
    {
        var result = await _service.GetConverseChannelsAsync(GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("converse/messages")]
    [HttpGet("converse/{conversationId}/messages")]
    public async Task<IActionResult> GetConverseMessages([FromRoute] string? conversationId, [FromQuery] string? conversationIdQuery, CancellationToken ct = default)
    {
        var targetId = !string.IsNullOrEmpty(conversationId) ? conversationId : conversationIdQuery;
        var result = await _service.GetConverseMessagesAsync(GetTenantId(), targetId, ct);
        return Ok(result);
    }

    [HttpPost("converse/messages")]
    public async Task<IActionResult> SendConverseMessage([FromBody] object payload, CancellationToken ct = default)
    {
        var result = await _service.SendConverseMessageAsync(GetTenantId(), payload, ct);
        return Ok(result);
    }

    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetNotificationsAsync(GetTenantId(), limit, ct);
        return Ok(result);
    }

    [HttpGet("alerts")]
    public async Task<IActionResult> GetAlerts([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _service.GetAlertsAsync(GetTenantId(), limit, ct);
        return Ok(result);
    }
}

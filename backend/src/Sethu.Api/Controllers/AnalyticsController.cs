using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sethu.Service.DTOs.Analytics;
using Sethu.Service.Layered;

namespace Sethu.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/member-analytics")]
[Route("api/v1/member-analytics")]
[Route("member-analytics")]
public class AnalyticsController : ControllerBase
{
    private readonly INetworkAnalyticsService _service;
    private readonly ICurrentNetworkMember _currentMember;

    public AnalyticsController(
        INetworkAnalyticsService service,
        ICurrentNetworkMember currentMember)
    {
        _service = service;
        _currentMember = currentMember;
    }

    [HttpGet("snapshot")]
    public async Task<ActionResult<NetworkAnalyticsSnapshotDto>> GetSnapshot(
        CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var snapshot = await _service.GetSnapshotAsync(actor, cancellationToken);
        return Ok(snapshot);
    }

    [HttpGet("actions")]
    public async Task<ActionResult<List<MemberActionItemDto>>> GetActionItems(
        [FromQuery] int size = 20,
        CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var actions = await _service.GetActionItemsAsync(actor, size, cancellationToken);
        return Ok(actions);
    }
}

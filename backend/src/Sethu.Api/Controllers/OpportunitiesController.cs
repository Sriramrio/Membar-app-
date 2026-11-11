using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sethu.Service.DTOs.Common;
using Sethu.Service.DTOs.Opportunities;
using Sethu.Service.Layered;

namespace Sethu.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/opportunities")]
[Route("api/v1/opportunities")]
[Route("opportunities")]
public class OpportunitiesController : ControllerBase
{
    private readonly IOpportunityService _service;
    private readonly ICurrentNetworkMember _currentMember;

    public OpportunitiesController(
        IOpportunityService service,
        ICurrentNetworkMember currentMember)
    {
        _service = service;
        _currentMember = currentMember;
    }

    [HttpGet]
    public async Task<ActionResult<List<OpportunityDto>>> GetAll(
        [FromQuery] OpportunityQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var opportunities = await _service.GetAllAsync(actor, query.Page, query.Size, cancellationToken);
        return Ok(opportunities);
    }
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OpportunityDto>> GetById(
     Guid id,
     CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var opportunities = await _service.GetAllAsync(actor, 1, 1000, cancellationToken);
        var item = opportunities.FirstOrDefault(o => o.Id == id);
        if (item is null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<OperationResultDto>> Create(
        [FromBody] CreateOpportunityDto dto,
        CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var result = await _service.CreateOpportunityAsync(actor, dto, cancellationToken);
        return result.Accepted ? Ok(result) : Conflict(result);
    }

    [HttpPost("actions")]
    public async Task<ActionResult<OperationResultDto>> Change(
        [FromBody] OpportunityActionDto dto,
        CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var result = await _service.ChangeOpportunityAsync(actor, dto, cancellationToken);
        return result.Accepted ? Ok(result) : Conflict(result);
    }
}

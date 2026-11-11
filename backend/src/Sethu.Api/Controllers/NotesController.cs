using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sethu.Service.DTOs.Common;
using Sethu.Service.DTOs.Notes;
using Sethu.Service.Layered;

namespace Sethu.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/notes")]
[Route("api/v1/notes")]
[Route("notes")]
public class NotesController : ControllerBase
{
    private readonly INoteService _service;
    private readonly ICurrentNetworkMember _currentMember;

    public NotesController(
        INoteService service,
        ICurrentNetworkMember currentMember)
    {
        _service = service;
        _currentMember = currentMember;
    }

    [HttpGet]
    public async Task<ActionResult<List<NoteDto>>> GetAll(
        [FromQuery] NoteQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var notes = await _service.GetAllAsync(actor, query.Page, query.Size, cancellationToken);
        return Ok(notes);
    }

    [HttpPost]
    public async Task<ActionResult<OperationResultDto>> Create(
        [FromBody] CreateNoteDto dto,
        CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var result = await _service.CreateNoteAsync(actor, dto, cancellationToken);
        return result.Accepted ? Ok(result) : Conflict(result);
    }

    [HttpPost("actions")]
    public async Task<ActionResult<OperationResultDto>> Change(
        [FromBody] NoteActionDto dto,
        CancellationToken cancellationToken = default)
    {
        var actor = await _currentMember.ResolveAsync(User, cancellationToken);
        if (actor is null) return Forbid();

        var result = await _service.ChangeNoteAsync(actor, dto, cancellationToken);
        return result.Accepted ? Ok(result) : Conflict(result);
    }
}

using Sethu.Service.DTOs.Common;
using Sethu.Service.DTOs.Notes;

namespace Sethu.Service.Layered;

public interface INoteService
{
    // Clean Architecture DTO-based Methods
    Task<List<NoteDto>> GetAllAsync(NetworkActor actor, int page, int size, CancellationToken ct = default);
    Task<OperationResultDto> CreateNoteAsync(NetworkActor actor, CreateNoteDto dto, CancellationToken ct = default);
    Task<OperationResultDto> ChangeNoteAsync(NetworkActor actor, NoteActionDto dto, CancellationToken ct = default);

    // Core Domain Operations
    Task<IReadOnlyList<NoteView>> ListAsync(NetworkActor actor, int page, int size, CancellationToken ct);
    Task<GovernedResult> CreateAsync(NetworkActor actor, NoteCreate request, CancellationToken ct);
    Task<GovernedResult> ChangeAsync(NetworkActor actor, NoteAction request, CancellationToken ct);
}

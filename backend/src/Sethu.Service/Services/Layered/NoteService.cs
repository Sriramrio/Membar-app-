using Sethu.Service.Common.Mapping;
using Sethu.Service.DTOs.Common;
using Sethu.Service.DTOs.Notes;

namespace Sethu.Service.Layered;

public sealed class NoteService : INoteService
{
    private const int MaxNoteLength = 4000;
    private readonly INoteRepository _repository;
    private readonly INetworkUnitOfWork _uow;

    public NoteService(INoteRepository repository, INetworkUnitOfWork uow)
    {
        _repository = repository;
        _uow = uow;
    }

    // ----- DTO Methods for API Controllers ---------------------------------------

    public async Task<List<NoteDto>> GetAllAsync(NetworkActor actor, int page, int size, CancellationToken ct = default)
    {
        var items = await ListAsync(actor, page, size, ct);
        return items.Select(x => x.ToDto()).ToList();
    }

    public async Task<OperationResultDto> CreateNoteAsync(NetworkActor actor, CreateNoteDto dto, CancellationToken ct = default)
    {
        var request = dto.ToCommand();
        var result = await CreateAsync(actor, request, ct);
        return result.ToDto();
    }

    public async Task<OperationResultDto> ChangeNoteAsync(NetworkActor actor, NoteActionDto dto, CancellationToken ct = default)
    {
        var request = dto.ToCommand();
        var result = await ChangeAsync(actor, request, ct);
        return result.ToDto();
    }

    // ----- Core Domain & Test-Compatible Methods ----------------------------------

    public Task<IReadOnlyList<NoteView>> ListAsync(NetworkActor actor, int page, int size, CancellationToken ct)
    {
        RequestGuard.Pagination(page, size);
        return _repository.ListAsync(actor, page, size, ct);
    }

    public Task<GovernedResult> CreateAsync(NetworkActor actor, NoteCreate request, CancellationToken ct)
    {
        if (IsInvalid(request))
            return Task.FromResult(new GovernedResult(false, "invalid_note", null));

        return _uow.ExecuteGovernedAsync(actor, "network.note.create", request.IdempotencyKey, request,
            token => _repository.CreateAsync(actor, request, token), ct);
    }

    public Task<GovernedResult> ChangeAsync(NetworkActor actor, NoteAction request, CancellationToken ct)
    {
        if (IsInvalid(request))
            return Task.FromResult(new GovernedResult(false, "invalid_note_action", null));

        return _uow.ExecuteGovernedAsync(actor, "network.note." + request.Action, request.IdempotencyKey, request,
            token => _repository.ChangeAsync(actor, request, token), ct);
    }

    private static bool IsInvalid(NoteCreate r) =>
        r.ContextType is not ("Member" or "OneToOne" or "Opportunity" or "Reference" or "Business")
        || r.ContextId == Guid.Empty
        || string.IsNullOrWhiteSpace(r.Text) || r.Text.Length > MaxNoteLength
        || !RequestGuard.IsValidKey(r.IdempotencyKey);

    private static bool IsInvalid(NoteAction r) =>
        r.NoteId == Guid.Empty
        || r.Action is not ("Edit" or "Archive" or "FollowUp")
        || !RequestGuard.IsValidKey(r.IdempotencyKey)
        || r.Action == "Edit" && (string.IsNullOrWhiteSpace(r.Text) || r.Text.Length > MaxNoteLength)
        || r.Action == "FollowUp" && r.FollowUpAt is null;
}

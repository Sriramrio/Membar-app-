using Sethu.Service.Common.Mapping;
using Sethu.Service.DTOs.Connections;
using Sethu.Service.MemberNetwork;

namespace Sethu.Service.Layered;

public sealed class ConnectionService : IConnectionService
{
    private static readonly string[] ConnectionStates = ["Pending", "Accepted", "Declined", "Withdrawn", "Blocked", "Removed"];
    private readonly IConnectionRepository _repository;
    private readonly INetworkUnitOfWork _unitOfWork;

    public ConnectionService(IConnectionRepository repository, INetworkUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    // ----- DTO Methods for API Controllers ---------------------------------------

    public async Task<List<ConnectionDto>> GetAllAsync(NetworkActor actor, string? state, int page, int size, CancellationToken ct = default)
    {
        var items = await ListAsync(actor, state, page, size, ct);
        return items.Select(x => x.ToDto()).ToList();
    }

    public async Task<ConnectionDto?> GetByIdAsync(NetworkActor actor, Guid id, CancellationToken ct = default)
    {
        var item = await GetAsync(actor, id, ct);
        return item?.ToDto();
    }

    public async Task<List<ConnectionTransitionDto>> GetHistoryAsync(NetworkActor actor, Guid id, int page, int size, CancellationToken ct = default)
    {
        var items = await HistoryAsync(actor, id, page, size, ct);
        return items.Select(x => x.ToDto()).ToList();
    }

    public async Task<ConnectionOutcomeDto> ChangeStateAsync(NetworkActor actor, ConnectionActionRequestDto dto, CancellationToken ct = default)
    {
        var outcome = await ChangeAsync(actor, dto.OtherMemberId, dto.Action, dto.IdempotencyKey, ct);
        return outcome.ToDto();
    }

    // ----- Core Domain & Test-Compatible Methods ----------------------------------

    public Task<IReadOnlyList<ConnectionView>> ListAsync(NetworkActor actor, string? state, int page, int size, CancellationToken ct)
    {
        RequestGuard.Pagination(page, size);
        if (state is not null && !ConnectionStates.Contains(state))
            throw new InvalidRequestException("Invalid connection state filter");

        return _repository.ListAsync(actor, state, page, size, ct);
    }

    public Task<ConnectionView?> GetAsync(NetworkActor actor, Guid id, CancellationToken ct) =>
        _repository.GetAsync(actor, id, ct);

    public Task<IReadOnlyList<ConnectionTransitionView>> HistoryAsync(NetworkActor actor, Guid id, int page, int size, CancellationToken ct)
    {
        RequestGuard.Pagination(page, size);
        return _repository.HistoryAsync(actor, id, page, size, ct);
    }

    public Task<ConnectionOutcome> ChangeAsync(NetworkActor actor, Guid other, ConnectionAction action, string idempotencyKey, CancellationToken ct)
    {
        var command = new ConnectionCommand(actor.TenantId, actor.MemberId, other, action, idempotencyKey);
        if (!ConnectionRules.Valid(command))
            return Task.FromResult(new ConnectionOutcome(false, "invalid_connection_command", null));

        return _unitOfWork.ExecuteConnectionAsync(command, token => _repository.ChangeAsync(command, token), ct);
    }
}

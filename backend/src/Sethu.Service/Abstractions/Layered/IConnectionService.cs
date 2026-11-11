using Sethu.Service.DTOs.Connections;
using Sethu.Service.MemberNetwork;

namespace Sethu.Service.Layered;

public interface IConnectionService
{
    // Clean Architecture DTO-based Methods
    Task<List<ConnectionDto>> GetAllAsync(NetworkActor actor, string? state, int page, int size, CancellationToken ct = default);
    Task<ConnectionDto?> GetByIdAsync(NetworkActor actor, Guid id, CancellationToken ct = default);
    Task<List<ConnectionTransitionDto>> GetHistoryAsync(NetworkActor actor, Guid id, int page, int size, CancellationToken ct = default);
    Task<ConnectionOutcomeDto> ChangeStateAsync(NetworkActor actor, ConnectionActionRequestDto dto, CancellationToken ct = default);

    // Core Domain Operations
    Task<IReadOnlyList<ConnectionView>> ListAsync(NetworkActor actor, string? state, int page, int size, CancellationToken ct);
    Task<ConnectionView?> GetAsync(NetworkActor actor, Guid id, CancellationToken ct);
    Task<IReadOnlyList<ConnectionTransitionView>> HistoryAsync(NetworkActor actor, Guid id, int page, int size, CancellationToken ct);
    Task<ConnectionOutcome> ChangeAsync(NetworkActor actor, Guid other, ConnectionAction action, string idempotencyKey, CancellationToken ct);
}

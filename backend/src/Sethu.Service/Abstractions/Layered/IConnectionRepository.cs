using Sethu.Service.MemberNetwork;
namespace Sethu.Service.Layered;

public interface IConnectionRepository
{
    Task<IReadOnlyList<ConnectionTransitionView>> HistoryAsync(NetworkActor actor,Guid id,int page,int size,CancellationToken ct);
    Task<IReadOnlyList<ConnectionView>> ListAsync(NetworkActor actor, string? state, int page, int size, CancellationToken ct);
    Task<ConnectionView?> GetAsync(NetworkActor actor, Guid connectionId, CancellationToken ct);
    Task<ConnectionOutcome> ChangeAsync(ConnectionCommand command, CancellationToken ct);
}

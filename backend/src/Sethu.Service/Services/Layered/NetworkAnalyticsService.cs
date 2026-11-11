using Sethu.Service.Common.Mapping;
using Sethu.Service.DTOs.Analytics;

namespace Sethu.Service.Layered;

public sealed class NetworkAnalyticsService : INetworkAnalyticsService
{
    private readonly INetworkAnalyticsRepository _repository;

    public NetworkAnalyticsService(INetworkAnalyticsRepository repository)
    {
        _repository = repository;
    }

    // ----- DTO Methods for API Controllers ---------------------------------------

    public async Task<NetworkAnalyticsSnapshotDto> GetSnapshotAsync(NetworkActor actor, CancellationToken ct = default)
    {
        var snapshot = await SnapshotAsync(actor, ct);
        return snapshot.ToDto();
    }

    public async Task<List<MemberActionItemDto>> GetActionItemsAsync(NetworkActor actor, int size, CancellationToken ct = default)
    {
        var items = await ActionsAsync(actor, size, ct);
        return items.Select(x => x.ToDto()).ToList();
    }

    // ----- Core Domain & Test-Compatible Methods ----------------------------------

    public Task<MemberAnalytics> SnapshotAsync(NetworkActor actor, CancellationToken ct) =>
        _repository.SnapshotAsync(actor, ct);

    public Task<IReadOnlyList<MemberActionItem>> ActionsAsync(NetworkActor actor, int size, CancellationToken ct)
    {
        RequestGuard.PageSize(size);
        return _repository.ActionsAsync(actor, size, ct);
    }
}

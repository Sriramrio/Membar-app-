using Sethu.Service.DTOs.Analytics;

namespace Sethu.Service.Layered;

public interface INetworkAnalyticsService
{
    // Clean Architecture DTO-based Methods
    Task<NetworkAnalyticsSnapshotDto> GetSnapshotAsync(NetworkActor actor, CancellationToken ct = default);
    Task<List<MemberActionItemDto>> GetActionItemsAsync(NetworkActor actor, int size, CancellationToken ct = default);

    // Core Domain Operations
    Task<MemberAnalytics> SnapshotAsync(NetworkActor actor, CancellationToken ct);
    Task<IReadOnlyList<MemberActionItem>> ActionsAsync(NetworkActor actor, int size, CancellationToken ct);
}

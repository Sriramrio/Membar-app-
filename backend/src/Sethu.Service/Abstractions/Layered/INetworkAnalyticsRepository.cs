namespace Sethu.Service.Layered;

public interface INetworkAnalyticsRepository
{
    Task<MemberAnalytics> SnapshotAsync(NetworkActor actor,CancellationToken ct);
    Task<IReadOnlyList<MemberActionItem>> ActionsAsync(NetworkActor actor,int size,CancellationToken ct);
}

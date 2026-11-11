namespace Sethu.Service.Layered;

public interface IMeetingRepository
{
    Task<IReadOnlyList<MeetingView>> ListAsync(NetworkActor actor,int page,int size,CancellationToken ct);
    Task<GovernedResult> CreateAsync(NetworkActor actor,MeetingCreate request,CancellationToken ct);
    Task<GovernedResult> ChangeAsync(NetworkActor actor,MeetingAction action,CancellationToken ct);
}

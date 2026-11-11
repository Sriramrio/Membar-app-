namespace Sethu.Service.MemberNetwork;

public interface IMemberNetworkStore
{
    Task<DirectoryPage> SearchAsync(Guid tenantId,Guid actorMemberId,NetworkScope scope,string? term,Guid? specialisationId,int page,int size,CancellationToken ct);
    Task<ConnectionOutcome> ChangeConnectionAsync(ConnectionCommand command,CancellationToken ct);
}

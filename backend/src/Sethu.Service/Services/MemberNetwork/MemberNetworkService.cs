namespace Sethu.Service.MemberNetwork;

public sealed class MemberNetworkService(IMemberNetworkStore store)
{
    public Task<DirectoryPage> SearchAsync(Guid tenantId,Guid actorMemberId,NetworkScope scope,string? term,Guid? specialisationId,int page,int size,CancellationToken ct)
    {
        if(tenantId==Guid.Empty || actorMemberId==Guid.Empty || page<1 || size<1 || size>50) throw new ArgumentException("Invalid scoped directory query");
        return store.SearchAsync(tenantId,actorMemberId,scope,term?.Trim(),specialisationId,page,size,ct);
    }
    public Task<ConnectionOutcome> ChangeAsync(ConnectionCommand command,CancellationToken ct)
    {
        if(command.TenantId==Guid.Empty || command.ActorMemberId==Guid.Empty || command.OtherMemberId==Guid.Empty ||
           command.ActorMemberId==command.OtherMemberId || string.IsNullOrWhiteSpace(command.IdempotencyKey) || command.IdempotencyKey.Length>128)
            return Task.FromResult(new ConnectionOutcome(false,"invalid_connection_command",null));
        return store.ChangeConnectionAsync(command,ct);
    }
}

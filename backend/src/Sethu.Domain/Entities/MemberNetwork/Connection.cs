namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class Connection
{
    public Guid Id {get;set;}
    public Guid TenantId {get;set;}
    public Guid LowerMemberId {get;set;}
    public Guid UpperMemberId {get;set;}
    public Guid InitiatorId {get;set;}
    public Guid? BlockedByMemberId {get;set;}
    public ConnectionState State {get;set;}
    public long Version {get;set;}
    public DateTimeOffset UpdatedAt {get;set;}
}

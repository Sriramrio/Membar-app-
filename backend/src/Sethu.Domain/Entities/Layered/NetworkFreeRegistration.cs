namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class NetworkFreeRegistration
{
    public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid EventId {get;set;}
    public Guid MemberId {get;set;} public string Status {get;set;}="Registered";
    public DateTimeOffset UpdatedAt {get;set;}
}

namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class NetworkFreeEvent
{
    public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid ChapterId {get;set;}
    public Guid OrganiserMemberId {get;set;} public string Title {get;set;}="";
    public DateTimeOffset StartsAt {get;set;} public DateTimeOffset EndsAt {get;set;}
    public int Capacity {get;set;} public int Registered {get;set;}
    public bool IsPaid {get;set;} public string Status {get;set;}="Published";
    public long Version {get;set;}
}

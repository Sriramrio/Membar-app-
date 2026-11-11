namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class NetworkReferenceHistory
{
    public Guid Id {get;set;}
    public Guid TenantId {get;set;}
    public Guid ReferenceId {get;set;}
    public Guid ActorMemberId {get;set;}
    public string PreviousStatus {get;set;}="";
    public string NewStatus {get;set;}="";
    public string Action {get;set;}="";
    public DateTimeOffset OccurredAt {get;set;}
}

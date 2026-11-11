namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class ConnectionTransition
{
    public Guid Id {get;set;}
    public Guid TenantId {get;set;}
    public Guid ConnectionId {get;set;}
    public Guid ActorMemberId {get;set;}
    public string? PreviousState {get;set;}
    public string NewState {get;set;}="";
    public string Action {get;set;}="";
    public DateTimeOffset OccurredAt {get;set;}
}

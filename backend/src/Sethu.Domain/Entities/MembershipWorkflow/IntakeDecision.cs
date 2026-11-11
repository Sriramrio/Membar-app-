namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class IntakeDecision
{
    public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid IntakeId {get;set;}
    public Guid ActorId {get;set;} public string Decision {get;set;}="";
    public string EvidenceReference {get;set;}=""; public DateTimeOffset At {get;set;} public long ApplicationVersion {get;set;}
}

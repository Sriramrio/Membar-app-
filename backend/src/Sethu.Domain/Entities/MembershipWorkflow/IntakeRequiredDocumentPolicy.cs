namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class IntakeRequiredDocumentPolicy
{
    public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid ChapterId {get;set;}
    public string DocumentKind {get;set;}=""; public long PolicyVersion {get;set;}
    public bool Required {get;set;} public bool Active {get;set;}
    public DateTimeOffset EffectiveFrom {get;set;} public DateTimeOffset? EffectiveUntil {get;set;}
}

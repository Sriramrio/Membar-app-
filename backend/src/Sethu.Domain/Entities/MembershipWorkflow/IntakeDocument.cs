namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class IntakeDocument
{
    public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid IntakeId {get;set;}
    public string SecureReference {get;set;}=""; public string Kind {get;set;}="";
    public Guid SubmittedBy {get;set;} public DateTimeOffset SubmittedAt {get;set;}
    public long ApplicationVersion {get;set;} public int DocumentVersion {get;set;} = 1;
}

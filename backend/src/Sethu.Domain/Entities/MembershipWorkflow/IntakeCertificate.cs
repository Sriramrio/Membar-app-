namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class IntakeCertificate
{
    public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid MemberId {get;set;}
    public string SecureReference {get;set;}=""; public Guid IssuerId {get;set;} public DateTimeOffset IssuedAt {get;set;}
}

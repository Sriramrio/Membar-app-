namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class NetworkOpportunity
{
    public Guid Id {get;set;} 
    public Guid TenantId {get;set;}
    public Guid OwnerMemberId {get;set;}
    public Guid BusinessId {get;set;}
    public string Title {get;set;}=""; public string Status {get;set;}="Draft";
    public string Scope {get;set;}="YourNetwork"; public Guid? ChapterId {get;set;}
    public Guid? SpecialisationId {get;set;} public string? Outcome {get;set;}
    public long Version {get;set;}
}

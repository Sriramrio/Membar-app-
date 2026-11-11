namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class NetworkOpportunityResponse
{
    public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid OpportunityId {get;set;}
    public Guid MemberId {get;set;} public string Status {get;set;}="Responded";
}

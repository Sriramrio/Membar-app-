namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class NetworkReference
{
    public Guid Id {get;set;}
    public Guid TenantId {get;set;}
    public Guid FromMemberId {get;set;}
    public Guid ToMemberId {get;set;}
    public Guid? IntroducedMemberId {get;set;}
    public string Status {get;set;}="Pending";
    public string? Outcome {get;set;}
    public DateTimeOffset? FollowUpAt {get;set;}
    public DateTimeOffset CreatedAt {get;set;}
    public DateTimeOffset? ConsentedAt {get;set;}
    public long Version {get;set;}
}

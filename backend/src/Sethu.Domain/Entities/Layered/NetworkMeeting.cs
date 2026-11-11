namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class NetworkMeeting
{
    public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid FromMemberId {get;set;} public Guid ToMemberId {get;set;}
    public string Status {get;set;}="Requested"; public Guid ProposedByMemberId {get;set;} public DateTimeOffset ProposedAt {get;set;}
    public DateTimeOffset? ConfirmedAt {get;set;} public string TimeZoneId {get;set;}="UTC";
    public string? Outcome {get;set;} public DateTimeOffset? FollowUpAt {get;set;} public long Version {get;set;}
}

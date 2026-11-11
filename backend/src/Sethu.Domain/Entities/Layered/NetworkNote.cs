namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class NetworkNote
{
    public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid AuthorMemberId {get;set;}
    public string ContextType {get;set;}=""; public Guid ContextId {get;set;} public string Text {get;set;}="";
    public DateTimeOffset? FollowUpAt {get;set;} public bool Archived {get;set;}
    public DateTimeOffset UpdatedAt {get;set;} public long Version {get;set;}
}

namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class CommitteeApprovalPolicy
{
    public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid ChapterId {get;set;}
    public int RequiredApprovals {get;set;} public bool Active {get;set;} public long Version {get;set;}
    public DateTimeOffset EffectiveFrom {get;set;} public DateTimeOffset? EffectiveUntil {get;set;}
}

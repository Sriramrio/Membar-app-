using Sethu.Domain.Finance;

namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class ChapterActivity
{
    public Guid Id {get;set;}
    public Guid TenantId {get;set;}
    public Guid ChapterId {get;set;}
    public FinancePurpose Purpose {get;set;}
    public int? Capacity {get;set;}
    public bool Cancelled {get;set;}
    public long Version {get;set;}=1;
}

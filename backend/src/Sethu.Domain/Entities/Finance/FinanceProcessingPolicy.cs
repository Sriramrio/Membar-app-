using Sethu.Domain.Finance;

namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class FinanceProcessingPolicy
{
    public Guid Id {get;set;} public Guid TenantId {get;set;}
    public FinancePurpose Purpose {get;set;} public FinanceOwnerType OwnerType {get;set;}
    public Guid OwnerUnitId {get;set;}
    public string PostVerificationMode {get;set;}=""; // AUTOMATIC or MANUAL
    public bool Approved {get;set;} public long Version {get;set;}
    public DateTimeOffset EffectiveFrom {get;set;}
    public DateTimeOffset? EffectiveUntil {get;set;}
}

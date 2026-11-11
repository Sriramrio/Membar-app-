using Sethu.Domain.Finance;

namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class ReceivingAccount
{
    public Guid Id {get;set;} public Guid TenantId {get;set;} public FinanceOwnerType OwnerType {get;set;}
    public Guid OwnerUnitId {get;set;} public string MaskedReference {get;set;}="";
    public string Currency {get;set;}="INR"; public bool Active {get;set;} public long Version {get;set;}
}

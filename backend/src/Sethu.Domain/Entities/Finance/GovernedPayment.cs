using Sethu.Domain.Finance;

namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class GovernedPayment
{
    public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid PayerUserId {get;set;}
    public Guid ChapterId {get;set;} public Guid ContextId {get;set;}
    public FinancePurpose Purpose {get;set;} public FinanceOwnerType OwnerType {get;set;}
    public Guid ReceivingAccountId {get;set;} public long AccountVersion {get;set;}
    public decimal ExpectedAmount {get;set;} public string Currency {get;set;}="INR";
    public string Status {get;set;}="Requested"; public long Version {get;set;}=1;
}

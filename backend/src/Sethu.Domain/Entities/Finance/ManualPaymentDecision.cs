using Sethu.Domain.Finance;

namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class ManualPaymentDecision
{
    public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid PaymentId {get;set;}
    public Guid ClaimId {get;set;} public Guid VerifierId {get;set;}
    public FinanceOwnerType OwnerType {get;set;} public Guid OwnerUnitId {get;set;}
    public string CheckedSource {get;set;}=""; public DateOnly CheckedDate {get;set;}
    public string CheckedUtr {get;set;}=""; public decimal CheckedAmount {get;set;}
    public string Currency {get;set;}="INR"; public bool BeneficiaryMatched {get;set;}
    public bool UtrMatched {get;set;} public bool AmountMatched {get;set;}
    public bool DateMatched {get;set;} public ManualFinanceDecision Decision {get;set;}
    public string ReasonCode {get;set;}=""; public DateTimeOffset DecidedAt {get;set;}
}

namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class IntakePayment
{
    public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid IntakeId {get;set;}
    public string Reference {get;set;}=""; public decimal Amount {get;set;}
    public string Currency {get;set;}="INR"; public bool Verified {get;set;}
    public Guid? VerifiedBy {get;set;} public string BankEvidenceReference {get;set;}="";
}

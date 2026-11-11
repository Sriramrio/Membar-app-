namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class FinanceBankRecord
{
    public Guid Id {get;set;} public Guid TenantId {get;set;} public string Reference {get;set;}="";
    public decimal Amount {get;set;} public string Currency {get;set;}="INR";
    public bool IndependentlyVerified {get;set;} public string Beneficiary {get;set;}="";
    public Guid IngestedBy {get;set;} public Guid ApprovedBy {get;set;}
    public string Provenance {get;set;}=""; public DateTimeOffset RecordedAt {get;set;}
    public bool Reversed {get;set;} public Guid? AssignedIntakeId {get;set;}
    // Only a separately authenticated bank/provider adapter may set this field.
    public bool BankOriginAuthenticated {get;set;} public string SourceDigest {get;set;}="";
}

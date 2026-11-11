namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class FinanceBeneficiaryPolicy
{
    public Guid Id {get;set;} public Guid TenantId {get;set;} public string Beneficiary {get;set;}="";
    public bool Active {get;set;} public decimal ExpectedAmount {get;set;} public string Currency {get;set;}="INR";
}

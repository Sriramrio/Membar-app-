namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class PaymentClaim
{
    public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid PaymentId {get;set;}
    public Guid SubmittedBy {get;set;} public string Utr {get;set;}=""; public decimal Amount {get;set;}
    public string Currency {get;set;}="INR"; public DateOnly PaymentDate {get;set;}
    public string Mode {get;set;}=""; public DateTimeOffset SubmittedAt {get;set;}
    public bool Superseded {get;set;}
}

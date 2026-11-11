namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class ChapterActivityRegistration
{
    public Guid Id {get;set;}
    public Guid TenantId {get;set;}
    public Guid ActivityId {get;set;}
    public Guid MemberId {get;set;}
    public Guid? PaymentId {get;set;}
    public bool Cancelled {get;set;}
    public bool PaymentVerified {get;set;}
    public bool SeatConfirmed {get;set;}
    public bool Waitlisted {get;set;}
    public bool Attended {get;set;}
    public long Version {get;set;}=1;
}

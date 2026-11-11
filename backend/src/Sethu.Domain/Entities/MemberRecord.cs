using Sethu.Domain;
namespace Sethu.Domain.MemberBusiness;

// Canonical Member refers to, but does not replace, the established User identity master.
public sealed class MemberRecord : AggregateRoot
{
    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public Guid UserId { get; private set; }
    public MemberRecordStatus Status { get; private set; }
    private MemberRecord() { }
    public static MemberRecord Create(Guid id, Guid tenantId, Guid userId)
    {
        if (id == Guid.Empty || tenantId == Guid.Empty || userId == Guid.Empty) throw new ArgumentException("Member identifiers required");
        return new MemberRecord { Id=id,TenantId=tenantId,UserId=userId,Status=MemberRecordStatus.Pending };
    }
    public DomainOutcome Activate(bool approved, bool verifiedFinance)
    {
        if (Status != MemberRecordStatus.Pending) return new(false,"invalid_member_transition");
        if (!approved || !verifiedFinance) return new(false,"activation_evidence_missing");
        Status=MemberRecordStatus.Active; Version++; return new(true,"member_activated");
    }
    public DomainOutcome Suspend()
    {
        if (Status != MemberRecordStatus.Active) return new(false,"invalid_member_transition");
        Status=MemberRecordStatus.Suspended; Version++; return new(true,"member_suspended");
    }
}

using Sethu.Domain;
namespace Sethu.Domain.MemberBusiness;

public sealed class MemberChapterAffiliation : AggregateRoot
{
    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public Guid MemberId { get; private set; }
    public Guid ChapterId { get; private set; }
    public AffiliationStatus Status { get; private set; }
    private MemberChapterAffiliation() { }
    public static MemberChapterAffiliation Create(Guid id,Guid tenantId,Guid memberId,Guid chapterId)
    {
        if(id==Guid.Empty || tenantId==Guid.Empty || memberId==Guid.Empty || chapterId==Guid.Empty) throw new ArgumentException("Affiliation identifiers required");
        return new MemberChapterAffiliation {Id=id,TenantId=tenantId,MemberId=memberId,ChapterId=chapterId,Status=AffiliationStatus.Pending};
    }
    public DomainOutcome Approve() {if(Status!=AffiliationStatus.Pending)return new(false,"affiliation_transition_denied");Status=AffiliationStatus.Active;Version++;return new(true,"affiliation_approved");}
}

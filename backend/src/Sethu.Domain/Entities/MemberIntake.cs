using System;
namespace Sethu.Domain.Membership;

public sealed class MemberIntake : AggregateRoot
{
    public Guid Id {get;private set;}
    public Guid TenantId {get;private set;}
    public Guid ChapterId {get;private set;}
    public Guid ApplicantUserId {get;private set;}
    public Guid ProposedSpecialisationId {get;private set;}
    public IntakeState State {get;private set;}
    public string BusinessName {get;private set;}="";
    public DateTimeOffset CreatedAt {get;private set;}
    private MemberIntake() {}
    public static MemberIntake Draft(Guid id,Guid tenantId,Guid chapterId,Guid applicantId,Guid specialisationId,string businessName,DateTimeOffset now)
    {
        if(id==Guid.Empty||tenantId==Guid.Empty||chapterId==Guid.Empty||applicantId==Guid.Empty||specialisationId==Guid.Empty||string.IsNullOrWhiteSpace(businessName)||businessName.Trim().Length>200)
            throw new ArgumentException("Invalid member application details");
        return new MemberIntake{Id=id,TenantId=tenantId,ChapterId=chapterId,ApplicantUserId=applicantId,ProposedSpecialisationId=specialisationId,BusinessName=businessName.Trim(),State=IntakeState.Draft,CreatedAt=now};
    }
    public bool Submit(long expectedVersion) => Move(IntakeState.Draft,IntakeState.Submitted,expectedVersion);
    public bool AskClarification(long expectedVersion) => State==IntakeState.Submitted && Move(IntakeState.Submitted,IntakeState.ClarificationRequired,expectedVersion);
    public bool Resubmit(long expectedVersion) => Move(IntakeState.ClarificationRequired,IntakeState.Submitted,expectedVersion);
    public bool MarkDocumentsVerified(long expectedVersion) => Move(IntakeState.Submitted,IntakeState.DocumentsVerified,expectedVersion);
    public bool MarkCommitteeApproved(long expectedVersion) => Move(IntakeState.DocumentsVerified,IntakeState.CommitteeApproved,expectedVersion);
    public bool RequestPayment(long expectedVersion) => Move(IntakeState.CommitteeApproved,IntakeState.PaymentRequested,expectedVersion);
    public bool ReportPayment(long expectedVersion) => Move(IntakeState.PaymentRequested,IntakeState.PaymentReported,expectedVersion);
    public bool ConfirmFinance(long expectedVersion) => Move(IntakeState.PaymentReported,IntakeState.FinanceVerified,expectedVersion);
    public bool Activate(long expectedVersion) => Move(IntakeState.FinanceVerified,IntakeState.Activated,expectedVersion);
    public bool Withdraw(long expectedVersion)
    {
        if(State is IntakeState.Activated or IntakeState.Rejected or IntakeState.Withdrawn || Version!=expectedVersion)return false;
        State=IntakeState.Withdrawn;Version++;return true;
    }
    public bool Reject(long expectedVersion)
    {
        if(State is IntakeState.Activated or IntakeState.Rejected or IntakeState.Withdrawn || Version!=expectedVersion)return false;
        State=IntakeState.Rejected;Version++;return true;
    }
    /// <summary>Advances the application to a state already validated by the governed workflow (replaces direct Row writes).</summary>
    public void AdvanceTo(IntakeState next){State=next;Version++;}
    private bool Move(IntakeState from,IntakeState to,long expectedVersion)
    {
        if(State!=from||Version!=expectedVersion)return false;
        State=to;Version++;return true;
    }
}

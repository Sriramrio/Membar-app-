using Sethu.Domain;

namespace Sethu.Domain.Membership;

public sealed class MembershipApplication : AggregateRoot
{
    public Guid ApplicationId { get; }
    public Guid TenantId { get; }
    public Guid ChapterId { get; }
    public Guid ApplicantUserId { get; }
    public ApplicationStage Stage { get; private set; } = ApplicationStage.Submitted;

    public MembershipApplication(Guid id, Guid tenantId, Guid chapterId, Guid applicantUserId)
    {
        if (id == Guid.Empty || tenantId == Guid.Empty || chapterId == Guid.Empty || applicantUserId == Guid.Empty)
            throw new ArgumentException("Application, tenant, chapter and applicant IDs are required.");
        ApplicationId = id;
        TenantId = tenantId;
        ChapterId = chapterId;
        ApplicantUserId = applicantUserId;
    }

    // Authorization is an additional mandatory server-side gate: caller may not invent an OnboardingActor.
    public OnboardingResult Apply(OnboardingAction action, OnboardingActor actor, long expectedVersion)
    {
        if (expectedVersion != Version) return Denied("stale_version");
        if (actor.UserId == Guid.Empty || actor.TenantId != TenantId || actor.ChapterId != ChapterId)
            return Denied("actor_scope_denied");
        if (Stage is ApplicationStage.Rejected or ApplicationStage.CertificateDelivered)
            return Denied("terminal_stage");
        if (actor.UserId == ApplicantUserId && action != OnboardingAction.ReportPayment)
            return Denied("self_approval_denied");
        if (action == OnboardingAction.ReportPayment && actor.UserId != ApplicantUserId)
            return Denied("payment_reporter_mismatch");
        // Legacy unpersisted onboarding authority cannot verify trusted finance evidence.
        if (action is OnboardingAction.VerifyBankReceipt or OnboardingAction.ActivateMembership)
            return Denied("canonical_intake_workflow_required");

        ApplicationStage? next = (Stage, action, actor.Permission) switch
        {
            (ApplicationStage.Submitted, OnboardingAction.VerifyDocuments, "onboarding.documents.verify") => ApplicationStage.DocumentsVerified,
            (ApplicationStage.DocumentsVerified, OnboardingAction.ApproveCommittee, "onboarding.committee.approve") => ApplicationStage.CommitteeApproved,
            (ApplicationStage.CommitteeApproved, OnboardingAction.IssuePaymentRequest, "onboarding.payment.issue") => ApplicationStage.PaymentRequested,
            (ApplicationStage.PaymentRequested, OnboardingAction.ReportPayment, "onboarding.payment.report") => ApplicationStage.PaymentReported,
            (ApplicationStage.PaymentReported, OnboardingAction.VerifyBankReceipt, "onboarding.finance.verify") => ApplicationStage.FinanceVerified,
            (ApplicationStage.FinanceVerified, OnboardingAction.ActivateMembership, "onboarding.member.activate") => ApplicationStage.Activated,
            (ApplicationStage.Activated, OnboardingAction.DeliverCertificate, "onboarding.certificate.deliver") => ApplicationStage.CertificateDelivered,
            (_, OnboardingAction.Reject, "onboarding.application.reject") => ApplicationStage.Rejected,
            _ => (ApplicationStage?)null
        };
        if (next is null) return Denied("invalid_transition_or_permission");
        Stage = next.Value;
        Version++;
        return new(true, "transition_accepted", Stage, Version);
    }

    private OnboardingResult Denied(string reason) => new(false, reason, Stage, Version);
}

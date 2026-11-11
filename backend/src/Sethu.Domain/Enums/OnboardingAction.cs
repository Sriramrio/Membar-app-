using Sethu.Domain;

namespace Sethu.Domain.Membership;

public enum OnboardingAction
{
    VerifyDocuments, ApproveCommittee, IssuePaymentRequest, ReportPayment,
    VerifyBankReceipt, ActivateMembership, DeliverCertificate, Reject
}

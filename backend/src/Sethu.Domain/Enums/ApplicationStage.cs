using Sethu.Domain;

namespace Sethu.Domain.Membership;

public enum ApplicationStage
{
    Submitted, DocumentsVerified, CommitteeApproved, PaymentRequested,
    PaymentReported, FinanceVerified, Activated, CertificateDelivered, Rejected
}

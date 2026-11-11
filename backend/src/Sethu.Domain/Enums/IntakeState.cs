using System;
namespace Sethu.Domain.Membership;

// Independent new applicant intake aggregate; does not replace the inherited approved membership identity.
public enum IntakeState { Draft=0, Submitted=1, ClarificationRequired=2, DocumentsVerified=3, CommitteeApproved=4, PaymentRequested=5, PaymentReported=6, FinanceVerified=7, Activated=8, Rejected=9, Withdrawn=10 }

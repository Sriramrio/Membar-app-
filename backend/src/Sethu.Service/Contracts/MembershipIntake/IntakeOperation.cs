using System.Security.Claims;
using Sethu.Service.Security;
using Sethu.Domain.Membership;
namespace Sethu.Service.MembershipIntake;

public enum IntakeOperation { RecordDocument, VerifyDocuments, ApproveCommittee, IssuePaymentRequest, ReportPayment, ReconcileFinance, Activate, RecordCertificate }

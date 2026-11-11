using System.Security.Claims;
using Sethu.Service.Security;
using Sethu.Domain.Membership;
namespace Sethu.Service.MembershipIntake;

public sealed record IntakeWorkflowCommand(Guid ApplicationId, IntakeOperation Operation, long ExpectedVersion,
    string IdempotencyKey, string? EvidenceReference = null, string? PaymentReference = null,
    decimal Amount = 0, string Currency = "INR", string? Reason = null, string? DocumentKind = null);

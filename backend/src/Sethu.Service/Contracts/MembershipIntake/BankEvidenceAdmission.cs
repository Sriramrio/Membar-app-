using System.Security.Claims;
using Sethu.Service.Security;
namespace Sethu.Service.MembershipIntake;

// This command cannot be invoked by an applicant: it requires authoritative identity and finance entitlement.
public sealed record BankEvidenceAdmission(Guid TenantId, Guid ApplicationId, string Reference, decimal Amount,
    string Currency, string Beneficiary, string Provenance, string IdempotencyKey);

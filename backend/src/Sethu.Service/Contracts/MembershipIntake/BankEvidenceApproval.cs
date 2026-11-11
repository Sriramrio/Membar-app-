using System.Security.Claims;
using Sethu.Service.Security;
namespace Sethu.Service.MembershipIntake;

public sealed record BankEvidenceApproval(Guid TenantId,string Reference,string IdempotencyKey);

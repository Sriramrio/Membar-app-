using System.Security.Claims;
using Sethu.Service.Security;
namespace Sethu.Service.MembershipIntake;

public sealed record BankEvidenceResult(bool Accepted, string Code);

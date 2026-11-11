using System.Security.Claims;
using Sethu.Service.Security;
using Sethu.Domain.Membership;
namespace Sethu.Service.MembershipIntake;

public sealed record IntakeWorkflowOutcome(bool Accepted, string Code, Guid ApplicationId, long? Version, Guid? MemberId = null);

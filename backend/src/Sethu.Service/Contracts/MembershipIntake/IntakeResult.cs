using System.Security.Claims;
using Sethu.Service.Security;
using Sethu.Domain.Membership;
namespace Sethu.Service.MembershipIntake;

public sealed record IntakeResult(bool Accepted,string Code,Guid? ApplicationId,long? Version);

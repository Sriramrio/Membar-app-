using System.Security.Claims;
using Sethu.Service.Security;
using Sethu.Domain.Membership;
namespace Sethu.Service.MembershipIntake;

public sealed record StartIntake(Guid ApplicationId,Guid ChapterId,Guid SpecialisationId,string BusinessName,string IdempotencyKey);

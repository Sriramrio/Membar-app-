using System.Security.Claims;
using Sethu.Service.Security;
using Sethu.Domain.MemberBusiness;

namespace Sethu.Service.MemberBusiness;

public sealed record VerifiedMember(Guid MemberId,Guid TenantId,Guid UserId,bool Active);

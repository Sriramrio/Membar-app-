using System.Security.Claims;
using Sethu.Service.Security;
using Sethu.Domain.MemberBusiness;

namespace Sethu.Service.MemberBusiness;

public sealed record BusinessCommandResult(bool Accepted,string Code,Guid? BusinessId,long? Version);

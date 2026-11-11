using System.Security.Claims;
using Sethu.Service.Security;
using Sethu.Domain.MemberBusiness;

namespace Sethu.Service.MemberBusiness;

public sealed record CreateBusinessDraft(Guid BusinessId,Guid MemberId,string Name,Guid SpecialisationId,string IdempotencyKey);

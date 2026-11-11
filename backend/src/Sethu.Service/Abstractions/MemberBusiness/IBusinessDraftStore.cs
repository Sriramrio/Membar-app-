using System.Security.Claims;
using Sethu.Service.Security;
using Sethu.Domain.MemberBusiness;

namespace Sethu.Service.MemberBusiness;

// Repository/UoW contract intentionally records one atomic business effect plus audit/outbox.
public interface IBusinessDraftStore
{
    Task<VerifiedMember?> FindMemberAsync(Guid tenantId,Guid memberId,CancellationToken ct);
    Task<BusinessCommandResult> CreateDraftAtomicallyAsync(BusinessRecord draft,Guid actorId,string idempotencyKey,CancellationToken ct);
}

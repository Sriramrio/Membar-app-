using Sethu.Service.DTOs.Directory;
using Sethu.Service.MemberNetwork;
namespace Sethu.Service.Layered;
public sealed class MemberContextService(IMemberContextRepository repository) : IMemberContextService
{
    public Task<MemberContextDto?> GetAsync(NetworkActor actor, CancellationToken ct)
    {
        if (actor.UserId == Guid.Empty || actor.MemberId == Guid.Empty || actor.TenantId == Guid.Empty)
            return Task.FromResult<MemberContextDto?>(null);
        return repository.GetAsync(actor, ct);
    }
}

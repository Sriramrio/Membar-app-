using Sethu.Domain.Membership;
using Sethu.Domain.Security;
namespace Sethu.Service.Security;

public interface ITrustedPermissionStore
{
    Task<IReadOnlyList<RoleGrant>?> ReadGrantsAsync(Guid actorId, Guid tenantId, CancellationToken token);
}

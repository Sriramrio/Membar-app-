using Sethu.Domain.Membership;
using Sethu.Domain.Security;
namespace Sethu.Service.Security;

public interface IMembershipApplicationStore
{
    Task<MembershipApplication?> FindAsync(Guid id, CancellationToken token);
    Task SaveAsync(MembershipApplication application, long previousVersion, CancellationToken token);
}

using System.Security.Claims;
using Sethu.Domain.Security;
namespace Sethu.Service.Security;

public interface IAuthenticatedActorResolver
{
    Task<IdentityResolution> ResolveAsync(ClaimsPrincipal principal, CancellationToken token);
}

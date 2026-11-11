using System.Security.Claims;
using Sethu.Domain.Security;
namespace Sethu.Service.Security;

public interface ITrustedIdentityDirectory
{
    Task<TrustedIdentityRecord?> FindBySubjectAsync(string issuer, string subject, CancellationToken token);
}

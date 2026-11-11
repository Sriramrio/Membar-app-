using System.Security.Claims;
using Sethu.Domain.Security;
namespace Sethu.Service.Security;

public interface ISessionRevocationReader
{
    Task<bool?> IsRevokedAsync(string issuer, string sessionId, CancellationToken token);
}

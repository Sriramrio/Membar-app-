using Sethu.Service.MemberNetwork;
namespace Sethu.Service.Layered;

public interface ICurrentNetworkMember
{
    Task<NetworkActor?> ResolveAsync(System.Security.Claims.ClaimsPrincipal principal, CancellationToken ct);
}

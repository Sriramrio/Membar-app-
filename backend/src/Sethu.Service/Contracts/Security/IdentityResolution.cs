using System.Security.Claims;
using Sethu.Domain.Security;
namespace Sethu.Service.Security;

public sealed record IdentityResolution(TrustedActor? Actor, string Reason)
{
    public bool Succeeded => Actor is not null;
}

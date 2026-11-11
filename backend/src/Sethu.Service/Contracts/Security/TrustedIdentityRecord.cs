using System.Security.Claims;
using Sethu.Domain.Security;
namespace Sethu.Service.Security;

public sealed record TrustedIdentityRecord(Guid UserId, Guid TenantId, bool Active, Guid? MemberId);

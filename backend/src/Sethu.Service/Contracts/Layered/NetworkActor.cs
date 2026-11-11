using Sethu.Service.MemberNetwork;
namespace Sethu.Service.Layered;

public sealed record NetworkActor(Guid UserId, Guid MemberId, Guid TenantId);

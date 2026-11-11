namespace Sethu.Service.MemberNetwork;

public sealed record ConnectionCommand(Guid TenantId, Guid ActorMemberId, Guid OtherMemberId, ConnectionAction Action, string IdempotencyKey);

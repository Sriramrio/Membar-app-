namespace Sethu.Service.MemberNetwork;

public sealed record ConnectionOutcome(bool Accepted, string Code, Guid? ConnectionId);

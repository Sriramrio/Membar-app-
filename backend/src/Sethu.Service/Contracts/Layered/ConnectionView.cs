using Sethu.Service.MemberNetwork;
namespace Sethu.Service.Layered;

public sealed record ConnectionView(Guid Id, Guid InitiatorId, Guid OtherMemberId, string State, long Version, DateTimeOffset UpdatedAt);

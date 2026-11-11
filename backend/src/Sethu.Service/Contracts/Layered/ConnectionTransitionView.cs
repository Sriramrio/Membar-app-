using Sethu.Service.MemberNetwork;
namespace Sethu.Service.Layered;

public sealed record ConnectionTransitionView(Guid Id,Guid ConnectionId,Guid ActorMemberId,string? PreviousState,string NewState,string Action,DateTimeOffset OccurredAt);

namespace Sethu.Service.Layered;

public sealed record MeetingView(Guid Id,Guid FromMemberId,Guid ToMemberId,string Status,DateTimeOffset ProposedAt,DateTimeOffset? ConfirmedAt,string TimeZoneId,string? Outcome,DateTimeOffset? FollowUpAt);

namespace Sethu.Service.Layered;

public sealed record MeetingCreate(Guid ToMemberId,DateTimeOffset ProposedAt,string TimeZoneId,string IdempotencyKey);

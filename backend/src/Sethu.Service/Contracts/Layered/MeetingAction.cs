namespace Sethu.Service.Layered;

public sealed record MeetingAction(Guid MeetingId,string Action,string IdempotencyKey,DateTimeOffset? Time=null,string? Outcome=null);

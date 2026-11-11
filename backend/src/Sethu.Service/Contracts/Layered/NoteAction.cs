namespace Sethu.Service.Layered;

public sealed record NoteAction(Guid NoteId,string Action,string IdempotencyKey,string? Text=null,DateTimeOffset? FollowUpAt=null);

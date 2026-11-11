namespace Sethu.Service.Layered;

public sealed record NoteCreate(string ContextType,Guid ContextId,string Text,DateTimeOffset? FollowUpAt,string IdempotencyKey);

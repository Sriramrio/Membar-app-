namespace Sethu.Service.Layered;

public sealed record NoteView(Guid Id,string ContextType,Guid ContextId,string Text,DateTimeOffset? FollowUpAt,bool Archived,DateTimeOffset UpdatedAt);

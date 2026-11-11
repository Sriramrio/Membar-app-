namespace Sethu.Service.Layered;

public sealed record MemberActionItem(string Type,Guid ResourceId,string Description,DateTimeOffset? DueAt);

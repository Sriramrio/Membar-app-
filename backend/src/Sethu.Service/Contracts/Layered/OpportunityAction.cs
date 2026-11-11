namespace Sethu.Service.Layered;

public sealed record OpportunityAction(Guid OpportunityId,string Action,string IdempotencyKey,string? Outcome=null,Guid? ResponseId=null,string? Title=null);

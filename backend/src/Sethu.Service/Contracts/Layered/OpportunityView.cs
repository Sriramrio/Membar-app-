namespace Sethu.Service.Layered;

public sealed record OpportunityView(Guid Id,Guid OwnerMemberId,Guid BusinessId,string Title,string Status,string Scope,Guid? ChapterId,Guid? SpecialisationId,string? Outcome);

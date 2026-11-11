namespace Sethu.Service.Layered;

public sealed record OpportunityCreate(Guid BusinessId,string Title,string Scope,Guid? ChapterId,Guid? SpecialisationId,string IdempotencyKey);

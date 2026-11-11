namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class ChapterSpecialisationClaim
{
    public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid ChapterId {get;set;}
    public Guid SpecialisationId {get;set;} public Guid MemberId {get;set;} public bool Active {get;set;}
}

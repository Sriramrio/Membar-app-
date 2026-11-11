namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class Delegation { public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid ChapterId {get;set;} public Guid DelegatorId {get;set;} public Guid DelegateId {get;set;} public string Permission {get;set;}=""; public DateTimeOffset StartsAt {get;set;} public DateTimeOffset EndsAt {get;set;} public bool Revoked {get;set;} }

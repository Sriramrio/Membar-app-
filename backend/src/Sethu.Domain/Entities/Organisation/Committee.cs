namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class Committee { public Guid TenantId {get;set;} public Guid ChapterId {get;set;} public long Version {get;set;} }

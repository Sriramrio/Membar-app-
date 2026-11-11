using Sethu.Domain.Organisation;

namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class Unit { public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid? ParentId {get;set;} public UnitLevel Level {get;set;} public string Code {get;set;}=""; public bool Active {get;set;} public long Version {get;set;} }

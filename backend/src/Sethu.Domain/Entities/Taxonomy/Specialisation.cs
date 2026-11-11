namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class Specialisation { public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid SegmentId {get;set;} public string Name {get;set;}=""; public bool Active {get;set;}=true; }

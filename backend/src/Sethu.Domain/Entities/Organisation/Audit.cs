namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class Audit { public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid ActorId {get;set;} public Guid ResourceId {get;set;} public string Operation {get;set;}=""; public string CorrelationId {get;set;}=""; public string Event {get;set;}=""; public DateTimeOffset OccurredAt {get;set;} }

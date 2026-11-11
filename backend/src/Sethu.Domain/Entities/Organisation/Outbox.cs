namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class Outbox { public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid ResourceId {get;set;} public string Event {get;set;}=""; public DateTimeOffset OccurredAt {get;set;} public DateTimeOffset? DispatchedAt {get;set;} public int Attempts {get;set;} public DateTimeOffset? NextAttemptAt {get;set;} public bool DeadLettered {get;set;} public string? LastErrorCode {get;set;} public Guid? LeaseOwner {get;set;} public DateTimeOffset? LeaseExpiresAt {get;set;} }

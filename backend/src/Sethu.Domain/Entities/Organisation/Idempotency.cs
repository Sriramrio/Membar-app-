namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class Idempotency { public Guid TenantId {get;set;} public Guid ActorId {get;set;} public string Operation {get;set;}=""; public string Key {get;set;}=""; public string PayloadSha256 {get;set;}=""; public string ResultJson {get;set;}=""; public DateTimeOffset CreatedAt {get;set;} }

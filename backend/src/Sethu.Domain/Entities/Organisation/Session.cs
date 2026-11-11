namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class Session { public Guid Id {get;set;} public Guid UserId {get;set;} public string Issuer {get;set;}=""; public string SessionId {get;set;}=""; public bool Revoked {get;set;} public DateTimeOffset ExpiresAt {get;set;} }

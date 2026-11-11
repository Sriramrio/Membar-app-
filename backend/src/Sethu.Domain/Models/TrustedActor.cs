namespace Sethu.Domain.Security;

// Inputs must be loaded from trusted server-side identity/assignment stores, never request DTOs.
public sealed record TrustedActor(Guid UserId, Guid TenantId, bool Active, bool SessionRevoked);

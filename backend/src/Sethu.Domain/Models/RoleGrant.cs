namespace Sethu.Domain.Security;

public sealed record RoleGrant(Guid UserId, Guid TenantId, Guid? ChapterId, string Permission,
    DateTimeOffset StartsAt, DateTimeOffset? EndsAt, bool Revoked, bool IndependentGovernance);

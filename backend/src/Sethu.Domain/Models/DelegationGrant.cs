namespace Sethu.Domain.Security;

public sealed record DelegationGrant(Guid Id, Guid DelegatorId, Guid DelegateId, Guid TenantId, Guid ChapterId,
    string Permission, DateTimeOffset StartsAt, DateTimeOffset EndsAt, bool Revoked);

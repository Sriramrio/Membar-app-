namespace Sethu.Domain.Security;

public sealed record ScopedResource(Guid TenantId, Guid? ChapterId, Guid? OwnerUserId);

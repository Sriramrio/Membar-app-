using Sethu.Domain;

namespace Sethu.Domain.Membership;

public sealed record OnboardingActor(Guid UserId, Guid TenantId, Guid ChapterId,
    bool IsApplicant, string Permission);

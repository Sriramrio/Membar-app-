using Sethu.Domain.Security;
namespace Sethu.Service.Security;

public sealed record GovernanceDecisionRequest(Guid TenantId, Guid ChapterId, Guid SubjectUserId,
    Guid CaseId, IReadOnlyCollection<Guid> InterestedUsers);

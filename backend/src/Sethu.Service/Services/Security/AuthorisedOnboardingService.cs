using Sethu.Domain.Membership;
using Sethu.Domain.Security;
namespace Sethu.Service.Security;

public sealed class AuthorisedOnboardingService
{
    // Retained only as compatibility type; no independent mutable authority is permitted.
    public Task<OnboardingTransitionOutcome> ExecuteAsync(System.Security.Claims.ClaimsPrincipal principal,
        OnboardingTransitionCommand command, CancellationToken token) =>
        Task.FromResult(new OnboardingTransitionOutcome(false,"canonical_membership_intake_required",null,null));
}

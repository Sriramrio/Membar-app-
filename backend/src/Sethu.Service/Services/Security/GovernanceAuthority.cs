using Sethu.Domain.Security;
namespace Sethu.Service.Security;

public sealed class GovernanceAuthority(IAuthenticatedActorResolver resolver, ITrustedPermissionStore store, TimeProvider clock)
{
    public async Task<PolicyDecision> EvaluateAsync(System.Security.Claims.ClaimsPrincipal principal,
        GovernanceDecisionRequest request, CancellationToken token)
    {
        var result = await resolver.ResolveAsync(principal,token);
        if (!result.Succeeded) return new(false,result.Reason);
        var actor = result.Actor!;
        if (request.CaseId == Guid.Empty || request.InterestedUsers.Contains(actor.UserId))
            return new(false,"conflict_of_interest_or_invalid_case");
        var grants = await store.ReadGrantsAsync(actor.UserId,actor.TenantId,token);
        if (grants is null) return new(false,"assignment_unavailable");
        return RoleScopePolicy.Evaluate(actor,new ScopedResource(request.TenantId,request.ChapterId,request.SubjectUserId),
            new PermissionRequest("governance.decision.approve",RequiresIndependentGovernance:true,ProhibitsSelfApproval:true),
            grants,clock.GetUtcNow());
    }
}

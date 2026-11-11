namespace Sethu.Domain.Security;

public static class RoleScopePolicy
{
    public static PolicyDecision Evaluate(TrustedActor? actor, ScopedResource resource,
        PermissionRequest request, IEnumerable<RoleGrant> trustedGrants, DateTimeOffset now)
    {
        if (actor is null || actor.UserId == Guid.Empty || !actor.Active || actor.SessionRevoked)
            return new(false, "identity_not_active");
        if (resource.TenantId == Guid.Empty || actor.TenantId != resource.TenantId)
            return new(false, "tenant_scope_denied");
        if (string.IsNullOrWhiteSpace(request.Permission))
            return new(false, "permission_missing");
        if (request.ProhibitsSelfApproval && resource.OwnerUserId == actor.UserId)
            return new(false, "self_approval_denied");
        if (trustedGrants is null)
            return new(false, "assignment_unavailable");

        foreach (var grant in trustedGrants)
        {
            if (grant.UserId != actor.UserId || grant.TenantId != actor.TenantId || grant.Revoked)
                continue;
            if (!string.Equals(grant.Permission, request.Permission, StringComparison.Ordinal))
                continue;
            if (grant.StartsAt > now || (grant.EndsAt is { } end && now >= end))
                continue;
            if (request.RequiresIndependentGovernance && !grant.IndependentGovernance)
                continue;
            // Chapter assignments never implicitly elevate into tenant-wide grants.
            if (resource.ChapterId is null ? grant.ChapterId is not null :
                (grant.ChapterId is not null && grant.ChapterId != resource.ChapterId))
                continue;
            return new(true, "granted");
        }
        return new(false, "no_active_matching_grant");
    }
}

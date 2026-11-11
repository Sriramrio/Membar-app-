namespace Sethu.Domain.Security;

public static class DelegationLifecycle
{
    public static (DelegationGrant? Value, string Error) Issue(DelegationGrant grant,
        CommitteeAppointment delegatorOffice, IReadOnlyCollection<string> trustedPermissions, DateTimeOffset now)
    {
        if (grant.Id == Guid.Empty || grant.DelegateId == Guid.Empty || grant.DelegatorId == Guid.Empty ||
            grant.DelegatorId == grant.DelegateId || grant.Revoked || grant.EndsAt <= grant.StartsAt)
            return (null,"invalid_delegation");
        // Governance decisions never inherit generic platform authority.
        if (grant.Permission.StartsWith("governance.", StringComparison.Ordinal))
            return (null,"governance_delegation_requires_independent_policy");
        var check=AppointmentAuthority.CheckDelegation(grant,delegatorOffice,grant.Permission,now,trustedPermissions);
        return check.Allowed ? (grant,"delegation_valid") : (null,check.Reason);
    }
    public static (DelegationGrant? Value, string Error) Revoke(DelegationGrant grant)
        => grant.Revoked ? (null,"delegation_already_revoked") : (grant with { Revoked=true },"revocation_valid");
}

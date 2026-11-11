using Sethu.Domain.Security;

namespace Sethu.TrackA.SourceTests;
// Executable C# scenario source, NOT executed in Track A.
public static class B02CAppointmentDelegationTests
{
    public static void Validate()
    {
        var t = Guid.NewGuid(); var chapter = Guid.NewGuid(); var actor = Guid.NewGuid();
        var now = new DateTimeOffset(2026,10,12,0,0,0,TimeSpan.Zero);
        var appt = new CommitteeAppointment(Guid.NewGuid(),t,chapter,actor,"coordinator",
            now.AddMinutes(-10),now.AddDays(5),AppointmentStatus.Proposed,true);
        var approved = AppointmentLifecycle.Transition(appt,AppointmentStatus.Approved,now);
        if (approved.Value is null) throw new Exception("approve_rejected");
        if (AppointmentLifecycle.Transition(appt,AppointmentStatus.Active,now).Value is not null)
            throw new Exception("unapproved_activation_allowed");
        var active = AppointmentLifecycle.Transition(approved.Value,AppointmentStatus.Active,now);
        if (active.Value is null) throw new Exception("activate_rejected");
        if (AppointmentLifecycle.Transition(active.Value,AppointmentStatus.Approved,now).Value is not null)
            throw new Exception("duplicate_approval_allowed");
        if (AppointmentLifecycle.Renew(active.Value,now.AddDays(8),now).Value is null)
            throw new Exception("renewal_rejected");
        var suspended = AppointmentLifecycle.Transition(active.Value,AppointmentStatus.Suspended,now);
        if (suspended.Value is null) throw new Exception("suspend_rejected");
        var revoked = AppointmentLifecycle.Transition(suspended.Value,AppointmentStatus.Revoked,now);
        if (revoked.Value is null) throw new Exception("revoke_rejected");
        if (AppointmentLifecycle.Renew(revoked.Value,now.AddDays(9),now).Value is not null)
            throw new Exception("revoked_renewal_allowed");
        if (AppointmentLifecycle.Transition(revoked.Value,AppointmentStatus.Active,now).Value is not null)
            throw new Exception("revoked_reactivation_allowed");
        var deleg = new DelegationGrant(Guid.NewGuid(),actor,Guid.NewGuid(),t,chapter,
            "organisation.committee.appoint",now,now.AddDays(1),false);
        if (DelegationLifecycle.Issue(deleg,active.Value,new[]{deleg.Permission},now).Value is null)
            throw new Exception("valid_delegation_rejected");
        if (DelegationLifecycle.Issue(deleg with {EndsAt=now.AddDays(6)},active.Value,
                new[]{deleg.Permission},now).Value is not null)
            throw new Exception("excess_tenure_allowed");
        if (DelegationLifecycle.Issue(deleg with {Permission="governance.decide"},active.Value,
                new[]{"governance.decide"},now).Value is not null)
            throw new Exception("governance_delegation_allowed");
        var ended=DelegationLifecycle.Revoke(deleg);
        if (ended.Value is null || !ended.Value.Revoked) throw new Exception("revocation_failed");
        if (DelegationLifecycle.Revoke(ended.Value).Value is not null)
            throw new Exception("double_revocation_allowed");
    }
}

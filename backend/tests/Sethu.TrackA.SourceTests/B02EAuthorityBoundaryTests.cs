using Sethu.Domain.Security;

namespace Sethu.TrackA.SourceTests;
// These checks are authored source, NOT executed at this checkpoint.
public static class B02EAuthorityBoundaryTests
{
    public static void Validate()
    {
        var t = Guid.NewGuid(); var c = Guid.NewGuid(); var user = Guid.NewGuid();
        var now = new DateTimeOffset(2026,10,12,9,0,0,TimeSpan.Zero);
        var first = new CommitteeAppointment(Guid.NewGuid(),t,c,user,"president",
            now.AddDays(-1),now.AddDays(2),AppointmentStatus.Approved,true);
        var overlaps = first with { Id=Guid.NewGuid(), UserId=Guid.NewGuid(),
            StartsAt=now, EndsAt=now.AddDays(1), Status=AppointmentStatus.Active };
        if (AppointmentAuthority.CheckExclusiveConflict(overlaps,new[]{first}).Allowed)
            throw new InvalidOperationException("Overlapping exclusive office accepted");
        var touching = overlaps with { StartsAt=first.EndsAt, EndsAt=first.EndsAt.AddDays(1) };
        if (!AppointmentAuthority.CheckExclusiveConflict(touching,new[]{first}).Allowed)
            throw new InvalidOperationException("Adjacent tenure incorrectly overlaps");
        var delegated = new DelegationGrant(Guid.NewGuid(),user,Guid.NewGuid(),t,c,"organisation.unit.reparent",
            now.AddHours(-1),now.AddHours(1),true);
        var activeOffice = first with { Status=AppointmentStatus.Active };
        if (AppointmentAuthority.CheckDelegation(delegated,activeOffice,delegated.Permission,now,
            new[]{delegated.Permission}).Allowed) throw new InvalidOperationException("Revoked delegation authorized");
    }
}

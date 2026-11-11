using Sethu.Service.Security;
using Sethu.Domain.Organisation;
using Sethu.Domain.Security;

namespace Sethu.TrackA.SourceTests;
// Authored negative test assertions. This source must be incorporated into executable test harness at S4.
public static class OrganisationCommandTests
{
    public static void ValidateDomainRules()
    {
        var tenant = Guid.NewGuid(); var countryId = Guid.NewGuid(); var stateId = Guid.NewGuid();
        var country = new OrganisationUnit(countryId,tenant,UnitLevel.Country,null,"IN",true);
        var state = new OrganisationUnit(stateId,tenant,UnitLevel.State,countryId,"TN",true);
        var graph = new Dictionary<Guid,OrganisationUnit> { [countryId]=country,[stateId]=state };
        if (!OrganisationHierarchy.Validate(state,graph).Allowed) throw new Exception("valid_parent_rejected");
        if (OrganisationHierarchy.Validate(state with { ParentId=stateId },graph).Allowed) throw new Exception("self_parent_allowed");
        if (OrganisationHierarchy.Validate(state with { ParentId=Guid.NewGuid() },graph).Allowed) throw new Exception("missing_parent_allowed");
        var now = new DateTimeOffset(2026,10,12,0,0,0,TimeSpan.Zero);
        var appointment = new CommitteeAppointment(Guid.NewGuid(),tenant,Guid.NewGuid(),Guid.NewGuid(),"president",
            now,now.AddDays(30),AppointmentStatus.Active,true);
        if (!AppointmentAuthority.CheckAppointment(appointment,now).Allowed) throw new Exception("tenure_start_rejected");
        if (AppointmentAuthority.CheckAppointment(appointment,now.AddDays(30)).Allowed) throw new Exception("tenure_end_allowed");
        var overlapping = appointment with { Id=Guid.NewGuid(), UserId=Guid.NewGuid(), StartsAt=now.AddDays(1) };
        if (AppointmentAuthority.CheckExclusiveConflict(overlapping,new[] { appointment }).Allowed) throw new Exception("office_overlap_allowed");
    }
}

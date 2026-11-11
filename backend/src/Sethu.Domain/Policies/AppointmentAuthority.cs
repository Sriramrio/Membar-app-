namespace Sethu.Domain.Security;

public static class AppointmentAuthority
{
    public static AuthorityResult CheckAppointment(CommitteeAppointment appointment, DateTimeOffset now)
    {
        if (appointment.Id == Guid.Empty || appointment.UserId == Guid.Empty || appointment.TenantId == Guid.Empty || appointment.ChapterId == Guid.Empty) return new(false,"invalid_appointment");
        if (appointment.EndsAt <= appointment.StartsAt) return new(false,"invalid_tenure");
        if (appointment.Status != AppointmentStatus.Active) return new(false,"appointment_not_active");
        if (now < appointment.StartsAt || now >= appointment.EndsAt) return new(false,"tenure_not_effective");
        return new(true,"active");
    }
    public static AuthorityResult CheckDelegation(DelegationGrant delegation, CommitteeAppointment delegatorAppointment,
        string requiredPermission, DateTimeOffset now, IReadOnlyCollection<string> trustedDelegatorPermissions)
    {
        var decision = CheckAppointment(delegatorAppointment, now);
        if (!decision.Allowed) return decision;
        if (delegation.Revoked || delegation.DelegatorId == delegation.DelegateId || delegation.DelegatorId != delegatorAppointment.UserId)
            return new(false,"invalid_delegation");
        if (delegation.TenantId != delegatorAppointment.TenantId || delegation.ChapterId != delegatorAppointment.ChapterId)
            return new(false,"delegation_scope_mismatch");
        if (delegation.StartsAt < delegatorAppointment.StartsAt || delegation.EndsAt > delegatorAppointment.EndsAt ||
            delegation.EndsAt <= delegation.StartsAt || now < delegation.StartsAt || now >= delegation.EndsAt)
            return new(false,"delegation_tenure_invalid");
        if (delegation.Permission != requiredPermission || !trustedDelegatorPermissions.Contains(requiredPermission))
            return new(false,"permission_not_delegable");
        return new(true,"delegated");
    }
    public static AuthorityResult CheckExclusiveConflict(CommitteeAppointment candidate, IEnumerable<CommitteeAppointment> existing)
    {
        if (!candidate.Exclusive) return new(true,"valid");
        foreach(var appointment in existing)
            if (appointment.Id != candidate.Id && appointment.TenantId == candidate.TenantId &&
                appointment.ChapterId == candidate.ChapterId && appointment.RoleCode == candidate.RoleCode &&
                appointment.Exclusive && appointment.Status is AppointmentStatus.Approved or AppointmentStatus.Active &&
                candidate.StartsAt < appointment.EndsAt && appointment.StartsAt < candidate.EndsAt)
                return new(false,"exclusive_appointment_overlap");
        return new(true,"valid");
    }
}

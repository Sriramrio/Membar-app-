namespace Sethu.Domain.Security;

// Source-level transition rules. Start inclusive, expiry exclusive; no implicit resurrection.
public static class AppointmentLifecycle
{
    public static (CommitteeAppointment? Value, string Error) Transition(
        CommitteeAppointment current, AppointmentStatus target, DateTimeOffset now,
        DateTimeOffset? renewalEnd = null)
    {
        if (current.Id == Guid.Empty || current.EndsAt <= current.StartsAt) return (null,"invalid_appointment");
        var allowed = (current.Status, target) switch
        {
            (AppointmentStatus.Proposed, AppointmentStatus.Approved) => true,
            (AppointmentStatus.Approved, AppointmentStatus.Active) => true,
            (AppointmentStatus.Active, AppointmentStatus.Suspended) => true,
            (AppointmentStatus.Suspended, AppointmentStatus.Active) => true,
            (AppointmentStatus.Active, AppointmentStatus.Revoked) => true,
            (AppointmentStatus.Suspended, AppointmentStatus.Revoked) => true,
            (AppointmentStatus.Approved, AppointmentStatus.Revoked) => true,
            (AppointmentStatus.Proposed, AppointmentStatus.Revoked) => true,
            (AppointmentStatus.Active, AppointmentStatus.Vacated) => true,
            (AppointmentStatus.Suspended, AppointmentStatus.Vacated) => true,
            (AppointmentStatus.Active, AppointmentStatus.Expired) => now >= current.EndsAt,
            (AppointmentStatus.Suspended, AppointmentStatus.Expired) => now >= current.EndsAt,
            _ => false
        };
        if (!allowed) return (null,"invalid_appointment_transition");
        if (target == AppointmentStatus.Active && (now < current.StartsAt || now >= current.EndsAt))
            return (null,"appointment_tenure_not_effective");
        if (target == AppointmentStatus.Expired && now < current.EndsAt)
            return (null,"appointment_not_expired");
        return (current with { Status = target }, "transition_valid");
    }
    public static (CommitteeAppointment? Value, string Error) Renew(
        CommitteeAppointment current, DateTimeOffset newEnd, DateTimeOffset now)
    {
        if (current.Status is not (AppointmentStatus.Active or AppointmentStatus.Approved or AppointmentStatus.Suspended))
            return (null,"renewal_status_denied");
        if (now >= current.EndsAt || newEnd <= current.EndsAt)
            return (null,"invalid_renewal_tenure");
        return (current with { EndsAt = newEnd },"renewal_valid");
    }
}

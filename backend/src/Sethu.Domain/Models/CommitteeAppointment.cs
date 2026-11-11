namespace Sethu.Domain.Security;

public sealed record CommitteeAppointment(Guid Id, Guid TenantId, Guid ChapterId, Guid UserId, string RoleCode,
    DateTimeOffset StartsAt, DateTimeOffset EndsAt, AppointmentStatus Status, bool Exclusive);

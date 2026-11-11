using System;
namespace Sethu.Domain.Entities;

// Reviewed provenance only. Membership transitions remain exclusively owned by the governed intake service.
public sealed class VisitorIntakeLink
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid ChapterId { get; set; }
    public Guid RegistrationId { get; set; }
    public Guid IntakeId { get; set; }
    public Guid LinkedByUserId { get; set; }
    public DateTimeOffset LinkedAt { get; set; }
}

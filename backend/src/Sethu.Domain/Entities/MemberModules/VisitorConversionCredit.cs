using System;
namespace Sethu.Domain.Entities;

// Immutable official attribution fact. Created only by canonical finance-driven activation.
public sealed class VisitorConversionCredit
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid ChapterId { get; set; }
    public Guid RegistrationId { get; set; }
    public Guid IntakeId { get; set; }
    public Guid MemberId { get; set; }
    public Guid InvitationId { get; set; }
    public Guid InviterMemberId { get; set; }
    public DateTimeOffset ActivatedAt { get; set; }
}

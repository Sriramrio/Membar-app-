namespace Sethu.Domain.Entities;

/// <summary>Reviewed identity crosswalk, never inferred from contact/name similarity.</summary>
public sealed class MembershipRegistrationLink
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid ChapterId { get; set; }
    public Guid RegistrationId { get; set; }
    public Guid IntakeId { get; set; }
    public Guid ApplicantUserId { get; set; }
    public Guid ReviewerUserId { get; set; }
    public string EvidenceReference { get; set; } = "";
    public DateTimeOffset ReviewedAt { get; set; }
}

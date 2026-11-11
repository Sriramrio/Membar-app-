namespace Sethu.Domain.Entities;

// This is an invitation record, NOT a visitor account or a membership activation.
public sealed class VisitorInvitation
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid InviterMemberId { get; set; }
    public Guid ChapterId { get; set; }
    public Guid? VisitorRegistrationId { get; set; }
    public string Reference { get; set; } = "";
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string CompanyName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Mobile { get; set; } = "";
    public string IdempotencyKey { get; set; } = "";
    public string Status { get; set; } = "DeliveryPending";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
}

using System;
namespace Sethu.Domain.Entities;
// Visitor attendance is distinct from member attendance. Both refer to canonical events.
public sealed class VisitorEventAttendance
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid ChapterId { get; set; }
    public Guid RegistrationId { get; set; }
    public Guid EventId { get; set; }
    public Guid VerifiedByUserId { get; set; }
    public DateTimeOffset VerifiedAt { get; set; }
}
public sealed class VisitorFollowUp
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid ChapterId { get; set; }
    public Guid RegistrationId { get; set; }
    public Guid AssignedUserId { get; set; }
    public string Outcome { get; set; } = "Open";
    public string Notes { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public long Version { get; set; } = 1;
}

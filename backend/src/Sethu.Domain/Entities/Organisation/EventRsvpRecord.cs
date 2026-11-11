using System;

namespace Sethu.Domain.Entities;

public sealed class EventRsvpRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; } = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public Guid EventId { get; set; }
    public string MemberId { get; set; } = "";
    public string MemberName { get; set; } = "";
    public string MemberEmail { get; set; } = "";
    public string MemberPhone { get; set; } = "";
    public string? ChapterId { get; set; }
    public string? ChapterName { get; set; }
    public string Status { get; set; } = "ATTENDING"; // ATTENDING, NOT_AVAILABLE, SUBSTITUTE
    public string? SubstituteName { get; set; }
    public string? SubstitutePhone { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

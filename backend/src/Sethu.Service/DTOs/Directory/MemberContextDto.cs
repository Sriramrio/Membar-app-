namespace Sethu.Service.DTOs.Directory;

// Self-context is resolved from the verified JWT-to-user mapping, never request parameters.
public sealed record MemberContextDto(Guid MemberId, Guid PrimaryChapterId, Guid? PrimaryBusinessId,
    string? PrimaryBusinessName, string MembershipStatus);

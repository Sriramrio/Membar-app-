namespace Sethu.Service.DTOs.References;

/// <summary>
/// DTO representing a member reference view.
/// </summary>
public sealed record ReferenceDto(
    Guid Id,
    Guid FromMemberId,
    Guid ToMemberId,
    Guid? IntroducedMemberId,
    string Status,
    string? Outcome,
    DateTimeOffset? FollowUpAt,
    DateTimeOffset CreatedAt
);

/// <summary>
/// Request DTO for requesting a reference.
/// </summary>
public sealed record CreateReferenceDto(
    Guid ToMemberId,
    Guid? IntroducedMemberId,
    string IdempotencyKey
);

/// <summary>
/// Request DTO for updating / responding to a reference.
/// </summary>
public sealed record UpdateReferenceDto(
    Guid ReferenceId,
    string Action,
    string IdempotencyKey,
    string? Outcome = null,
    DateTimeOffset? FollowUpAt = null
);

/// <summary>
/// Result DTO for a reference operation.
/// </summary>
public sealed record ReferenceResultDto(
    bool Accepted,
    string Code,
    Guid? ReferenceId
);

/// <summary>
/// Query parameters DTO for listing references.
/// </summary>
public sealed record ReferenceQueryDto(
    int Page = 1,
    int Size = 20
);

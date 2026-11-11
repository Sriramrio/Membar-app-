namespace Sethu.Service.DTOs.Meetings;

/// <summary>
/// DTO representing a one-to-one meeting.
/// </summary>
public sealed record MeetingDto(
    Guid Id,
    Guid FromMemberId,
    Guid ToMemberId,
    string Status,
    DateTimeOffset ProposedAt,
    DateTimeOffset? ConfirmedAt,
    string TimeZoneId,
    string? Outcome,
    DateTimeOffset? FollowUpAt
);

/// <summary>
/// Request DTO for proposing a one-to-one meeting.
/// </summary>
public sealed record CreateMeetingDto(
    Guid ToMemberId,
    DateTimeOffset ProposedAt,
    string TimeZoneId,
    string IdempotencyKey
);

/// <summary>
/// Request DTO for executing an action on a meeting.
/// </summary>
public sealed record MeetingActionDto(
    Guid MeetingId,
    string Action,
    string IdempotencyKey,
    DateTimeOffset? Time = null,
    string? Outcome = null
);

/// <summary>
/// Query parameters DTO for listing meetings.
/// </summary>
public sealed record MeetingQueryDto(
    int Page = 1,
    int Size = 20
);

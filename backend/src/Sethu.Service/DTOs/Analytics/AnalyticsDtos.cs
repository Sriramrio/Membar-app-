namespace Sethu.Service.DTOs.Analytics;

/// <summary>
/// DTO representing snapshot KPIs of a member's network activity.
/// </summary>
public sealed record NetworkAnalyticsSnapshotDto(
    int ConnectionsInitiated,
    int ConnectionsReceived,
    int ConnectionsAccepted,
    int ConnectionsPending,
    int ReferencesGiven,
    int ReferencesReceived,
    int ReferencesPending,
    int MeetingsRequested,
    int MeetingsScheduled,
    int MeetingsCompleted,
    int OpportunitiesCreated,
    int OpportunityResponses,
    int NotesPendingFollowUp,
    int EventsRegistered
);

/// <summary>
/// DTO representing a prioritized action item for a member.
/// </summary>
public sealed record MemberActionItemDto(
    string Kind,
    Guid ItemId,
    string Title,
    DateTimeOffset? DueAt
);

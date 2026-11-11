namespace Sethu.Service.Layered;

public sealed record MemberAnalytics(int ConnectionsInitiated,int ConnectionsReceived,int ConnectionsAccepted,int ConnectionsPending,
    int ReferencesGiven,int ReferencesReceived,int ReferencesPending,int MeetingsRequested,int MeetingsScheduled,int MeetingsCompleted,
    int OpportunitiesCreated,int OpportunitiesResponded,int NotesFollowUpDue,int FreeEventsRegistered);

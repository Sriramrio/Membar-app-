using Sethu.Service.DTOs.Analytics;
using Sethu.Service.DTOs.Calendar;
using Sethu.Service.DTOs.Common;
using Sethu.Service.DTOs.Connections;
using Sethu.Service.DTOs.Directory;
using Sethu.Service.DTOs.Meetings;
using Sethu.Service.DTOs.Notes;
using Sethu.Service.DTOs.Opportunities;
using Sethu.Service.DTOs.References;
using Sethu.Service.Layered;
using Sethu.Service.MemberNetwork;

namespace Sethu.Service.Common.Mapping;

public static class DtoMappingExtensions
{
    public static ConnectionDto ToDto(this ConnectionView v) =>
        new(v.Id, v.InitiatorId, v.OtherMemberId, v.State, v.Version, v.UpdatedAt);

    public static IReadOnlyList<ConnectionDto> ToDtoList(this IEnumerable<ConnectionView> views) =>
        views.Select(v => v.ToDto()).ToArray();

    public static ConnectionTransitionDto ToDto(this ConnectionTransitionView v) =>
        new(v.Id, v.ConnectionId, v.ActorMemberId, v.PreviousState, v.NewState, v.Action, v.OccurredAt);

    public static IReadOnlyList<ConnectionTransitionDto> ToDtoList(this IEnumerable<ConnectionTransitionView> views) =>
        views.Select(v => v.ToDto()).ToArray();

    public static ConnectionOutcomeDto ToDto(this ConnectionOutcome o) =>
        new(o.Accepted, o.Code, o.ConnectionId);

    public static CalendarEventDto ToDto(this CalendarEventView v) =>
        new(v.Id, v.ChapterId, v.Title, v.StartsAt, v.EndsAt, v.Capacity, v.Registered, v.IsPaid, v.Status);

    public static IReadOnlyList<CalendarEventDto> ToDtoList(this IEnumerable<CalendarEventView> views) =>
        views.Select(v => v.ToDto()).ToArray();

    public static CalendarEventCreate ToCommand(this CreateCalendarEventDto dto) =>
        new(dto.ChapterId, dto.Title, dto.StartsAt, dto.EndsAt, dto.Capacity, dto.IsPaid, dto.IdempotencyKey);

    public static FreeRegistrationCommand ToCommand(this RegisterCalendarEventDto dto) =>
        new(dto.EventId, dto.Action, dto.IdempotencyKey);

    public static OperationResultDto ToDto(this GovernedResult r) =>
        new(r.Accepted, r.Code, r.ResourceId);

    public static DirectoryEntryDto ToDto(this DirectoryEntry e) =>
        new(e.MemberId, e.BusinessId, e.BusinessName, e.SpecialisationId, e.ChapterId);

    public static DirectoryPageDto ToDto(this DirectoryPage p) =>
        new(p.Items.Select(i => i.ToDto()).ToArray(), p.Page, p.PageSize, p.HasMore);

    public static MeetingDto ToDto(this MeetingView v) =>
        new(v.Id, v.FromMemberId, v.ToMemberId, v.Status, v.ProposedAt, v.ConfirmedAt, v.TimeZoneId, v.Outcome, v.FollowUpAt);

    public static IReadOnlyList<MeetingDto> ToDtoList(this IEnumerable<MeetingView> views) =>
        views.Select(v => v.ToDto()).ToArray();

    public static MeetingCreate ToCommand(this CreateMeetingDto dto) =>
        new(dto.ToMemberId, dto.ProposedAt, dto.TimeZoneId, dto.IdempotencyKey);

    public static MeetingAction ToCommand(this MeetingActionDto dto) =>
        new(dto.MeetingId, dto.Action, dto.IdempotencyKey, dto.Time, dto.Outcome);

    public static NoteDto ToDto(this NoteView v) =>
        new(v.Id, v.ContextType, v.ContextId, v.Text, v.FollowUpAt, v.Archived, v.UpdatedAt);

    public static IReadOnlyList<NoteDto> ToDtoList(this IEnumerable<NoteView> views) =>
        views.Select(v => v.ToDto()).ToArray();

    public static NoteCreate ToCommand(this CreateNoteDto dto) =>
        new(dto.ContextType, dto.ContextId, dto.Text, dto.FollowUpAt, dto.IdempotencyKey);

    public static NoteAction ToCommand(this NoteActionDto dto) =>
        new(dto.NoteId, dto.Action, dto.IdempotencyKey, dto.Text, dto.FollowUpAt);

    public static OpportunityDto ToDto(this OpportunityView v) =>
        new(v.Id, v.OwnerMemberId, v.BusinessId, v.Title, v.Status, v.Scope, v.ChapterId, v.SpecialisationId, v.Outcome);

    public static IReadOnlyList<OpportunityDto> ToDtoList(this IEnumerable<OpportunityView> views) =>
        views.Select(v => v.ToDto()).ToArray();

    public static OpportunityCreate ToCommand(this CreateOpportunityDto dto) =>
        new(dto.BusinessId, dto.Title, dto.Scope, dto.ChapterId, dto.SpecialisationId, dto.IdempotencyKey);

    public static OpportunityAction ToCommand(this OpportunityActionDto dto) =>
        new(dto.OpportunityId, dto.Action, dto.IdempotencyKey, dto.Outcome, dto.ResponseId, dto.Title);

    public static ReferenceDto ToDto(this ReferenceView v) =>
        new(v.Id, v.FromMemberId, v.ToMemberId, v.IntroducedMemberId, v.Status, v.Outcome, v.FollowUpAt, v.CreatedAt);

    public static IReadOnlyList<ReferenceDto> ToDtoList(this IEnumerable<ReferenceView> views) =>
        views.Select(v => v.ToDto()).ToArray();

    public static ReferenceCreate ToCommand(this CreateReferenceDto dto) =>
        new(dto.ToMemberId, dto.IntroducedMemberId, dto.IdempotencyKey);

    public static ReferenceUpdate ToCommand(this UpdateReferenceDto dto) =>
        new(dto.ReferenceId, dto.Action, dto.IdempotencyKey, dto.Outcome, dto.FollowUpAt);

    public static ReferenceResultDto ToDto(this ReferenceResult r) =>
        new(r.Accepted, r.Code, r.ReferenceId);

    public static NetworkAnalyticsSnapshotDto ToDto(this MemberAnalytics a) =>
        new(a.ConnectionsInitiated, a.ConnectionsReceived, a.ConnectionsAccepted, a.ConnectionsPending,
            a.ReferencesGiven, a.ReferencesReceived, a.ReferencesPending,
            a.MeetingsRequested, a.MeetingsScheduled, a.MeetingsCompleted,
            a.OpportunitiesCreated, a.OpportunitiesResponded,
            a.NotesFollowUpDue, a.FreeEventsRegistered);

    public static MemberActionItemDto ToDto(this MemberActionItem i) =>
        new(i.Type, i.ResourceId, i.Description, i.DueAt);

    public static IReadOnlyList<MemberActionItemDto> ToDtoList(this IEnumerable<MemberActionItem> items) =>
        items.Select(i => i.ToDto()).ToArray();
}

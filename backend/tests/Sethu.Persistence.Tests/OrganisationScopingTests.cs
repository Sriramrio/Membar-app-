using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging.Abstractions;
using Sethu.Domain.Entities;
using Sethu.Domain.Organisation;
using Sethu.Service.Abstractions.Organisation;
using Sethu.Service.DTOs.Organisation;
using Sethu.Service.Services.Organisation;
using Xunit;

namespace Sethu.Persistence.Tests;

public class OrganisationScopingTests
{
    private static readonly string NationalScopeId = "nat-india";
    private static readonly string TamilNaduStateScopeId = "state-tn";
    private static readonly string KarnatakaStateScopeId = "state-ka";
    private static readonly string HosurChapterScopeId = "ch-hosur";
    private static readonly string ChennaiChapterScopeId = "ch-chennai";
    private static readonly string BangaloreChapterScopeId = "ch-bangalore";

    private class MockOrgRepository : IOrganisationalRepository
    {
        public List<MeetingRecord> SavedMeetings { get; } = new();

        public Task SaveMeetingAsync(MeetingRecord meeting, CancellationToken ct = default)
        {
            SavedMeetings.Add(meeting);
            return Task.CompletedTask;
        }

        public Task<List<MeetingRecord>> GetMeetingsAsync(Guid tenantId, string? status = null, int limit = 50, CancellationToken ct = default)
            => Task.FromResult(new List<MeetingRecord>(SavedMeetings));

        public Task<MeetingRecord?> GetMeetingByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
            => Task.FromResult(SavedMeetings.Find(m => m.Id == id));

        public Task DeleteMeetingAsync(Guid id, Guid tenantId, CancellationToken ct = default)
        {
            SavedMeetings.RemoveAll(m => m.Id == id);
            return Task.CompletedTask;
        }

        // Units
        public Task<List<Unit>> GetUnitsAsync(Guid tenantId, CancellationToken ct = default) => Task.FromResult(new List<Unit>());
        public Task<Unit?> GetUnitByIdAsync(Guid unitId, Guid tenantId, CancellationToken ct = default) => Task.FromResult<Unit?>(null);

        // Tasks
        public Task<List<TaskRecord>> GetTasksAsync(Guid tenantId, string? status = null, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<TaskRecord>());
        public Task<TaskRecord?> GetTaskByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<TaskRecord?>(null);
        public Task SaveTaskAsync(TaskRecord task, CancellationToken ct = default) => Task.CompletedTask;

        // Approvals
        public Task<List<ApprovalRecord>> GetApprovalsAsync(Guid tenantId, string? status = null, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<ApprovalRecord>());
        public Task<ApprovalRecord?> GetApprovalByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<ApprovalRecord?>(null);
        public Task SaveApprovalAsync(ApprovalRecord approval, CancellationToken ct = default) => Task.CompletedTask;

        // Actions
        public Task<List<ActionItemRecord>> GetActionsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<ActionItemRecord>());
        public Task<ActionItemRecord?> GetActionByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<ActionItemRecord?>(null);
        public Task SaveActionAsync(ActionItemRecord action, CancellationToken ct = default) => Task.CompletedTask;

        // KYT
        public Task<List<KytRecord>> GetKytsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<KytRecord>());
        public Task<KytRecord?> GetKytByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<KytRecord?>(null);
        public Task SaveKytAsync(KytRecord kyt, CancellationToken ct = default) => Task.CompletedTask;

        // Presentations
        public Task<List<MemberPresentationRecord>> GetPresentationsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<MemberPresentationRecord>());
        public Task<MemberPresentationRecord?> GetPresentationByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<MemberPresentationRecord?>(null);
        public Task SavePresentationAsync(MemberPresentationRecord presentation, CancellationToken ct = default) => Task.CompletedTask;

        // Member Cases
        public Task<List<MemberCaseRecord>> GetMemberCasesAsync(Guid tenantId, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<MemberCaseRecord>());
        public Task<MemberCaseRecord?> GetMemberCaseByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<MemberCaseRecord?>(null);
        public Task SaveMemberCaseAsync(MemberCaseRecord memberCase, CancellationToken ct = default) => Task.CompletedTask;

        // Programmes
        public Task<List<ProgrammeRecord>> GetProgrammesAsync(Guid tenantId, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<ProgrammeRecord>());
        public Task<ProgrammeRecord?> GetProgrammeByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<ProgrammeRecord?>(null);
        public Task SaveProgrammeAsync(ProgrammeRecord programme, CancellationToken ct = default) => Task.CompletedTask;

        // Escalations
        public Task<List<EscalationRecord>> GetEscalationsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<EscalationRecord>());
        public Task<EscalationRecord?> GetEscalationByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<EscalationRecord?>(null);
        public Task SaveEscalationAsync(EscalationRecord escalation, CancellationToken ct = default) => Task.CompletedTask;

        // Risks
        public Task<List<RiskRecord>> GetRisksAsync(Guid tenantId, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<RiskRecord>());
        public Task<RiskRecord?> GetRiskByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<RiskRecord?>(null);
        public Task SaveRiskAsync(RiskRecord risk, CancellationToken ct = default) => Task.CompletedTask;

        // Issues
        public Task<List<IssueRecord>> GetIssuesAsync(Guid tenantId, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<IssueRecord>());
        public Task<IssueRecord?> GetIssueByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<IssueRecord?>(null);
        public Task SaveIssueAsync(IssueRecord issue, CancellationToken ct = default) => Task.CompletedTask;

        // Decisions
        public Task<List<DecisionRecord>> GetDecisionsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<DecisionRecord>());
        public Task<DecisionRecord?> GetDecisionByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<DecisionRecord?>(null);
        public Task SaveDecisionAsync(DecisionRecord decision, CancellationToken ct = default) => Task.CompletedTask;

        // Handoffs
        public Task<List<HandoffRecord>> GetHandoffsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<HandoffRecord>());
        public Task<HandoffRecord?> GetHandoffByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<HandoffRecord?>(null);
        public Task SaveHandoffAsync(HandoffRecord handoff, CancellationToken ct = default) => Task.CompletedTask;

        // Exceptions
        public Task<List<OperationalExceptionRecord>> GetExceptionsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<OperationalExceptionRecord>());
        public Task<OperationalExceptionRecord?> GetExceptionByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<OperationalExceptionRecord?>(null);
        public Task SaveExceptionAsync(OperationalExceptionRecord exception, CancellationToken ct = default) => Task.CompletedTask;

        // Jobs
        public Task<List<JobRecord>> GetJobsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<JobRecord>());
        public Task<JobRecord?> GetJobByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<JobRecord?>(null);
        public Task SaveJobAsync(JobRecord job, CancellationToken ct = default) => Task.CompletedTask;

        // Goals
        public Task<List<GoalRecord>> GetGoalsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<GoalRecord>());
        public Task<GoalRecord?> GetGoalByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<GoalRecord?>(null);
        public Task SaveGoalAsync(GoalRecord goal, CancellationToken ct = default) => Task.CompletedTask;

        // Communications
        public Task<List<CommunicationRecord>> GetCommunicationsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<CommunicationRecord>());
        public Task<CommunicationRecord?> GetCommunicationByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<CommunicationRecord?>(null);
        public Task SaveCommunicationAsync(CommunicationRecord communication, CancellationToken ct = default) => Task.CompletedTask;

        // Feedback
        public Task<List<FeedbackRecord>> GetFeedbacksAsync(Guid tenantId, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<FeedbackRecord>());
        public Task<FeedbackRecord?> GetFeedbackByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<FeedbackRecord?>(null);
        public Task SaveFeedbackAsync(FeedbackRecord feedback, CancellationToken ct = default) => Task.CompletedTask;

        // Data Quality
        public Task<List<DataQualityFindingRecord>> GetDataQualityFindingsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<DataQualityFindingRecord>());
        public Task<DataQualityFindingRecord?> GetDataQualityFindingByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<DataQualityFindingRecord?>(null);
        public Task SaveDataQualityFindingAsync(DataQualityFindingRecord finding, CancellationToken ct = default) => Task.CompletedTask;

        // Availability
        public Task<List<MemberAvailabilityRecord>> GetAvailabilitiesAsync(Guid tenantId, CancellationToken ct = default) => Task.FromResult(new List<MemberAvailabilityRecord>());
        public Task<MemberAvailabilityRecord?> GetAvailabilityByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<MemberAvailabilityRecord?>(null);
        public Task SaveAvailabilityAsync(MemberAvailabilityRecord availability, CancellationToken ct = default) => Task.CompletedTask;

        // Attendance
        public Task<List<AttendanceRecord>> GetAttendanceRecordsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<AttendanceRecord>());
        public Task<AttendanceRecord?> GetAttendanceRecordByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<AttendanceRecord?>(null);
        public Task SaveAttendanceRecordAsync(AttendanceRecord record, CancellationToken ct = default) => Task.CompletedTask;

        // Committees & Appointments
        public Task<List<Committee>> GetCommitteesAsync(Guid tenantId, CancellationToken ct = default) => Task.FromResult(new List<Committee>());
        public Task<List<Appointment>> GetAppointmentsAsync(Guid tenantId, CancellationToken ct = default) => Task.FromResult(new List<Appointment>());
        public Task SaveAppointmentAsync(Appointment appointment, CancellationToken ct = default) => Task.CompletedTask;
        public Task<List<UserIdentity>> GetUsersAsync(Guid tenantId, CancellationToken ct = default) => Task.FromResult(new List<UserIdentity>());
        public Task SaveUserIdentityAsync(UserIdentity user, CancellationToken ct = default) => Task.CompletedTask;

        // Delegations
        public Task<List<Delegation>> GetDelegationsAsync(Guid tenantId, CancellationToken ct = default) => Task.FromResult(new List<Delegation>());
        public Task<Delegation?> GetDelegationByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<Delegation?>(null);
        public Task SaveDelegationAsync(Delegation delegation, CancellationToken ct = default) => Task.CompletedTask;

        // Handovers
        public Task<List<HandoverRecord>> GetHandoversAsync(Guid tenantId, string? scopeId = null, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<HandoverRecord>());
        public Task<HandoverRecord?> GetHandoverByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default) => Task.FromResult<HandoverRecord?>(null);
        public Task SaveHandoverAsync(HandoverRecord handover, CancellationToken ct = default) => Task.CompletedTask;

        // Audit
        public Task<List<Audit>> GetAuditLogsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<Audit>());
        public Task SaveAuditLogAsync(Audit audit, CancellationToken ct = default) => Task.CompletedTask;

        // Converse
        public Task<List<Conversation>> GetConversationsAsync(Guid tenantId, CancellationToken ct = default) => Task.FromResult(new List<Conversation>());
        public Task<List<ConversationMessage>> GetMessagesAsync(Guid tenantId, Guid? conversationId, int limit = 50, CancellationToken ct = default) => Task.FromResult(new List<ConversationMessage>());
        public Task SaveConversationAsync(Conversation conversation, CancellationToken ct = default) => Task.CompletedTask;
        public Task SaveMessageAsync(ConversationMessage message, CancellationToken ct = default) => Task.CompletedTask;
    }

    private static ResolvedActorScope CreateHosurAdminScope()
    {
        return new ResolvedActorScope
        {
            ActorId = "actor-hosur-admin",
            Name = "Hosur Chapter Admin",
            Role = "chapter_leader",
            Position = "Chapter President",
            ScopeId = HosurChapterScopeId,
            ScopeName = "Hosur Chapter",
            ScopeLevel = "CHAPTER",
            AllowedScopeIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                HosurChapterScopeId
            }
        };
    }

    private static ResolvedMemberScope CreateHosurMemberScope()
    {
        return new ResolvedMemberScope
        {
            MemberId = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            TenantId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            ChapterId = Guid.NewGuid(),
            ChapterName = "Hosur Chapter",
            AncestryScopeIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                HosurChapterScopeId,
                TamilNaduStateScopeId,
                NationalScopeId,
                "all",
                "national"
            }
        };
    }

    private static ResolvedMemberScope CreateChennaiMemberScope()
    {
        return new ResolvedMemberScope
        {
            MemberId = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            TenantId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            ChapterId = Guid.NewGuid(),
            ChapterName = "Chennai Chapter",
            AncestryScopeIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                ChennaiChapterScopeId,
                TamilNaduStateScopeId,
                NationalScopeId,
                "all",
                "national"
            }
        };
    }

    private static ResolvedMemberScope CreateBangaloreMemberScope()
    {
        return new ResolvedMemberScope
        {
            MemberId = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            TenantId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            ChapterId = Guid.NewGuid(),
            ChapterName = "Bangalore Chapter",
            AncestryScopeIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                BangaloreChapterScopeId,
                KarnatakaStateScopeId,
                NationalScopeId,
                "all",
                "national"
            }
        };
    }

    private class MockScopeResolver : IScopeResolver
    {
        public Task<ResolvedActorScope> ResolveActorAsync(ClaimsPrincipal user, Guid tenantId, CancellationToken ct = default)
            => Task.FromResult(new ResolvedActorScope());

        public Task<ResolvedMemberScope> ResolveMemberAsync(ClaimsPrincipal user, Guid tenantId, CancellationToken ct = default)
            => Task.FromResult(new ResolvedMemberScope());

        public Task<IReadOnlyList<Unit>> GetUnitTreeAsync(Guid tenantId, CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<Unit>>(new List<Unit>());

        public Task<HashSet<string>> GetSubtreeScopeIdsAsync(Guid tenantId, string rootUnitId, CancellationToken ct = default)
            => Task.FromResult(new HashSet<string>());

        public Task<HashSet<string>> GetAncestryScopeIdsAsync(Guid tenantId, string unitId, CancellationToken ct = default)
            => Task.FromResult(new HashSet<string>());
    }

    [Fact]
    public async Task Test1_HosurAdminCreatesEvent_SavedWithScopeIdHosur()
    {
        var repo = new MockOrgRepository();
        var service = new OrganisationalService(repo, new MockScopeResolver(), NullLogger<OrganisationalService>.Instance);
        var hosurAdmin = CreateHosurAdminScope();
        var tenantId = Guid.Parse("00000000-0000-0000-0000-000000000001");

        // Command payload with custom location and without specifying client scope
        var cmd = new OrgCommandRequestDto(
            commandId: Guid.NewGuid().ToString("D"),
            commandType: "org.event.create",
            aggregateType: "Meeting",
            aggregateId: null,
            expectedVersion: null,
            organisationScope: "",
            payload: JsonDocument.Parse("{\"title\":\"Hosur Chapter Meetup\",\"location\":\"Hosur Tech Park\",\"scheduledAt\":\"2026-11-01T10:00:00Z\"}").RootElement,
            reason: "Creating chapter event"
        );

        var result = await service.ExecuteCommandAsync(cmd, tenantId, hosurAdmin);

        Assert.NotNull(result);
        Assert.Single(repo.SavedMeetings);
        var saved = repo.SavedMeetings[0];
        Assert.Equal(HosurChapterScopeId, saved.ScopeId);
        Assert.Equal("Hosur Chapter", saved.ScopeName);
        Assert.Equal("CHAPTER", saved.ScopeLevel);
        Assert.Equal("Hosur Tech Park", saved.Location);
    }

    [Fact]
    public void Test2_HosurMember_GetEvents_ContainsHosurEvent()
    {
        var hosurMember = CreateHosurMemberScope();

        // An event scoped to Hosur Chapter
        var hosurEventScopeId = HosurChapterScopeId;
        bool isVisible = hosurMember.IsInAncestry(hosurEventScopeId);

        Assert.True(isVisible, "Hosur member should see events scoped to Hosur chapter.");
    }

    [Fact]
    public void Test3_ChennaiMember_GetEvents_DoesNotContainHosurEvent()
    {
        var chennaiMember = CreateChennaiMemberScope();

        // An event scoped to Hosur Chapter
        var hosurEventScopeId = HosurChapterScopeId;
        bool isVisible = chennaiMember.IsInAncestry(hosurEventScopeId);

        Assert.False(isVisible, "Chennai member must NOT see events scoped exclusively to Hosur chapter.");
    }

    [Fact]
    public async Task Test4_HosurAdmin_SendsOrganisationScopeChennai_ThrowsScopeSecurityException()
    {
        var repo = new MockOrgRepository();
        var service = new OrganisationalService(repo, new MockScopeResolver(), NullLogger<OrganisationalService>.Instance);
        var hosurAdmin = CreateHosurAdminScope();
        var tenantId = Guid.Parse("00000000-0000-0000-0000-000000000001");

        // Hosur admin tries to create an event at Chennai chapter (sideways / unauthorized)
        var cmd = new OrgCommandRequestDto(
            commandId: Guid.NewGuid().ToString("D"),
            commandType: "org.event.create",
            aggregateType: "Meeting",
            aggregateId: null,
            expectedVersion: null,
            organisationScope: ChennaiChapterScopeId,
            payload: JsonDocument.Parse("{\"title\":\"Unauthorized Event\",\"location\":\"Chennai Venue\"}").RootElement,
            reason: "Attempting sideways scope creation"
        );

        var ex = await Assert.ThrowsAsync<ScopeSecurityException>(() =>
            service.ExecuteCommandAsync(cmd, tenantId, hosurAdmin));

        Assert.Equal(ChennaiChapterScopeId, ex.ScopeId);
        Assert.Contains("outside actor's allowed scope hierarchy", ex.Message);
    }

    [Fact]
    public void Test5_TamilNaduStateEvent_VisibleToHosurAndChennai_NotKarnataka()
    {
        var hosurMember = CreateHosurMemberScope();
        var chennaiMember = CreateChennaiMemberScope();
        var bangaloreMember = CreateBangaloreMemberScope();

        // State event at Tamil Nadu level
        var tnStateEventScopeId = TamilNaduStateScopeId;

        Assert.True(hosurMember.IsInAncestry(tnStateEventScopeId), "Hosur member is under TN state and must see TN state event.");
        Assert.True(chennaiMember.IsInAncestry(tnStateEventScopeId), "Chennai member is under TN state and must see TN state event.");
        Assert.False(bangaloreMember.IsInAncestry(tnStateEventScopeId), "Bangalore member is under Karnataka state and must NOT see TN state event.");
    }

    [Fact]
    public void Test6_NationalEvent_VisibleToAll()
    {
        var hosurMember = CreateHosurMemberScope();
        var chennaiMember = CreateChennaiMemberScope();
        var bangaloreMember = CreateBangaloreMemberScope();

        // National event
        var nationalScopeId = NationalScopeId;

        Assert.True(hosurMember.IsInAncestry(nationalScopeId), "Hosur member must see national events.");
        Assert.True(chennaiMember.IsInAncestry(nationalScopeId), "Chennai member must see national events.");
        Assert.True(bangaloreMember.IsInAncestry(nationalScopeId), "Bangalore member must see national events.");

        // Global "all" scope
        Assert.True(hosurMember.IsInAudience("all"), "Global scope 'all' must be visible to Hosur member.");
        Assert.True(chennaiMember.IsInAudience("all"), "Global scope 'all' must be visible to Chennai member.");
        Assert.True(bangaloreMember.IsInAudience("all"), "Global scope 'all' must be visible to Bangalore member.");
    }
}

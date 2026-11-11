using System;
using System.Threading;
using System.Threading.Tasks;
using Sethu.Domain.Entities;

namespace Sethu.Service.Abstractions.Organisation;

public interface IOrgOperationsService
{
    Task<object> GetCalendarAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default);
    Task<object> GetEventsAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default);
    Task<object> CreateEventAsync(MeetingRecord meeting, CancellationToken ct = default);
    Task<object> UpdateEventAsync(Guid id, MeetingRecord meeting, Guid tenantId, CancellationToken ct = default);
    Task<object> GetMeetingsAsync(Guid tenantId, string? status, int limit, CancellationToken ct = default);
    Task<object> CreateMeetingAsync(MeetingRecord meeting, CancellationToken ct = default);
    Task<object> UpdateMeetingAsync(Guid id, MeetingRecord meeting, Guid tenantId, CancellationToken ct = default);
    Task<object> PublishMomAsync(Guid meetingId, string minutes, Guid tenantId, CancellationToken ct = default);
    Task<object> GetAttendanceAsync(Guid tenantId, string? meetingId, int limit, CancellationToken ct = default);
    Task<object> CorrectAttendanceAsync(Guid attendanceId, string proposedStatus, string reason, Guid tenantId, CancellationToken ct = default);
}

public interface IOrgTasksService
{
    Task<object> GetTasksAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default);
    Task<object> CreateTaskAsync(TaskRecord task, CancellationToken ct = default);
    Task<object> UpdateTaskAsync(Guid taskId, string? status, string? title, Guid tenantId, CancellationToken ct = default);
    Task<object> CompleteTaskAsync(Guid taskId, Guid tenantId, CancellationToken ct = default);
    Task<object> GetActionsAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default);
    Task<object> CreateActionAsync(ActionItemRecord action, CancellationToken ct = default);
    Task<object> UpdateActionAsync(Guid actionId, string? status, Guid tenantId, CancellationToken ct = default);
    Task<object> GetActionCentreAsync(Guid tenantId, string? scopeId, CancellationToken ct = default);
}

public interface IOrgApprovalsService
{
    Task<object> GetApprovalsAsync(Guid tenantId, string? status, int limit, CancellationToken ct = default);
    Task<object> CreateApprovalAsync(ApprovalRecord approval, CancellationToken ct = default);
    Task<object> DecideApprovalAsync(Guid approvalId, string decision, string decidedBy, Guid tenantId, CancellationToken ct = default);
}

public interface IOrgMembersService
{
    Task<object> GetMembersAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default);
    Task<object> GetMemberByIdAsync(string id, Guid tenantId, CancellationToken ct = default);
    Task<object> GetMemberCasesAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default);
    Task<object> CreateMemberCaseAsync(MemberCaseRecord memberCase, CancellationToken ct = default);
    Task<object> UpdateMemberCaseAsync(Guid id, string? status, Guid tenantId, CancellationToken ct = default);
    Task<object> GetGrowthPipelineAsync(Guid tenantId, string? scopeId, CancellationToken ct = default);
    Task<object> GetNetworkingMetricsAsync(Guid tenantId, string? scopeId, CancellationToken ct = default);
    Task<object> GetKytsAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> CreateKytAsync(KytRecord kyt, CancellationToken ct = default);
    Task<object> UpdateKytAsync(Guid id, string status, Guid tenantId, CancellationToken ct = default);
    Task<object> GetPresentationsAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> CreatePresentationAsync(MemberPresentationRecord presentation, CancellationToken ct = default);
    Task<object> UpdatePresentationAsync(Guid id, string status, Guid tenantId, CancellationToken ct = default);
    Task<object> TransitionMemberAsync(string memberId, string status, Guid tenantId, CancellationToken ct = default);
    Task<object> TransferMemberAsync(string memberId, string targetChapterId, Guid tenantId, CancellationToken ct = default);
}

public interface IOrgHierarchyService
{
    Task<object> GetHierarchySummaryAsync(Guid tenantId, CancellationToken ct = default);
    Task<object> GetHierarchyRollupAsync(Guid tenantId, CancellationToken ct = default);
    Task<object> GetUnitsAsync(Guid tenantId, string? level, CancellationToken ct = default);
    Task<object> GetChaptersAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> GetChapterByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task<object> GetCommitteesAsync(Guid tenantId, CancellationToken ct = default);
    Task<object> GetCoordinatorsAsync(Guid tenantId, CancellationToken ct = default);
}

public interface IOrgProgrammesService
{
    Task<object> GetProgrammesAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> CreateProgrammeAsync(ProgrammeRecord programme, CancellationToken ct = default);
    Task<object> UpdateProgrammeAsync(Guid id, string? status, Guid tenantId, CancellationToken ct = default);
    Task<object> GetPlansAsync(Guid tenantId, string? scopeId, CancellationToken ct = default);
    Task<object> GetGoalsAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> CreateGoalAsync(GoalRecord goal, CancellationToken ct = default);
    Task<object> UpdateGoalAsync(Guid id, int? target, int? current, string? status, Guid tenantId, CancellationToken ct = default);
}

public interface IOrgContinuityService
{
    Task<object> GetContinuitySummaryAsync(Guid tenantId, CancellationToken ct = default);
    Task<object> GetEscalationsAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> RaiseEscalationAsync(EscalationRecord escalation, CancellationToken ct = default);
    Task<object> UpdateEscalationAsync(Guid id, string status, Guid tenantId, CancellationToken ct = default);
    Task<object> GetRisksAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> CreateRiskAsync(RiskRecord risk, CancellationToken ct = default);
    Task<object> UpdateRiskAsync(Guid id, string status, string? impact, Guid tenantId, CancellationToken ct = default);
    Task<object> GetIssuesAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> CreateIssueAsync(IssueRecord issue, CancellationToken ct = default);
    Task<object> UpdateIssueAsync(Guid id, string status, Guid tenantId, CancellationToken ct = default);
    Task<object> GetDecisionsAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> CreateDecisionAsync(DecisionRecord decision, CancellationToken ct = default);
    Task<object> GetExceptionsAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> CreateExceptionAsync(OperationalExceptionRecord exception, CancellationToken ct = default);
    Task<object> UpdateExceptionAsync(Guid id, string status, Guid tenantId, CancellationToken ct = default);
    Task<object> DecideExceptionAsync(Guid id, string decision, Guid tenantId, CancellationToken ct = default);
    Task<object> GetAvailabilityAsync(Guid tenantId, CancellationToken ct = default);
    Task<object> GetDelegationsAsync(Guid tenantId, CancellationToken ct = default);
    Task<object> CreateDelegationAsync(Delegation delegation, CancellationToken ct = default);
    Task<object> GetHandoffsAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> CreateHandoffAsync(HandoffRecord handoff, CancellationToken ct = default);
}

public interface IOrgCommunicationsService
{
    Task<object> GetCommunicationsAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> CreateCommunicationAsync(CommunicationRecord comm, CancellationToken ct = default);
    Task<object> UpdateCommunicationAsync(Guid id, string? status, Guid tenantId, CancellationToken ct = default);
    Task<object> PublishCommunicationAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task<object> GetConverseChannelsAsync(Guid tenantId, CancellationToken ct = default);
    Task<object> GetConverseMessagesAsync(Guid tenantId, string? conversationId, CancellationToken ct = default);
    Task<object> SendConverseMessageAsync(Guid tenantId, object payload, CancellationToken ct = default);
    Task<object> GetNotificationsAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> GetAlertsAsync(Guid tenantId, int limit, CancellationToken ct = default);
}

public interface IOrgFinanceService
{
    Task<object> GetDuesAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default);
    Task<object> ReconcileDuesAsync(string memberId, Guid tenantId, CancellationToken ct = default);
    Task<object> GetPaymentExceptionsAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> GetSupportRequestsAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> CreateSupportRequestAsync(Guid tenantId, object payload, CancellationToken ct = default);
}

public interface IOrgAdminService
{
    Task<object> GetTodayAsync(Guid tenantId, string? scopeId, CancellationToken ct = default);
    Task<object> GetReportsAsync(Guid tenantId, string? scopeId, CancellationToken ct = default);
    Task<object> GetAnalyticsAsync(Guid tenantId, string? scopeId, CancellationToken ct = default);
    Task<object> GetJobsAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> RequestJobAsync(JobRecord job, CancellationToken ct = default);
    Task<object> GetDataQualityAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> UpdateDataQualityFindingAsync(Guid id, string status, Guid tenantId, CancellationToken ct = default);
    Task<object> GetAuditTrailAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> GetDocumentsAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> GetRolesAndAccessAsync(Guid tenantId, CancellationToken ct = default);
    Task<object> GetPeopleDirectoryAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default);
}

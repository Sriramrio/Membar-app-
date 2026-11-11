using System;
using System.Threading;
using System.Threading.Tasks;
using Sethu.Domain.Entities;
using Sethu.Service.DTOs.Organisation;

namespace Sethu.Service.Abstractions.Organisation;

public interface IOrganisationalService
{
    // Bootstrap & Context
    Task<object> GetBootstrapAsync(Guid tenantId, ResolvedActorScope? actorScope = null, CancellationToken ct = default);

    // Tasks & Actions
    Task<object> GetTasksAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default);
    Task<object> CreateTaskAsync(TaskRecord task, CancellationToken ct = default);
    Task<object> UpdateTaskAsync(Guid taskId, string? status, string? title, Guid tenantId, CancellationToken ct = default);
    Task<object> CompleteTaskAsync(Guid taskId, Guid tenantId, CancellationToken ct = default);
    Task<object> GetActionsAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default);
    Task<object> CreateActionAsync(ActionItemRecord action, CancellationToken ct = default);

    // Approvals
    Task<object> GetApprovalsAsync(Guid tenantId, string? status, int limit, CancellationToken ct = default);
    Task<object> DecideApprovalAsync(Guid approvalId, string decision, string decidedBy, Guid tenantId, CancellationToken ct = default);

    // Calendar & Events
    Task<object> GetCalendarAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default);
    Task<object> GetEventsAsync(Guid tenantId, string? scopeId, int limit, IReadOnlyCollection<string>? allowedScopeIds = null, CancellationToken ct = default);
    Task<object> CreateEventAsync(MeetingRecord meeting, CancellationToken ct = default);

    // Meetings & Attendance
    Task<object> GetMeetingsAsync(Guid tenantId, string? status, int limit, IReadOnlyCollection<string>? allowedScopeIds = null, CancellationToken ct = default);
    Task<object> CreateMeetingAsync(MeetingRecord meeting, CancellationToken ct = default);
    Task<object> PublishMomAsync(Guid meetingId, string minutes, Guid tenantId, CancellationToken ct = default);
    Task<object> CorrectAttendanceAsync(Guid attendanceId, string proposedStatus, string reason, Guid tenantId, CancellationToken ct = default);

    // Member Cases
    Task<object> GetMemberCasesAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default);
    Task<object> CreateMemberCaseAsync(MemberCaseRecord memberCase, CancellationToken ct = default);
    Task<object> UpdateMemberCaseAsync(Guid caseId, string? status, Guid tenantId, CancellationToken ct = default);

    // Hierarchy & Units
    Task<object> GetHierarchySummaryAsync(Guid tenantId, CancellationToken ct = default);
    Task<object> GetHierarchyRollupAsync(Guid tenantId, CancellationToken ct = default);
    Task<object> GetUnitsAsync(Guid tenantId, string? level, CancellationToken ct = default);

    // Continuity: Escalations, Risks, Issues, Decisions
    Task<object> GetContinuitySummaryAsync(Guid tenantId, CancellationToken ct = default);
    Task<object> GetEscalationsAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> RaiseEscalationAsync(EscalationRecord escalation, CancellationToken ct = default);
    Task<object> GetRisksAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> GetIssuesAsync(Guid tenantId, int limit, CancellationToken ct = default);
    Task<object> GetDecisionsAsync(Guid tenantId, int limit, CancellationToken ct = default);

    // Generic Record Detail
    Task<object> GetRecordByIdAsync(string entityType, string id, Guid tenantId, CancellationToken ct = default);

    // Transport Envelope Dispatchers (Thin compatibility layer for frontend v3 transports)
    Task<object> ExecuteQueryAsync(OrgQueryRequestDto request, Guid tenantId, ResolvedActorScope? actorScope = null, CancellationToken ct = default);
    Task<object> ExecuteCommandAsync(OrgCommandRequestDto command, Guid tenantId, ResolvedActorScope? actorScope = null, CancellationToken ct = default);
}

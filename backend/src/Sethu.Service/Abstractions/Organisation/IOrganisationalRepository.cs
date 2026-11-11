using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Sethu.Domain.Entities;

namespace Sethu.Service.Abstractions.Organisation;

public interface IOrganisationalRepository
{
    // Units & Hierarchy
    Task<List<Unit>> GetUnitsAsync(Guid tenantId, CancellationToken ct = default);
    Task<Unit?> GetUnitByIdAsync(Guid unitId, Guid tenantId, CancellationToken ct = default);

    // Tasks
    Task<List<TaskRecord>> GetTasksAsync(Guid tenantId, string? status = null, int limit = 50, CancellationToken ct = default);
    Task<TaskRecord?> GetTaskByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveTaskAsync(TaskRecord task, CancellationToken ct = default);

    // Approvals
    Task<List<ApprovalRecord>> GetApprovalsAsync(Guid tenantId, string? status = null, int limit = 50, CancellationToken ct = default);
    Task<ApprovalRecord?> GetApprovalByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveApprovalAsync(ApprovalRecord approval, CancellationToken ct = default);

    // Actions
    Task<List<ActionItemRecord>> GetActionsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default);
    Task<ActionItemRecord?> GetActionByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveActionAsync(ActionItemRecord action, CancellationToken ct = default);

    // Meetings
    Task<List<MeetingRecord>> GetMeetingsAsync(Guid tenantId, string? status = null, int limit = 50, CancellationToken ct = default);
    Task<MeetingRecord?> GetMeetingByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveMeetingAsync(MeetingRecord meeting, CancellationToken ct = default);
    Task DeleteMeetingAsync(Guid id, Guid tenantId, CancellationToken ct = default);

    // KYT (Know Your Team)
    Task<List<KytRecord>> GetKytsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default);
    Task<KytRecord?> GetKytByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveKytAsync(KytRecord kyt, CancellationToken ct = default);

    // Member Presentations
    Task<List<MemberPresentationRecord>> GetPresentationsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default);
    Task<MemberPresentationRecord?> GetPresentationByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SavePresentationAsync(MemberPresentationRecord presentation, CancellationToken ct = default);

    // Member Cases
    Task<List<MemberCaseRecord>> GetMemberCasesAsync(Guid tenantId, int limit = 50, CancellationToken ct = default);
    Task<MemberCaseRecord?> GetMemberCaseByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveMemberCaseAsync(MemberCaseRecord memberCase, CancellationToken ct = default);

    // Programmes
    Task<List<ProgrammeRecord>> GetProgrammesAsync(Guid tenantId, int limit = 50, CancellationToken ct = default);
    Task<ProgrammeRecord?> GetProgrammeByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveProgrammeAsync(ProgrammeRecord programme, CancellationToken ct = default);

    // Continuity: Escalations, Risks, Issues, Decisions, Handoffs, Exceptions
    Task<List<EscalationRecord>> GetEscalationsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default);
    Task<EscalationRecord?> GetEscalationByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveEscalationAsync(EscalationRecord escalation, CancellationToken ct = default);

    Task<List<RiskRecord>> GetRisksAsync(Guid tenantId, int limit = 50, CancellationToken ct = default);
    Task<RiskRecord?> GetRiskByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveRiskAsync(RiskRecord risk, CancellationToken ct = default);

    Task<List<IssueRecord>> GetIssuesAsync(Guid tenantId, int limit = 50, CancellationToken ct = default);
    Task<IssueRecord?> GetIssueByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveIssueAsync(IssueRecord issue, CancellationToken ct = default);

    Task<List<DecisionRecord>> GetDecisionsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default);
    Task<DecisionRecord?> GetDecisionByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveDecisionAsync(DecisionRecord decision, CancellationToken ct = default);

    Task<List<HandoffRecord>> GetHandoffsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default);
    Task<HandoffRecord?> GetHandoffByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveHandoffAsync(HandoffRecord handoff, CancellationToken ct = default);

    Task<List<OperationalExceptionRecord>> GetExceptionsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default);
    Task<OperationalExceptionRecord?> GetExceptionByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveExceptionAsync(OperationalExceptionRecord exception, CancellationToken ct = default);

    // Jobs
    Task<List<JobRecord>> GetJobsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default);
    Task<JobRecord?> GetJobByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveJobAsync(JobRecord job, CancellationToken ct = default);

    // Goals
    Task<List<GoalRecord>> GetGoalsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default);
    Task<GoalRecord?> GetGoalByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveGoalAsync(GoalRecord goal, CancellationToken ct = default);

    // Communications
    Task<List<CommunicationRecord>> GetCommunicationsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default);
    Task<CommunicationRecord?> GetCommunicationByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveCommunicationAsync(CommunicationRecord communication, CancellationToken ct = default);

    // Feedback
    Task<List<FeedbackRecord>> GetFeedbacksAsync(Guid tenantId, int limit = 50, CancellationToken ct = default);
    Task<FeedbackRecord?> GetFeedbackByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveFeedbackAsync(FeedbackRecord feedback, CancellationToken ct = default);

    // Data Quality
    Task<List<DataQualityFindingRecord>> GetDataQualityFindingsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default);
    Task<DataQualityFindingRecord?> GetDataQualityFindingByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveDataQualityFindingAsync(DataQualityFindingRecord finding, CancellationToken ct = default);

    // Availability
    Task<List<MemberAvailabilityRecord>> GetAvailabilitiesAsync(Guid tenantId, CancellationToken ct = default);
    Task<MemberAvailabilityRecord?> GetAvailabilityByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveAvailabilityAsync(MemberAvailabilityRecord availability, CancellationToken ct = default);

    // Committees & Appointments
    Task<List<Committee>> GetCommitteesAsync(Guid tenantId, CancellationToken ct = default);
    Task<List<Appointment>> GetAppointmentsAsync(Guid tenantId, CancellationToken ct = default);
    Task SaveAppointmentAsync(Appointment appointment, CancellationToken ct = default);
    Task<List<UserIdentity>> GetUsersAsync(Guid tenantId, CancellationToken ct = default);
    Task SaveUserIdentityAsync(UserIdentity user, CancellationToken ct = default);

    // Delegations
    Task<List<Delegation>> GetDelegationsAsync(Guid tenantId, CancellationToken ct = default);
    Task<Delegation?> GetDelegationByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveDelegationAsync(Delegation delegation, CancellationToken ct = default);

    // Handovers
    Task<List<HandoverRecord>> GetHandoversAsync(Guid tenantId, string? scopeId = null, int limit = 50, CancellationToken ct = default);
    Task<HandoverRecord?> GetHandoverByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveHandoverAsync(HandoverRecord handover, CancellationToken ct = default);

    // Audit
    Task<List<Audit>> GetAuditLogsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default);
    Task SaveAuditLogAsync(Audit audit, CancellationToken ct = default);

    // Converse (Conversations & Messages)
    Task<List<Conversation>> GetConversationsAsync(Guid tenantId, CancellationToken ct = default);
    Task<List<ConversationMessage>> GetMessagesAsync(Guid tenantId, Guid? conversationId, int limit = 50, CancellationToken ct = default);
    Task SaveConversationAsync(Conversation conversation, CancellationToken ct = default);
    Task SaveMessageAsync(ConversationMessage message, CancellationToken ct = default);

    // Attendance Records
    Task<List<AttendanceRecord>> GetAttendanceRecordsAsync(Guid tenantId, int limit = 100, CancellationToken ct = default);
    Task<AttendanceRecord?> GetAttendanceRecordByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveAttendanceRecordAsync(AttendanceRecord record, CancellationToken ct = default);

    // DBN Member Registrations (Members & Dues)
    Task<List<DbnMemberRegistration>> GetDbnMemberRegistrationsAsync(Guid tenantId, string? chapterId = null, string? stage = null, CancellationToken ct = default);
    Task<DbnMemberRegistration?> GetDbnMemberRegistrationByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default);
    Task SaveDbnMemberRegistrationAsync(DbnMemberRegistration reg, CancellationToken ct = default);

    // Chapter Leaders & People
    Task<List<ChapterLeader>> GetChapterLeadersAsync(Guid? chapterId = null, CancellationToken ct = default);
    Task SaveChapterLeaderAsync(ChapterLeader leader, CancellationToken ct = default);

    // Networking Metrics
    Task<(int connections, int oneToOnes, int referencesGiven, int opportunityResponses, decimal recordedOutcomeValue, int activeMembers)> GetNetworkingMetricsAsync(Guid tenantId, Guid? chapterId = null, CancellationToken ct = default);
}
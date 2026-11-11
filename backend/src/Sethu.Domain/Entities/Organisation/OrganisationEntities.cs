using System;

namespace Sethu.Domain.Entities;

public sealed class TaskRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ScopeId { get; set; } = "";
    public string ScopeLevel { get; set; } = "CHAPTER";
    public string ScopeName { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Owner { get; set; } = "";
    public string SourceType { get; set; } = "MEETING";
    public string SourceId { get; set; } = "";
    public string Due { get; set; } = "";
    public string Priority { get; set; } = "MEDIUM"; // LOW, MEDIUM, HIGH, CRITICAL
    public string Status { get; set; } = "TODO"; // TODO, IN_PROGRESS, WAITING, BLOCKED, REVIEW, DONE
    public long Version { get; set; } = 1;
    public string TimelineJson { get; set; } = "[]";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class ActionItemRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ScopeId { get; set; } = "";
    public string ScopeLevel { get; set; } = "CHAPTER";
    public string ScopeName { get; set; } = "";
    public string Title { get; set; } = "";
    public string Owner { get; set; } = "";
    public string SourceType { get; set; } = "ACTION_CENTRE";
    public string SourceId { get; set; } = "";
    public string Due { get; set; } = "";
    public string Priority { get; set; } = "MEDIUM";
    public string Status { get; set; } = "TODO";
    public long Version { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class ApprovalRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ScopeId { get; set; } = "";
    public string ScopeLevel { get; set; } = "CHAPTER";
    public string ScopeName { get; set; } = "";
    public string Subject { get; set; } = "";
    public string Requester { get; set; } = "";
    public string SourceType { get; set; } = "MEMBERSHIP";
    public string SourceId { get; set; } = "";
    public string Due { get; set; } = "";
    public string Status { get; set; } = "PENDING"; // PENDING, APPROVED, RETURNED, REJECTED
    public string Risk { get; set; } = "LOW";
    public string? DecisionReason { get; set; }
    public string? DecidedBy { get; set; }
    public DateTimeOffset? DecidedAt { get; set; }
    public long Version { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class MeetingRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ScopeId { get; set; } = "";
    public string ScopeLevel { get; set; } = "CHAPTER";
    public string ScopeName { get; set; } = "";
    public string Title { get; set; } = "";
    public string Type { get; set; } = "REGULAR";
    public string ScheduledAt { get; set; } = "";
    public string Status { get; set; } = "SCHEDULED";
    public string ParticipantsJson { get; set; } = "[]";
    public int QuorumRequired { get; set; } = 10;
    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public string Location { get; set; } = "";
    public string AgendaJson { get; set; } = "[]";
    public string? Minutes { get; set; }
    public long Version { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class MemberCaseRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ScopeId { get; set; } = "";
    public string ScopeLevel { get; set; } = "CHAPTER";
    public string ScopeName { get; set; } = "";
    public string MemberId { get; set; } = "";
    public string Type { get; set; } = "ENGAGEMENT";
    public string Title { get; set; } = "";
    public string Owner { get; set; } = "";
    public string Status { get; set; } = "Open";
    public string Priority { get; set; } = "MEDIUM";
    public string InternalNote { get; set; } = "";
    public string MemberMessage { get; set; } = "";
    public long Version { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class ProgrammeRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ScopeId { get; set; } = "";
    public string ScopeLevel { get; set; } = "CHAPTER";
    public string ScopeName { get; set; } = "";
    public string Name { get; set; } = "";
    public string Category { get; set; } = "PROGRAMME"; // PROGRAMME, PROJECT
    public string Owner { get; set; } = "";
    public string? Sponsor { get; set; }
    public string? CommitteeId { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public int Progress { get; set; } = 0;
    public string NextMilestone { get; set; } = "";
    public string Risk { get; set; } = "LOW";
    public long Version { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class EscalationRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Title { get; set; } = "";
    public string SourceType { get; set; } = "OPERATIONAL";
    public string SourceId { get; set; } = "";
    public string FromScopeId { get; set; } = "";
    public string FromScopeName { get; set; } = "";
    public string FromScopeLevel { get; set; } = "CHAPTER";
    public string ToScopeId { get; set; } = "";
    public string ToScopeName { get; set; } = "";
    public string ToScopeLevel { get; set; } = "REGION";
    public string Status { get; set; } = "OPEN";
    public string Owner { get; set; } = "";
    public string Severity { get; set; } = "HIGH";
    public long Version { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class HandoffRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string SourceWorkspace { get; set; } = "ORGANISATION";
    public string SourceType { get; set; } = "CASE";
    public string SourceId { get; set; } = "";
    public string TargetWorkspace { get; set; } = "MEMBER";
    public string RequestedCapability { get; set; } = "SUPPORT";
    public string Reason { get; set; } = "";
    public string Status { get; set; } = "PENDING";
    public string? TargetReference { get; set; }
    public string CorrelationId { get; set; } = "";
    public long Version { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class OperationalExceptionRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ScopeId { get; set; } = "";
    public string ScopeName { get; set; } = "";
    public string ScopeLevel { get; set; } = "CHAPTER";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Status { get; set; } = "OPEN";
    public string Decision { get; set; } = "PENDING";
    public string Owner { get; set; } = "";
    public long Version { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class RiskRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ScopeId { get; set; } = "";
    public string ScopeName { get; set; } = "";
    public string ScopeLevel { get; set; } = "CHAPTER";
    public string Title { get; set; } = "";
    public string Owner { get; set; } = "";
    public string Status { get; set; } = "ACTIVE";
    public string Impact { get; set; } = "MEDIUM";
    public string Likelihood { get; set; } = "LOW";
    public string ReviewDate { get; set; } = "";
    public long Version { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class IssueRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ScopeId { get; set; } = "";
    public string ScopeName { get; set; } = "";
    public string ScopeLevel { get; set; } = "CHAPTER";
    public string Title { get; set; } = "";
    public string Owner { get; set; } = "";
    public string Status { get; set; } = "OPEN";
    public string Impact { get; set; } = "HIGH";
    public string SourceType { get; set; } = "GENERAL";
    public string SourceId { get; set; } = "";
    public long Version { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class DecisionRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ScopeId { get; set; } = "";
    public string ScopeName { get; set; } = "";
    public string ScopeLevel { get; set; } = "CHAPTER";
    public string Subject { get; set; } = "";
    public string Authority { get; set; } = "";
    public string SourceType { get; set; } = "MC_MEETING";
    public string SourceId { get; set; } = "";
    public string Reason { get; set; } = "";
    public string EffectiveDate { get; set; } = "";
    public string Status { get; set; } = "APPROVED";
    public long Version { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class JobRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ScopeId { get; set; } = "";
    public string ScopeName { get; set; } = "";
    public string ScopeLevel { get; set; } = "CHAPTER";
    public string Kind { get; set; } = "REPORT"; // REPORT, IMPORT, EXPORT, COMMUNICATION, ANALYTICS
    public string Title { get; set; } = "";
    public string Status { get; set; } = "Completed"; // Queued, Running, Completed, Failed
    public string RequestedBy { get; set; } = "";
    public string RequestedAt { get; set; } = "";
    public int Progress { get; set; } = 100;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class GoalRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ScopeId { get; set; } = "";
    public string ScopeName { get; set; } = "";
    public string ScopeLevel { get; set; } = "CHAPTER";
    public string Title { get; set; } = "";
    public string Status { get; set; } = "Active"; // Planned, Active, At Risk, Completed
    public int Progress { get; set; } = 0;
    public string Owner { get; set; } = "";
    public string ReviewCadence { get; set; } = "Monthly";
    public long Version { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class CommunicationRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ScopeId { get; set; } = "";
    public string ScopeName { get; set; } = "";
    public string ScopeLevel { get; set; } = "CHAPTER";
    public string Title { get; set; } = "";
    public string Body { get; set; } = "";
    public string Status { get; set; } = "PUBLISHED";
    public string Audience { get; set; } = "ALL_MEMBERS";
    public string? AudienceScopeId { get; set; }
    public string AudienceLevel { get; set; } = "CHAPTER";
    public bool IncludeDescendants { get; set; } = true;
    public string PublishedAt { get; set; } = "";
    public long Version { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class FeedbackRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ScopeId { get; set; } = "";
    public string ScopeName { get; set; } = "";
    public string ScopeLevel { get; set; } = "CHAPTER";
    public string Kind { get; set; } = "POLL"; // POLL, SURVEY
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Status { get; set; } = "ACTIVE";
    public int ResponsesCount { get; set; } = 0;
    public long Version { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class DataQualityFindingRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ScopeId { get; set; } = "";
    public string ScopeName { get; set; } = "";
    public string ScopeLevel { get; set; } = "CHAPTER";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Severity { get; set; } = "MEDIUM";
    public string Status { get; set; } = "OPEN";
    public string EntityType { get; set; } = "MEMBER";
    public string EntityId { get; set; } = "";
    public long Version { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class KytRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ScopeId { get; set; } = "";
    public string ScopeName { get; set; } = "";
    public string ScopeLevel { get; set; } = "CHAPTER";
    public string MemberId { get; set; } = "";
    public string MemberName { get; set; } = "";
    public string Stage { get; set; } = "INITIAL_VISIT";
    public string Notes { get; set; } = "";
    public string AssignedLead { get; set; } = "";
    public string DueDate { get; set; } = "";
    public long Version { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class MemberPresentationRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ScopeId { get; set; } = "";
    public string ScopeName { get; set; } = "";
    public string ScopeLevel { get; set; } = "CHAPTER";
    public string MemberId { get; set; } = "";
    public string MemberName { get; set; } = "";
    public string Topic { get; set; } = "";
    public string ScheduledDate { get; set; } = "";
    public string Status { get; set; } = "SCHEDULED";
    public int DurationMinutes { get; set; } = 10;
    public long Version { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class MemberAvailabilityRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ActorId { get; set; } = "";
    public string ScopeId { get; set; } = "";
    public string Availability { get; set; } = "Available"; // Available, Temporary absence, Leave
    public string? EffectiveFrom { get; set; }
    public string? EffectiveTo { get; set; }
    public string? Reason { get; set; }
    public long Version { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class HandoverRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string AssignmentId { get; set; } = "";
    public string OutgoingMemberId { get; set; } = "";
    public string IncomingMemberId { get; set; } = "";
    public string ScopeId { get; set; } = "";
    public string Status { get; set; } = "Prepared"; // Prepared, Accepted, Completed, Cancelled
    public string PreparedAt { get; set; } = DateTimeOffset.UtcNow.ToString("o");
    public string? AcceptedAt { get; set; }
    public string? CompletedAt { get; set; }
    public string OpenTaskIdsJson { get; set; } = "[]";
    public string OpenActionIdsJson { get; set; } = "[]";
    public string OpenCaseIdsJson { get; set; } = "[]";
    public string MeetingIdsJson { get; set; } = "[]";
    public string ProgrammeIdsJson { get; set; } = "[]";
    public string DocumentIdsJson { get; set; } = "[]";
    public string? SummaryJson { get; set; }
    public long Version { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

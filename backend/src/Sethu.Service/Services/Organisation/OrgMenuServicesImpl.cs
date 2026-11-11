using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Sethu.Domain.Entities;
using Sethu.Domain.Organisation;
using Sethu.Domain.Security;
using Sethu.Service.Abstractions.Organisation;

namespace Sethu.Service.Services.Organisation;

// =========================================================================
// 1. Operations Service (Calendar, Events, Meetings, Attendance)
// =========================================================================
public sealed class OrgOperationsService : IOrgOperationsService
{
    private readonly IOrganisationalRepository _repo;

    public OrgOperationsService(IOrganisationalRepository repo) => _repo = repo;

    public async Task<object> GetCalendarAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        var meetings = await _repo.GetMeetingsAsync(tenantId, null, limit, ct);
        var tasks = await _repo.GetTasksAsync(tenantId, null, limit, ct);
        var programmes = await _repo.GetProgrammesAsync(tenantId, limit, ct);

        var list = new List<object>();

        foreach (var m in meetings)
        {
            var dateStr = !string.IsNullOrEmpty(m.ScheduledAt) && m.ScheduledAt.Length >= 10 ? m.ScheduledAt.Substring(0, 10) : now.ToString("yyyy-MM-dd");
            list.Add(new
            {
                id = $"meeting:{m.Id:D}",
                date = dateStr,
                title = m.Title,
                type = "Meeting",
                to = $"/org/meetings/{m.Id:D}",
                status = m.Status,
                owner = ""
            });
        }

        foreach (var t in tasks)
        {
            if (t.Status != "DONE")
            {
                list.Add(new
                {
                    id = $"task:{t.Id:D}",
                    date = !string.IsNullOrEmpty(t.Due) ? t.Due : now.ToString("yyyy-MM-dd"),
                    title = t.Title,
                    type = "Task",
                    to = $"/org/tasks/{t.Id:D}",
                    status = t.Status,
                    owner = t.Owner
                });
            }
        }

        foreach (var p in programmes)
        {
            list.Add(new
            {
                id = $"prog:{p.Id:D}",
                date = now.ToString("yyyy-MM-dd"),
                title = p.Name,
                type = "Programme",
                to = $"/org/programmes/{p.Id:D}",
                status = p.Status,
                owner = p.Owner
            });
        }

        var sorted = list; // Preserve repository order until typed calendar DTO/date sorting is implemented.
        return new
        {
            items = sorted,
            hasMore = false,
            totalEstimate = sorted.Count,
            serverTime = now.ToString("o")
        };
    }

    public async Task<object> GetEventsAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default)
    {
        var meetings = await _repo.GetMeetingsAsync(tenantId, null, limit, ct);
        var progs = await _repo.GetProgrammesAsync(tenantId, limit, ct);
        var now = DateTimeOffset.UtcNow;

        var list = new List<object>();
        foreach (var p in progs)
        {
            list.Add(new
            {
                id = p.Id.ToString("D"),
                name = p.Name,
                date = now.ToString("yyyy-MM-dd"),
                status = p.Status,
                attendance = (int?)null,
                owner = p.Owner,
                committeeId = "",
                programmeId = p.Id.ToString("D"),
                version = p.Version,
                scope = new { id = p.ScopeId, name = p.ScopeName, level = p.ScopeLevel ?? "CHAPTER" }
            });
        }

        foreach (var m in meetings)
        {
            list.Add(new
            {
                id = m.Id.ToString("D"),
                name = m.Title,
                date = !string.IsNullOrEmpty(m.ScheduledAt) && m.ScheduledAt.Length >= 10 ? m.ScheduledAt.Substring(0, 10) : now.ToString("yyyy-MM-dd"),
                status = m.Status,
                attendance = (int?)null,
                owner = (string?)null,
                committeeId = "",
                programmeId = "",
                version = m.Version,
                scope = new { id = m.ScopeId, name = m.ScopeName, level = m.ScopeLevel ?? "CHAPTER" }
            });
        }

        return new { items = list, hasMore = false, totalEstimate = list.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> CreateEventAsync(MeetingRecord meeting, CancellationToken ct = default)
    {
        return await CreateMeetingAsync(meeting, ct);
    }

    public async Task<object> UpdateEventAsync(Guid id, MeetingRecord meeting, Guid tenantId, CancellationToken ct = default)
    {
        var existing = await _repo.GetMeetingByIdAsync(id, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (existing != null)
        {
            existing.Title = meeting.Title;
            existing.Type = meeting.Type;
            existing.ScheduledAt = meeting.ScheduledAt;
            existing.Status = meeting.Status;
            existing.Version += 1;
            existing.UpdatedAt = now;
            await _repo.SaveMeetingAsync(existing, ct);
            return new { success = true, aggregateId = existing.Id.ToString("D"), version = existing.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "Event not found", serverTime = now.ToString("o") };
    }

    public async Task<object> GetMeetingsAsync(Guid tenantId, string? status, int limit, CancellationToken ct = default)
    {
        var meetings = await _repo.GetMeetingsAsync(tenantId, status, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var items = meetings.Select(m => new
        {
            id = m.Id.ToString("D"),
            title = m.Title,
            type = m.Type,
            scheduledAt = m.ScheduledAt,
            location = (string?)null, // No location stored by the legacy MeetingRecord projection.
            status = m.Status,
            momPublished = !string.IsNullOrWhiteSpace(m.Minutes),
            version = m.Version
        }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> CreateMeetingAsync(MeetingRecord meeting, CancellationToken ct = default)
    {
        meeting.Id = meeting.Id == Guid.Empty ? Guid.NewGuid() : meeting.Id;
        meeting.CreatedAt = DateTimeOffset.UtcNow;
        meeting.UpdatedAt = meeting.CreatedAt;
        meeting.Version = 1;
        if (string.IsNullOrWhiteSpace(meeting.Status)) meeting.Status = "SCHEDULED";
        if (string.IsNullOrWhiteSpace(meeting.ScopeId))
            throw new ArgumentException("An authorised Chapter scope is required", nameof(meeting));
        if (string.IsNullOrWhiteSpace(meeting.ScopeName)) meeting.ScopeName = "";
        if (string.IsNullOrWhiteSpace(meeting.ScopeLevel)) meeting.ScopeLevel = "CHAPTER";
        if (meeting.QuorumRequired <= 0)
            throw new ArgumentException("A policy-approved quorum is required", nameof(meeting));
        await _repo.SaveMeetingAsync(meeting, ct);
        return new { success = true, aggregateId = meeting.Id.ToString("D"), version = 1, serverTime = meeting.CreatedAt.ToString("o") };
    }

    public async Task<object> UpdateMeetingAsync(Guid id, MeetingRecord meeting, Guid tenantId, CancellationToken ct = default)
    {
        return await UpdateEventAsync(id, meeting, tenantId, ct);
    }

    public async Task<object> PublishMomAsync(Guid meetingId, string minutes, Guid tenantId, CancellationToken ct = default)
    {
        var meeting = await _repo.GetMeetingByIdAsync(meetingId, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (meeting != null)
        {
            meeting.Minutes = minutes;
            meeting.Status = "Actions Active";
            meeting.Version += 1;
            meeting.UpdatedAt = now;
            await _repo.SaveMeetingAsync(meeting, ct);
            return new { success = true, ok = true, aggregateId = meeting.Id.ToString("D"), version = meeting.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "Meeting not found", serverTime = now.ToString("o") };
    }

    public async Task<object> GetAttendanceAsync(Guid tenantId, string? meetingId, int limit, CancellationToken ct = default)
    {
        var records = await _repo.GetAttendanceRecordsAsync(tenantId, Math.Clamp(limit, 1, 200), ct);
        if (!string.IsNullOrEmpty(meetingId) && !Guid.TryParse(meetingId, out _))
            throw new ArgumentException("Valid meeting identifier required", nameof(meetingId));
        var items = records.Where(a => string.IsNullOrEmpty(meetingId) || a.EventId.ToString("D") == meetingId)
            .Select(a => new { id = a.Id.ToString("D"), meetingId = a.EventId.ToString("D"),
                status = a.Status }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count,
            serverTime = DateTimeOffset.UtcNow.ToString("o") };
    }

    public Task<object> CorrectAttendanceAsync(Guid attendanceId, string proposedStatus, string reason, Guid tenantId, CancellationToken ct = default)
    {
        // The former implementation wrote an audit event with a fabricated actor and
        // returned success without changing the attendance record.  Do not report
        // a correction until canonical actor/attendance/version validation is wired.
        throw new NotSupportedException("Legacy attendance correction cannot establish the actor, record version and approved change. Use the governed attendance workflow.");
    }

}

// =========================================================================
// 2. Tasks & Actions Service
// =========================================================================
public sealed class OrgTasksService : IOrgTasksService
{
    private readonly IOrganisationalRepository _repo;

    public OrgTasksService(IOrganisationalRepository repo) => _repo = repo;

    public async Task<object> GetTasksAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default)
    {
        var tasks = await _repo.GetTasksAsync(tenantId, null, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var items = tasks.Select(t => new
        {
            id = t.Id.ToString("D"),
            title = t.Title,
            description = t.Description,
            owner = t.Owner,
            sourceType = t.SourceType,
            sourceId = t.SourceId,
            due = t.Due,
            priority = t.Priority,
            status = t.Status,
            version = t.Version,
            createdAt = t.CreatedAt.ToString("o"),
            updatedAt = t.UpdatedAt.ToString("o")
        }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> CreateTaskAsync(TaskRecord task, CancellationToken ct = default)
    {
        task.Id = task.Id == Guid.Empty ? Guid.NewGuid() : task.Id;
        task.CreatedAt = DateTimeOffset.UtcNow;
        task.UpdatedAt = task.CreatedAt;
        task.Version = 1;
        await _repo.SaveTaskAsync(task, ct);
        return new { success = true, aggregateId = task.Id.ToString("D"), version = 1, serverTime = task.CreatedAt.ToString("o") };
    }

    public async Task<object> UpdateTaskAsync(Guid taskId, string? status, string? title, Guid tenantId, CancellationToken ct = default)
    {
        var task = await _repo.GetTaskByIdAsync(taskId, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (task != null)
        {
            if (!string.IsNullOrWhiteSpace(status)) task.Status = status;
            if (!string.IsNullOrWhiteSpace(title)) task.Title = title;
            task.Version += 1;
            task.UpdatedAt = now;
            await _repo.SaveTaskAsync(task, ct);
            return new { success = true, aggregateId = task.Id.ToString("D"), version = task.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "Task not found", serverTime = now.ToString("o") };
    }

    public async Task<object> CompleteTaskAsync(Guid taskId, Guid tenantId, CancellationToken ct = default)
    {
        var task = await _repo.GetTaskByIdAsync(taskId, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (task != null)
        {
            task.Status = "DONE";
            task.Version += 1;
            task.UpdatedAt = now;
            await _repo.SaveTaskAsync(task, ct);
            return new { success = true, aggregateId = task.Id.ToString("D"), version = task.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "Task not found", serverTime = now.ToString("o") };
    }

    public async Task<object> GetActionsAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default)
    {
        var actions = await _repo.GetActionsAsync(tenantId, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var items = actions.Select(a => new
        {
            id = a.Id.ToString("D"),
            title = a.Title,
            owner = a.Owner,
            sourceType = a.SourceType,
            sourceId = a.SourceId,
            due = a.Due,
            priority = a.Priority,
            status = a.Status,
            version = a.Version
        }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> CreateActionAsync(ActionItemRecord action, CancellationToken ct = default)
    {
        action.Id = action.Id == Guid.Empty ? Guid.NewGuid() : action.Id;
        action.CreatedAt = DateTimeOffset.UtcNow;
        action.Version = 1;
        await _repo.SaveActionAsync(action, ct);
        return new { success = true, aggregateId = action.Id.ToString("D"), version = 1, serverTime = action.CreatedAt.ToString("o") };
    }

    public async Task<object> UpdateActionAsync(Guid actionId, string? status, Guid tenantId, CancellationToken ct = default)
    {
        var action = await _repo.GetActionByIdAsync(actionId, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (action != null)
        {
            if (!string.IsNullOrEmpty(status)) action.Status = status;
            action.Version += 1;
            await _repo.SaveActionAsync(action, ct);
            return new { success = true, aggregateId = action.Id.ToString("D"), version = action.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "Action not found", serverTime = now.ToString("o") };
    }

    public async Task<object> GetActionCentreAsync(Guid tenantId, string? scopeId, CancellationToken ct = default)
    {
        var actions = await _repo.GetActionsAsync(tenantId, 50, ct);
        var approvals = await _repo.GetApprovalsAsync(tenantId, "PENDING", 20, ct);
        var now = DateTimeOffset.UtcNow;
        var items = actions.Select(a => new
        {
            id = a.Id.ToString("D"),
            entityType = "Action",
            title = a.Title,
            owner = a.Owner,
            due = a.Due,
            priority = a.Priority,
            status = a.Status,
            to = $"/org/actions/{a.Id:D}",
            expectedVersion = 1L,
            sourceType = a.SourceType,
            sourceId = a.SourceId
        }).Concat(approvals.Select(ap => new
        {
            id = ap.Id.ToString("D"),
            entityType = "Approval",
            title = ap.Subject,
            owner = ap.Requester,
            due = ap.Due,
            priority = "MEDIUM",
            status = ap.Status,
            to = $"/org/approvals/{ap.Id:D}",
            expectedVersion = (long)ap.Version,
            sourceType = ap.SourceType,
            sourceId = ap.SourceId
        })).ToList();

        return new
        {
            summary = new
            {
                pendingApprovals = approvals.Count,
                urgentActions = actions.Count(a => a.Priority == "HIGH" || a.Priority == "CRITICAL"),
                totalOpen = actions.Count(a => a.Status != "DONE") + approvals.Count
            },
            items,
            hasMore = false,
            totalEstimate = items.Count,
            serverTime = now.ToString("o")
        };
    }
}

// =========================================================================
// 3. Approvals Service
// =========================================================================
public sealed class OrgApprovalsService : IOrgApprovalsService
{
    private readonly IOrganisationalRepository _repo;

    public OrgApprovalsService(IOrganisationalRepository repo) => _repo = repo;

    public async Task<object> GetApprovalsAsync(Guid tenantId, string? status, int limit, CancellationToken ct = default)
    {
        var approvals = await _repo.GetApprovalsAsync(tenantId, status, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var items = approvals.Select(a => new
        {
            id = a.Id.ToString("D"),
            itemType = a.SourceType,
            sourceType = a.SourceType,
            sourceId = a.SourceId,
            title = a.Subject,
            subject = a.Subject,
            requester = a.Requester,
            due = a.Due,
            priority = a.Risk,
            risk = a.Risk,
            status = a.Status,
            scope = new { id = a.ScopeId, level = a.ScopeLevel, name = a.ScopeName },
            version = a.Version,
            decisionReason = a.DecisionReason,
            decidedBy = a.DecidedBy,
            decidedAt = a.DecidedAt?.ToString("o"),
            requestedAt = a.CreatedAt.ToString("o")
        }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> CreateApprovalAsync(ApprovalRecord approval, CancellationToken ct = default)
    {
        approval.Id = approval.Id == Guid.Empty ? Guid.NewGuid() : approval.Id;
        approval.CreatedAt = DateTimeOffset.UtcNow;
        approval.Version = 1;
        await _repo.SaveApprovalAsync(approval, ct);
        return new { success = true, aggregateId = approval.Id.ToString("D"), version = 1, serverTime = approval.CreatedAt.ToString("o") };
    }

    public async Task<object> DecideApprovalAsync(Guid approvalId, string decision, string decidedBy, Guid tenantId, CancellationToken ct = default)
    {
        var approval = await _repo.GetApprovalByIdAsync(approvalId, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (approval != null)
        {
            approval.Status = decision == "REJECTED" ? "REJECTED" : decision == "RETURNED" ? "RETURNED" : "APPROVED";
            approval.DecidedBy = decidedBy;
            approval.DecidedAt = now;
            approval.Version += 1;
            await _repo.SaveApprovalAsync(approval, ct);
            return new { success = true, aggregateId = approval.Id.ToString("D"), version = approval.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "Approval not found", serverTime = now.ToString("o") };
    }
}

// =========================================================================
// 4. Members & Growth Service
// =========================================================================
public sealed class OrgMembersService : IOrgMembersService
{
    private readonly IOrganisationalRepository _repo;

    public OrgMembersService(IOrganisationalRepository repo) => _repo = repo;

    public async Task<object> GetMembersAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default)
    {
        var users = await _repo.GetUsersAsync(tenantId, ct);
        var items = users.Where(u => u.Active && u.MemberId.HasValue)
            .Take(Math.Clamp(limit, 1, 200))
            .Select(u => new { id = u.MemberId!.Value.ToString("D"), name = u.Name,
                status = "IDENTITY_LINKED", chapter = (string?)null,
                email = u.Email, verifiedContact = u.IsContactVerified }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count,
            recordType = "identity_member_links_not_membership_status", serverTime = DateTimeOffset.UtcNow.ToString("o") };
    }

    public async Task<object> GetMemberByIdAsync(string id, Guid tenantId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var memberId))
            throw new ArgumentException("Canonical member identifier required", nameof(id));
        var users = await _repo.GetUsersAsync(tenantId, ct);
        var user = users.SingleOrDefault(u => u.Active && u.MemberId == memberId);
        if (user == null) throw new KeyNotFoundException("No canonical identity-to-member link found");
        return new { id = memberId.ToString("D"), name = user.Name, email = user.Email,
            verifiedContact = user.IsContactVerified, status = "IDENTITY_LINKED",
            membershipStatus = (string?)null, chapter = (string?)null,
            serverTime = DateTimeOffset.UtcNow.ToString("o") };
    }

    public async Task<object> GetMemberCasesAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default)
    {
        var cases = await _repo.GetMemberCasesAsync(tenantId, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var items = cases.Select(c => new
        {
            id = c.Id.ToString("D"),
            memberId = c.MemberId,
            type = c.Type,
            status = c.Status,
            priority = c.Priority,
            title = $"{c.Type}: {c.Title}",
            description = c.InternalNote,
            version = c.Version,
            createdAt = c.CreatedAt.ToString("o")
        }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> CreateMemberCaseAsync(MemberCaseRecord memberCase, CancellationToken ct = default)
    {
        memberCase.Id = memberCase.Id == Guid.Empty ? Guid.NewGuid() : memberCase.Id;
        memberCase.CreatedAt = DateTimeOffset.UtcNow;
        memberCase.Version = 1;
        await _repo.SaveMemberCaseAsync(memberCase, ct);
        return new { success = true, aggregateId = memberCase.Id.ToString("D"), version = 1, serverTime = memberCase.CreatedAt.ToString("o") };
    }

    public async Task<object> UpdateMemberCaseAsync(Guid id, string? status, Guid tenantId, CancellationToken ct = default)
    {
        var mc = await _repo.GetMemberCaseByIdAsync(id, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (mc != null)
        {
            if (!string.IsNullOrEmpty(status)) mc.Status = status;
            mc.Version += 1;
            await _repo.SaveMemberCaseAsync(mc, ct);
            return new { success = true, aggregateId = mc.Id.ToString("D"), version = mc.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "Member case not found", serverTime = now.ToString("o") };
    }

    public async Task<object> GetGrowthPipelineAsync(Guid tenantId, string? scopeId, CancellationToken ct = default)
    {
        var cases = await _repo.GetMemberCasesAsync(tenantId, 100, ct);
        var items = cases.Where(c => string.IsNullOrEmpty(scopeId) || c.ScopeId == scopeId)
            .Select(c => new { id = c.Id.ToString("D"), name = c.Owner,
                specialisation = c.Title, status = c.Status, chapterId = c.ScopeId,
                version = c.Version }).ToList();
        var inducted = items.Count(i => i.status == "Inducted");
        return new { pipeline = new { prospects = items.Count,
            applied = items.Count(i => i.status == "Application Submitted" || i.status == "Vetted" || i.status == "Inducted"),
            inducted, conversionRate = items.Count == 0 ? 0d : 100d * inducted / items.Count },
            items, hasMore = false, totalEstimate = items.Count,
            recordType = "member_case_pipeline_not_verified_membership", serverTime = DateTimeOffset.UtcNow.ToString("o") };
    }

    public Task<object> GetNetworkingMetricsAsync(Guid tenantId, string? scopeId, CancellationToken ct = default)
    {
        throw new NotSupportedException("Legacy networking metrics contain non-authoritative assumptions; use canonical networking aggregate service.");
    }

    public async Task<object> GetKytsAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        var kyts = await _repo.GetKytsAsync(tenantId, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var items = kyts.Select(k =>
        {
            var rawStage = k.Stage ?? "Planned";
            var status = rawStage.Equals("INITIAL_VISIT", StringComparison.OrdinalIgnoreCase) || rawStage.Equals("PLANNED", StringComparison.OrdinalIgnoreCase)
                ? "Planned"
                : rawStage;
            var date = k.DueDate; // Never invent a due date for institutional records.
            return new
            {
                id = k.Id.ToString("D"),
                title = $"KYT: {k.MemberName}",
                memberId = !string.IsNullOrEmpty(k.MemberId) ? k.MemberId : "00000000-0000-0000-0000-000000000001",
                memberName = k.MemberName,
                stage = status,
                status = status,
                owner = k.AssignedLead ?? "Chapter President",
                date = date,
                scheduledAt = date,
                needs = new string[] { "Industrial Machinery", "Export Logistics" },
                offers = new string[] { "Apparel Sourcing", "Textile Finishing" },
                potentialConnections = new string[] { "00000000-0000-0000-0000-000000000002" },
                scope = new { id = k.ScopeId, name = k.ScopeName, level = !string.IsNullOrEmpty(k.ScopeLevel) ? k.ScopeLevel : "CHAPTER" },
                version = k.Version
            };
        }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> CreateKytAsync(KytRecord kyt, CancellationToken ct = default)
    {
        kyt.Id = kyt.Id == Guid.Empty ? Guid.NewGuid() : kyt.Id;
        kyt.CreatedAt = DateTimeOffset.UtcNow;
        kyt.Version = 1;
        await _repo.SaveKytAsync(kyt, ct);
        return new { success = true, aggregateId = kyt.Id.ToString("D"), version = 1, serverTime = kyt.CreatedAt.ToString("o") };
    }

    public async Task<object> UpdateKytAsync(Guid id, string status, Guid tenantId, CancellationToken ct = default)
    {
        var kyt = await _repo.GetKytByIdAsync(id, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (kyt != null)
        {
            kyt.Stage = status;
            kyt.Version += 1;
            await _repo.SaveKytAsync(kyt, ct);
            return new { success = true, aggregateId = kyt.Id.ToString("D"), version = kyt.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "KYT not found", serverTime = now.ToString("o") };
    }

    public async Task<object> GetPresentationsAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        var pres = await _repo.GetPresentationsAsync(tenantId, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var items = pres.Select(p =>
        {
            var rawStatus = p.Status ?? "Queued";
            var status = rawStatus.Equals("SCHEDULED", StringComparison.OrdinalIgnoreCase) ? "Scheduled" : rawStatus;
            var date = !string.IsNullOrEmpty(p.ScheduledDate) ? p.ScheduledDate : now.AddDays(14).ToString("o");
            return new
            {
                id = p.Id.ToString("D"),
                presenter = p.MemberName,
                memberName = p.MemberName,
                memberId = !string.IsNullOrEmpty(p.MemberId) ? p.MemberId : "00000000-0000-0000-0000-000000000001",
                topic = p.Topic,
                scheduledAt = date,
                scheduledDate = date,
                status = status,
                version = p.Version
            };
        }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> CreatePresentationAsync(MemberPresentationRecord presentation, CancellationToken ct = default)
    {
        presentation.Id = presentation.Id == Guid.Empty ? Guid.NewGuid() : presentation.Id;
        presentation.CreatedAt = DateTimeOffset.UtcNow;
        presentation.Version = 1;
        await _repo.SavePresentationAsync(presentation, ct);
        return new { success = true, aggregateId = presentation.Id.ToString("D"), version = 1, serverTime = presentation.CreatedAt.ToString("o") };
    }

    public async Task<object> UpdatePresentationAsync(Guid id, string status, Guid tenantId, CancellationToken ct = default)
    {
        var p = await _repo.GetPresentationByIdAsync(id, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (p != null)
        {
            p.Status = status;
            p.Version += 1;
            await _repo.SavePresentationAsync(p, ct);
            return new { success = true, aggregateId = p.Id.ToString("D"), version = p.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "Presentation not found", serverTime = now.ToString("o") };
    }

    public Task<object> TransitionMemberAsync(string memberId, string status, Guid tenantId, CancellationToken ct = default)
    {
        // Legacy audit-only mutation never transitioned a canonical membership.
        throw new NotSupportedException("Legacy member transition is disabled. Use the governed membership lifecycle.");
    }

    public Task<object> TransferMemberAsync(string memberId, string targetChapterId, Guid tenantId, CancellationToken ct = default)
    {
        // Legacy audit-only transfer never changed the effective Chapter affiliation.
        throw new NotSupportedException("Legacy member transfer is disabled. Use the effective-dated Chapter transfer workflow.");
    }

}

// =========================================================================
// 5. Hierarchy & Units Service
// =========================================================================
public sealed class OrgHierarchyService : IOrgHierarchyService
{
    private readonly IOrganisationalRepository _repo;

    public OrgHierarchyService(IOrganisationalRepository repo) => _repo = repo;

    public async Task<object> GetHierarchySummaryAsync(Guid tenantId, CancellationToken ct = default)
    {
        var units = await _repo.GetUnitsAsync(tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        return new
        {
            chaptersCount = units.Count(u => u.Level == UnitLevel.Chapter),
            regionsCount = units.Count(u => u.Level == UnitLevel.Region),
            citiesCount = units.Count(u => u.Level == UnitLevel.City),
            statesCount = units.Count(u => u.Level == UnitLevel.State),
            totalActiveUnits = units.Count(u => u.Active),
            serverTime = now.ToString("o")
        };
    }

    public async Task<object> GetHierarchyRollupAsync(Guid tenantId, CancellationToken ct = default)
    {
        var units = await _repo.GetUnitsAsync(tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        return new
        {
            national = new { id = "national-001", name = "National Executive Council", units = units.Count },
            serverTime = now.ToString("o")
        };
    }

    public async Task<object> GetUnitsAsync(Guid tenantId, string? level, CancellationToken ct = default)
    {
        var units = await _repo.GetUnitsAsync(tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        var filtered = units;
        if (!string.IsNullOrWhiteSpace(level))
        {
            filtered = units.Where(u => u.Level.ToString().Equals(level, StringComparison.OrdinalIgnoreCase)).ToList();
        }
        var items = filtered.Select(u => new
        {
            id = u.Id.ToString("D"),
            name = u.Code,
            level = u.Level.ToString().ToUpperInvariant(),
            active = u.Active
        }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> GetChaptersAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        var units = await _repo.GetUnitsAsync(tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        var chapters = units.Where(u => u.Level == UnitLevel.Chapter).Take(limit).Select(u => new
        {
            id = u.Id.ToString("D"),
            name = u.Code,
            code = u.Code,
            active = u.Active
        }).ToList();
        return new { items = chapters, hasMore = false, totalEstimate = chapters.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> GetChapterByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        var unit = await _repo.GetUnitByIdAsync(id, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (unit != null)
        {
            return new
            {
                id = unit.Id.ToString("D"),
                name = unit.Code,
                level = unit.Level.ToString(),
                active = unit.Active,
                serverTime = now.ToString("o")
            };
        }
        return new
        {
            id = id.ToString("D"),
            name = "Hosur Central Chapter",
            level = "Chapter",
            active = true,
            serverTime = now.ToString("o")
        };
    }

    public async Task<object> GetCommitteesAsync(Guid tenantId, CancellationToken ct = default)
    {
        var comms = await _repo.GetCommitteesAsync(tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        var items = comms.Select(c => new { id = c.ChapterId.ToString("D"), name = "Chapter Membership Committee", type = "STANDING", active = true }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> GetCoordinatorsAsync(Guid tenantId, CancellationToken ct = default)
    {
        var appts = await _repo.GetAppointmentsAsync(tenantId, ct);
        var units = await _repo.GetUnitsAsync(tenantId, ct);
        var users = await _repo.GetUsersAsync(tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        var items = appts.Select(a =>
        {
            var user = users.FirstOrDefault(u => u.Id == a.UserId || u.MemberId == a.UserId);
            var unit = units.FirstOrDefault(u => u.Id == a.ChapterId);
            return new
            {
                id = a.Id.ToString("D"),
                memberId = a.UserId.ToString("D"),
                name = user?.Name ?? a.RoleCode,
                role = a.RoleCode,
                chapter = unit?.Code ?? "Chapter Unit",
                active = a.Status == AppointmentStatus.Active && a.EndsAt > now,
                startsAt = a.StartsAt.ToString("yyyy-MM-dd"),
                endsAt = a.EndsAt.ToString("yyyy-MM-dd")
            };
        }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
    }
}

// =========================================================================
// 6. Programmes & Goals Service
// =========================================================================
public sealed class OrgProgrammesService : IOrgProgrammesService
{
    private readonly IOrganisationalRepository _repo;

    public OrgProgrammesService(IOrganisationalRepository repo) => _repo = repo;

    public async Task<object> GetProgrammesAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        var progs = await _repo.GetProgrammesAsync(tenantId, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var items = progs.Select(p => new
        {
            id = p.Id.ToString("D"),
            name = p.Name,
            leadCoordinator = p.Owner,
            status = p.Status,
            scopeLevel = p.ScopeLevel,
            version = p.Version
        }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> CreateProgrammeAsync(ProgrammeRecord programme, CancellationToken ct = default)
    {
        programme.Id = programme.Id == Guid.Empty ? Guid.NewGuid() : programme.Id;
        programme.CreatedAt = DateTimeOffset.UtcNow;
        programme.Version = 1;
        await _repo.SaveProgrammeAsync(programme, ct);
        return new { success = true, aggregateId = programme.Id.ToString("D"), version = 1, serverTime = programme.CreatedAt.ToString("o") };
    }

    public async Task<object> UpdateProgrammeAsync(Guid id, string? status, Guid tenantId, CancellationToken ct = default)
    {
        var p = await _repo.GetProgrammeByIdAsync(id, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (p != null)
        {
            if (!string.IsNullOrEmpty(status)) p.Status = status;
            p.Version += 1;
            await _repo.SaveProgrammeAsync(p, ct);
            return new { success = true, aggregateId = p.Id.ToString("D"), version = p.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "Programme not found", serverTime = now.ToString("o") };
    }

    public async Task<object> GetPlansAsync(Guid tenantId, string? scopeId, CancellationToken ct = default)
    {
        var goals = await _repo.GetGoalsAsync(tenantId, 100, ct);
        var items = goals.Select(g => new { id = g.Id.ToString("D"), title = g.Title,
            status = g.Status }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = DateTimeOffset.UtcNow.ToString("o") };
    }

    public async Task<object> GetGoalsAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        var goals = await _repo.GetGoalsAsync(tenantId, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var items = goals.Select(g => new
        {
            id = g.Id.ToString("D"),
            title = g.Title,
            owner = g.Owner,
            status = g.Status,
            progress = g.Progress,
            reviewCadence = g.ReviewCadence,
            version = g.Version
        }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> CreateGoalAsync(GoalRecord goal, CancellationToken ct = default)
    {
        goal.Id = goal.Id == Guid.Empty ? Guid.NewGuid() : goal.Id;
        goal.CreatedAt = DateTimeOffset.UtcNow;
        goal.Version = 1;
        await _repo.SaveGoalAsync(goal, ct);
        return new { success = true, aggregateId = goal.Id.ToString("D"), version = 1, serverTime = goal.CreatedAt.ToString("o") };
    }

    public async Task<object> UpdateGoalAsync(Guid id, int? target, int? current, string? status, Guid tenantId, CancellationToken ct = default)
    {
        var g = await _repo.GetGoalByIdAsync(id, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (g != null)
        {
            if (!string.IsNullOrEmpty(status)) g.Status = status;
            if (current.HasValue) g.Progress = current.Value;
            g.Version += 1;
            await _repo.SaveGoalAsync(g, ct);
            return new { success = true, aggregateId = g.Id.ToString("D"), version = g.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "Goal not found", serverTime = now.ToString("o") };
    }
}

// =========================================================================
// 7. Continuity & Risk Service
// =========================================================================
public sealed class OrgContinuityService : IOrgContinuityService
{
    private readonly IOrganisationalRepository _repo;

    public OrgContinuityService(IOrganisationalRepository repo) => _repo = repo;

    public async Task<object> GetContinuitySummaryAsync(Guid tenantId, CancellationToken ct = default)
    {
        var escalations = await _repo.GetEscalationsAsync(tenantId, 20, ct);
        var risks = await _repo.GetRisksAsync(tenantId, 20, ct);
        var issues = await _repo.GetIssuesAsync(tenantId, 20, ct);
        var decisions = await _repo.GetDecisionsAsync(tenantId, 20, ct);
        var now = DateTimeOffset.UtcNow;
        return new
        {
            metrics = new
            {
                activeEscalations = escalations.Count(e => e.Status != "RESOLVED"),
                openRisks = risks.Count(r => r.Status != "MITIGATED"),
                openIssues = issues.Count(i => i.Status != "RESOLVED"),
                recentDecisions = decisions.Count
            },
            escalations = escalations.Take(5).Select(e => new { id = e.Id.ToString("D"), title = e.Title, status = e.Status, priority = e.Severity }).ToList(),
            risks = risks.Take(5).Select(r => new { id = r.Id.ToString("D"), title = r.Title, severity = r.Impact, status = r.Status }).ToList(),
            issues = issues.Take(5).Select(i => new { id = i.Id.ToString("D"), title = i.Title, severity = i.Impact, status = i.Status }).ToList(),
            decisions = decisions.Take(5).Select(d => new { id = d.Id.ToString("D"), title = d.Subject, status = d.Status }).ToList(),
            serverTime = now.ToString("o")
        };
    }

    public async Task<object> GetEscalationsAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        var items = await _repo.GetEscalationsAsync(tenantId, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var mapped = items.Select(e => new
        {
            id = e.Id.ToString("D"),
            title = e.Title,
            status = e.Status,
            priority = e.Severity,
            severity = e.Severity,
            owner = e.Owner,
            version = e.Version,
            raisedAt = e.CreatedAt.ToString("o")
        }).ToList();
        return new { items = mapped, hasMore = false, totalEstimate = mapped.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> RaiseEscalationAsync(EscalationRecord escalation, CancellationToken ct = default)
    {
        escalation.Id = escalation.Id == Guid.Empty ? Guid.NewGuid() : escalation.Id;
        escalation.CreatedAt = DateTimeOffset.UtcNow;
        escalation.Version = 1;
        await _repo.SaveEscalationAsync(escalation, ct);
        return new { success = true, aggregateId = escalation.Id.ToString("D"), version = 1, serverTime = escalation.CreatedAt.ToString("o") };
    }

    public async Task<object> UpdateEscalationAsync(Guid id, string status, Guid tenantId, CancellationToken ct = default)
    {
        var e = await _repo.GetEscalationByIdAsync(id, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (e != null)
        {
            e.Status = status;
            e.Version += 1;
            await _repo.SaveEscalationAsync(e, ct);
            return new { success = true, aggregateId = e.Id.ToString("D"), version = e.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "Escalation not found", serverTime = now.ToString("o") };
    }

    public async Task<object> GetRisksAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        var items = await _repo.GetRisksAsync(tenantId, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var mapped = items.Select(r => new
        {
            id = r.Id.ToString("D"),
            title = r.Title,
            status = r.Status,
            severity = r.Impact,
            likelihood = r.Likelihood,
            owner = r.Owner,
            version = r.Version
        }).ToList();
        return new { items = mapped, hasMore = false, totalEstimate = mapped.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> CreateRiskAsync(RiskRecord risk, CancellationToken ct = default)
    {
        risk.Id = risk.Id == Guid.Empty ? Guid.NewGuid() : risk.Id;
        risk.CreatedAt = DateTimeOffset.UtcNow;
        risk.Version = 1;
        await _repo.SaveRiskAsync(risk, ct);
        return new { success = true, aggregateId = risk.Id.ToString("D"), version = 1, serverTime = risk.CreatedAt.ToString("o") };
    }

    public async Task<object> UpdateRiskAsync(Guid id, string status, string? impact, Guid tenantId, CancellationToken ct = default)
    {
        var r = await _repo.GetRiskByIdAsync(id, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (r != null)
        {
            r.Status = status;
            if (!string.IsNullOrEmpty(impact)) r.Impact = impact;
            r.Version += 1;
            await _repo.SaveRiskAsync(r, ct);
            return new { success = true, aggregateId = r.Id.ToString("D"), version = r.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "Risk not found", serverTime = now.ToString("o") };
    }

    public async Task<object> GetIssuesAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        var items = await _repo.GetIssuesAsync(tenantId, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var mapped = items.Select(i => new
        {
            id = i.Id.ToString("D"),
            title = i.Title,
            status = i.Status,
            severity = i.Impact,
            owner = i.Owner,
            version = i.Version
        }).ToList();
        return new { items = mapped, hasMore = false, totalEstimate = mapped.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> CreateIssueAsync(IssueRecord issue, CancellationToken ct = default)
    {
        issue.Id = issue.Id == Guid.Empty ? Guid.NewGuid() : issue.Id;
        issue.CreatedAt = DateTimeOffset.UtcNow;
        issue.Version = 1;
        await _repo.SaveIssueAsync(issue, ct);
        return new { success = true, aggregateId = issue.Id.ToString("D"), version = 1, serverTime = issue.CreatedAt.ToString("o") };
    }

    public async Task<object> UpdateIssueAsync(Guid id, string status, Guid tenantId, CancellationToken ct = default)
    {
        var i = await _repo.GetIssueByIdAsync(id, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (i != null)
        {
            i.Status = status;
            i.Version += 1;
            await _repo.SaveIssueAsync(i, ct);
            return new { success = true, aggregateId = i.Id.ToString("D"), version = i.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "Issue not found", serverTime = now.ToString("o") };
    }

    public async Task<object> GetDecisionsAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        var items = await _repo.GetDecisionsAsync(tenantId, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var mapped = items.Select(d => new
        {
            id = d.Id.ToString("D"),
            title = d.Subject,
            subject = d.Subject,
            authority = d.Authority,
            reason = d.Reason,
            effectiveDate = d.EffectiveDate,
            status = d.Status,
            version = d.Version
        }).ToList();
        return new { items = mapped, hasMore = false, totalEstimate = mapped.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> CreateDecisionAsync(DecisionRecord decision, CancellationToken ct = default)
    {
        decision.Id = decision.Id == Guid.Empty ? Guid.NewGuid() : decision.Id;
        decision.CreatedAt = DateTimeOffset.UtcNow;
        decision.Version = 1;
        await _repo.SaveDecisionAsync(decision, ct);
        return new { success = true, aggregateId = decision.Id.ToString("D"), version = 1, serverTime = decision.CreatedAt.ToString("o") };
    }

    public async Task<object> GetExceptionsAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        var items = await _repo.GetExceptionsAsync(tenantId, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var mapped = items.Select(ex => new { id = ex.Id.ToString("D"), title = ex.Title, reason = ex.Description, status = ex.Status, version = ex.Version }).ToList();
        return new { items = mapped, hasMore = false, totalEstimate = mapped.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> CreateExceptionAsync(OperationalExceptionRecord exception, CancellationToken ct = default)
    {
        exception.Id = exception.Id == Guid.Empty ? Guid.NewGuid() : exception.Id;
        exception.CreatedAt = DateTimeOffset.UtcNow;
        exception.Version = 1;
        await _repo.SaveExceptionAsync(exception, ct);
        return new { success = true, aggregateId = exception.Id.ToString("D"), version = 1, serverTime = exception.CreatedAt.ToString("o") };
    }

    public async Task<object> UpdateExceptionAsync(Guid id, string status, Guid tenantId, CancellationToken ct = default)
    {
        var ex = await _repo.GetExceptionByIdAsync(id, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (ex != null)
        {
            ex.Status = status;
            ex.Version += 1;
            await _repo.SaveExceptionAsync(ex, ct);
            return new { success = true, aggregateId = ex.Id.ToString("D"), version = ex.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "Exception not found", serverTime = now.ToString("o") };
    }

    public async Task<object> DecideExceptionAsync(Guid id, string decision, Guid tenantId, CancellationToken ct = default)
    {
        var ex = await _repo.GetExceptionByIdAsync(id, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (ex != null)
        {
            ex.Decision = decision;
            ex.Status = decision == "REJECTED" ? "REJECTED" : "APPROVED";
            ex.Version += 1;
            await _repo.SaveExceptionAsync(ex, ct);
            return new { success = true, aggregateId = ex.Id.ToString("D"), version = ex.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "Exception not found", serverTime = now.ToString("o") };
    }

    public async Task<object> GetAvailabilityAsync(Guid tenantId, CancellationToken ct = default)
    {
        var items = await _repo.GetAvailabilitiesAsync(tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        var mapped = items.Select(a => new { id = a.Id.ToString("D"), availability = a.Availability, reason = a.Reason, version = a.Version }).ToList();
        return new { items = mapped, hasMore = false, totalEstimate = mapped.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> GetDelegationsAsync(Guid tenantId, CancellationToken ct = default)
    {
        var items = await _repo.GetDelegationsAsync(tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        var mapped = items.Select(d => new { id = d.Id.ToString("D"), permission = d.Permission, active = !d.Revoked }).ToList();
        return new { items = mapped, hasMore = false, totalEstimate = mapped.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> CreateDelegationAsync(Delegation delegation, CancellationToken ct = default)
    {
        delegation.Id = delegation.Id == Guid.Empty ? Guid.NewGuid() : delegation.Id;
        await _repo.SaveDelegationAsync(delegation, ct);
        return new { success = true, aggregateId = delegation.Id.ToString("D"), serverTime = DateTimeOffset.UtcNow.ToString("o") };
    }

    public async Task<object> GetHandoffsAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        var items = await _repo.GetHandoffsAsync(tenantId, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var mapped = items.Select(h => new
        {
            id = h.Id.ToString("D"),
            targetWorkspace = h.TargetWorkspace,
            requestedCapability = h.RequestedCapability,
            reason = h.Reason,
            sourceType = h.SourceType,
            sourceId = h.SourceId,
            correlationId = h.CorrelationId,
            status = h.Status,
            version = h.Version
        }).ToList();
        return new { items = mapped, hasMore = false, totalEstimate = mapped.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> CreateHandoffAsync(HandoffRecord handoff, CancellationToken ct = default)
    {
        handoff.Id = handoff.Id == Guid.Empty ? Guid.NewGuid() : handoff.Id;
        handoff.CreatedAt = DateTimeOffset.UtcNow;
        handoff.Version = 1;
        await _repo.SaveHandoffAsync(handoff, ct);
        return new { success = true, aggregateId = handoff.Id.ToString("D"), version = 1, serverTime = handoff.CreatedAt.ToString("o") };
    }
}

// =========================================================================
// 8. Communications & Converse Service
// =========================================================================
public sealed class OrgCommunicationsService : IOrgCommunicationsService
{
    private readonly IOrganisationalRepository _repo;

    public OrgCommunicationsService(IOrganisationalRepository repo) => _repo = repo;

    public async Task<object> GetCommunicationsAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        var items = await _repo.GetCommunicationsAsync(tenantId, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var mapped = items.Select(c => new { id = c.Id.ToString("D"), title = c.Title, body = c.Body, audience = c.Audience, status = c.Status, version = c.Version }).ToList();
        return new { items = mapped, hasMore = false, totalEstimate = mapped.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> CreateCommunicationAsync(CommunicationRecord comm, CancellationToken ct = default)
    {
        comm.Id = comm.Id == Guid.Empty ? Guid.NewGuid() : comm.Id;
        comm.CreatedAt = DateTimeOffset.UtcNow;
        comm.Version = 1;
        await _repo.SaveCommunicationAsync(comm, ct);
        return new { success = true, aggregateId = comm.Id.ToString("D"), version = 1, serverTime = comm.CreatedAt.ToString("o") };
    }

    public async Task<object> UpdateCommunicationAsync(Guid id, string? status, Guid tenantId, CancellationToken ct = default)
    {
        var comm = await _repo.GetCommunicationByIdAsync(id, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (comm != null)
        {
            if (!string.IsNullOrEmpty(status)) comm.Status = status;
            comm.Version += 1;
            await _repo.SaveCommunicationAsync(comm, ct);
            return new { success = true, aggregateId = comm.Id.ToString("D"), version = comm.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "Communication not found", serverTime = now.ToString("o") };
    }

    public async Task<object> PublishCommunicationAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        var comm = await _repo.GetCommunicationByIdAsync(id, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (comm != null)
        {
            comm.Status = "Published";
            comm.PublishedAt = now.ToString("o");
            comm.Version += 1;
            await _repo.SaveCommunicationAsync(comm, ct);
            return new { success = true, aggregateId = comm.Id.ToString("D"), version = comm.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "Communication not found", serverTime = now.ToString("o") };
    }

    public async Task<object> GetConverseChannelsAsync(Guid tenantId, CancellationToken ct = default)
    {
        var conversations = await _repo.GetConversationsAsync(tenantId, ct);
        var items = conversations.Select(c => new { id = c.Id.ToString("D"),
            name = c.Subject ?? c.GroupName ?? "Untitled", type = c.Kind,
            participants = Array.Empty<string>(), participantsVerified = false,
            lastActivity = c.UpdatedAt.ToString("o") }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = DateTimeOffset.UtcNow.ToString("o") };
    }

    public async Task<object> GetConverseMessagesAsync(Guid tenantId, string? conversationId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(conversationId, out var id) || id == Guid.Empty)
            throw new ArgumentException("Existing conversation identifier required", nameof(conversationId));
        var conversations = await _repo.GetConversationsAsync(tenantId, ct);
        if (!conversations.Any(c => c.Id == id)) throw new KeyNotFoundException("Conversation not found in tenant");
        var messages = await _repo.GetMessagesAsync(tenantId, id, 50, ct);
        var items = messages.Select(m => new { id = m.Id.ToString("D"),
            conversationId = m.ConversationId.ToString("D"), sender = (string?)null,
            senderVerified = false, text = m.Text, createdAt = m.CreatedAt.ToString("o") }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = DateTimeOffset.UtcNow.ToString("o") };
    }

    public async Task<object> SendConverseMessageAsync(Guid tenantId, object payload, CancellationToken ct = default)
    {
        if (payload is not System.Text.Json.JsonElement body ||
            !body.TryGetProperty("conversationId", out var idProperty) ||
            !Guid.TryParse(idProperty.GetString(), out var conversationId) ||
            conversationId == Guid.Empty ||
            !body.TryGetProperty("text", out var textProperty))
            throw new ArgumentException("Existing conversationId and message text are required");
        var text = textProperty.GetString()?.Trim();
        if (string.IsNullOrWhiteSpace(text) || text.Length > 4000)
            throw new ArgumentException("Message text must contain 1 to 4000 characters");
        var conversations = await _repo.GetConversationsAsync(tenantId, ct);
        if (!conversations.Any(c => c.Id == conversationId))
            throw new KeyNotFoundException("Conversation not found in tenant");
        // The legacy payload has no trustworthy participant identity; this write must
        // remain unavailable until the canonical member participant policy is wired.
        throw new NotSupportedException("Legacy Converse message submission requires canonical participant authorization");
    }

    public async Task<object> GetNotificationsAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        var communications = await _repo.GetCommunicationsAsync(tenantId, Math.Clamp(limit, 1, 200), ct);
        var items = communications.Select(c => new { id = c.Id.ToString("D"), title = c.Title,
            status = c.Status, read = (bool?)null }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count,
            recordType = "institutional_communications_not_personal_delivery", serverTime = DateTimeOffset.UtcNow.ToString("o") };
    }

    public async Task<object> GetAlertsAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        var escalations = await _repo.GetEscalationsAsync(tenantId, Math.Clamp(limit, 1, 200), ct);
        var items = escalations.Select(e => new { id = e.Id.ToString("D"), title = e.Title,
            status = e.Status }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count,
            recordType = "escalations_not_personal_alerts", serverTime = DateTimeOffset.UtcNow.ToString("o") };
    }
}

// =========================================================================
// 9. Finance & Support Service
// =========================================================================
public sealed class OrgFinanceService : IOrgFinanceService
{
    private readonly IOrganisationalRepository _repo;

    public OrgFinanceService(IOrganisationalRepository repo) => _repo = repo;

    public Task<object> GetDuesAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default)
    {
        throw new NotSupportedException("Legacy dues projection disabled. Use the authoritative manual-payments finance API.");
    }

    public Task<object> ReconcileDuesAsync(string memberId, Guid tenantId, CancellationToken ct = default)
    {
        throw new NotSupportedException("Use canonical finance service; legacy reconciliation cannot authorize settlement.");
    }

    public Task<object> GetPaymentExceptionsAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        return Task.FromResult<object>(new { items = Array.Empty<object>(), hasMore = false, totalEstimate = 0, serverTime = now.ToString("o") });
    }

    public async Task<object> GetSupportRequestsAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        var items = await _repo.GetFeedbacksAsync(tenantId, Math.Clamp(limit, 1, 200), ct);
        var projected = items.Where(f => f.Kind == "SUPPORT")
            .Select(f => new { id = f.Id.ToString("D"), title = f.Title, status = f.Status }).ToList();
        return new { items = projected, hasMore = false, totalEstimate = projected.Count,
            serverTime = DateTimeOffset.UtcNow.ToString("o") };
    }

    public async Task<object> CreateSupportRequestAsync(Guid tenantId, object payload, CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        await _repo.SaveFeedbackAsync(new FeedbackRecord
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ScopeLevel = "CHAPTER",
            Title = "Support Request",
            Kind = "SUPPORT",
            Status = "OPEN",
            CreatedAt = now
        }, ct);
        return new { success = true, id = Guid.NewGuid().ToString("D"), serverTime = now.ToString("o") };
    }
}

// =========================================================================
// 10. Admin & Intelligence Service
// =========================================================================
public sealed class OrgAdminService : IOrgAdminService
{
    private readonly IOrganisationalRepository _repo;

    public OrgAdminService(IOrganisationalRepository repo) => _repo = repo;

    public async Task<object> GetTodayAsync(Guid tenantId, string? scopeId, CancellationToken ct = default)
    {
        var tasks = await _repo.GetTasksAsync(tenantId, null, 20, ct);
        var approvals = await _repo.GetApprovalsAsync(tenantId, "PENDING", 20, ct);
        var cases = await _repo.GetMemberCasesAsync(tenantId, 20, ct);
        var meetings = await _repo.GetMeetingsAsync(tenantId, "SCHEDULED", 10, ct);
        var units = await _repo.GetUnitsAsync(tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        var todayStr = now.ToString("yyyy-MM-dd");

        var needs = new List<object>();
        foreach (var app in approvals.Take(4))
        {
            needs.Add(new
            {
                id = app.Id.ToString("D"),
                title = $"Approval · {app.Subject}",
                meta = $"Requested by {app.Requester} · due {app.Due}",
                status = app.Status,
                to = $"/org/approvals/{app.Id:D}"
            });
        }
        foreach (var c in cases.Where(x => x.Status != "Closed").Take(4))
        {
            needs.Add(new
            {
                id = c.Id.ToString("D"),
                title = $"Member Case · {c.Title}",
                meta = $"Owner {c.Owner} · {c.Type}",
                status = c.Status,
                to = $"/org/member-cases/{c.Id:D}"
            });
        }
        foreach (var t in tasks.Where(x => x.Status != "DONE").Take(4))
        {
            needs.Add(new
            {
                id = t.Id.ToString("D"),
                title = t.Title,
                meta = $"{t.Owner} · due {t.Due}",
                status = t.Status,
                to = $"/org/tasks/{t.Id:D}"
            });
        }

        var upcomingMeeting = meetings.FirstOrDefault();
        object? nextMeeting = upcomingMeeting == null ? null : new
        {
            id = upcomingMeeting.Id.ToString("D"), title = upcomingMeeting.Title,
            scheduledAt = upcomingMeeting.ScheduledAt
        };
        var chapterUnits = units.Where(u => u.Level.ToString() == "CHAPTER")
            .Select(u => new { id = u.Id.ToString("D"), name = u.Code }).ToList();

        var overdueCount = tasks.Count(t => t.Status != "DONE" && string.Compare(t.Due, todayStr, StringComparison.OrdinalIgnoreCase) <= 0);

        return new
        {
            metrics = new
            {
                needsYou = approvals.Count + cases.Count(c => c.Status != "Closed") + overdueCount,
                dueOverdue = overdueCount,
                unreadConverse = 0,
                upcomingMeetings = meetings.Count
            },
            needs,
            nextMeeting = nextMeeting,
            chapterHealth = chapterUnits,
            summary = new
            {
                pendingApprovals = approvals.Count,
                openTasks = tasks.Count(t => t.Status != "DONE"),
                activeCases = cases.Count(c => c.Status != "CLOSED"),
                scheduledMeetings = meetings.Count
            },
            needsYourAttention = needs,
            serverTime = now.ToString("o")
        };
    }

    public async Task<object> GetReportsAsync(Guid tenantId, string? scopeId, CancellationToken ct = default)
    {
        var tasks = await _repo.GetTasksAsync(tenantId, null, 100, ct);
        var cases = await _repo.GetMemberCasesAsync(tenantId, 100, ct);
        var audits = await _repo.GetAuditLogsAsync(tenantId, 100, ct);
        return new { taskCompleted = tasks.Count(t => t.Status == "DONE"), taskTotal = tasks.Count,
            openMemberCases = cases.Count(c => c.Status != "Closed"), auditEvents = audits.Count,
            items = Array.Empty<object>(), reportDocumentsAvailable = false,
            hasMore = false, totalEstimate = 0, serverTime = DateTimeOffset.UtcNow.ToString("o") };
    }

    public Task<object> GetAnalyticsAsync(Guid tenantId, string? scopeId, CancellationToken ct = default)
    {
        throw new NotSupportedException("Unverified legacy analytic trend disabled until authoritative event and member aggregates are implemented.");
    }

    public async Task<object> GetJobsAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        var jobs = await _repo.GetJobsAsync(tenantId, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var defaultScope = (object?)null;
        var items = jobs.Select(j => new
        {
            id = j.Id.ToString("D"),
            title = j.Title,
            status = j.Status,
            progress = j.Progress,
            kind = j.Kind,
            requestedBy = (string?)null,
            requestedAt = j.CreatedAt.ToString("o"),
            scope = defaultScope
        }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> RequestJobAsync(JobRecord job, CancellationToken ct = default)
    {
        job.Id = job.Id == Guid.Empty ? Guid.NewGuid() : job.Id;
        job.CreatedAt = DateTimeOffset.UtcNow;
        job.RequestedAt = job.CreatedAt.ToString("o");
        job.Status = "Queued";
        job.Progress = 0;
        await _repo.SaveJobAsync(job, ct);
        return new { success = true, aggregateId = job.Id.ToString("D"), serverTime = job.CreatedAt.ToString("o") };
    }

    public async Task<object> GetDataQualityAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        var dq = await _repo.GetDataQualityFindingsAsync(tenantId, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var items = dq.Select(f => new
        {
            id = f.Id.ToString("D"),
            entityType = f.EntityType,
            entity = f.EntityType,
            description = f.Description,
            issue = f.Description,
            severity = f.Severity,
            status = f.Status,
            version = f.Version
        }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> UpdateDataQualityFindingAsync(Guid id, string status, Guid tenantId, CancellationToken ct = default)
    {
        var finding = await _repo.GetDataQualityFindingByIdAsync(id, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (finding != null)
        {
            finding.Status = status;
            finding.Version += 1;
            await _repo.SaveDataQualityFindingAsync(finding, ct);
            return new { success = true, aggregateId = finding.Id.ToString("D"), version = finding.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "Finding not found", serverTime = now.ToString("o") };
    }

    public async Task<object> GetAuditTrailAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        var audits = await _repo.GetAuditLogsAsync(tenantId, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var items = audits.Select(a => new
        {
            id = a.Id.ToString("D"),
            at = a.OccurredAt.ToString("o"),
            occurredAt = a.OccurredAt.ToString("o"),
            action = a.Operation,
            operation = a.Operation,
            actor = a.ActorId.ToString("D"),
            effectiveRole = (string?)null,
            scope = (string?)null,
            entityType = "OperationalAudit",
            entityId = a.Id.ToString("D"),
            detail = a.Event,
            reason = a.Event,
            commandId = "cmd-" + a.Id.ToString("D").Substring(0, 8),
            correlationId = "corr-" + a.Id.ToString("D").Substring(0, 8)
        }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
    }

    public Task<object> GetDocumentsAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        throw new NotSupportedException("Legacy hard-coded document catalogue disabled pending governed document store.");
    }

    public async Task<object> GetRolesAndAccessAsync(Guid tenantId, CancellationToken ct = default)
    {
        var appointments = await _repo.GetAppointmentsAsync(tenantId, ct);
        var items = appointments.Select(a => new { id = a.Id.ToString("D"),
            role = a.RoleCode, chapterId = a.ChapterId.ToString("D"),
            userId = a.UserId.ToString("D"), effectiveFrom = a.StartsAt,
            effectiveTo = a.EndsAt, status = a.Status.ToString() }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count,
            recordType = "appointments_not_effective_permission_grants",
            serverTime = DateTimeOffset.UtcNow.ToString("o") };
    }

    public async Task<object> GetPeopleDirectoryAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default)
    {
        var appointments = await _repo.GetAppointmentsAsync(tenantId, ct);
        var people = await _repo.GetUsersAsync(tenantId, ct);
        var names = people.ToDictionary(u => u.Id, u => u.Name);
        var items = appointments.Where(a => !string.IsNullOrWhiteSpace(a.RoleCode))
            .Where(a => !string.IsNullOrWhiteSpace(names.GetValueOrDefault(a.UserId)))
            .Where(a => scopeId == null || string.Equals(a.ChapterId.ToString("D"), scopeId, StringComparison.OrdinalIgnoreCase))
            .Take(Math.Clamp(limit, 1, 200))
            .Select(a => new { id = a.UserId.ToString("D"), name = names[a.UserId],
                position = a.RoleCode, chapterId = a.ChapterId.ToString("D"),
                effectiveFrom = a.StartsAt, effectiveTo = a.EndsAt,
                status = a.Status.ToString() }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count,
            serverTime = DateTimeOffset.UtcNow.ToString("o") };
    }
}

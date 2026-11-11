using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Sethu.Domain.Entities;
using Sethu.Service.Abstractions.Organisation;
using Sethu.Service.DTOs.Organisation;

namespace Sethu.Service.Services.Organisation;

public sealed class OrganisationalService : IOrganisationalService
{
    private readonly IOrganisationalRepository _repo;
    private readonly IScopeResolver _scopeResolver;
    private readonly ILogger<OrganisationalService> _logger;

    private sealed class DuesRecordStoreItem
    {
        public string Id { get; set; } = "";
        public string MemberId { get; set; } = "";
        public string MemberName { get; set; } = "";
        public string Business { get; set; } = "";
        public string Chapter { get; set; } = "";
        public string MembershipTerm { get; set; } = "2026-2027 Annual";
        public decimal Amount { get; set; } = 15000;
        public string DueDate { get; set; } = "2026-06-30";
        public string Status { get; set; } = "Pending";
        public string ExceptionStatus { get; set; } = "NONE";
        public string PaymentReferenceMasked { get; set; } = "";
        public string? PaymentMethod { get; set; }
        public string? PaidAt { get; set; }
        public string? ReconciledAt { get; set; }
        public string? ReconciledBy { get; set; }
        public int Version { get; set; } = 1;
    }

    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, DuesRecordStoreItem> _duesStore = new(StringComparer.OrdinalIgnoreCase);
    private static readonly string DuesStoreFilePath = Path.Combine(AppContext.BaseDirectory, "dues_store.json");

    private static void LoadDuesStoreFromDisk()
    {
        try
        {
            if (File.Exists(DuesStoreFilePath))
            {
                var json = File.ReadAllText(DuesStoreFilePath);
                var items = JsonSerializer.Deserialize<List<DuesRecordStoreItem>>(json);
                if (items != null && items.Count > 0)
                {
                    foreach (var item in items)
                    {
                        _duesStore[item.Id] = item;
                    }
                }
            }
        }
        catch { }
    }

    private static void SaveDuesStoreToDisk()
    {
        try
        {
            var list = _duesStore.Values.ToList();
            var json = JsonSerializer.Serialize(list, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(DuesStoreFilePath, json);
        }
        catch { }
    }

    public OrganisationalService(
        IOrganisationalRepository repo,
        IScopeResolver scopeResolver,
        ILogger<OrganisationalService> logger)
    {
        _repo = repo;
        _scopeResolver = scopeResolver;
        _logger = logger;
    }

    public async Task<object> GetBootstrapAsync(Guid tenantId, ResolvedActorScope? actorScope = null, CancellationToken ct = default)
    {
        var allUnits = await _scopeResolver.GetUnitTreeAsync(tenantId, ct);
        var activeScopeId = actorScope?.ScopeId ?? allUnits.FirstOrDefault(u => u.Level == Domain.Organisation.UnitLevel.Chapter)?.Id.ToString("D") ?? "11111111-1111-1111-1111-111111111111";
        var activeUnit = allUnits.FirstOrDefault(u => u.Id.ToString("D").Equals(activeScopeId, StringComparison.OrdinalIgnoreCase)) ?? allUnits.FirstOrDefault();
        var activeScopeName = activeUnit?.Code ?? actorScope?.ScopeName ?? "Chapter Unit";
        var activeScopeLevel = actorScope?.ScopeLevel ?? (activeUnit?.Level.ToString().ToUpperInvariant() ?? "CHAPTER");

        // Allowed scopes for actor (own unit + descendants)
        var allowedScopeIds = actorScope?.AllowedScopeIds ?? new HashSet<string>(StringComparer.OrdinalIgnoreCase) { activeScopeId };

        // Filter units to actor's subtree
        var filteredUnits = allUnits.Where(u => allowedScopeIds.Contains(u.Id.ToString("D")) || allowedScopeIds.Contains(u.Code)).ToList();
        if (filteredUnits.Count == 0 && activeUnit != null)
        {
            filteredUnits.Add(activeUnit);
        }

        var units = filteredUnits.Select(u => new
        {
            id = u.Id.ToString("D"),
            name = u.Code,
            level = u.Level switch
            {
                Domain.Organisation.UnitLevel.Country => "NATIONAL",
                Domain.Organisation.UnitLevel.State => "STATE",
                Domain.Organisation.UnitLevel.Region => "REGION",
                Domain.Organisation.UnitLevel.City => "CITY",
                _ => "CHAPTER"
            },
            parentId = u.ParentId?.ToString("D"),
            status = u.Active ? "ACTIVE" : "INACTIVE",
            health = 95,
            memberCount = 100
        }).ToList();

        var availableScopes = filteredUnits.Select(u => new
        {
            id = u.Id.ToString("D"),
            name = u.Code,
            level = u.Level switch
            {
                Domain.Organisation.UnitLevel.Country => "NATIONAL",
                Domain.Organisation.UnitLevel.State => "STATE",
                Domain.Organisation.UnitLevel.Region => "REGION",
                Domain.Organisation.UnitLevel.City => "CITY",
                _ => "CHAPTER"
            }
        }).ToList();

        var now = DateTimeOffset.UtcNow;
        var permissions = actorScope?.Permissions ?? new List<string> { "org:read", "org:write" };

        return new
        {
            actor = new
            {
                id = actorScope?.ActorId ?? "00000000-0000-0000-0000-000000000099",
                name = actorScope?.Name ?? "Office Bearer",
                position = actorScope?.Position ?? "Chapter President",
                scope = new { id = activeScopeId, name = activeScopeName, level = activeScopeLevel },
                effectiveFrom = "2026-04-01T00:00:00Z"
            },
            activeScope = new { id = activeScopeId, name = activeScopeName, level = activeScopeLevel },
            availableScopes,
            units,
            permissions,
            activeAssignment = new
            {
                id = $"assignment-{activeScopeId}",
                memberId = actorScope?.ActorId ?? "00000000-0000-0000-0000-000000000099",
                roleType = actorScope?.Role?.ToUpperInvariant().Replace(" ", "_") ?? "CHAPTER_PRESIDENT",
                organisationLevel = activeScopeLevel,
                organisationUnitId = activeScopeId,
                effectiveFrom = "2026-04-01T00:00:00Z",
                status = "ACTIVE",
                version = 1
            },
            sessionRevision = "rev-auth-" + now.ToUnixTimeSeconds(),
            serverTime = now.ToString("o"),
            contractVersion = "3.5.0",
            effectivePolicy = new
            {
                configurationVersion = "1.0",
                source = "BACKEND"
            }
        };
    }

    // --- Standard Tasks & Actions Service Methods ---
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
        return await UpdateTaskAsync(taskId, "DONE", null, tenantId, ct);
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

    // --- Standard Approvals Service Methods ---
    public async Task<object> GetApprovalsAsync(Guid tenantId, string? status, int limit, CancellationToken ct = default)
    {
        var approvals = await _repo.GetApprovalsAsync(tenantId, status, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var items = approvals.Select(a => new
        {
            id = a.Id.ToString("D"),
            itemType = a.SourceType,
            title = a.Subject,
            subject = a.Subject,
            requester = a.Requester,
            due = a.Due,
            priority = a.Risk,
            status = a.Status,
            version = a.Version,
            requestedAt = a.CreatedAt.ToString("o")
        }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> DecideApprovalAsync(Guid approvalId, string decision, string decidedBy, Guid tenantId, CancellationToken ct = default)
    {
        var approval = await _repo.GetApprovalByIdAsync(approvalId, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (approval != null)
        {
            approval.Status = decision == "REJECTED" ? "REJECTED" : "APPROVED";
            approval.DecidedBy = decidedBy;
            approval.DecidedAt = now;
            approval.Version += 1;
            await _repo.SaveApprovalAsync(approval, ct);
            return new { success = true, aggregateId = approval.Id.ToString("D"), version = approval.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "Approval not found", serverTime = now.ToString("o") };
    }

    // --- Standard Meetings & Attendance Service Methods ---
    public async Task<object> GetMeetingsAsync(Guid tenantId, string? status, int limit, IReadOnlyCollection<string>? allowedScopeIds = null, CancellationToken ct = default)
    {
        var meetings = await _repo.GetMeetingsAsync(tenantId, status, limit, ct);
        if (allowedScopeIds != null && allowedScopeIds.Count > 0)
        {
            meetings = meetings.Where(m => string.IsNullOrWhiteSpace(m.ScopeId) || allowedScopeIds.Contains(m.ScopeId)).ToList();
        }
        var now = DateTimeOffset.UtcNow;
        var items = meetings.Select(m => {
            var participants = new string[] { "Organizer" };
            try { if (!string.IsNullOrWhiteSpace(m.ParticipantsJson)) participants = System.Text.Json.JsonSerializer.Deserialize<string[]>(m.ParticipantsJson) ?? participants; } catch { }
            var agenda = new string[] { "Smart Agenda", "Operational Discussion" };
            try { if (!string.IsNullOrWhiteSpace(m.AgendaJson)) agenda = System.Text.Json.JsonSerializer.Deserialize<string[]>(m.AgendaJson) ?? agenda; } catch { }

            return new
            {
                id = m.Id.ToString("D"),
                title = m.Title,
                type = m.Type,
                scheduledAt = m.ScheduledAt,
                location = !string.IsNullOrWhiteSpace(m.Location) ? m.Location : "Online / Venue TBD",
                status = m.Status,
                quorumRequired = m.QuorumRequired > 0 ? m.QuorumRequired : 1,
                participants = participants.Length > 0 ? participants : new[] { "Organizer" },
                agenda = agenda.Length > 0 ? agenda : new[] { "Smart Agenda", "Operational Discussion" },
                momPublished = !string.IsNullOrWhiteSpace(m.Minutes),
                version = m.Version,
                scope = new { id = m.ScopeId, name = m.ScopeName, level = m.ScopeLevel }
            };
        }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
    }


    public async Task<object> CreateMeetingAsync(MeetingRecord meeting, CancellationToken ct = default)
    {
        meeting.Id = meeting.Id == Guid.Empty ? Guid.NewGuid() : meeting.Id;
        meeting.CreatedAt = DateTimeOffset.UtcNow;
        meeting.UpdatedAt = meeting.CreatedAt;
        meeting.Version = 1;
        await _repo.SaveMeetingAsync(meeting, ct);
        return new { success = true, aggregateId = meeting.Id.ToString("D"), version = 1, serverTime = meeting.CreatedAt.ToString("o") };
    }

    public async Task<object> UpdateMeetingAsync(Guid meetingId, string? title, string? scheduledAt, string? type, string? location, int? quorumRequired, string? status, string? scopeId, string? scopeName, Guid tenantId, CancellationToken ct = default)
    {
        var meeting = await _repo.GetMeetingByIdAsync(meetingId, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (meeting != null)
        {
            if (!string.IsNullOrWhiteSpace(title)) meeting.Title = title;
            if (!string.IsNullOrWhiteSpace(scheduledAt)) meeting.ScheduledAt = scheduledAt;
            if (!string.IsNullOrWhiteSpace(type)) meeting.Type = type;
            if (location != null) meeting.Location = location;
            if (quorumRequired.HasValue && quorumRequired.Value > 0) meeting.QuorumRequired = quorumRequired.Value;
            if (!string.IsNullOrWhiteSpace(status)) meeting.Status = status;
            if (!string.IsNullOrWhiteSpace(scopeId)) meeting.ScopeId = scopeId;
            if (!string.IsNullOrWhiteSpace(scopeName)) meeting.ScopeName = scopeName;
            meeting.Version += 1;
            meeting.UpdatedAt = now;
            await _repo.SaveMeetingAsync(meeting, ct);
            return new { success = true, aggregateId = meeting.Id.ToString("D"), version = meeting.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "Meeting not found", serverTime = now.ToString("o") };
    }

    public async Task<object> DeleteMeetingAsync(Guid meetingId, Guid tenantId, CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        await _repo.DeleteMeetingAsync(meetingId, tenantId, ct);
        return new { success = true, aggregateId = meetingId.ToString("D"), serverTime = now.ToString("o") };
    }

    public async Task<object> PublishMomAsync(Guid meetingId, string minutes, Guid tenantId, CancellationToken ct = default)
    {
        var meeting = await _repo.GetMeetingByIdAsync(meetingId, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (meeting != null)
        {
            meeting.Minutes = minutes;
            meeting.Version += 1;
            meeting.UpdatedAt = now;
            await _repo.SaveMeetingAsync(meeting, ct);
            return new { success = true, aggregateId = meeting.Id.ToString("D"), version = meeting.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "Meeting not found", serverTime = now.ToString("o") };
    }

    public async Task<object> CorrectAttendanceAsync(Guid attendanceId, string proposedStatus, string reason, Guid tenantId, CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        var existing = await _repo.GetAttendanceRecordByIdAsync(attendanceId, tenantId, ct);
        if (existing != null)
        {
            existing.PriorStatus = existing.Status;
            existing.Status = proposedStatus;
            existing.CorrectionReason = reason;
            existing.CorrectionStatus = "approved";
            existing.UpdatedAt = now;
            await _repo.SaveAttendanceRecordAsync(existing, ct);
        }

        await _repo.SaveAuditLogAsync(new Audit
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ActorId = Guid.Parse("00000000-0000-0000-0000-000000000099"),
            ResourceId = attendanceId,
            Operation = "org.attendance.correct",
            Event = $"Attendance status updated to {proposedStatus}: {reason}",
            CorrelationId = Guid.NewGuid().ToString("D"),
            OccurredAt = now
        }, ct);
        return new { success = true, aggregateId = attendanceId.ToString("D"), version = 2, serverTime = now.ToString("o") };
    }

    // --- Standard Calendar & Events Service Methods ---
    public async Task<object> GetCalendarAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        var meetings = await _repo.GetMeetingsAsync(tenantId, null, limit, ct);
        var tasks = await _repo.GetTasksAsync(tenantId, null, limit, ct);
        var programmes = await _repo.GetProgrammesAsync(tenantId, limit, ct);

        if (!string.IsNullOrWhiteSpace(scopeId) && !scopeId.Equals("all", StringComparison.OrdinalIgnoreCase) && !scopeId.Equals("national", StringComparison.OrdinalIgnoreCase))
        {
            meetings = meetings.Where(m =>
                (!string.IsNullOrWhiteSpace(m.ScopeId) && m.ScopeId.Equals(scopeId, StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrWhiteSpace(m.ScopeName) && (m.ScopeName.Equals(scopeId, StringComparison.OrdinalIgnoreCase) || m.ScopeName.Contains(scopeId, StringComparison.OrdinalIgnoreCase)))
            ).ToList();
            tasks = tasks.Where(t =>
                (!string.IsNullOrWhiteSpace(t.ScopeId) && t.ScopeId.Equals(scopeId, StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrWhiteSpace(t.ScopeName) && (t.ScopeName.Equals(scopeId, StringComparison.OrdinalIgnoreCase) || t.ScopeName.Contains(scopeId, StringComparison.OrdinalIgnoreCase)))
            ).ToList();
            programmes = programmes.Where(p =>
                (!string.IsNullOrWhiteSpace(p.ScopeId) && p.ScopeId.Equals(scopeId, StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrWhiteSpace(p.ScopeName) && (p.ScopeName.Equals(scopeId, StringComparison.OrdinalIgnoreCase) || p.ScopeName.Contains(scopeId, StringComparison.OrdinalIgnoreCase)))
            ).ToList();
        }

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
                    date = !string.IsNullOrEmpty(t.Due) && t.Due.Length >= 10 ? t.Due.Substring(0, 10) : now.ToString("yyyy-MM-dd"),
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
            var dateStr = !string.IsNullOrEmpty(p.NextMilestone) && p.NextMilestone.Length >= 10 ? p.NextMilestone.Substring(0, 10) : now.ToString("yyyy-MM-dd");
            list.Add(new
            {
                id = $"event:{p.Id:D}",
                date = dateStr,
                title = p.Name,
                type = "Event",
                to = $"/org/events/{p.Id:D}",
                status = p.Status,
                owner = p.Owner
            });
        }

        return new { items = list, hasMore = false, totalEstimate = list.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> GetEventsAsync(Guid tenantId, string? scopeId, int limit, IReadOnlyCollection<string>? allowedScopeIds = null, CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        var meetings = await _repo.GetMeetingsAsync(tenantId, null, limit, ct);
        var programmes = await _repo.GetProgrammesAsync(tenantId, limit, ct);

        // Filter by scopeId and allowedScopeIds
        if (!string.IsNullOrWhiteSpace(scopeId) && !scopeId.Equals("all", StringComparison.OrdinalIgnoreCase) && !scopeId.Equals("national", StringComparison.OrdinalIgnoreCase))
        {
            meetings = meetings.Where(m =>
                (!string.IsNullOrWhiteSpace(m.ScopeId) && m.ScopeId.Equals(scopeId, StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrWhiteSpace(m.ScopeName) && (m.ScopeName.Equals(scopeId, StringComparison.OrdinalIgnoreCase) || m.ScopeName.Contains(scopeId, StringComparison.OrdinalIgnoreCase)))
            ).ToList();
            programmes = programmes.Where(p =>
                (!string.IsNullOrWhiteSpace(p.ScopeId) && p.ScopeId.Equals(scopeId, StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrWhiteSpace(p.ScopeName) && (p.ScopeName.Equals(scopeId, StringComparison.OrdinalIgnoreCase) || p.ScopeName.Contains(scopeId, StringComparison.OrdinalIgnoreCase)))
            ).ToList();
        }
        else if (allowedScopeIds != null && allowedScopeIds.Count > 0 && !allowedScopeIds.Contains("all") && !allowedScopeIds.Contains("national"))
        {
            meetings = meetings.Where(m => string.IsNullOrWhiteSpace(m.ScopeId) || allowedScopeIds.Contains(m.ScopeId)).ToList();
            programmes = programmes.Where(p => string.IsNullOrWhiteSpace(p.ScopeId) || allowedScopeIds.Contains(p.ScopeId)).ToList();
        }

        var list = new List<object>();

        foreach (var p in programmes)
        {
            list.Add(new
            {
                id = p.Id.ToString("D"),
                name = p.Name,
                date = !string.IsNullOrEmpty(p.NextMilestone) ? p.NextMilestone : p.CreatedAt.ToString("yyyy-MM-dd"),
                status = p.Status,
                attendance = 24,
                owner = p.Owner,
                committeeId = p.CommitteeId,
                programmeId = p.Id.ToString("D"),
                version = p.Version,
                scope = new { id = p.ScopeId, name = p.ScopeName, level = p.ScopeLevel }
            });
        }

        foreach (var m in meetings)
        {
            list.Add(new
            {
                id = m.Id.ToString("D"),
                name = m.Title,
                title = m.Title,
                date = !string.IsNullOrEmpty(m.ScheduledAt) && m.ScheduledAt.Length >= 10 ? m.ScheduledAt.Substring(0, 10) : now.ToString("yyyy-MM-dd"),
                scheduledAt = m.ScheduledAt,
                type = m.Type,
                status = m.Status,
                attendance = m.QuorumRequired,
                quorumRequired = m.QuorumRequired,
                owner = "Chapter Coordinator",
                committeeId = "",
                programmeId = "",
                version = m.Version,
                location = !string.IsNullOrWhiteSpace(m.Location) ? m.Location : "Online",
                chapterId = m.ScopeId,
                chapterName = m.ScopeName,
                scope = new { id = m.ScopeId, name = m.ScopeName, level = m.ScopeLevel }
            });
        }

        return new { items = list, hasMore = false, totalEstimate = list.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> CreateEventAsync(MeetingRecord meeting, CancellationToken ct = default)
    {
        return await CreateMeetingAsync(meeting, ct);
    }

    // --- Standard Member Cases Service Methods ---
    public async Task<object> GetMemberCasesAsync(Guid tenantId, string? scopeId, int limit, CancellationToken ct = default)
    {
        var cases = await _repo.GetMemberCasesAsync(tenantId, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var items = cases.Select(c => new
        {
            id = c.Id.ToString("D"),
            memberId = c.MemberId,
            memberName = "Member",
            type = c.Type,
            title = c.Title,
            owner = c.Owner,
            status = c.Status,
            priority = c.Priority,
            internalNote = c.InternalNote,
            memberMessage = c.MemberMessage,
            version = c.Version,
            createdAt = c.CreatedAt.ToString("o")
        }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> CreateMemberCaseAsync(MemberCaseRecord memberCase, CancellationToken ct = default)
    {
        memberCase.Id = memberCase.Id == Guid.Empty ? Guid.NewGuid() : memberCase.Id;
        memberCase.CreatedAt = DateTimeOffset.UtcNow;
        memberCase.UpdatedAt = memberCase.CreatedAt;
        memberCase.Version = 1;
        await _repo.SaveMemberCaseAsync(memberCase, ct);
        return new { success = true, aggregateId = memberCase.Id.ToString("D"), version = 1, serverTime = memberCase.CreatedAt.ToString("o") };
    }

    public async Task<object> UpdateMemberCaseAsync(Guid caseId, string? status, Guid tenantId, CancellationToken ct = default)
    {
        var mc = await _repo.GetMemberCaseByIdAsync(caseId, tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        if (mc != null)
        {
            if (!string.IsNullOrWhiteSpace(status)) mc.Status = status;
            mc.Version += 1;
            mc.UpdatedAt = now;
            await _repo.SaveMemberCaseAsync(mc, ct);
            return new { success = true, aggregateId = mc.Id.ToString("D"), version = mc.Version, serverTime = now.ToString("o") };
        }
        return new { success = false, message = "MemberCase not found", serverTime = now.ToString("o") };
    }

    // --- Standard Hierarchy & Units Service Methods ---
    public async Task<object> GetHierarchySummaryAsync(Guid tenantId, CancellationToken ct = default)
    {
        var units = await _repo.GetUnitsAsync(tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        return new
        {
            tree = units.Select(u => new
            {
                id = u.Id.ToString("D"),
                name = u.Code,
                level = u.Level.ToString().ToUpperInvariant(),
                parentId = u.ParentId?.ToString("D"),
                active = u.Active
            }).ToList(),
            serverTime = now.ToString("o")
        };
    }

    public async Task<object> GetHierarchyRollupAsync(Guid tenantId, CancellationToken ct = default)
    {
        var units = await _repo.GetUnitsAsync(tenantId, ct);
        var now = DateTimeOffset.UtcNow;
        return new
        {
            summary = new
            {
                totalChapters = units.Count(u => u.Level == Domain.Organisation.UnitLevel.Chapter),
                totalMembers = 240,
                averageAttendance = 94,
                health = 96
            },
            units = units.Select(u => new { id = u.Id.ToString("D"), name = u.Code, level = u.Level.ToString().ToUpperInvariant(), status = u.Active ? "ACTIVE" : "INACTIVE" }).ToList(),
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
            parentId = u.ParentId?.ToString("D"),
            status = u.Active ? "ACTIVE" : "INACTIVE"
        }).ToList();
        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
    }

    // --- Standard Continuity: Escalations, Risks, Issues, Decisions ---
    public async Task<object> GetContinuitySummaryAsync(Guid tenantId, CancellationToken ct = default)
    {
        var tasks = await _repo.GetTasksAsync(tenantId, null, 100, ct);
        var actions = await _repo.GetActionsAsync(tenantId, 100, ct);
        var cases = await _repo.GetMemberCasesAsync(tenantId, 100, ct);
        var meetings = await _repo.GetMeetingsAsync(tenantId, null, 50, ct);
        var committees = await _repo.GetCommitteesAsync(tenantId, ct);
        var programmes = await _repo.GetProgrammesAsync(tenantId, 50, ct);
        var delegations = await _repo.GetDelegationsAsync(tenantId, ct);
        var avails = await _repo.GetAvailabilitiesAsync(tenantId, ct);
        var activeCover = avails.OrderByDescending(a => a.CreatedAt).FirstOrDefault(a => a.Availability != "Available");

        var escalations = await _repo.GetEscalationsAsync(tenantId, 20, ct);
        var risks = await _repo.GetRisksAsync(tenantId, 20, ct);
        var issues = await _repo.GetIssuesAsync(tenantId, 20, ct);
        var decisions = await _repo.GetDecisionsAsync(tenantId, 20, ct);
        var now = DateTimeOffset.UtcNow;

        return new
        {
            responsibilities = new[] { "CHAPTER_PRESIDENT", "Chapter Leadership & Governance" },
            openTasks = tasks.Count(t => t.Status != "DONE"),
            openActions = actions.Count(a => a.Status != "DONE"),
            openMemberCases = cases.Count(c => c.Status != "Closed"),
            upcomingMeetings = meetings.Count(m => m.Status != "COMPLETED"),
            committees = committees.Count,
            programmes = programmes.Count,
            documentReferences = 2,
            activeDelegations = delegations.Count(d => !d.Revoked && d.EndsAt > now),
            actingCover = activeCover != null ? new
            {
                delegateName = "Vice President",
                effectiveTo = activeCover.EffectiveTo,
                status = activeCover.Availability
            } : null,
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
            raisedAt = e.CreatedAt.ToString("o"),
            to = $"/org/escalations/{e.Id:D}",
            meta = $"{(!string.IsNullOrWhiteSpace(e.FromScopeName) ? e.FromScopeName : "Chapter")} → {(!string.IsNullOrWhiteSpace(e.ToScopeName) ? e.ToScopeName : "Region")} · owner {e.Owner}"
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

    public async Task<object> GetRisksAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        var items = await _repo.GetRisksAsync(tenantId, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var mapped = items.Select(r => new
        {
            id = r.Id.ToString("D"),
            title = r.Title,
            owner = r.Owner,
            status = r.Status,
            impact = r.Impact,
            severity = r.Impact,
            likelihood = r.Likelihood,
            reviewDate = r.ReviewDate,
            version = r.Version,
            to = $"/org/risks/{r.Id:D}",
            meta = $"Owner {r.Owner} · review {r.ReviewDate}"
        }).ToList();
        return new { items = mapped, hasMore = false, totalEstimate = mapped.Count, serverTime = now.ToString("o") };
    }

    public async Task<object> GetIssuesAsync(Guid tenantId, int limit, CancellationToken ct = default)
    {
        var items = await _repo.GetIssuesAsync(tenantId, limit, ct);
        var now = DateTimeOffset.UtcNow;
        var mapped = items.Select(i => new
        {
            id = i.Id.ToString("D"),
            title = i.Title,
            owner = i.Owner,
            status = i.Status,
            impact = i.Impact,
            severity = i.Impact,
            sourceType = i.SourceType,
            version = i.Version,
            to = $"/org/issues/{i.Id:D}",
            meta = $"Owner {i.Owner} · {i.SourceType} {i.SourceId}"
        }).ToList();
        return new { items = mapped, hasMore = false, totalEstimate = mapped.Count, serverTime = now.ToString("o") };
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
            version = d.Version,
            to = $"/org/decisions/{d.Id:D}",
            meta = $"{d.Authority} · effective {d.EffectiveDate} · {d.Reason}"
        }).ToList();
        return new { items = mapped, hasMore = false, totalEstimate = mapped.Count, serverTime = now.ToString("o") };
    }

    // --- Standard Record Detail By ID ---
    public async Task<object> GetRecordByIdAsync(string entityType, string id, Guid tenantId, CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        if (Guid.TryParse(id, out var recGuid))
        {
            switch (entityType.ToUpperInvariant())
            {
                case "TASK":
                    {
                        var t = await _repo.GetTaskByIdAsync(recGuid, tenantId, ct);
                        if (t != null)
                        {
                            return new
                            {
                                id = t.Id.ToString("D"),
                                title = t.Title,
                                description = t.Description,
                                owner = t.Owner,
                                due = t.Due,
                                priority = t.Priority,
                                status = t.Status,
                                sourceType = t.SourceType,
                                sourceId = t.SourceId,
                                version = t.Version,
                                createdAt = t.CreatedAt.ToString("o")
                            };
                        }
                        break;
                    }
                case "ACTION":
                    {
                        var a = await _repo.GetActionByIdAsync(recGuid, tenantId, ct);
                        if (a != null)
                        {
                            return new
                            {
                                id = a.Id.ToString("D"),
                                title = a.Title,
                                owner = a.Owner,
                                due = a.Due,
                                priority = a.Priority,
                                status = a.Status,
                                sourceType = a.SourceType,
                                sourceId = a.SourceId,
                                version = a.Version
                            };
                        }
                        break;
                    }
                case "APPROVAL":
                    {
                        var app = await _repo.GetApprovalByIdAsync(recGuid, tenantId, ct);
                        if (app != null)
                        {
                            return new
                            {
                                id = app.Id.ToString("D"),
                                title = app.Subject,
                                subject = app.Subject,
                                requester = app.Requester,
                                due = app.Due,
                                status = app.Status,
                                priority = app.Risk,
                                version = app.Version
                            };
                        }
                        break;
                    }
                case "MEETING":
                    {
                        var m = await _repo.GetMeetingByIdAsync(recGuid, tenantId, ct);
                        if (m != null)
                        {
                            var participants = new string[] { "Organizer" };
                            try { if (!string.IsNullOrWhiteSpace(m.ParticipantsJson)) participants = System.Text.Json.JsonSerializer.Deserialize<string[]>(m.ParticipantsJson) ?? participants; } catch { }
                            var agenda = new string[] { "Review open actions", "General discussion" };
                            try { if (!string.IsNullOrWhiteSpace(m.AgendaJson)) agenda = System.Text.Json.JsonSerializer.Deserialize<string[]>(m.AgendaJson) ?? agenda; } catch { }

                            return new
                            {
                                id = m.Id.ToString("D"),
                                title = m.Title,
                                type = m.Type,
                                scheduledAt = m.ScheduledAt,
                                location = "Hosur Conference Hall",
                                status = m.Status,
                                quorumRequired = m.QuorumRequired > 0 ? m.QuorumRequired : 1,
                                participants = participants.Length > 0 ? participants : new[] { "Organizer" },
                                agenda = agenda.Length > 0 ? agenda : new[] { "Review open actions", "General discussion" },
                                momPublished = !string.IsNullOrWhiteSpace(m.Minutes),
                                minutes = m.Minutes ?? "",
                                version = m.Version
                            };
                        }
                        break;
                    }
                case "MEMBER_CASE":
                    {
                        var mc = await _repo.GetMemberCaseByIdAsync(recGuid, tenantId, ct);
                        if (mc != null)
                        {
                            return new
                            {
                                id = mc.Id.ToString("D"),
                                title = mc.Title,
                                memberId = mc.MemberId,
                                type = mc.Type,
                                owner = mc.Owner,
                                status = mc.Status,
                                priority = mc.Priority,
                                internalNote = mc.InternalNote,
                                memberMessage = mc.MemberMessage,
                                version = mc.Version
                            };
                        }
                        break;
                    }
                case "PROGRAMME":
                case "PROJECT":
                    {
                        var prog = await _repo.GetProgrammeByIdAsync(recGuid, tenantId, ct);
                        if (prog != null)
                        {
                            return new
                            {
                                id = prog.Id.ToString("D"),
                                title = prog.Name,
                                name = prog.Name,
                                owner = prog.Owner,
                                status = prog.Status,
                                progress = prog.Progress,
                                risk = prog.Risk,
                                nextMilestone = prog.NextMilestone,
                                version = prog.Version
                            };
                        }
                        break;
                    }
                case "ESCALATION":
                    {
                        var esc = await _repo.GetEscalationByIdAsync(recGuid, tenantId, ct);
                        if (esc != null)
                        {
                            return new
                            {
                                id = esc.Id.ToString("D"),
                                title = esc.Title,
                                status = esc.Status,
                                priority = esc.Severity,
                                severity = esc.Severity,
                                owner = esc.Owner,
                                requesterScope = new { id = esc.FromScopeId, name = !string.IsNullOrWhiteSpace(esc.FromScopeName) ? esc.FromScopeName : "Chapter Scope", level = esc.FromScopeLevel },
                                targetScope = new { id = esc.ToScopeId, name = !string.IsNullOrWhiteSpace(esc.ToScopeName) ? esc.ToScopeName : "Region Scope", level = esc.ToScopeLevel },
                                from = new { id = esc.FromScopeId, name = !string.IsNullOrWhiteSpace(esc.FromScopeName) ? esc.FromScopeName : "Chapter Scope", level = esc.FromScopeLevel },
                                to = new { id = esc.ToScopeId, name = !string.IsNullOrWhiteSpace(esc.ToScopeName) ? esc.ToScopeName : "Region Scope", level = esc.ToScopeLevel },
                                version = esc.Version,
                                createdAt = esc.CreatedAt.ToString("o")
                            };
                        }
                        break;
                    }
                case "CHAPTER":
                    {
                        var u = await _repo.GetUnitByIdAsync(recGuid, tenantId, ct);
                        if (u != null)
                        {
                            return new
                            {
                                id = u.Id.ToString("D"),
                                name = u.Code,
                                level = u.Level.ToString().ToUpperInvariant(),
                                status = u.Active ? "ACTIVE" : "INACTIVE",
                                memberCount = 42,
                                health = 96,
                                version = u.Version
                            };
                        }
                        break;
                    }
                case "HANDOFF":
                    {
                        var h = await _repo.GetHandoffByIdAsync(recGuid, tenantId, ct);
                        if (h != null)
                        {
                            return new
                            {
                                id = h.Id.ToString("D"),
                                title = $"Handoff {h.SourceWorkspace} → {h.TargetWorkspace}",
                                sourceWorkspace = h.SourceWorkspace,
                                targetWorkspace = h.TargetWorkspace,
                                sourceType = h.SourceType,
                                sourceId = h.SourceId,
                                requestedCapability = h.RequestedCapability,
                                reason = h.Reason,
                                status = h.Status,
                                correlationId = h.CorrelationId,
                                version = h.Version,
                                createdAt = h.CreatedAt.ToString("o")
                            };
                        }
                        break;
                    }
                case "JOB":
                    {
                        var j = await _repo.GetJobByIdAsync(recGuid, tenantId, ct);
                        if (j != null)
                        {
                            return new
                            {
                                id = j.Id.ToString("D"),
                                title = j.Title,
                                kind = j.Kind,
                                status = j.Status,
                                requestedBy = j.RequestedBy,
                                requestedAt = j.RequestedAt,
                                progress = j.Progress,
                                version = 1,
                                createdAt = j.CreatedAt.ToString("o")
                            };
                        }
                        break;
                    }
                case "DATA_QUALITY":
                case "DATAQUALITY":
                case "DATA-QUALITY":
                    {
                        var dq = await _repo.GetDataQualityFindingByIdAsync(recGuid, tenantId, ct);
                        if (dq != null)
                        {
                            return new
                            {
                                id = dq.Id.ToString("D"),
                                title = dq.Title,
                                rule = dq.Title,
                                severity = dq.Severity,
                                category = dq.Severity,
                                status = dq.Status,
                                entityType = dq.EntityType,
                                sourceType = dq.EntityType,
                                entityId = dq.EntityId,
                                sourceId = dq.EntityId,
                                scope = dq.ScopeName,
                                scopeId = dq.ScopeId,
                                description = dq.Description,
                                summary = dq.Description,
                                remediationRecommendation = "Review and correct data finding through governed workflow",
                                version = dq.Version,
                                createdAt = dq.CreatedAt.ToString("o")
                            };
                        }
                        break;
                    }
                case "HANDOVER":
                    {
                        var ho = await _repo.GetHandoverByIdAsync(recGuid, tenantId, ct);
                        if (ho != null)
                        {
                            return new
                            {
                                id = ho.Id.ToString("D"),
                                title = $"Handover: {ho.AssignmentId}",
                                assignmentId = ho.AssignmentId,
                                outgoingMemberId = ho.OutgoingMemberId,
                                incomingMemberId = ho.IncomingMemberId,
                                scopeId = ho.ScopeId,
                                status = ho.Status,
                                preparedAt = ho.PreparedAt,
                                acceptedAt = ho.AcceptedAt,
                                completedAt = ho.CompletedAt,
                                version = ho.Version
                            };
                        }
                        break;
                    }
                case "SUPPORT":
                case "SUPPORTREQUEST":
                case "SUPPORT-REQUEST":
                    {
                        var sc = await _repo.GetMemberCaseByIdAsync(recGuid, tenantId, ct);
                        if (sc != null)
                        {
                            var targetParts = (sc.MemberMessage ?? "").Split('|');
                            var tgtName = targetParts.Length > 0 && !string.IsNullOrWhiteSpace(targetParts[0]) ? targetParts[0] : "Krishnagiri Region";
                            var tgtLevel = targetParts.Length > 1 && !string.IsNullOrWhiteSpace(targetParts[1]) ? targetParts[1] : "REGION";
                            return new
                            {
                                id = sc.Id.ToString("D"),
                                title = sc.Title,
                                summary = sc.InternalNote,
                                description = sc.InternalNote,
                                status = sc.Status,
                                owner = sc.Owner,
                                priority = sc.Priority,
                                requesterScope = new { id = sc.ScopeId, name = !string.IsNullOrWhiteSpace(sc.ScopeName) ? sc.ScopeName : "Chapter Scope", level = sc.ScopeLevel },
                                targetScope = new { id = sc.MemberId, name = tgtName, level = tgtLevel },
                                from = new { id = sc.ScopeId, name = !string.IsNullOrWhiteSpace(sc.ScopeName) ? sc.ScopeName : "Chapter Scope", level = sc.ScopeLevel },
                                to = new { id = sc.MemberId, name = tgtName, level = tgtLevel },
                                version = sc.Version,
                                createdAt = sc.CreatedAt.ToString("o")
                            };
                        }
                        break;
                    }
                case "EXCEPTION":
                    {
                        var exc = await _repo.GetExceptionByIdAsync(recGuid, tenantId, ct);
                        if (exc != null)
                        {
                            return new
                            {
                                id = exc.Id.ToString("D"),
                                title = exc.Title,
                                description = exc.Description,
                                summary = exc.Description,
                                status = exc.Status,
                                decision = exc.Decision,
                                owner = exc.Owner,
                                version = exc.Version,
                                createdAt = exc.CreatedAt.ToString("o")
                            };
                        }
                        break;
                    }
                case "RISK":
                    {
                        var rk = await _repo.GetRiskByIdAsync(recGuid, tenantId, ct);
                        if (rk != null)
                        {
                            return new
                            {
                                id = rk.Id.ToString("D"),
                                title = rk.Title,
                                status = rk.Status,
                                priority = rk.Impact,
                                severity = rk.Impact,
                                impact = rk.Impact,
                                likelihood = rk.Likelihood,
                                owner = rk.Owner,
                                reviewDate = rk.ReviewDate,
                                version = rk.Version,
                                createdAt = rk.CreatedAt.ToString("o")
                            };
                        }
                        break;
                    }
                case "ISSUE":
                    {
                        var iss = await _repo.GetIssueByIdAsync(recGuid, tenantId, ct);
                        if (iss != null)
                        {
                            return new
                            {
                                id = iss.Id.ToString("D"),
                                title = iss.Title,
                                status = iss.Status,
                                priority = iss.Impact,
                                severity = iss.Impact,
                                impact = iss.Impact,
                                owner = iss.Owner,
                                sourceType = iss.SourceType,
                                sourceId = iss.SourceId,
                                version = iss.Version,
                                createdAt = iss.CreatedAt.ToString("o")
                            };
                        }
                        break;
                    }
                case "DECISION":
                    {
                        var dec = await _repo.GetDecisionByIdAsync(recGuid, tenantId, ct);
                        if (dec != null)
                        {
                            return new
                            {
                                id = dec.Id.ToString("D"),
                                title = dec.Subject,
                                subject = dec.Subject,
                                reason = dec.Reason,
                                summary = dec.Reason,
                                authority = dec.Authority,
                                status = dec.Status,
                                effectiveDate = dec.EffectiveDate,
                                version = dec.Version,
                                createdAt = dec.CreatedAt.ToString("o")
                            };
                        }
                        break;
                    }
                case "GOAL":
                case "PLAN":
                    {
                        var g = await _repo.GetGoalByIdAsync(recGuid, tenantId, ct);
                        if (g != null)
                        {
                            return new
                            {
                                id = g.Id.ToString("D"),
                                title = g.Title,
                                owner = g.Owner,
                                status = g.Status,
                                progress = g.Progress,
                                reviewCadence = g.ReviewCadence,
                                version = g.Version
                            };
                        }
                        break;
                    }
                case "EVENT":
                    {
                        var m = await _repo.GetMeetingByIdAsync(recGuid, tenantId, ct);
                        if (m != null)
                        {
                            return new
                            {
                                id = m.Id.ToString("D"),
                                title = m.Title,
                                name = m.Title,
                                type = m.Type,
                                date = m.ScheduledAt,
                                scheduledAt = m.ScheduledAt,
                                status = m.Status,
                                location = !string.IsNullOrWhiteSpace(m.Location) ? m.Location : "Online / Venue TBD",
                                attendance = 24,
                                version = m.Version
                            };
                        }
                        var pItem = await _repo.GetProgrammeByIdAsync(recGuid, tenantId, ct);
                        if (pItem != null)
                        {
                            return new
                            {
                                id = pItem.Id.ToString("D"),
                                title = pItem.Name,
                                name = pItem.Name,
                                type = "PROGRAMME_EVENT",
                                date = !string.IsNullOrEmpty(pItem.NextMilestone) ? pItem.NextMilestone : pItem.CreatedAt.ToString("yyyy-MM-dd"),
                                scheduledAt = !string.IsNullOrEmpty(pItem.NextMilestone) ? pItem.NextMilestone : pItem.CreatedAt.ToString("yyyy-MM-dd"),
                                status = pItem.Status,
                                location = "Hosur Conference Hall",
                                attendance = 30,
                                version = pItem.Version
                            };
                        }
                        break;
                    }
                case "COMMUNICATION":
                    {
                        var comm = await _repo.GetCommunicationByIdAsync(recGuid, tenantId, ct);
                        if (comm != null)
                        {
                            return new
                            {
                                id = comm.Id.ToString("D"),
                                title = comm.Title,
                                description = comm.Body,
                                body = comm.Body,
                                audience = comm.Audience,
                                status = comm.Status,
                                acknowledgementRequired = true,
                                publishedAt = comm.PublishedAt,
                                version = comm.Version,
                                createdAt = comm.CreatedAt.ToString("o")
                            };
                        }
                        break;
                    }
                case "FEEDBACK":
                case "POLL":
                case "SURVEY":
                    {
                        var fb = await _repo.GetFeedbackByIdAsync(recGuid, tenantId, ct);
                        if (fb == null)
                        {
                            var allFb = await _repo.GetFeedbacksAsync(tenantId, 100, ct);
                            fb = allFb.FirstOrDefault(x => x.Id == recGuid);
                        }
                        if (fb != null)
                        {
                            return new
                            {
                                id = fb.Id.ToString("D"),
                                title = fb.Title,
                                description = fb.Description,
                                kind = fb.Kind,
                                status = fb.Status,
                                responses = fb.ResponsesCount,
                                responsesCount = fb.ResponsesCount,
                                scope = new { id = !string.IsNullOrEmpty(fb.ScopeId) ? fb.ScopeId : "ch-cuddalore", name = "cuddalore Chapter", level = "CHAPTER" },
                                version = fb.Version,
                                createdAt = fb.CreatedAt.ToString("o"),
                                serverTime = now.ToString("o")
                            };
                        }
                        break;
                    }
            }
        }

        if (entityType.Equals("DOCUMENT", StringComparison.OrdinalIgnoreCase))
        {
            var docTitles = new Dictionary<string, (string, string, string, string)>(StringComparer.OrdinalIgnoreCase)
            {
                { "doc-001", ("DBN Constitution & SOP Manual 2026", "SOP", "Chapter Operations", "v3") },
                { "doc-002", ("Meeting Protocol Guidelines", "SOP", "Chapter Secretariat", "v2") },
                { "doc-003", ("Membership Working Committee Charter", "Charter", "Membership Committee", "v2") },
                { "doc-004", ("Event Closure & Attendance Checklist", "Template", "Events Committee", "v4") },
                { "doc-005", ("Officer Handover Checklist & Toolkit", "Template", "Chapter Operations", "v1") },
                { "doc-1", ("How to conduct an MC meeting", "SOP", "Chapter Operations", "v3") },
                { "doc-2", ("Membership Working Committee Charter", "Charter", "Membership Committee", "v2") },
                { "doc-3", ("Event closure checklist", "Template", "Events Committee", "v4") },
                { "doc-4", ("Role handover checklist", "Template", "Chapter Operations", "v1") }
            };
            var meta = docTitles.TryGetValue(id, out var foundDoc) ? foundDoc : ("DBN Standard Operating Reference", "SOP", "Chapter Operations", "v1");
            return new
            {
                id,
                title = meta.Item1,
                type = meta.Item2,
                description = $"Standard controlled operational reference document for {meta.Item1}.",
                owner = meta.Item3,
                version = meta.Item4,
                status = "Effective",
                visibility = "INTERNAL",
                effectiveDate = "2026-04-01",
                scope = new { id = "11111111-1111-1111-1111-111111111111", name = "Thanjavur Chapter", level = "CHAPTER" },
                serverTime = now.ToString("o")
            };
        }
        if (entityType.Equals("NOTIFICATION", StringComparison.OrdinalIgnoreCase))
        {
            return new
            {
                id,
                title = id == "notif-002" ? "Weekly chapter meeting agenda published" : "New Member application received",
                description = "System notification dispatched for chapter leadership action and record update.",
                sourceType = id == "notif-002" ? "MEETING" : "MEMBERSHIP",
                sourceId = id == "notif-002" ? "meet-104" : "app-001",
                status = "Unread",
                to = id == "notif-002" ? "/org/meetings" : "/org/member-onboarding",
                scope = new { id = "11111111-1111-1111-1111-111111111111", name = "Thanjavur Chapter", level = "CHAPTER" },
                createdAt = now.AddHours(-2).ToString("o"),
                version = 1,
                serverTime = now.ToString("o")
            };
        }
        if (entityType.Equals("ALERT", StringComparison.OrdinalIgnoreCase))
        {
            return new
            {
                id,
                title = id == "alert-002" ? "Meeting quorum confirmation required" : "Payment reconciliation pending verification",
                description = "Operational alert requiring attention from chapter office bearers.",
                sourceType = id == "alert-002" ? "MEETING" : "FINANCE",
                sourceId = id == "alert-002" ? "meet-105" : "pay-001",
                severity = id == "alert-002" ? "MEDIUM" : "HIGH",
                status = "ACTIVE",
                requiresAction = true,
                to = id == "alert-002" ? "/org/meetings" : "/org/membership-dues",
                scope = new { id = "11111111-1111-1111-1111-111111111111", name = "Thanjavur Chapter", level = "CHAPTER" },
                createdAt = now.AddHours(-1).ToString("o"),
                version = 1,
                serverTime = now.ToString("o")
            };
        }
        if (entityType.Equals("COMMUNICATION", StringComparison.OrdinalIgnoreCase))
        {
            return new
            {
                id,
                title = "Chapter Executive Operational Communication",
                description = "Official chapter announcement and leadership notice regarding upcoming schedules.",
                body = "Official chapter announcement and leadership notice regarding upcoming schedules.",
                audience = "All Chapter Members",
                status = "Published",
                acknowledgementRequired = true,
                publishedAt = now.AddDays(-1).ToString("o"),
                version = 1,
                createdAt = now.AddDays(-1).ToString("o"),
                serverTime = now.ToString("o")
            };
        }
        if (entityType.Equals("FEEDBACK", StringComparison.OrdinalIgnoreCase) || entityType.Equals("POLL", StringComparison.OrdinalIgnoreCase) || entityType.Equals("SURVEY", StringComparison.OrdinalIgnoreCase))
        {
            var isSurvey = entityType.Equals("SURVEY", StringComparison.OrdinalIgnoreCase);
            return new
            {
                id,
                title = isSurvey ? "Member Engagement & Value Assessment" : "Venue Selection for Annual Chapter Gala 2026",
                description = isSurvey ? "Provide comprehensive feedback regarding business generation and referrals quality." : "Vote for either City Convention Hall or Heritage Palace Grounds.",
                kind = isSurvey ? "SURVEY" : "POLL",
                status = isSurvey ? "Open" : "Results Available",
                responses = isSurvey ? 35 : 42,
                responsesCount = isSurvey ? 35 : 42,
                scope = new { id = "ch-cuddalore", name = "cuddalore Chapter", level = "CHAPTER" },
                version = 1,
                createdAt = now.AddDays(-2).ToString("o"),
                serverTime = now.ToString("o")
            };
        }

        return new
        {
            id,
            title = $"{entityType} Details",
            status = "Active",
            version = 1,
            serverTime = now.ToString("o")
        };
    }

    // --- Transport Compatibility Routing Adapter (dispatches to standard service methods) ---
    public async Task<object> ExecuteQueryAsync(OrgQueryRequestDto req, Guid tenantId, ResolvedActorScope? actorScope = null, CancellationToken ct = default)
    {
        // Scope Validation: reject queries outside allowed scope hierarchy
        if (actorScope != null && !string.IsNullOrWhiteSpace(req.organisationScope))
        {
            if (!actorScope.IsScopeAllowed(req.organisationScope))
            {
                throw new ScopeSecurityException($"Forbidden: Requested organisationScope '{req.organisationScope}' is outside actor's allowed scope hierarchy.", req.organisationScope);
            }
        }

        var scopeId = req.organisationScope ?? actorScope?.ScopeId ?? "11111111-1111-1111-1111-111111111111";
        var allowedScopeIds = actorScope?.AllowedScopeIds;
        var now = DateTimeOffset.UtcNow;
        var p = req.parameters;

        try
        {
            switch (req.queryId)
            {
                case "org.today":
                    {
                        var tasks = await _repo.GetTasksAsync(tenantId, null, 10, ct);
                        var approvals = await _repo.GetApprovalsAsync(tenantId, "PENDING", 10, ct);
                        var cases = await _repo.GetMemberCasesAsync(tenantId, 10, ct);
                        var meetings = await _repo.GetMeetingsAsync(tenantId, "SCHEDULED", 5, ct);

                        if (!string.IsNullOrWhiteSpace(scopeId) && !scopeId.Equals("all", StringComparison.OrdinalIgnoreCase) && !scopeId.Equals("national", StringComparison.OrdinalIgnoreCase))
                        {
                            tasks = tasks.Where(t => (!string.IsNullOrWhiteSpace(t.ScopeId) && t.ScopeId.Equals(scopeId, StringComparison.OrdinalIgnoreCase)) || (!string.IsNullOrWhiteSpace(t.ScopeName) && (t.ScopeName.Equals(scopeId, StringComparison.OrdinalIgnoreCase) || t.ScopeName.Contains(scopeId, StringComparison.OrdinalIgnoreCase)))).ToList();
                            approvals = approvals.Where(a => (!string.IsNullOrWhiteSpace(a.ScopeId) && a.ScopeId.Equals(scopeId, StringComparison.OrdinalIgnoreCase)) || (!string.IsNullOrWhiteSpace(a.ScopeName) && (a.ScopeName.Equals(scopeId, StringComparison.OrdinalIgnoreCase) || a.ScopeName.Contains(scopeId, StringComparison.OrdinalIgnoreCase)))).ToList();
                            cases = cases.Where(c => (!string.IsNullOrWhiteSpace(c.ScopeId) && c.ScopeId.Equals(scopeId, StringComparison.OrdinalIgnoreCase)) || (!string.IsNullOrWhiteSpace(c.ScopeName) && (c.ScopeName.Equals(scopeId, StringComparison.OrdinalIgnoreCase) || c.ScopeName.Contains(scopeId, StringComparison.OrdinalIgnoreCase)))).ToList();
                            meetings = meetings.Where(m => (!string.IsNullOrWhiteSpace(m.ScopeId) && m.ScopeId.Equals(scopeId, StringComparison.OrdinalIgnoreCase)) || (!string.IsNullOrWhiteSpace(m.ScopeName) && (m.ScopeName.Equals(scopeId, StringComparison.OrdinalIgnoreCase) || m.ScopeName.Contains(scopeId, StringComparison.OrdinalIgnoreCase)))).ToList();
                        }
                        else if (allowedScopeIds != null && allowedScopeIds.Count > 0 && !allowedScopeIds.Contains("all") && !allowedScopeIds.Contains("national"))
                        {
                            tasks = tasks.Where(t => string.IsNullOrWhiteSpace(t.ScopeId) || allowedScopeIds.Contains(t.ScopeId)).ToList();
                            approvals = approvals.Where(a => string.IsNullOrWhiteSpace(a.ScopeId) || allowedScopeIds.Contains(a.ScopeId)).ToList();
                            cases = cases.Where(c => string.IsNullOrWhiteSpace(c.ScopeId) || allowedScopeIds.Contains(c.ScopeId)).ToList();
                            meetings = meetings.Where(m => string.IsNullOrWhiteSpace(m.ScopeId) || allowedScopeIds.Contains(m.ScopeId)).ToList();
                        }

                        var needs = new List<object>();
                        foreach (var app in approvals.Take(3))
                        {
                            needs.Add(new { id = app.Id.ToString("D"), title = app.Subject, category = "APPROVAL", priority = app.Risk, due = app.Due, href = $"/org/approvals/{app.Id:D}", to = $"/org/approvals/{app.Id:D}" });
                        }
                        foreach (var t in tasks.Where(x => x.Status != "DONE").Take(3))
                        {
                            needs.Add(new { id = t.Id.ToString("D"), title = t.Title, category = "TASK", priority = t.Priority, due = t.Due, href = $"/org/tasks/{t.Id:D}", to = $"/org/tasks/{t.Id:D}" });
                        }

                        var upcomingMeeting = meetings.FirstOrDefault();
                        object? nextMeeting = upcomingMeeting != null ? new
                        {
                            id = upcomingMeeting.Id.ToString("D"),
                            title = upcomingMeeting.Title,
                            scheduledAt = upcomingMeeting.ScheduledAt,
                            location = !string.IsNullOrWhiteSpace(upcomingMeeting.Location) ? upcomingMeeting.Location : "Meeting Venue",
                            status = upcomingMeeting.Status
                        } : null;

                        return new
                        {
                            metrics = new
                            {
                                needsYou = needs.Count,
                                overdue = tasks.Count(t => t.Status != "DONE"),
                                approvalsPending = approvals.Count,
                                activeCases = cases.Count(c => c.Status != "Closed"),
                                attendanceRate = 94,
                                complianceRate = 98,
                                chapterHealthScore = 96
                            },
                            needs,
                            nextMeeting,
                            chapterHealth = new[]
                            {
                            new { metric = "Attendance Rate", score = 94, status = "HEALTHY" },
                            new { metric = "Renewals on Time", score = 91, status = "HEALTHY" },
                            new { metric = "1-to-1 Completion", score = 88, status = "GOOD" },
                            new { metric = "Referral Velocity", score = 95, status = "EXCELLENT" }
                        },
                            serverTime = now.ToString("o")
                        };
                    }

                case "org.action-centre":
                    {
                        var actions = await _repo.GetActionsAsync(tenantId, 50, ct);
                        var approvals = await _repo.GetApprovalsAsync(tenantId, "PENDING", 20, ct);
                        return new
                        {
                            summary = new
                            {
                                pendingApprovals = approvals.Count,
                                urgentActions = actions.Count(a => a.Priority == "HIGH" || a.Priority == "CRITICAL"),
                                totalOpen = actions.Count(a => a.Status != "DONE") + approvals.Count
                            },
                            items = actions.Select(a => new
                            {
                                id = a.Id.ToString("D"),
                                title = a.Title,
                                owner = a.Owner,
                                due = a.Due,
                                priority = a.Priority,
                                status = a.Status
                            }).ToList(),
                            serverTime = now.ToString("o")
                        };
                    }

                case "org.search":
                    {
                        var q = req.search?.ToLowerInvariant() ?? "";
                        var tasks = await _repo.GetTasksAsync(tenantId, null, 20, ct);
                        var approvals = await _repo.GetApprovalsAsync(tenantId, null, 20, ct);
                        var meetings = await _repo.GetMeetingsAsync(tenantId, null, 20, ct);

                        var searchResults = new List<object>();
                        foreach (var t in tasks.Where(x => string.IsNullOrWhiteSpace(q) || x.Title.ToLowerInvariant().Contains(q)))
                        {
                            searchResults.Add(new { id = t.Id.ToString("D"), title = t.Title, subtitle = $"Task · Due {t.Due}", type = "TASK", href = $"/org/tasks/{t.Id:D}", status = t.Status });
                        }
                        foreach (var a in approvals.Where(x => string.IsNullOrWhiteSpace(q) || x.Subject.ToLowerInvariant().Contains(q)))
                        {
                            searchResults.Add(new { id = a.Id.ToString("D"), title = a.Subject, subtitle = $"Approval · {a.Requester}", type = "APPROVAL", href = $"/org/approvals/{a.Id:D}", status = a.Status });
                        }
                        foreach (var m in meetings.Where(x => string.IsNullOrWhiteSpace(q) || x.Title.ToLowerInvariant().Contains(q)))
                        {
                            searchResults.Add(new { id = m.Id.ToString("D"), title = m.Title, subtitle = $"Meeting · {m.ScheduledAt}", type = "MEETING", href = $"/org/meetings/{m.Id:D}", status = m.Status });
                        }

                        return new { items = searchResults, hasMore = false, totalEstimate = searchResults.Count, serverTime = now.ToString("o") };
                    }

                case "org.hierarchy.summary":
                    return await GetHierarchySummaryAsync(tenantId, ct);

                case "org.hierarchy.rollup":
                    return await GetHierarchyRollupAsync(tenantId, ct);

                case "org.record.get":
                case "record.get":
                case "record":
                    {
                        string entityType = "TASK";
                        string id = "";
                        if (p != null)
                        {
                            if (p.TryGetValue("entityType", out var etObj) && etObj != null)
                            {
                                entityType = etObj is JsonElement jet && jet.ValueKind == JsonValueKind.String ? jet.GetString() ?? "" : etObj.ToString() ?? "";
                            }
                            if (p.TryGetValue("id", out var idObj) && idObj != null)
                            {
                                id = idObj is JsonElement jid && jid.ValueKind == JsonValueKind.String ? jid.GetString() ?? "" : idObj.ToString() ?? "";
                            }
                        }
                        if (string.IsNullOrWhiteSpace(id) && !string.IsNullOrWhiteSpace(req.search))
                        {
                            id = req.search.Trim();
                        }
                        return await GetRecordByIdAsync(entityType, id, tenantId, ct);
                    }

                case "org.tasks.list":
                    return await GetTasksAsync(tenantId, scopeId, req.pageSize ?? 100, ct);

                case "org.actions.list":
                    return await GetActionsAsync(tenantId, scopeId, req.pageSize ?? 100, ct);

                case "org.approvals.list":
                    return await GetApprovalsAsync(tenantId, null, req.pageSize ?? 100, ct);

                case "org.meetings.list":
                    return await GetMeetingsAsync(tenantId, null, req.pageSize ?? 100, allowedScopeIds, ct);

                case "org.member-cases.list":
                    return await GetMemberCasesAsync(tenantId, scopeId, req.pageSize ?? 100, ct);

                case "org.continuity.summary":
                    return await GetContinuitySummaryAsync(tenantId, ct);

                case "org.escalations.list":
                    return await GetEscalationsAsync(tenantId, req.pageSize ?? 100, ct);

                case "org.risks.list":
                    return await GetRisksAsync(tenantId, req.pageSize ?? 100, ct);

                case "org.issues.list":
                    return await GetIssuesAsync(tenantId, req.pageSize ?? 100, ct);

                case "org.decisions.list":
                    return await GetDecisionsAsync(tenantId, req.pageSize ?? 100, ct);

                case "org.chapters.list":
                    return await GetUnitsAsync(tenantId, "CHAPTER", ct);

                case "org.cities.list":
                    return await GetUnitsAsync(tenantId, "CITY", ct);

                case "org.regions.list":
                    return await GetUnitsAsync(tenantId, "REGION", ct);

                case "org.states.list":
                    return await GetUnitsAsync(tenantId, "STATE", ct);

                case "org.calendar.list":
                case "org.calendar":
                    return await GetCalendarAsync(tenantId, scopeId, req.pageSize ?? 50, ct);

                case "org.goals.list":
                case "org.goals":
                case "org.plans.list":
                case "org.plans":
                    {
                        var goals = await _repo.GetGoalsAsync(tenantId, 100, ct);
                        var items = goals.Select(g => new { id = g.Id.ToString("D"), title = g.Title, owner = g.Owner, status = g.Status, progress = g.Progress, reviewCadence = g.ReviewCadence, version = g.Version }).ToList();
                        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
                    }

                case "org.handoffs.list":
                    {
                        var handoffs = await _repo.GetHandoffsAsync(tenantId, 100, ct);
                        if (handoffs.Count == 0)
                        {
                            var seedScopeId = !string.IsNullOrWhiteSpace(scopeId) ? scopeId : "ch-thanjavur";
                            var initialHandoffs = new List<HandoffRecord>
                        {
                            new()
                            {
                                Id = Guid.NewGuid(),
                                TenantId = tenantId,
                                SourceWorkspace = "ORGANISATIONAL",
                                SourceType = "WORKSPACE",
                                SourceId = seedScopeId,
                                TargetWorkspace = "PLATFORM_ADMIN",
                                RequestedCapability = "platform-change",
                                Reason = "Request chapter unit hierarchy and leadership permissions realignment for newly appointed committee chairs.",
                                Status = "Accepted",
                                CorrelationId = $"CORR-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
                                Version = 2,
                                CreatedAt = now.AddDays(-2)
                            },
                            new()
                            {
                                Id = Guid.NewGuid(),
                                TenantId = tenantId,
                                SourceWorkspace = "ORGANISATIONAL",
                                SourceType = "WORKSPACE",
                                SourceId = seedScopeId,
                                TargetWorkspace = "GOVERNANCE",
                                RequestedCapability = "governance-review",
                                Reason = "Independent governance review requested for executive chapter operational compliance and member dispute resolution.",
                                Status = "Requested",
                                CorrelationId = $"CORR-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
                                Version = 1,
                                CreatedAt = now.AddHours(-18)
                            },
                            new()
                            {
                                Id = Guid.NewGuid(),
                                TenantId = tenantId,
                                SourceWorkspace = "ORGANISATIONAL",
                                SourceType = "WORKSPACE",
                                SourceId = seedScopeId,
                                TargetWorkspace = "MEMBER",
                                RequestedCapability = "member-response",
                                Reason = "Direct member notification dispatch regarding verified attendance and dues renewal confirmation.",
                                Status = "Completed",
                                CorrelationId = $"CORR-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
                                Version = 3,
                                CreatedAt = now.AddDays(-5)
                            }
                        };
                            foreach (var ih in initialHandoffs)
                            {
                                await _repo.SaveHandoffAsync(ih, ct);
                            }
                            handoffs = initialHandoffs;
                        }

                        var items = handoffs.Select(h => new
                        {
                            id = h.Id.ToString("D"),
                            title = $"Handoff {h.SourceWorkspace} → {h.TargetWorkspace}",
                            sourceWorkspace = h.SourceWorkspace,
                            targetWorkspace = h.TargetWorkspace,
                            sourceType = h.SourceType,
                            sourceId = h.SourceId,
                            requestedCapability = h.RequestedCapability,
                            reason = h.Reason,
                            status = h.Status,
                            correlationId = string.IsNullOrWhiteSpace(h.CorrelationId) ? $"CORR-{h.Id.ToString("N")[..8].ToUpperInvariant()}" : h.CorrelationId,
                            targetReference = h.TargetReference,
                            version = h.Version,
                            createdAt = h.CreatedAt.ToString("o")
                        }).ToList();
                        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
                    }

                case "org.networking.summary":
                    {
                        Guid? chFilter = !string.IsNullOrWhiteSpace(scopeId) && Guid.TryParse(scopeId, out var sG) ? sG : null;
                        var metrics = await _repo.GetNetworkingMetricsAsync(tenantId, chFilter, ct);
                        var pendingMembers = await _repo.GetDbnMemberRegistrationsAsync(tenantId, scopeId, "Submitted", ct);
                        var lowMembers = pendingMembers.Select(m => new
                        {
                            id = m.Id.ToString("D"),
                            name = m.ApplicantFullName,
                            specialisation = !string.IsNullOrWhiteSpace(m.PrimaryBusinessCategory) ? m.PrimaryBusinessCategory : "Member",
                            engagement = 50,
                            duesStatus = "Pending"
                        }).Take(5).ToList();

                        var outcomeVal = metrics.recordedOutcomeValue;
                        var totalOutcome = outcomeVal > 0 ? outcomeVal : 0m;
                        var connCount = metrics.connections;
                        var oneToOneCount = metrics.oneToOnes;
                        var refCount = metrics.referencesGiven;
                        var oppCount = metrics.opportunityResponses;
                        var actCount = metrics.activeMembers;

                        return new
                        {
                            period = "current",
                            connections = connCount,
                            oneToOnes = oneToOneCount,
                            referencesGiven = refCount,
                            referencesReceived = refCount,
                            opportunityResponses = oppCount,
                            recordedOutcomeValue = totalOutcome,
                            activeMembers = actCount,
                            participatingMembers = actCount,
                            lowParticipation = lowMembers,
                            source = "database-canonical",
                            metrics = new
                            {
                                oneToOneTarget = actCount * 2,
                                oneToOneActual = oneToOneCount,
                                referralsTarget = actCount * 3,
                                referralsActual = refCount,
                                businessGiven = $"₹ {totalOutcome:N0}",
                                thankYouNotes = refCount
                            },
                            serverTime = now.ToString("o")
                        };
                    }

                case "org.reports.summary":
                    {
                        var tasks = await _repo.GetTasksAsync(tenantId, null, 100, ct);
                        var cases = await _repo.GetMemberCasesAsync(tenantId, 100, ct);
                        var audits = await _repo.GetAuditLogsAsync(tenantId, 100, ct);

                        if (allowedScopeIds != null && allowedScopeIds.Count > 0)
                        {
                            tasks = tasks.Where(t => string.IsNullOrWhiteSpace(t.ScopeId) || allowedScopeIds.Contains(t.ScopeId)).ToList();
                            cases = cases.Where(c => string.IsNullOrWhiteSpace(c.ScopeId) || allowedScopeIds.Contains(c.ScopeId)).ToList();
                        }
                        else if (!string.IsNullOrWhiteSpace(scopeId))
                        {
                            tasks = tasks.Where(t => string.IsNullOrWhiteSpace(t.ScopeId) || t.ScopeId == scopeId).ToList();
                            cases = cases.Where(c => string.IsNullOrWhiteSpace(c.ScopeId) || c.ScopeId == scopeId).ToList();
                        }

                        var completedCount = tasks.Count(t => t.Status == "DONE");
                        var totalTasks = tasks.Count;
                        var openCases = cases.Count(c => c.Status != "Closed");
                        var openSupport = cases.Count(c => c.Type == "SUPPORT" && c.Status != "Closed");
                        var totalAudits = audits.Count;

                        return new
                        {
                            taskCompleted = completedCount,
                            taskTotal = totalTasks,
                            openMemberCases = openCases,
                            openSupportRequests = openSupport,
                            auditEvents = totalAudits,
                            chapterHealthScore = totalTasks == 0 && openCases == 0 ? 100 : Math.Max(0, 100 - (openCases * 10)),
                            volunteerEffort = Array.Empty<object>(),
                            automation = new[]
                            {
                            new { key = "sync_health", label = "Data Sync Health", value = 100, unit = "%" }
                        },
                            serverTime = now.ToString("o")
                        };
                    }

                case "org.chapter.operations.summary":
                    {
                        var tasks = await _repo.GetTasksAsync(tenantId, null, 50, ct);
                        var cases = await _repo.GetMemberCasesAsync(tenantId, 50, ct);
                        Guid? chFilter = !string.IsNullOrWhiteSpace(scopeId) && Guid.TryParse(scopeId, out var parsedCh) ? parsedCh : null;
                        var leaders = await _repo.GetChapterLeadersAsync(chFilter, ct);
                        var officeBearers = leaders.Select(l => new
                        {
                            id = l.Id.ToString("D"),
                            name = l.FullName,
                            position = l.Position,
                            effectiveFrom = l.CreatedAt.ToString("yyyy-MM-dd"),
                            effectiveTo = l.CreatedAt.AddYears(1).ToString("yyyy-MM-dd"),
                            scope = new { id = l.ChapterId?.ToString("D") ?? scopeId, name = actorScope?.ScopeName ?? "Chapter" }
                        }).ToList();

                        var pendingRegistrations = await _repo.GetDbnMemberRegistrationsAsync(tenantId, scopeId, "Submitted", ct);
                        var membersRequiringAttention = pendingRegistrations.Select(m => new
                        {
                            id = m.Id.ToString("D"),
                            name = m.ApplicantFullName,
                            status = m.Stage,
                            engagement = 50,
                            chapter = m.ChapterName
                        }).ToList();

                        return new
                        {
                            openTasks = tasks.Count(t => t.Status != "DONE"),
                            openMemberCases = cases.Count(c => c.Status != "Closed"),
                            officeBearers,
                            membersRequiringAttention,
                            serverTime = now.ToString("o")
                        };
                    }

                case "org.meeting.agenda-candidates":
                    {
                        var tasks = await _repo.GetTasksAsync(tenantId, "TODO", 10, ct);
                        var items = tasks.Select(t => new { id = t.Id.ToString("D"), title = t.Title, owner = t.Owner, type = "TASK_REVIEW" }).ToList();
                        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
                    }

                case "org.people.list":
                    {
                        var scopeName = actorScope?.ScopeName ?? "Chapter Unit";
                        Guid? chFilter = null;
                        if (!string.IsNullOrWhiteSpace(scopeId) && Guid.TryParse(scopeId, out var parsedCh))
                        {
                            chFilter = parsedCh;
                        }

                        var leaders = await _repo.GetChapterLeadersAsync(chFilter, ct);
                        var appts = await _repo.GetAppointmentsAsync(tenantId, ct);
                        var users = await _repo.GetUsersAsync(tenantId, ct);
                        var userMap = users.ToDictionary(u => u.Id, u => u);

                        var peopleList = new List<object>();

                        foreach (var l in leaders)
                        {
                            peopleList.Add(new
                            {
                                id = l.Id.ToString("D"),
                                memberId = l.Id.ToString("D"),
                                name = l.FullName,
                                position = l.Position,
                                email = l.Email,
                                phone = l.Phone,
                                scope = new { id = l.ChapterId?.ToString("D") ?? scopeId, name = scopeName, level = "CHAPTER" },
                                converseConversationId = $"conv-{l.Id.ToString("N")[..8]}"
                            });
                        }

                        foreach (var a in appts)
                        {
                            if (chFilter.HasValue && a.ChapterId != chFilter.Value) continue;
                            if (userMap.TryGetValue(a.UserId, out var u) && !leaders.Any(l => l.Email.Equals(u.Email, StringComparison.OrdinalIgnoreCase)))
                            {
                                peopleList.Add(new
                                {
                                    id = a.Id.ToString("D"),
                                    memberId = a.UserId.ToString("D"),
                                    name = u.Name,
                                    position = a.RoleCode,
                                    email = u.Email,
                                    phone = u.PhoneNumber,
                                    scope = new { id = a.ChapterId.ToString("D"), name = scopeName, level = "CHAPTER" },
                                    converseConversationId = $"conv-{a.Id.ToString("N")[..8]}"
                                });
                            }
                        }

                        return new { items = peopleList, hasMore = false, totalEstimate = peopleList.Count, serverTime = now.ToString("o") };
                    }

                case "org.assignments.list":
                    {
                        var appts = await _repo.GetAppointmentsAsync(tenantId, ct);
                        var items = appts.Select(a => new
                        {
                            id = a.Id.ToString("D"),
                            memberId = a.UserId.ToString("D"),
                            memberName = "Officer",
                            roleType = a.RoleCode,
                            organisationLevel = "CHAPTER",
                            organisationUnitId = a.ChapterId.ToString("D"),
                            organisationUnitName = "Hosur Chapter",
                            effectiveFrom = a.StartsAt.ToString("o"),
                            effectiveTo = a.EndsAt.ToString("o"),
                            status = a.Status.ToString().ToUpperInvariant(),
                            version = 1
                        }).ToList();
                        if (items.Count == 0)
                        {
                            items.Add(new
                            {
                                id = "assign-001",
                                memberId = "00000000-0000-0000-0000-000000000099",
                                memberName = "Sethu DBN Officer",
                                roleType = "CHAPTER_PRESIDENT",
                                organisationLevel = "CHAPTER",
                                organisationUnitId = scopeId,
                                organisationUnitName = "Hosur Chapter",
                                effectiveFrom = "2026-04-01T00:00:00Z",
                                effectiveTo = "2027-03-31T23:59:59Z",
                                status = "ACTIVE",
                                version = 1
                            });
                        }
                        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
                    }

                case "org.chapter-coordinators.list":
                    {
                        var items = new[]
                        {
                        new { id = "coord-001", name = "Venkatesh Rao", chapter = "Hosur Chapter", region = "Krishnagiri Region", email = "venkat@dbn.org", phone = "+91 98450 11223", status = "ACTIVE" },
                        new { id = "coord-002", name = "Meena Narayanan", chapter = "Salem Dynamic", region = "Salem Region", email = "meena@dbn.org", phone = "+91 98450 44556", status = "ACTIVE" }
                    };
                        return new { items, hasMore = false, totalEstimate = items.Length, serverTime = now.ToString("o") };
                    }

                case "org.delegations.list":
                    {
                        var delegs = await _repo.GetDelegationsAsync(tenantId, ct);
                        var items = delegs.Select(d =>
                        {
                            var isExpired = d.EndsAt <= now;
                            var status = d.Revoked ? "Revoked" : (isExpired ? "Expired" : "Active");
                            var funcs = string.IsNullOrWhiteSpace(d.Permission) ? new[] { "operational follow-through" } : new[] { d.Permission };
                            return new
                            {
                                id = d.Id.ToString("D"),
                                delegatorId = d.DelegatorId.ToString("D"),
                                delegateId = d.DelegateId.ToString("D"),
                                scopeId = d.ChapterId.ToString("D"),
                                functions = funcs,
                                start = d.StartsAt.ToString("o"),
                                end = d.EndsAt.ToString("o"),
                                reason = "Operational delegation",
                                status = status,
                                version = d.Revoked ? 2 : 1
                            };
                        }).ToList();
                        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
                    }

                case "org.handovers.list":
                    {
                        var handovers = await _repo.GetHandoversAsync(tenantId, scopeId, 50, ct);
                        var items = handovers.Select(h =>
                        {
                            string[] openTasks = Array.Empty<string>();
                            string[] openActions = Array.Empty<string>();
                            string[] openCases = Array.Empty<string>();
                            string[] meetings = Array.Empty<string>();
                            string[] programmes = Array.Empty<string>();
                            string[] documents = Array.Empty<string>();

                            try { if (!string.IsNullOrEmpty(h.OpenTaskIdsJson)) openTasks = System.Text.Json.JsonSerializer.Deserialize<string[]>(h.OpenTaskIdsJson) ?? openTasks; } catch { }
                            try { if (!string.IsNullOrEmpty(h.OpenActionIdsJson)) openActions = System.Text.Json.JsonSerializer.Deserialize<string[]>(h.OpenActionIdsJson) ?? openActions; } catch { }
                            try { if (!string.IsNullOrEmpty(h.OpenCaseIdsJson)) openCases = System.Text.Json.JsonSerializer.Deserialize<string[]>(h.OpenCaseIdsJson) ?? openCases; } catch { }
                            try { if (!string.IsNullOrEmpty(h.MeetingIdsJson)) meetings = System.Text.Json.JsonSerializer.Deserialize<string[]>(h.MeetingIdsJson) ?? meetings; } catch { }
                            try { if (!string.IsNullOrEmpty(h.ProgrammeIdsJson)) programmes = System.Text.Json.JsonSerializer.Deserialize<string[]>(h.ProgrammeIdsJson) ?? programmes; } catch { }
                            try { if (!string.IsNullOrEmpty(h.DocumentIdsJson)) documents = System.Text.Json.JsonSerializer.Deserialize<string[]>(h.DocumentIdsJson) ?? documents; } catch { }

                            return new
                            {
                                id = h.Id.ToString("D"),
                                assignmentId = h.AssignmentId,
                                outgoingMemberId = h.OutgoingMemberId,
                                incomingMemberId = h.IncomingMemberId,
                                scopeId = h.ScopeId,
                                status = h.Status,
                                preparedAt = h.PreparedAt,
                                acceptedAt = h.AcceptedAt,
                                completedAt = h.CompletedAt,
                                openTaskIds = openTasks,
                                openActionIds = openActions,
                                openCaseIds = openCases,
                                meetingIds = meetings,
                                programmeIds = programmes,
                                documentIds = documents,
                                version = h.Version
                            };
                        }).ToList();
                        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
                    }

                case "org.availability.list":
                    {
                        var avails = await _repo.GetAvailabilitiesAsync(tenantId, ct);
                        var currentActorName = !string.IsNullOrWhiteSpace(actorScope?.Name) ? actorScope.Name : "Saravanan";
                        var currentRole = !string.IsNullOrWhiteSpace(actorScope?.Position) ? actorScope.Position : (!string.IsNullOrWhiteSpace(actorScope?.Role) ? actorScope.Role : "Chapter President");
                        var items = avails.OrderByDescending(a => a.CreatedAt).Select(a => new
                        {
                            id = a.Id.ToString("D"),
                            actorId = a.ActorId,
                            actorName = currentActorName,
                            role = currentRole,
                            availability = a.Availability,
                            effectiveFrom = a.EffectiveFrom,
                            effectiveTo = a.EffectiveTo,
                            reason = a.Reason,
                            scopeId = a.ScopeId,
                            version = a.Version,
                            createdAt = a.CreatedAt.ToString("o")
                        }).ToList();
                        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
                    }

                case "org.members.list":
                    {
                        var dbnMembers = await _repo.GetDbnMemberRegistrationsAsync(tenantId, scopeId, null, ct);
                        var search = req.search?.Trim();
                        if (!string.IsNullOrWhiteSpace(search))
                        {
                            dbnMembers = dbnMembers.Where(m =>
                                m.ApplicantFullName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                m.BusinessName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                m.Email.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                m.MobileNumber.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                (m.AssignedMemberId != null && m.AssignedMemberId.Contains(search, StringComparison.OrdinalIgnoreCase))
                            ).ToList();
                        }

                        var items = dbnMembers.Select(m => new
                        {
                            id = m.Id.ToString("D"),
                            memberId = !string.IsNullOrWhiteSpace(m.AssignedMemberId) ? m.AssignedMemberId : m.Id.ToString("D"),
                            name = m.ApplicantFullName,
                            company = m.BusinessName,
                            business = m.BusinessName,
                            position = !string.IsNullOrWhiteSpace(m.ApplicantDesignation) ? m.ApplicantDesignation : "Member",
                            specialisation = !string.IsNullOrWhiteSpace(m.PrimaryBusinessCategory) ? m.PrimaryBusinessCategory : (!string.IsNullOrWhiteSpace(m.ApplicantDesignation) ? m.ApplicantDesignation : "General Member"),
                            chapter = m.ChapterName,
                            baseChapterId = m.ChapterId?.ToString("D") ?? scopeId,
                            status = m.Stage == "Activated" ? "Active" : m.Stage,
                            phone = m.MobileNumber,
                            email = m.Email,
                            engagement = m.Stage == "Activated" ? 95 : 50,
                            duesStatus = m.Stage == "Activated" ? "PAID" : "PENDING",
                            membershipTerm = "2026-2027 Annual",
                            version = 1
                        }).ToList();

                        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
                    }

                case "org.member-growth.list":
                    {
                        var pendingMembers = await _repo.GetDbnMemberRegistrationsAsync(tenantId, scopeId, null, ct);
                        var items = pendingMembers.Where(m => m.Stage != "Activated").Select(m => new
                        {
                            id = m.Id.ToString("D"),
                            name = m.ApplicantFullName,
                            business = m.BusinessName,
                            specialisation = !string.IsNullOrWhiteSpace(m.PrimaryBusinessCategory) ? m.PrimaryBusinessCategory : "Prospect",
                            owner = m.ChapterName,
                            status = m.Stage,
                            chapterId = m.ChapterId?.ToString("D") ?? scopeId,
                            nextFollowUp = m.CreatedAt.AddDays(7).ToString("yyyy-MM-dd"),
                            version = 1
                        }).ToList();

                        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
                    }

                case "org.member-dues.list":
                    {
                        var dbnMembers = await _repo.GetDbnMemberRegistrationsAsync(tenantId, scopeId, null, ct);

                        var items = dbnMembers.Select(m =>
                        {
                            var isActivated = m.Stage == "Activated";
                            var isPaid = isActivated || m.TrustPaymentVerifiedAt != null;
                            var pRef = !string.IsNullOrWhiteSpace(m.UpiReference)
                                ? m.UpiReference
                                : (!string.IsNullOrWhiteSpace(m.NeftReference)
                                    ? m.NeftReference
                                    : (!string.IsNullOrWhiteSpace(m.ChequeNumber)
                                        ? m.ChequeNumber
                                        : $"TXN-{m.Id.ToString("N")[..8].ToUpperInvariant()}"));

                            return new
                            {
                                id = m.Id.ToString("D"),
                                memberId = !string.IsNullOrWhiteSpace(m.AssignedMemberId) ? m.AssignedMemberId : m.Id.ToString("D"),
                                memberName = m.ApplicantFullName,
                                business = m.BusinessName,
                                chapter = m.ChapterName,
                                membershipTerm = "2026-2027 Annual",
                                amount = m.DonationAmount > 0 ? m.DonationAmount : 6000m,
                                dueDate = m.CreatedAt.AddMonths(1).ToString("yyyy-MM-dd"),
                                status = isPaid ? "Paid" : "Pending",
                                exceptionStatus = isPaid ? "NONE" : "NEEDS_RECONCILIATION",
                                paymentReferenceMasked = pRef,
                                paymentMethod = !string.IsNullOrWhiteSpace(m.PaymentMode) ? m.PaymentMode : "UPI",
                                paidAt = (m.TrustPaymentVerifiedAt ?? m.CreatedAt).ToString("yyyy-MM-dd"),
                                reconciledAt = m.TrustPaymentVerifiedAt?.ToString("yyyy-MM-dd"),
                                reconciledBy = m.TrustPaymentVerifiedBy ?? (isPaid ? "Trust Administrator" : null),
                                version = 1
                            };
                        }).ToList();

                        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
                    }

                case "org.committees.list":
                    {
                        var committees = await _repo.GetCommitteesAsync(tenantId, ct);
                        var items = committees.Select(c => new
                        {
                            id = c.ChapterId.ToString("D"),
                            name = "Chapter Leadership Committee",
                            chapterId = c.ChapterId.ToString("D"),
                            status = "ACTIVE",
                            version = c.Version
                        }).ToList();
                        if (items.Count == 0)
                        {
                            items.Add(new { id = "comm-001", name = "Membership Committee", chapterId = scopeId, status = "ACTIVE", version = 1L });
                            items.Add(new { id = "comm-002", name = "Events & Programmes", chapterId = scopeId, status = "ACTIVE", version = 1L });
                        }
                        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
                    }

                case "org.programmes.list":
                case "org.programmes":
                case "org.projects.list":
                case "org.projects":
                    {
                        var programmes = await _repo.GetProgrammesAsync(tenantId, 100, ct);
                        if (req.queryId != null && req.queryId.Contains("project", StringComparison.OrdinalIgnoreCase))
                        {
                            var projects = programmes.Where(pItem => pItem.Category.Equals("PROJECT", StringComparison.OrdinalIgnoreCase)).ToList();
                            if (projects.Count > 0) programmes = projects;
                        }
                        var items = programmes.Select(pItem => new
                        {
                            id = pItem.Id.ToString("D"),
                            name = pItem.Name,
                            category = pItem.Category,
                            owner = pItem.Owner,
                            sponsor = pItem.Sponsor,
                            committeeId = pItem.CommitteeId,
                            status = pItem.Status,
                            progress = pItem.Progress,
                            nextMilestone = pItem.NextMilestone,
                            risk = pItem.Risk,
                            version = pItem.Version
                        }).ToList();
                        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
                    }

                case "org.events.list":
                case "org.event.list":
                case "org.events":
                    return await GetEventsAsync(tenantId, scopeId, req.pageSize ?? 50, allowedScopeIds, ct);

                case "org.attendance.list":
                    {
                        var records = await _repo.GetAttendanceRecordsAsync(tenantId, 100, ct);
                        var meetings = await _repo.GetMeetingsAsync(tenantId, null, 20, ct);

                        var dbMembers = await _repo.GetDbnMemberRegistrationsAsync(tenantId, scopeId, null, ct);
                        var dbLeaders = await _repo.GetChapterLeadersAsync(null, ct);

                        var memberList = new List<(Guid Id, string Name, string Role)>();
                        foreach (var l in dbLeaders)
                        {
                            memberList.Add((l.Id, l.FullName, l.Position));
                        }
                        foreach (var m in dbMembers)
                        {
                            if (!dbLeaders.Any(l => string.Equals(l.Email, m.Email, StringComparison.OrdinalIgnoreCase)))
                            {
                                memberList.Add((m.Id, m.ApplicantFullName, !string.IsNullOrWhiteSpace(m.ApplicantDesignation) ? m.ApplicantDesignation : "Member"));
                            }
                        }

                        var memberMap = memberList.ToDictionary(m => m.Id, m => $"{m.Name} ({m.Role})");

                        if (records.Count == 0)
                        {
                            var defaultMeetingId = Guid.Parse("33333333-3333-3333-3333-333333333301");
                            var meeting = await _repo.GetMeetingByIdAsync(defaultMeetingId, tenantId, ct);
                            if (meeting == null)
                            {
                                meeting = new MeetingRecord
                                {
                                    Id = defaultMeetingId,
                                    TenantId = tenantId,
                                    ScopeId = scopeId ?? "",
                                    ScopeName = actorScope?.ScopeName ?? "Thanjavur Chapter",
                                    ScopeLevel = "CHAPTER",
                                    Title = "Weekly Chapter Business Meeting",
                                    Type = "REGULAR",
                                    ScheduledAt = now.AddDays(-3).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                                    Status = "COMPLETED",
                                    Version = 1,
                                    CreatedAt = now.AddDays(-3),
                                    UpdatedAt = now.AddDays(-3)
                                };
                                await _repo.SaveMeetingAsync(meeting, ct);
                            }

                            var initialStatuses = new[] { "Present", "Present", "Absent", "Substitute", "Present", "Present", "Excused", "Absent" };
                            for (int i = 0; i < memberList.Count; i++)
                            {
                                var att = new AttendanceRecord
                                {
                                    Id = Guid.NewGuid(),
                                    TenantId = tenantId,
                                    MemberId = memberList[i].Id,
                                    EventId = defaultMeetingId,
                                    Status = initialStatuses[i % initialStatuses.Length],
                                    Finalised = true,
                                    CorrectionStatus = "none",
                                    UpdatedAt = now.AddDays(-3)
                                };
                                await _repo.SaveAttendanceRecordAsync(att, ct);
                                records.Add(att);
                            }
                        }

                        var meetingDict = meetings.ToDictionary(m => m.Id, m => m.Title);

                        var items = records.Select(a =>
                        {
                            var mName = memberMap.TryGetValue(a.MemberId, out var foundName)
                                ? foundName
                                : (!string.IsNullOrWhiteSpace(a.CorrectionReason) && a.CorrectionReason.Contains("Member:")
                                    ? a.CorrectionReason.Split(new[] { "Member:" }, StringSplitOptions.None)[1].Split('|')[0].Trim()
                                    : "Chapter Member");

                            var meetingTitle = meetingDict.TryGetValue(a.EventId, out var foundTitle)
                                ? foundTitle
                                : (!string.IsNullOrWhiteSpace(a.CorrectionReason) && a.CorrectionReason.Contains("Session:")
                                    ? a.CorrectionReason.Split(new[] { "Session:" }, StringSplitOptions.None)[1].Split('|')[0].Trim()
                                    : "Weekly Chapter Business Meeting");

                            var isVerified = !string.IsNullOrWhiteSpace(a.CorrectionReason) && a.CorrectionReason.Contains("Meeting Payment Verified");
                            var paymentStatus = isVerified ? "Paid & Verified" : (a.Status.Equals("Absent", StringComparison.OrdinalIgnoreCase) ? "Exempt" : "Pending Verification");

                            return new
                            {
                                id = a.Id.ToString("D"),
                                memberId = a.MemberId.ToString("D"),
                                memberName = mName,
                                sessionType = "MEETING",
                                sessionId = meetingTitle,
                                meetingId = a.EventId.ToString("D"),
                                meetingTitle = meetingTitle,
                                date = a.UpdatedAt.ToString("yyyy-MM-dd"),
                                status = a.Status,
                                paymentStatus = paymentStatus,
                                isPaymentVerified = isVerified,
                                canCorrect = true,
                                version = 1,
                                recordedAt = a.UpdatedAt.ToString("o"),
                                scope = new { id = scopeId, name = actorScope?.ScopeName ?? "Thanjavur Chapter", level = "CHAPTER" }
                            };
                        }).ToList();

                        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
                    }

                case "org.kyt.list":
                    {
                        var kyts = await _repo.GetKytsAsync(tenantId, 100, ct);
                        if (allowedScopeIds != null && allowedScopeIds.Count > 0)
                        {
                            kyts = kyts.Where(k => string.IsNullOrWhiteSpace(k.ScopeId) || allowedScopeIds.Contains(k.ScopeId)).ToList();
                        }
                        var items = kyts.Select(k =>
                        {
                            var rawStage = k.Stage ?? "Planned";
                            var status = rawStage.Equals("INITIAL_VISIT", StringComparison.OrdinalIgnoreCase) || rawStage.Equals("PLANNED", StringComparison.OrdinalIgnoreCase)
                                ? "Planned"
                                : rawStage;
                            var date = !string.IsNullOrEmpty(k.DueDate) ? k.DueDate : now.AddDays(7).ToString("o");
                            return new
                            {
                                id = k.Id.ToString("D"),
                                title = $"KYT: {k.MemberName}",
                                memberId = !string.IsNullOrEmpty(k.MemberId) ? k.MemberId : "00000000-0000-0000-0000-000000000001",
                                memberName = !string.IsNullOrEmpty(k.MemberName) ? k.MemberName : "Member",
                                stage = status,
                                status = status,
                                owner = k.AssignedLead ?? "Chapter President",
                                notes = k.Notes,
                                assignedLead = k.AssignedLead,
                                dueDate = date,
                                date = date,
                                scheduledAt = date,
                                needs = new string[] { "Industrial Machinery", "Export Logistics" },
                                offers = new string[] { "Apparel Sourcing", "Textile Finishing" },
                                potentialConnections = new string[] { "00000000-0000-0000-0000-000000000002" },
                                scope = new { id = !string.IsNullOrEmpty(k.ScopeId) ? k.ScopeId : "ch-hosur", name = !string.IsNullOrEmpty(k.ScopeName) ? k.ScopeName : "Hosur Chapter", level = !string.IsNullOrEmpty(k.ScopeLevel) ? k.ScopeLevel : "CHAPTER" },
                                version = k.Version
                            };
                        }).ToList();
                        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
                    }

                case "org.member-presentations.list":
                    {
                        var presentations = await _repo.GetPresentationsAsync(tenantId, 100, ct);
                        var items = presentations.Select(pItem => new
                        {
                            id = pItem.Id.ToString("D"),
                            memberId = pItem.MemberId,
                            memberName = pItem.MemberName,
                            topic = pItem.Topic,
                            scheduledDate = pItem.ScheduledDate,
                            scheduledAt = pItem.ScheduledDate,
                            status = pItem.Status,
                            durationMinutes = pItem.DurationMinutes,
                            version = pItem.Version
                        }).ToList();
                        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
                    }

                case "org.mom.list":
                case "org.mom":
                    {
                        var meetings = await _repo.GetMeetingsAsync(tenantId, null, 100, ct);
                        if (allowedScopeIds != null && allowedScopeIds.Count > 0)
                        {
                            meetings = meetings.Where(m => string.IsNullOrWhiteSpace(m.ScopeId) || allowedScopeIds.Contains(m.ScopeId)).ToList();
                        }
                        var items = meetings.Select(m => new
                        {
                            id = m.Id.ToString("D"),
                            title = m.Title,
                            type = m.Type,
                            scheduledAt = m.ScheduledAt,
                            location = !string.IsNullOrWhiteSpace(m.Location) ? m.Location : "Online / Venue TBD",
                            minutes = !string.IsNullOrWhiteSpace(m.Minutes) ? m.Minutes : "Pending preparation and circulation.",
                            status = !string.IsNullOrWhiteSpace(m.Minutes) ? "PUBLISHED" : m.Status,
                            momPublished = !string.IsNullOrWhiteSpace(m.Minutes),
                            quorumRequired = m.QuorumRequired > 0 ? m.QuorumRequired : 1,
                            version = m.Version,
                            scope = new { id = m.ScopeId, name = m.ScopeName, level = m.ScopeLevel }
                        }).ToList();
                        return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
                    }

                case "org.support-requests.list":
                    {
                        var supportCases = await _repo.GetMemberCasesAsync(tenantId, 100, ct);
                        var supportOnly = supportCases.Where(c => string.Equals(c.Type, "SUPPORT", StringComparison.OrdinalIgnoreCase)).ToList();
                        var mapped = supportOnly.Select(c =>
                        {
                            var targetParts = (c.MemberMessage ?? "").Split('|');
                            var tgtName = targetParts.Length > 0 && !string.IsNullOrWhiteSpace(targetParts[0]) ? targetParts[0] : "Krishnagiri Region";
                            var tgtLevel = targetParts.Length > 1 && !string.IsNullOrWhiteSpace(targetParts[1]) ? targetParts[1] : "REGION";
                            return new
                            {
                                id = c.Id.ToString("D"),
                                title = c.Title,
                                summary = c.InternalNote,
                                requesterScope = new
                                {
                                    id = !string.IsNullOrWhiteSpace(c.ScopeId) ? c.ScopeId : scopeId,
                                    name = !string.IsNullOrWhiteSpace(c.ScopeName) ? c.ScopeName : (actorScope?.ScopeName ?? "Chapter"),
                                    level = !string.IsNullOrWhiteSpace(c.ScopeLevel) ? c.ScopeLevel : "CHAPTER"
                                },
                                targetScope = new
                                {
                                    id = !string.IsNullOrWhiteSpace(c.MemberId) ? c.MemberId : "22222222-2222-2222-2222-222222222222",
                                    name = tgtName,
                                    level = tgtLevel
                                },
                                status = c.Status,
                                owner = c.Owner,
                                version = c.Version,
                                to = $"/org/support/{c.Id:D}",
                                createdAt = c.CreatedAt.ToString("o")
                            };
                        }).ToList();

                        if (mapped.Count == 0)
                        {
                            mapped.Add(new
                            {
                                id = "supp-001",
                                title = "Regional Venue Approval Assistance",
                                summary = "Assistance requested from Region for special anniversary meeting hall reservation.",
                                requesterScope = new { id = scopeId, name = actorScope?.ScopeName ?? "Hosur Chapter", level = "CHAPTER" },
                                targetScope = new { id = "22222222-2222-2222-2222-222222222222", name = "Krishnagiri Region", level = "REGION" },
                                status = "OPEN",
                                owner = "DBN Officer",
                                version = (long)1,
                                to = "/org/support/supp-001",
                                createdAt = now.ToString("o")
                            });
                        }
                        return new { items = mapped, hasMore = false, totalEstimate = mapped.Count, serverTime = now.ToString("o") };
                    }

                case "org.exceptions.list":
                    {
                        var items = await _repo.GetExceptionsAsync(tenantId, 100, ct);
                        var mapped = items.Select(e => new
                        {
                            id = e.Id.ToString("D"),
                            title = e.Title,
                            description = e.Description,
                            status = e.Status,
                            decision = e.Decision,
                            owner = e.Owner,
                            version = e.Version,
                            recordedAt = e.CreatedAt.ToString("o"),
                            to = $"/org/exceptions/{e.Id:D}",
                            meta = $"Requested by {e.Owner} · {(string.IsNullOrWhiteSpace(e.Description) ? "Operational Exception" : e.Description)}"
                        }).ToList();
                        return new { items = mapped, hasMore = false, totalEstimate = mapped.Count, serverTime = now.ToString("o") };
                    }

                case "org.notifications.list":
                    {
                        var scopeName = actorScope?.ScopeName ?? "Thanjavur Chapter";
                        var scopeLevel = actorScope?.ScopeLevel ?? "CHAPTER";
                        var items = new[]
                        {
                        new { id = "notif-001", title = "New Member application received", sourceType = "MEMBERSHIP", sourceId = "app-001", status = "Unread", to = "/org/member-onboarding", scope = new { id = scopeId, name = scopeName, level = scopeLevel }, createdAt = now.AddHours(-1).ToString("o"), version = 1 },
                        new { id = "notif-002", title = "Weekly chapter meeting agenda published", sourceType = "MEETING", sourceId = "meet-104", status = "Read", to = "/org/meetings", scope = new { id = scopeId, name = scopeName, level = scopeLevel }, createdAt = now.AddHours(-5).ToString("o"), version = 1 }
                    };
                        return new { items, hasMore = false, totalEstimate = items.Length, serverTime = now.ToString("o") };
                    }

                case "org.alerts.list":
                    {
                        var scopeName = actorScope?.ScopeName ?? "Thanjavur Chapter";
                        var scopeLevel = actorScope?.ScopeLevel ?? "CHAPTER";
                        var items = new[]
                        {
                        new { id = "alert-001", title = "Payment reconciliation pending verification", sourceType = "FINANCE", sourceId = "pay-001", severity = "HIGH", status = "ACTIVE", requiresAction = true, to = "/org/membership-dues", scope = new { id = scopeId, name = scopeName, level = scopeLevel }, createdAt = now.AddHours(-2).ToString("o"), version = 1 },
                        new { id = "alert-002", title = "Meeting quorum confirmation required", sourceType = "MEETING", sourceId = "meet-105", severity = "MEDIUM", status = "ACTIVE", requiresAction = true, to = "/org/meetings", scope = new { id = scopeId, name = scopeName, level = scopeLevel }, createdAt = now.AddDays(-1).ToString("o"), version = 1 }
                    };
                        return new { items, hasMore = false, totalEstimate = items.Length, serverTime = now.ToString("o") };
                    }

                case "org.communications.list":
                    {
                        var scopeName = actorScope?.ScopeName ?? "Thanjavur Chapter";
                        var scopeLevel = actorScope?.ScopeLevel ?? "CHAPTER";
                        var items = await _repo.GetCommunicationsAsync(tenantId, 100, ct);
                        if (items.Count == 0)
                        {
                            var seedScopeId = !string.IsNullOrWhiteSpace(scopeId) ? scopeId : "ch-thanjavur";
                            var c1 = new CommunicationRecord
                            {
                                Id = Guid.NewGuid(),
                                TenantId = tenantId,
                                ScopeId = seedScopeId,
                                AudienceScopeId = seedScopeId,
                                AudienceLevel = scopeLevel,
                                IncludeDescendants = true,
                                Title = "Q3 Chapter Performance & Leadership Announcements",
                                Body = "Please find the highlights of the third-quarter operational milestones and upcoming regional summits.",
                                Audience = "All Chapter Members",
                                Status = "Published",
                                PublishedAt = now.AddDays(-2).ToString("o"),
                                Version = 1,
                                CreatedAt = now.AddDays(-2)
                            };
                            var c2 = new CommunicationRecord
                            {
                                Id = Guid.NewGuid(),
                                TenantId = tenantId,
                                ScopeId = seedScopeId,
                                AudienceScopeId = seedScopeId,
                                AudienceLevel = scopeLevel,
                                IncludeDescendants = true,
                                Title = "Annual Trust Membership Renewal Window Open",
                                Body = "The annual dues renewal portal is now active for financial year 2026-2027.",
                                Audience = "Executive Committee",
                                Status = "Active",
                                PublishedAt = now.AddDays(-5).ToString("o"),
                                Version = 1,
                                CreatedAt = now.AddDays(-5)
                            };
                            await _repo.SaveCommunicationAsync(c1, ct);
                            await _repo.SaveCommunicationAsync(c2, ct);
                            items = await _repo.GetCommunicationsAsync(tenantId, 100, ct);
                        }
                        if (!string.IsNullOrWhiteSpace(scopeId) && !scopeId.Equals("all", StringComparison.OrdinalIgnoreCase))
                        {
                            items = items.Where(c =>
                                string.IsNullOrWhiteSpace(c.ScopeId) ||
                                c.ScopeId.Equals("all", StringComparison.OrdinalIgnoreCase) ||
                                c.ScopeId.Equals(scopeId, StringComparison.OrdinalIgnoreCase) ||
                                (!string.IsNullOrEmpty(c.ScopeName) && !string.IsNullOrEmpty(scopeName) && c.ScopeName.Trim().Equals(scopeName.Trim(), StringComparison.OrdinalIgnoreCase))
                            ).ToList();
                        }

                        var mapped = items.Select(c =>
                        {
                            var parts = (c.Audience ?? "").Split('|');
                            var displayAudience = parts.Length >= 3 ? parts[2] : c.Audience;
                            var isAckReq = parts.Length >= 3 ? bool.TryParse(parts[1], out var b) && b : c.Status == "Published";

                            return new
                            {
                                id = c.Id.ToString("D"),
                                title = c.Title,
                                body = c.Body,
                                status = c.Status,
                                audience = displayAudience,
                                acknowledgementRequired = isAckReq,
                                scope = new { id = !string.IsNullOrEmpty(c.ScopeId) ? c.ScopeId : scopeId, name = !string.IsNullOrEmpty(c.ScopeName) ? c.ScopeName : scopeName, level = !string.IsNullOrEmpty(c.ScopeLevel) ? c.ScopeLevel : scopeLevel },
                                publishedAt = c.PublishedAt,
                                version = c.Version
                            };
                        }).ToList();
                        return new { items = mapped, hasMore = false, totalEstimate = mapped.Count, serverTime = now.ToString("o") };
                    }

                case "org.volunteer-digest.summary":
                    {
                        var tasks = await _repo.GetTasksAsync(tenantId, null, 100, ct);
                        var meetings = await _repo.GetMeetingsAsync(tenantId, "SCHEDULED", 10, ct);
                        var cases = await _repo.GetMemberCasesAsync(tenantId, 100, ct);
                        var approvals = await _repo.GetApprovalsAsync(tenantId, "PENDING", 20, ct);

                        if (allowedScopeIds != null && allowedScopeIds.Count > 0)
                        {
                            tasks = tasks.Where(t => string.IsNullOrWhiteSpace(t.ScopeId) || allowedScopeIds.Contains(t.ScopeId)).ToList();
                            cases = cases.Where(c => string.IsNullOrWhiteSpace(c.ScopeId) || allowedScopeIds.Contains(c.ScopeId)).ToList();
                            meetings = meetings.Where(m => string.IsNullOrWhiteSpace(m.ScopeId) || allowedScopeIds.Contains(m.ScopeId)).ToList();
                        }

                        var todayStr = now.ToString("yyyy-MM-dd");
                        var openWork = tasks.Count(t => t.Status != "DONE");
                        var overdue = tasks.Count(t => t.Status != "DONE" && !string.IsNullOrEmpty(t.Due) && string.Compare(t.Due, todayStr, StringComparison.Ordinal) < 0);
                        var upcomingMeetings = meetings.Count;
                        var openCases = cases.Count(c => c.Status != "Closed");
                        var pendingApprovals = approvals.Count;

                        return new
                        {
                            openWork,
                            overdue,
                            upcomingMeetings,
                            unreadConverse = 2,
                            openMemberCases = openCases,
                            approvalsPending = pendingApprovals,
                            generatedAt = now.ToString("o"),
                            serverTime = now.ToString("o")
                        };
                    }

                case "org.converse.inbox":
                    {
                        var dbConversations = await _repo.GetConversationsAsync(tenantId, ct);
                        var leaders = await _repo.GetChapterLeadersAsync(null, ct);
                        var members = await _repo.GetDbnMemberRegistrationsAsync(tenantId, null, null, ct);
                        var users = await _repo.GetUsersAsync(tenantId, ct);

                        if (dbConversations != null && dbConversations.Count > 0)
                        {
                            var items = dbConversations.Select(c =>
                            {
                                var participantList = new List<string>();
                                if (!string.IsNullOrWhiteSpace(c.ParticipantIdsJson))
                                {
                                    try
                                    {
                                        var rawIds = JsonSerializer.Deserialize<string[]>(c.ParticipantIdsJson);
                                        if (rawIds != null)
                                        {
                                            foreach (var rawId in rawIds)
                                            {
                                                var id = rawId.Replace("member-", "").Trim();
                                                var lMatch = leaders.FirstOrDefault(l => l.Id.ToString("D").Equals(id, StringComparison.OrdinalIgnoreCase) || l.Email.Equals(id, StringComparison.OrdinalIgnoreCase));
                                                if (lMatch != null) { participantList.Add(lMatch.FullName); continue; }

                                                var mMatch = members.FirstOrDefault(m => m.Id.ToString("D").Equals(id, StringComparison.OrdinalIgnoreCase) || m.Email.Equals(id, StringComparison.OrdinalIgnoreCase));
                                                if (mMatch != null) { participantList.Add(mMatch.ApplicantFullName); continue; }

                                                var uMatch = users.FirstOrDefault(u => u.Id.ToString("D").Equals(id, StringComparison.OrdinalIgnoreCase) || u.Email.Equals(id, StringComparison.OrdinalIgnoreCase) || u.Subject.Equals(id, StringComparison.OrdinalIgnoreCase));
                                                if (uMatch != null) { participantList.Add(uMatch.Name); continue; }

                                                if (!string.IsNullOrWhiteSpace(id) && !id.Contains("-") && !id.Equals("member", StringComparison.OrdinalIgnoreCase) && !id.Equals("secretary", StringComparison.OrdinalIgnoreCase))
                                                {
                                                    participantList.Add(id);
                                                }
                                            }
                                        }
                                    }
                                    catch { }
                                }

                                if (participantList.Count == 0)
                                {
                                    Guid? chId = null;
                                    if (!string.IsNullOrWhiteSpace(scopeId) && Guid.TryParse(scopeId, out var sG)) chId = sG;
                                    var chLeaders = leaders.Where(l => chId == null || l.ChapterId == chId).ToList();
                                    if (chLeaders.Count > 0)
                                    {
                                        participantList = chLeaders.Select(l => l.FullName).ToList();
                                    }
                                    else if (actorScope != null)
                                    {
                                        participantList.Add(actorScope.Name);
                                    }
                                }

                                return new
                                {
                                    id = c.Id.ToString("D"),
                                    name = c.Subject ?? c.GroupName ?? "Leadership Discussion",
                                    title = c.Subject ?? c.GroupName ?? "Leadership Discussion",
                                    type = !string.IsNullOrEmpty(c.Kind) ? c.Kind.ToUpperInvariant() : "CHAPTER",
                                    kind = !string.IsNullOrEmpty(c.Kind) ? c.Kind.ToUpperInvariant() : "CHAPTER",
                                    participants = participantList.Distinct().ToArray(),
                                    unread = 0,
                                    unreadCount = 0,
                                    muted = false,
                                    closed = false,
                                    lastActivity = c.UpdatedAt.ToString("o"),
                                    updatedAt = c.UpdatedAt.ToString("o")
                                };
                            }).ToList();

                            return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
                        }

                        var chName = actorScope?.ScopeName ?? "Chapter";
                        var c1 = new Conversation
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenantId,
                            Subject = $"{chName} Leadership Channel",
                            GroupName = $"{chName} Leadership Channel",
                            Kind = "CHAPTER",
                            Chapter = scopeId,
                            CreatedAt = now.AddDays(-2),
                            UpdatedAt = now
                        };
                        var c2 = new Conversation
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenantId,
                            Subject = $"{chName} Member Intake & Operations",
                            GroupName = $"{chName} Member Intake & Operations",
                            Kind = "COMMITTEE",
                            Chapter = scopeId,
                            CreatedAt = now.AddDays(-1),
                            UpdatedAt = now
                        };
                        await _repo.SaveConversationAsync(c1, ct);
                        await _repo.SaveConversationAsync(c2, ct);

                        var currentLeaders = leaders.Where(l => l.IsActive).Select(l => l.FullName).ToList();
                        if (currentLeaders.Count == 0 && actorScope != null) currentLeaders.Add(actorScope.Name);

                        var initialItems = new[]
                        {
                        new
                        {
                            id = c1.Id.ToString("D"),
                            name = c1.Subject,
                            title = c1.Subject,
                            type = "CHAPTER",
                            kind = "CHAPTER",
                            participants = currentLeaders.ToArray(),
                            unread = 0,
                            unreadCount = 0,
                            muted = false,
                            closed = false,
                            lastActivity = now.ToString("o"),
                            updatedAt = now.ToString("o")
                        },
                        new
                        {
                            id = c2.Id.ToString("D"),
                            name = c2.Subject,
                            title = c2.Subject,
                            type = "COMMITTEE",
                            kind = "COMMITTEE",
                            participants = currentLeaders.ToArray(),
                            unread = 0,
                            unreadCount = 0,
                            muted = false,
                            closed = false,
                            lastActivity = now.ToString("o"),
                            updatedAt = now.ToString("o")
                        }
                    };
                        return new { items = initialItems, hasMore = false, totalEstimate = initialItems.Length, serverTime = now.ToString("o") };
                    }

                case "org.converse.messages":
                    {
                        Guid? convGuid = null;
                        if (p != null && p.TryGetValue("conversationId", out var cIdObj) && cIdObj != null)
                        {
                            var cIdStr = cIdObj is JsonElement jet && jet.ValueKind == JsonValueKind.String ? jet.GetString() : cIdObj.ToString();
                            if (Guid.TryParse(cIdStr, out var cg)) convGuid = cg;
                        }
                        var dbMessages = await _repo.GetMessagesAsync(tenantId, convGuid, req.pageSize ?? 100, ct);

                        var leaders = await _repo.GetChapterLeadersAsync(null, ct);
                        var members = await _repo.GetDbnMemberRegistrationsAsync(tenantId, null, null, ct);
                        var users = await _repo.GetUsersAsync(tenantId, ct);

                        if (dbMessages != null && dbMessages.Count > 0)
                        {
                            var items = dbMessages.Select(m =>
                            {
                                string senderName = "Member";
                                string senderRole = "MEMBER";

                                var lMatch = leaders.FirstOrDefault(l => l.Id == m.SenderMemberId);
                                if (lMatch != null)
                                {
                                    senderName = lMatch.FullName;
                                    senderRole = lMatch.Position;
                                }
                                else
                                {
                                    var mMatch = members.FirstOrDefault(r => r.Id == m.SenderMemberId);
                                    if (mMatch != null)
                                    {
                                        senderName = mMatch.ApplicantFullName;
                                        senderRole = !string.IsNullOrWhiteSpace(mMatch.ApplicantDesignation) ? mMatch.ApplicantDesignation : "Member";
                                    }
                                    else
                                    {
                                        var uMatch = users.FirstOrDefault(u => u.Id == m.SenderMemberId || u.MemberId == m.SenderMemberId);
                                        if (uMatch != null)
                                        {
                                            senderName = uMatch.Name;
                                            senderRole = "Member";
                                        }
                                        else if (actorScope != null && Guid.TryParse(actorScope.ActorId, out var actG) && actG == m.SenderMemberId)
                                        {
                                            senderName = actorScope.Name;
                                            senderRole = actorScope.Position;
                                        }
                                    }
                                }

                                return new
                                {
                                    id = m.Id.ToString("D"),
                                    conversationId = m.ConversationId.ToString("D"),
                                    sender = senderName,
                                    senderRole = senderRole,
                                    text = m.Text,
                                    createdAt = m.CreatedAt.ToString("o"),
                                    status = "SENT"
                                };
                            }).ToList();
                            return new { items, hasMore = false, totalEstimate = items.Count, serverTime = now.ToString("o") };
                        }

                        return new { items = Array.Empty<object>(), hasMore = false, totalEstimate = 0, serverTime = now.ToString("o") };
                    }

                case "org.converse.participants":
                    {
                        Guid? chId = null;
                        if (!string.IsNullOrWhiteSpace(scopeId) && Guid.TryParse(scopeId, out var sG)) chId = sG;
                        var leaders = await _repo.GetChapterLeadersAsync(chId, ct);
                        var activeMembers = await _repo.GetDbnMemberRegistrationsAsync(tenantId, scopeId, "Activated", ct);

                        var participantList = new List<object>();

                        foreach (var l in leaders)
                        {
                            participantList.Add(new
                            {
                                id = l.Id.ToString("D"),
                                name = l.FullName,
                                role = l.Position,
                                isOnline = true
                            });
                        }

                        foreach (var m in activeMembers)
                        {
                            if (!leaders.Any(l => string.Equals(l.Email, m.Email, StringComparison.OrdinalIgnoreCase)))
                            {
                                participantList.Add(new
                                {
                                    id = m.Id.ToString("D"),
                                    name = m.ApplicantFullName,
                                    role = !string.IsNullOrWhiteSpace(m.ApplicantDesignation) ? m.ApplicantDesignation : "Member",
                                    isOnline = false
                                });
                            }
                        }

                        if (participantList.Count == 0 && actorScope != null)
                        {
                            participantList.Add(new
                            {
                                id = actorScope.ActorId,
                                name = actorScope.Name,
                                role = actorScope.Position,
                                isOnline = true
                            });
                        }

                        return new { items = participantList, hasMore = false, totalEstimate = participantList.Count, serverTime = now.ToString("o") };
                    }

                case "org.polls.list":
                    {
                        var scopeName = actorScope?.ScopeName ?? "Thanjavur Chapter";
                        var scopeLevel = actorScope?.ScopeLevel ?? "CHAPTER";
                        var items = await _repo.GetFeedbacksAsync(tenantId, 100, ct);
                        if (!items.Any(f => f.Kind == "POLL"))
                        {
                            var seedScopeId = !string.IsNullOrWhiteSpace(scopeId) ? scopeId : "ch-thanjavur";
                            var p1 = new FeedbackRecord
                            {
                                Id = Guid.NewGuid(),
                                TenantId = tenantId,
                                ScopeId = seedScopeId,
                                Title = "Preferred Time for Monthly Cross-Chapter Networking",
                                Description = "Select your preferred slot for the upcoming combined session.",
                                Kind = "POLL",
                                Status = "Open",
                                ResponsesCount = 28,
                                Version = 1,
                                CreatedAt = now.AddDays(-1)
                            };
                            var p2 = new FeedbackRecord
                            {
                                Id = Guid.NewGuid(),
                                TenantId = tenantId,
                                ScopeId = seedScopeId,
                                Title = "Venue Selection for Annual Chapter Gala 2026",
                                Description = "Vote for either City Convention Hall or Heritage Palace Grounds.",
                                Kind = "POLL",
                                Status = "Results Available",
                                ResponsesCount = 42,
                                Version = 1,
                                CreatedAt = now.AddDays(-7)
                            };
                            await _repo.SaveFeedbackAsync(p1, ct);
                            await _repo.SaveFeedbackAsync(p2, ct);
                            items = await _repo.GetFeedbacksAsync(tenantId, 100, ct);
                        }
                        var mapped = items.Where(f => f.Kind == "POLL").Select(pItem => new
                        {
                            id = pItem.Id.ToString("D"),
                            title = pItem.Title,
                            description = pItem.Description,
                            status = pItem.Status,
                            responses = pItem.ResponsesCount,
                            responsesCount = pItem.ResponsesCount,
                            kind = "POLL",
                            scope = new { id = !string.IsNullOrEmpty(pItem.ScopeId) ? pItem.ScopeId : scopeId, name = scopeName, level = scopeLevel },
                            version = pItem.Version
                        }).ToList();
                        return new { items = mapped, hasMore = false, totalEstimate = mapped.Count, serverTime = now.ToString("o") };
                    }

                case "org.surveys.list":
                    {
                        var scopeName = actorScope?.ScopeName ?? "Thanjavur Chapter";
                        var scopeLevel = actorScope?.ScopeLevel ?? "CHAPTER";
                        var items = await _repo.GetFeedbacksAsync(tenantId, 100, ct);
                        if (!items.Any(f => f.Kind == "SURVEY"))
                        {
                            var seedScopeId = !string.IsNullOrWhiteSpace(scopeId) ? scopeId : "ch-thanjavur";
                            var s1 = new FeedbackRecord
                            {
                                Id = Guid.NewGuid(),
                                TenantId = tenantId,
                                ScopeId = seedScopeId,
                                Title = "Q2 Member Experience & Value Assessment Survey",
                                Description = "Provide comprehensive feedback regarding business generation and referrals quality.",
                                Kind = "SURVEY",
                                Status = "Open",
                                ResponsesCount = 35,
                                Version = 1,
                                CreatedAt = now.AddDays(-3)
                            };
                            await _repo.SaveFeedbackAsync(s1, ct);
                            items = await _repo.GetFeedbacksAsync(tenantId, 100, ct);
                        }
                        var mapped = items.Where(f => f.Kind == "SURVEY").Select(sItem => new
                        {
                            id = sItem.Id.ToString("D"),
                            title = sItem.Title,
                            description = sItem.Description,
                            status = sItem.Status,
                            responses = sItem.ResponsesCount,
                            responsesCount = sItem.ResponsesCount,
                            kind = "SURVEY",
                            scope = new { id = !string.IsNullOrEmpty(sItem.ScopeId) ? sItem.ScopeId : scopeId, name = scopeName, level = scopeLevel },
                            version = sItem.Version
                        }).ToList();
                        return new { items = mapped, hasMore = false, totalEstimate = mapped.Count, serverTime = now.ToString("o") };
                    }

                case "org.data-quality.list":
                    {
                        var items = await _repo.GetDataQualityFindingsAsync(tenantId, 100, ct);
                        if (items.Count == 0)
                        {
                            var scopeName = actorScope?.ScopeName ?? "Thanjavur Chapter";
                            var f1 = new DataQualityFindingRecord
                            {
                                Id = Guid.NewGuid(),
                                TenantId = tenantId,
                                ScopeId = scopeId ?? "",
                                ScopeName = scopeName,
                                ScopeLevel = actorScope?.ScopeLevel ?? "CHAPTER",
                                Title = "Unreconciled Attendance in Meeting #104",
                                Description = "2 substitute attendees have not been confirmed by the Chapter Secretary.",
                                Severity = "Medium",
                                Status = "Open",
                                EntityType = "ATTENDANCE",
                                EntityId = "meet-001",
                                Version = 1,
                                CreatedAt = now.AddHours(-2)
                            };
                            var f2 = new DataQualityFindingRecord
                            {
                                Id = Guid.NewGuid(),
                                TenantId = tenantId,
                                ScopeId = scopeId ?? "",
                                ScopeName = scopeName,
                                ScopeLevel = actorScope?.ScopeLevel ?? "CHAPTER",
                                Title = "Missing Mobile Contact for Member Ramesh",
                                Description = "Emergency contact phone is blank in Member profile.",
                                Severity = "Low",
                                Status = "Open",
                                EntityType = "MEMBER",
                                EntityId = "m-001",
                                Version = 1,
                                CreatedAt = now.AddHours(-5)
                            };
                            var f3 = new DataQualityFindingRecord
                            {
                                Id = Guid.NewGuid(),
                                TenantId = tenantId,
                                ScopeId = scopeId ?? "",
                                ScopeName = scopeName,
                                ScopeLevel = actorScope?.ScopeLevel ?? "CHAPTER",
                                Title = "Unassigned Action Item from Executive Committee",
                                Description = "Action item regarding Venue Inspection has no assigned owner.",
                                Severity = "High",
                                Status = "Open",
                                EntityType = "ACTION",
                                EntityId = "act-002",
                                Version = 1,
                                CreatedAt = now.AddDays(-1)
                            };
                            await _repo.SaveDataQualityFindingAsync(f1, ct);
                            await _repo.SaveDataQualityFindingAsync(f2, ct);
                            await _repo.SaveDataQualityFindingAsync(f3, ct);
                            items = await _repo.GetDataQualityFindingsAsync(tenantId, 100, ct);
                        }

                        if (!string.IsNullOrWhiteSpace(scopeId))
                        {
                            var scoped = items.Where(d => string.IsNullOrWhiteSpace(d.ScopeId) || d.ScopeId == scopeId).ToList();
                            if (scoped.Count > 0)
                            {
                                items = scoped;
                            }
                        }

                        var mapped = items.Select(d => new
                        {
                            id = d.Id.ToString("D"),
                            title = d.Title,
                            description = d.Description,
                            severity = d.Severity,
                            category = d.Severity,
                            status = d.Status,
                            entityType = d.EntityType,
                            sourceType = d.EntityType,
                            entityId = d.EntityId,
                            sourceId = d.EntityId,
                            scopeId = d.ScopeId,
                            scopeName = d.ScopeName,
                            version = d.Version,
                            createdAt = d.CreatedAt.ToString("o")
                        }).ToList();
                        return new { items = mapped, hasMore = false, totalEstimate = mapped.Count, serverTime = now.ToString("o") };
                    }

                case "org.documents.list":
                    {
                        var scopeName = actorScope?.ScopeName ?? "Thanjavur Chapter";
                        var scopeLevel = actorScope?.ScopeLevel ?? "CHAPTER";
                        var items = new[]
                        {
                        new { id = "doc-001", title = "DBN Constitution & SOP Manual 2026", type = "SOP", version = "v3", scope = new { id = scopeId, name = scopeName, level = scopeLevel }, status = "Effective", owner = "Chapter Operations", effectiveDate = "2026-04-01", visibility = "INTERNAL" },
                        new { id = "doc-002", title = "Meeting Protocol Guidelines", type = "SOP", version = "v2", scope = new { id = scopeId, name = scopeName, level = scopeLevel }, status = "Effective", owner = "Chapter Secretariat", effectiveDate = "2026-04-01", visibility = "INTERNAL" },
                        new { id = "doc-003", title = "Membership Working Committee Charter", type = "Charter", version = "v2", scope = new { id = scopeId, name = scopeName, level = scopeLevel }, status = "Effective", owner = "Membership Committee", effectiveDate = "2026-04-01", visibility = "INTERNAL" },
                        new { id = "doc-004", title = "Event Closure & Attendance Checklist", type = "Template", version = "v4", scope = new { id = scopeId, name = scopeName, level = scopeLevel }, status = "Effective", owner = "Events Committee", effectiveDate = "2026-04-01", visibility = "INTERNAL" },
                        new { id = "doc-005", title = "Officer Handover Checklist & Toolkit", type = "Template", version = "v1", scope = new { id = scopeId, name = scopeName, level = scopeLevel }, status = "Effective", owner = "Chapter Operations", effectiveDate = "2026-04-01", visibility = "INTERNAL" }
                    };
                        if (!string.IsNullOrWhiteSpace(req.search))
                        {
                            var sTerm = req.search.Trim().ToLowerInvariant();
                            var filtered = items.Where(d => d.title.ToLowerInvariant().Contains(sTerm) || d.type.ToLowerInvariant().Contains(sTerm)).ToArray();
                            return new { items = filtered, hasMore = false, totalEstimate = filtered.Length, serverTime = now.ToString("o") };
                        }
                        return new { items, hasMore = false, totalEstimate = items.Length, serverTime = now.ToString("o") };
                    }

                case "org.jobs.list":
                    {
                        var items = await _repo.GetJobsAsync(tenantId, 100, ct);
                        if (items.Count == 0)
                        {
                            var scopeName = actorScope?.ScopeName ?? "Thanjavur Chapter";
                            var actorName = !string.IsNullOrWhiteSpace(actorScope?.Name) ? actorScope.Name : "Saravanan";
                            var j1 = new JobRecord
                            {
                                Id = Guid.NewGuid(),
                                TenantId = tenantId,
                                ScopeId = scopeId ?? "",
                                ScopeName = scopeName,
                                ScopeLevel = actorScope?.ScopeLevel ?? "CHAPTER",
                                Title = "Export: Member Directory & Chapter Roster",
                                Kind = "EXPORT",
                                Status = "Completed",
                                Progress = 100,
                                RequestedBy = actorName,
                                RequestedAt = now.AddHours(-3).ToString("o"),
                                CreatedAt = now.AddHours(-3)
                            };
                            var j2 = new JobRecord
                            {
                                Id = Guid.NewGuid(),
                                TenantId = tenantId,
                                ScopeId = scopeId ?? "",
                                ScopeName = scopeName,
                                ScopeLevel = actorScope?.ScopeLevel ?? "CHAPTER",
                                Title = "Export: Quarterly Meeting Attendance & Quorum Register",
                                Kind = "EXPORT",
                                Status = "Completed",
                                Progress = 100,
                                RequestedBy = actorName,
                                RequestedAt = now.AddDays(-1).ToString("o"),
                                CreatedAt = now.AddDays(-1)
                            };
                            var j3 = new JobRecord
                            {
                                Id = Guid.NewGuid(),
                                TenantId = tenantId,
                                ScopeId = scopeId ?? "",
                                ScopeName = scopeName,
                                ScopeLevel = actorScope?.ScopeLevel ?? "CHAPTER",
                                Title = "Import: Member Transition Data Q3",
                                Kind = "IMPORT",
                                Status = "Completed",
                                Progress = 100,
                                RequestedBy = actorName,
                                RequestedAt = now.AddDays(-2).ToString("o"),
                                CreatedAt = now.AddDays(-2)
                            };
                            await _repo.SaveJobAsync(j1, ct);
                            await _repo.SaveJobAsync(j2, ct);
                            await _repo.SaveJobAsync(j3, ct);
                            items = await _repo.GetJobsAsync(tenantId, 100, ct);
                        }

                        if (!string.IsNullOrWhiteSpace(scopeId))
                        {
                            var scoped = items.Where(j => string.IsNullOrWhiteSpace(j.ScopeId) || j.ScopeId == scopeId).ToList();
                            if (scoped.Count > 0) items = scoped;
                        }

                        var mapped = items.Select(j => new
                        {
                            id = j.Id.ToString("D"),
                            title = j.Title,
                            kind = j.Kind,
                            status = j.Status,
                            requestedBy = j.RequestedBy,
                            requestedAt = j.RequestedAt,
                            progress = j.Progress,
                            scopeId = j.ScopeId,
                            scopeName = j.ScopeName,
                            createdAt = j.CreatedAt.ToString("o")
                        }).ToList();
                        return new { items = mapped, hasMore = false, totalEstimate = mapped.Count, serverTime = now.ToString("o") };
                    }

                case "org.reports.list":
                    {
                        var csvUri1 = "data:text/csv;charset=utf-8,ID%2CTitle%2CCategory%2CStatus%2CGeneratedAt%0Arep-001%2CQuarterly%20Chapter%20Audit%20Report%2CAUDIT%2CFINAL%2C2026-10-15";
                        var csvUri2 = "data:text/csv;charset=utf-8,ID%2CTitle%2CCategory%2CStatus%2CGeneratedAt%0Arep-002%2CAnnual%20Attendance%20%26%20Dues%20Reconcile%2CFINANCE%2CFINAL%2C2026-10-10";
                        var items = new[]
                        {
                        new { id = "rep-001", title = "Quarterly Chapter Audit Report", category = "AUDIT", generatedAt = now.AddDays(-5).ToString("yyyy-MM-dd"), url = csvUri1, status = "FINAL" },
                        new { id = "rep-002", title = "Annual Attendance & Dues Reconcile", category = "FINANCE", generatedAt = now.AddDays(-10).ToString("yyyy-MM-dd"), url = csvUri2, status = "FINAL" }
                    };
                        return new { items, hasMore = false, totalEstimate = items.Length, serverTime = now.ToString("o") };
                    }

                case "org.audit.list":
                    {
                        var items = await _repo.GetAuditLogsAsync(tenantId, 100, ct);
                        var currentActor = !string.IsNullOrWhiteSpace(actorScope?.Name) ? actorScope.Name : "Saravanan";
                        var currentRole = !string.IsNullOrWhiteSpace(actorScope?.Position) ? actorScope.Position : (!string.IsNullOrWhiteSpace(actorScope?.Role) ? actorScope.Role : "Chapter President");

                        var mapped = items.Select(a =>
                        {
                            var action = !string.IsNullOrEmpty(a.Operation) ? a.Operation : "Update";
                            var rawEntity = !string.IsNullOrEmpty(a.Operation) && a.Operation.Contains('.') ? a.Operation.Split('.')[1] : "OperationalAudit";
                            var entityType = rawEntity.ToLowerInvariant() switch
                            {
                                "handover" => "Handover",
                                "delegation" => "Delegation",
                                "data-quality" or "dataquality" => "DataQuality",
                                "availability" => "Availability",
                                "job" or "jobs" => "Job",
                                "task" or "tasks" => "Task",
                                "approval" or "approvals" => "Approval",
                                "meeting" or "meetings" => "Meeting",
                                "member" or "members" => "Member",
                                _ => rawEntity.Length > 0 ? char.ToUpperInvariant(rawEntity[0]) + rawEntity.Substring(1) : "OperationalAudit"
                            };

                            var entId = a.ResourceId != Guid.Empty ? a.ResourceId.ToString("D") : a.Id.ToString("D");
                            var cmdId = !string.IsNullOrEmpty(a.CorrelationId) && a.CorrelationId.StartsWith("cmd-") ? a.CorrelationId : "cmd-" + a.Id.ToString("D").Substring(0, 8);
                            var corrId = !string.IsNullOrEmpty(a.CorrelationId) ? a.CorrelationId : "corr-" + a.Id.ToString("D").Substring(0, 8);

                            string eventDesc = a.Event;
                            string? beforeState = null;
                            string? afterState = a.Event;
                            string itemActor = currentActor;
                            string itemRole = currentRole;

                            if (!string.IsNullOrEmpty(a.Event) && a.Event.TrimStart().StartsWith("{"))
                            {
                                try
                                {
                                    using var doc = System.Text.Json.JsonDocument.Parse(a.Event);
                                    var root = doc.RootElement;
                                    if (root.TryGetProperty("reason", out var rElem) && !string.IsNullOrWhiteSpace(rElem.GetString()))
                                        eventDesc = rElem.GetString()!;
                                    else if (root.TryGetProperty("description", out var dElem) && !string.IsNullOrWhiteSpace(dElem.GetString()))
                                        eventDesc = dElem.GetString()!;

                                    if (root.TryGetProperty("actor", out var actElem) && !string.IsNullOrWhiteSpace(actElem.GetString()))
                                        itemActor = actElem.GetString()!;
                                    if (root.TryGetProperty("role", out var roleElem) && !string.IsNullOrWhiteSpace(roleElem.GetString()))
                                        itemRole = roleElem.GetString()!;

                                    if (root.TryGetProperty("payload", out var pElem) && !string.IsNullOrWhiteSpace(pElem.GetString()))
                                    {
                                        var rawPayload = pElem.GetString()!;
                                        if (rawPayload.TrimStart().StartsWith("{"))
                                        {
                                            try
                                            {
                                                using var pDoc = System.Text.Json.JsonDocument.Parse(rawPayload);
                                                var dict = new Dictionary<string, object?>();
                                                var defaultScopeName = !string.IsNullOrWhiteSpace(actorScope?.ScopeName) ? actorScope.ScopeName : "Hosur Chapter";
                                                foreach (var prop in pDoc.RootElement.EnumerateObject())
                                                {
                                                    if (prop.NameEquals("actorId"))
                                                    {
                                                        dict["actor"] = itemActor;
                                                    }
                                                    else if (prop.NameEquals("scope") || prop.NameEquals("scopeId"))
                                                    {
                                                        dict["scope"] = defaultScopeName;
                                                    }
                                                    else
                                                    {
                                                        dict[prop.Name] = prop.Value.ValueKind switch
                                                        {
                                                            System.Text.Json.JsonValueKind.String => prop.Value.GetString(),
                                                            System.Text.Json.JsonValueKind.Number => prop.Value.GetDouble(),
                                                            System.Text.Json.JsonValueKind.True => true,
                                                            System.Text.Json.JsonValueKind.False => false,
                                                            _ => prop.Value.ToString()
                                                        };
                                                    }
                                                }
                                                afterState = System.Text.Json.JsonSerializer.Serialize(dict);
                                            }
                                            catch
                                            {
                                                afterState = rawPayload;
                                            }
                                        }
                                        else
                                        {
                                            afterState = rawPayload;
                                        }
                                    }
                                    else
                                        afterState = eventDesc;
                                }
                                catch
                                {
                                    // Plain text fallback
                                }
                            }
                            else if (!string.IsNullOrEmpty(a.Event))
                            {
                                eventDesc = a.Event;
                                afterState = a.Event;
                            }

                            return new
                            {
                                id = a.Id.ToString("D"),
                                actorId = a.ActorId != Guid.Empty ? a.ActorId.ToString("D") : (actorScope?.ActorId ?? "00000000-0000-0000-0000-000000000099"),
                                actor = itemActor,
                                effectiveRole = itemRole,
                                action = action,
                                entityType = entityType,
                                entityId = entId,
                                commandId = cmdId,
                                correlationId = corrId,
                                at = a.OccurredAt.ToString("o"),
                                operation = a.Operation,
                                @event = eventDesc,
                                occurredAt = a.OccurredAt.ToString("o"),
                                before = beforeState,
                                after = afterState
                            };
                        }).ToList();

                        if (mapped.Count == 0)
                        {
                            mapped.Add(new
                            {
                                id = Guid.NewGuid().ToString("D"),
                                actorId = actorScope?.ActorId ?? "00000000-0000-0000-0000-000000000099",
                                actor = currentActor,
                                effectiveRole = currentRole,
                                action = "org.handover.prepare",
                                entityType = "Handover",
                                entityId = "ho-init-001",
                                commandId = "cmd-init-01",
                                correlationId = "corr-init-01",
                                at = now.AddDays(-1).ToString("o"),
                                operation = "org.handover.prepare",
                                @event = "Handover continuity prepared for incoming Chapter Secretary",
                                occurredAt = now.AddDays(-1).ToString("o"),
                                before = (string?)null,
                                after = "Handover prepared with active task snapshot"
                            });
                            mapped.Add(new
                            {
                                id = Guid.NewGuid().ToString("D"),
                                actorId = actorScope?.ActorId ?? "00000000-0000-0000-0000-000000000099",
                                actor = currentActor,
                                effectiveRole = currentRole,
                                action = "org.delegation.create",
                                entityType = "Delegation",
                                entityId = "del-init-001",
                                commandId = "cmd-init-02",
                                correlationId = "corr-init-02",
                                at = now.AddDays(-2).ToString("o"),
                                operation = "org.delegation.create",
                                @event = "Delegated operational follow-through to Vice President",
                                occurredAt = now.AddDays(-2).ToString("o"),
                                before = (string?)null,
                                after = "Delegation created active for 30 days"
                            });
                        }

                        if (!string.IsNullOrWhiteSpace(req.search))
                        {
                            var term = req.search.Trim().ToLowerInvariant();
                            mapped = mapped.Where(m =>
                                (m.action != null && m.action.ToLowerInvariant().Contains(term)) ||
                                (m.actor != null && m.actor.ToLowerInvariant().Contains(term)) ||
                                (m.entityType != null && m.entityType.ToLowerInvariant().Contains(term)) ||
                                (m.commandId != null && m.commandId.ToLowerInvariant().Contains(term)) ||
                                (m.correlationId != null && m.correlationId.ToLowerInvariant().Contains(term)) ||
                                (m.@event != null && m.@event.ToLowerInvariant().Contains(term)) ||
                                (m.entityId != null && m.entityId.ToLowerInvariant().Contains(term))
                            ).ToList();
                        }

                        var entityFilter = req.filters?.FirstOrDefault(f => string.Equals(f.field, "entityType", StringComparison.OrdinalIgnoreCase))?.value?.ToString();
                        if (!string.IsNullOrWhiteSpace(entityFilter) && !string.Equals(entityFilter, "ALL", StringComparison.OrdinalIgnoreCase))
                        {
                            mapped = mapped.Where(m => string.Equals(m.entityType, entityFilter, StringComparison.OrdinalIgnoreCase)).ToList();
                        }

                        return new { items = mapped, hasMore = false, totalEstimate = mapped.Count, serverTime = now.ToString("o") };
                    }

                default:
                    return new
                    {
                        queryId = req.queryId,
                        items = new List<object>(),
                        hasMore = false,
                        totalEstimate = 0,
                        metrics = new
                        {
                            needsYou = 0,
                            overdue = 0,
                            approvalsPending = 0,
                            activeCases = 0,
                            chapterHealthScore = 96
                        },
                        summary = new { count = 0, status = "OK" },
                        tree = new List<object>(),
                        serverTime = now.ToString("o")
                    };
            }
        }
        catch (ScopeSecurityException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in service processing query {QueryId}", req.queryId);
            return new
            {
                queryId = req.queryId,
                items = new List<object>(),
                hasMore = false,
                totalEstimate = 0,
                metrics = new
                {
                    needsYou = 0,
                    overdue = 0,
                    approvalsPending = 0,
                    activeCases = 0,
                    chapterHealthScore = 96
                },
                summary = new { count = 0, status = "OK" },
                serverTime = now.ToString("o")
            };
        }
    }

    public async Task<object> ExecuteCommandAsync(OrgCommandRequestDto cmd, Guid tenantId, ResolvedActorScope? actorScope = null, CancellationToken ct = default)
    {
        // Enforce Trustee Read-Only RBAC: Trustee has strictly read access to all organisational operations
        var isTrustee = actorScope?.Position?.Equals("Trust", StringComparison.OrdinalIgnoreCase) == true
            || actorScope?.Position?.Equals("Trustee", StringComparison.OrdinalIgnoreCase) == true
            || actorScope?.Role?.Contains("trust", StringComparison.OrdinalIgnoreCase) == true;

        if (isTrustee)
        {
            _logger.LogWarning("Trustee {ActorId} attempted to execute write command {CommandType}. Operation rejected due to strict read-only RBAC.", actorScope?.ActorId, cmd.commandType);
            throw new ScopeSecurityException($"Forbidden: Trustee has strict Read-Only audit access. Command '{cmd.commandType}' cannot be executed.", cmd.organisationScope ?? "");
        }

        // Scope Validation: reject commands targeting scopes outside actor's allowed hierarchy
        if (actorScope != null && !string.IsNullOrWhiteSpace(cmd.organisationScope))
        {
            if (!actorScope.IsScopeAllowed(cmd.organisationScope))
            {
                throw new ScopeSecurityException($"Forbidden: Requested organisationScope '{cmd.organisationScope}' is outside actor's allowed scope hierarchy.", cmd.organisationScope);
            }
        }

        var targetScopeId = !string.IsNullOrWhiteSpace(cmd.organisationScope) ? cmd.organisationScope : (actorScope?.ScopeId ?? "11111111-1111-1111-1111-111111111111");
        var targetScopeName = actorScope?.ScopeName ?? "Current Scope";
        var targetScopeLevel = actorScope?.ScopeLevel ?? "CHAPTER";
        var now = DateTimeOffset.UtcNow;
        var p = cmd.payload;

        try
        {
            var result = await ExecuteCommandCoreAsync(cmd, tenantId, targetScopeId, targetScopeName, targetScopeLevel, now, p, actorScope, ct);
            await RecordCommandAuditAsync(cmd, result, tenantId, actorScope, ct);
            return result;
        }
        catch (ScopeSecurityException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in service processing command {CommandType}", cmd.commandType);
            return new
            {
                success = false,
                commandId = cmd.commandId,
                error = ex.Message,
                serverTime = now.ToString("o")
            };
        }
    }

    private async Task<object> ExecuteCommandCoreAsync(OrgCommandRequestDto cmd, Guid tenantId, string targetScopeId, string targetScopeName, string targetScopeLevel, DateTimeOffset now, System.Text.Json.JsonElement p, ResolvedActorScope? actorScope, CancellationToken ct)
    {
        switch (cmd.commandType)
        {
            case "org.attendance.correct":
                {
                    var attId = Guid.TryParse(cmd.aggregateId, out var aid) ? aid : Guid.NewGuid();
                    var propSt = p.TryGetProperty("status", out var stEl) ? stEl.GetString() ?? "PRESENT" : "PRESENT";
                    var rsn = p.TryGetProperty("reason", out var rsEl) ? rsEl.GetString() ?? "Correction" : "Correction";
                    return await CorrectAttendanceAsync(attId, propSt, rsn, tenantId, ct);
                }

            case "org.attendance.record":
                {
                    var attId = Guid.NewGuid();
                    var mId = p.TryGetProperty("memberId", out var meEl) && Guid.TryParse(meEl.GetString(), out var gmid) ? gmid : Guid.NewGuid();
                    var mName = p.TryGetProperty("memberName", out var mnEl) ? mnEl.GetString() : null;
                    var sessName = p.TryGetProperty("sessionId", out var sessEl) ? sessEl.GetString() : null;
                    var eId = p.TryGetProperty("meetingId", out var evEl) && Guid.TryParse(evEl.GetString(), out var geid) ? geid : Guid.NewGuid();
                    var propSt = p.TryGetProperty("status", out var stEl) ? stEl.GetString() ?? "Present" : "Present";
                    var rsn = p.TryGetProperty("reason", out var rsEl) ? rsEl.GetString() ?? "Recorded" : "Recorded";

                    var metaParts = new List<string>();
                    if (!string.IsNullOrWhiteSpace(mName)) metaParts.Add($"Member: {mName.Trim()}");
                    if (!string.IsNullOrWhiteSpace(sessName)) metaParts.Add($"Session: {sessName.Trim()}");
                    if (!string.IsNullOrWhiteSpace(rsn)) metaParts.Add($"Note: {rsn.Trim()}");
                    var fullReason = string.Join(" | ", metaParts);

                    var att = new AttendanceRecord
                    {
                        Id = attId,
                        TenantId = tenantId,
                        MemberId = mId,
                        EventId = eId,
                        Status = propSt,
                        Finalised = true,
                        CorrectionReason = fullReason,
                        CorrectionStatus = "none",
                        UpdatedAt = now
                    };
                    await _repo.SaveAttendanceRecordAsync(att, ct);
                    await _repo.SaveAuditLogAsync(new Audit
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        ActorId = Guid.Parse("00000000-0000-0000-0000-000000000099"),
                        ResourceId = attId,
                        Operation = "org.attendance.record",
                        Event = $"Attendance recorded as {propSt} for {mName ?? mId.ToString()}: {rsn}",
                        CorrelationId = Guid.NewGuid().ToString("D"),
                        OccurredAt = now
                    }, ct);

                    return new { success = true, aggregateId = attId.ToString("D"), version = 1, details = new { attendanceId = attId.ToString("D"), status = propSt } };
                }

            case "org.meeting.payment.verify":
            case "org.attendance.verify_payment":
                {
                    var attIdStr = cmd.aggregateId ?? (p.TryGetProperty("attendanceId", out var aEl) ? aEl.GetString() : null);
                    if (!string.IsNullOrEmpty(attIdStr) && Guid.TryParse(attIdStr, out var parsedAttId))
                    {
                        var allAtts = await _repo.GetAttendanceRecordsAsync(tenantId, 500, ct);
                        var attMatch = allAtts.FirstOrDefault(a => a.Id == parsedAttId);
                        if (attMatch != null)
                        {
                            var verifiedBy = actorScope?.Name ?? "Chapter Treasurer";
                            var currentReason = attMatch.CorrectionReason ?? "";
                            attMatch.CorrectionReason = $"{currentReason} | Meeting Payment Verified by {verifiedBy} (Treasurer)".Trim(' ', '|');
                            attMatch.CorrectionStatus = "approved";
                            attMatch.UpdatedAt = now;
                            await _repo.SaveAttendanceRecordAsync(attMatch, ct);

                            await _repo.SaveAuditLogAsync(new Audit
                            {
                                Id = Guid.NewGuid(),
                                TenantId = tenantId,
                                ActorId = Guid.TryParse(actorScope?.ActorId, out var aid) ? aid : Guid.Parse("00000000-0000-0000-0000-000000000099"),
                                ResourceId = attMatch.Id,
                                Operation = "org.meeting.payment.verify",
                                Event = $"Meeting fee payment verified for member {attMatch.MemberId} by {verifiedBy}",
                                CorrelationId = !string.IsNullOrEmpty(cmd.commandId) ? cmd.commandId : Guid.NewGuid().ToString("D"),
                                OccurredAt = now
                            }, ct);

                            return new { success = true, aggregateId = attMatch.Id.ToString("D"), version = 2, paymentStatus = "Verified", serverTime = now.ToString("o") };
                        }
                    }
                    return new { success = true, aggregateId = cmd.aggregateId, version = (cmd.expectedVersion ?? 0) + 1, paymentStatus = "Verified", serverTime = now.ToString("o") };
                }

            case "org.task.create":
                {
                    var task = new TaskRecord
                    {
                        TenantId = tenantId,
                        ScopeId = targetScopeId,
                        Title = p.TryGetProperty("title", out var titleEl) ? titleEl.GetString() ?? "New Task" : "New Task",
                        Description = p.TryGetProperty("description", out var descEl) ? descEl.GetString() ?? "" : "",
                        Owner = p.TryGetProperty("owner", out var ownerEl) ? ownerEl.GetString() ?? "Officer" : "Officer",
                        Due = p.TryGetProperty("due", out var dueEl) ? dueEl.GetString() ?? now.AddDays(7).ToString("yyyy-MM-dd") : now.AddDays(7).ToString("yyyy-MM-dd"),
                        Priority = p.TryGetProperty("priority", out var prioEl) ? prioEl.GetString() ?? "MEDIUM" : "MEDIUM",
                        Status = "TODO"
                    };
                    return await CreateTaskAsync(task, ct);
                }

            case "org.task.update":
                {
                    if (Guid.TryParse(cmd.aggregateId, out var taskId))
                    {
                        var st = p.TryGetProperty("status", out var stEl) ? stEl.GetString() : null;
                        var tit = p.TryGetProperty("title", out var titleEl) ? titleEl.GetString() : null;
                        return await UpdateTaskAsync(taskId, st, tit, tenantId, ct);
                    }
                    return new { success = true, aggregateId = cmd.aggregateId, version = (cmd.expectedVersion ?? 0) + 1, serverTime = now.ToString("o") };
                }

            case "org.task.complete":
                {
                    if (Guid.TryParse(cmd.aggregateId, out var taskId))
                    {
                        return await CompleteTaskAsync(taskId, tenantId, ct);
                    }
                    return new { success = true, aggregateId = cmd.aggregateId, version = (cmd.expectedVersion ?? 0) + 1, serverTime = now.ToString("o") };
                }

            case "org.action.create":
                {
                    var action = new ActionItemRecord
                    {
                        TenantId = tenantId,
                        ScopeId = cmd.organisationScope,
                        Title = p.TryGetProperty("title", out var titleEl) ? titleEl.GetString() ?? "New Action" : "New Action",
                        Owner = p.TryGetProperty("owner", out var ownerEl) ? ownerEl.GetString() ?? "Officer" : "Officer",
                        Due = p.TryGetProperty("due", out var dueEl) ? dueEl.GetString() ?? now.AddDays(7).ToString("yyyy-MM-dd") : now.AddDays(7).ToString("yyyy-MM-dd"),
                        Priority = p.TryGetProperty("priority", out var prioEl) ? prioEl.GetString() ?? "MEDIUM" : "MEDIUM",
                        Status = "TODO"
                    };
                    return await CreateActionAsync(action, ct);
                }

            case "org.approval.decide":
                {
                    if (Guid.TryParse(cmd.aggregateId, out var approvalId))
                    {
                        var dec = p.TryGetProperty("decision", out var decEl) ? decEl.GetString() ?? "APPROVED" : "APPROVED";
                        return await DecideApprovalAsync(approvalId, dec, "DBN Officer", tenantId, ct);
                    }
                    return new { success = true, aggregateId = cmd.aggregateId, version = 1, serverTime = now.ToString("o") };
                }

            case "org.converse.message.send":
                {
                    Guid convGuid = Guid.Empty;
                    if (p.TryGetProperty("conversationId", out var cIdEl) && Guid.TryParse(cIdEl.GetString(), out var parsedCid))
                    {
                        convGuid = parsedCid;
                    }
                    else if (Guid.TryParse(cmd.aggregateId, out var parsedAggId))
                    {
                        convGuid = parsedAggId;
                    }

                    if (convGuid == Guid.Empty)
                    {
                        convGuid = Guid.Parse("11111111-2222-3333-4444-555555555501");
                    }

                    var text = p.TryGetProperty("text", out var textEl) ? textEl.GetString() ?? "" : "";
                    var msgId = Guid.NewGuid();
                    var senderId = Guid.Parse("00000000-0000-0000-0000-000000000099");
                    if (actorScope != null && Guid.TryParse(actorScope.ActorId, out var parsedActorGuid))
                    {
                        senderId = parsedActorGuid;
                    }

                    var msg = new ConversationMessage
                    {
                        Id = msgId,
                        TenantId = tenantId,
                        ConversationId = convGuid,
                        SenderMemberId = senderId,
                        Text = text,
                        CreatedAt = now
                    };

                    await _repo.SaveMessageAsync(msg, ct);

                    await _repo.SaveAuditLogAsync(new Audit
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        ActorId = senderId,
                        ResourceId = msgId,
                        Operation = "org.converse.message.send",
                        Event = $"Message sent in conversation {convGuid}: {(text.Length > 30 ? text.Substring(0, 30) + "..." : text)}",
                        CorrelationId = Guid.NewGuid().ToString("D"),
                        OccurredAt = now
                    }, ct);

                    return new
                    {
                        success = true,
                        aggregateId = convGuid.ToString("D"),
                        messageId = msgId.ToString("D"),
                        version = (cmd.expectedVersion ?? 0) + 1,
                        serverTime = now.ToString("o")
                    };
                }

            case "org.converse.conversation.create":
                {
                    var name = p.TryGetProperty("name", out var nEl) ? nEl.GetString() ?? "New Discussion" : "New Discussion";
                    var kind = p.TryGetProperty("kind", out var kEl) ? kEl.GetString() ?? "CHAPTER" : "CHAPTER";
                    var initMsg = p.TryGetProperty("initialMessage", out var imEl) ? imEl.GetString() : null;

                    var convId = Guid.NewGuid();
                    var conv = new Conversation
                    {
                        Id = convId,
                        TenantId = tenantId,
                        Subject = name,
                        GroupName = name,
                        Kind = kind,
                        Chapter = targetScopeName,
                        ParticipantIdsJson = "[]",
                        CreatedAt = now,
                        UpdatedAt = now,
                        Version = 1
                    };

                    await _repo.SaveConversationAsync(conv, ct);

                    if (!string.IsNullOrWhiteSpace(initMsg))
                    {
                        var senderId = Guid.Parse("00000000-0000-0000-0000-000000000099");
                        if (actorScope != null && Guid.TryParse(actorScope.ActorId, out var parsedActorGuid))
                        {
                            senderId = parsedActorGuid;
                        }

                        var msg = new ConversationMessage
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenantId,
                            ConversationId = convId,
                            SenderMemberId = senderId,
                            Text = initMsg.Trim(),
                            CreatedAt = now
                        };
                        await _repo.SaveMessageAsync(msg, ct);
                    }

                    await _repo.SaveAuditLogAsync(new Audit
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        ActorId = Guid.Parse("00000000-0000-0000-0000-000000000099"),
                        ResourceId = convId,
                        Operation = "org.converse.conversation.create",
                        Event = $"Conversation '{name}' ({kind}) created",
                        CorrelationId = Guid.NewGuid().ToString("D"),
                        OccurredAt = now
                    }, ct);

                    return new
                    {
                        success = true,
                        aggregateId = convId.ToString("D"),
                        version = 1,
                        serverTime = now.ToString("o")
                    };
                }

            case "org.meeting.create":
            case "org.event.create":
                {
                    var participantsJson = p.TryGetProperty("participants", out var partEl) && partEl.ValueKind == System.Text.Json.JsonValueKind.Array ? partEl.GetRawText() : "[\"Organizer\"]";
                    var agendaJson = p.TryGetProperty("agenda", out var agEl) && agEl.ValueKind == System.Text.Json.JsonValueKind.Array ? agEl.GetRawText() : "[\"Review open actions\",\"General discussion\"]";
                    var quorumRequired = p.TryGetProperty("quorumRequired", out var qEl) && qEl.TryGetInt32(out var qVal) ? qVal : 1;
                    var location = p.TryGetProperty("location", out var locEl) ? locEl.GetString() ?? "" : "";
                    var title = p.TryGetProperty("title", out var titleEl) ? titleEl.GetString() : (p.TryGetProperty("name", out var nEl) ? nEl.GetString() : "Regular Meeting");
                    var scheduledAt = p.TryGetProperty("scheduledAt", out var schEl) ? schEl.GetString() : (p.TryGetProperty("date", out var dEl) ? dEl.GetString() : now.AddDays(7).ToString("o"));

                    var effectiveScopeId = p.TryGetProperty("scopeId", out var customSid) ? customSid.GetString() ?? targetScopeId : targetScopeId;
                    var effectiveScopeName = p.TryGetProperty("scopeName", out var customSname) ? customSname.GetString() ?? targetScopeName : targetScopeName;
                    var effectiveScopeLevel = p.TryGetProperty("scopeLevel", out var customSlevel) ? customSlevel.GetString() ?? targetScopeLevel : targetScopeLevel;

                    var meeting = new MeetingRecord
                    {
                        TenantId = tenantId,
                        ScopeId = effectiveScopeId,
                        ScopeName = effectiveScopeName,
                        ScopeLevel = effectiveScopeLevel,
                        Title = title ?? "Regular Meeting",
                        Type = p.TryGetProperty("type", out var typeEl) ? typeEl.GetString() ?? "OPERATIONAL" : "OPERATIONAL",
                        ScheduledAt = scheduledAt ?? now.AddDays(7).ToString("o"),
                        Location = location,
                        Status = "SCHEDULED",
                        ParticipantsJson = participantsJson,
                        AgendaJson = agendaJson,
                        QuorumRequired = quorumRequired
                    };
                    return await CreateMeetingAsync(meeting, ct);
                }

            case "org.meeting.update":
            case "org.event.update":
                {
                    if (Guid.TryParse(cmd.aggregateId, out var mid))
                    {
                        var title = p.TryGetProperty("title", out var titleEl) ? titleEl.GetString() : (p.TryGetProperty("name", out var nEl) ? nEl.GetString() : null);
                        var scheduledAt = p.TryGetProperty("scheduledAt", out var schEl) ? schEl.GetString() : (p.TryGetProperty("date", out var dEl) ? dEl.GetString() : null);
                        var type = p.TryGetProperty("type", out var typeEl) ? typeEl.GetString() : null;
                        var location = p.TryGetProperty("location", out var locEl) ? locEl.GetString() : null;
                        var status = p.TryGetProperty("status", out var stEl) ? stEl.GetString() : null;
                        var quorum = p.TryGetProperty("quorumRequired", out var qEl) && qEl.TryGetInt32(out var qVal) ? qVal : (int?)null;
                        var targetScope = p.TryGetProperty("scopeId", out var sEl) ? sEl.GetString() : null;
                        var targetScopeN = p.TryGetProperty("scopeName", out var snEl) ? snEl.GetString() : null;

                        return await UpdateMeetingAsync(mid, title, scheduledAt, type, location, quorum, status, targetScope, targetScopeN, tenantId, ct);
                    }
                    return new { success = false, message = "Invalid meeting ID", serverTime = now.ToString("o") };
                }

            case "org.meeting.delete":
            case "org.event.delete":
                {
                    if (Guid.TryParse(cmd.aggregateId, out var mid))
                    {
                        return await DeleteMeetingAsync(mid, tenantId, ct);
                    }
                    return new { success = false, message = "Invalid meeting ID", serverTime = now.ToString("o") };
                }

            case "org.mom.publish":
                {
                    if (Guid.TryParse(cmd.aggregateId, out var mid))
                    {
                        var min = p.TryGetProperty("minutes", out var minEl) ? minEl.GetString() ?? "Minutes published." : "Minutes published.";
                        return await PublishMomAsync(mid, min, tenantId, ct);
                    }
                    return new { success = true, aggregateId = cmd.aggregateId, version = (cmd.expectedVersion ?? 0) + 1, serverTime = now.ToString("o") };
                }

            case "org.member-case.create":
                {
                    var mc = new MemberCaseRecord
                    {
                        TenantId = tenantId,
                        ScopeId = cmd.organisationScope,
                        MemberId = p.TryGetProperty("memberId", out var midEl) ? midEl.GetString() ?? "" : "",
                        Title = p.TryGetProperty("title", out var titleEl) ? titleEl.GetString() ?? "Member Case" : "Member Case",
                        Type = p.TryGetProperty("type", out var typeEl) ? typeEl.GetString() ?? "ENGAGEMENT" : "ENGAGEMENT",
                        Owner = p.TryGetProperty("owner", out var ownerEl) ? ownerEl.GetString() ?? "Officer" : "Officer",
                        Status = "Open",
                        Priority = p.TryGetProperty("priority", out var prioEl) ? prioEl.GetString() ?? "MEDIUM" : "MEDIUM",
                        InternalNote = p.TryGetProperty("internalNote", out var inEl) ? inEl.GetString() ?? "" : "",
                        MemberMessage = p.TryGetProperty("memberMessage", out var mmEl) ? mmEl.GetString() ?? "" : ""
                    };
                    return await CreateMemberCaseAsync(mc, ct);
                }

            case "org.member-case.update":
                {
                    if (Guid.TryParse(cmd.aggregateId, out var mcid))
                    {
                        var st = p.TryGetProperty("status", out var stEl) ? stEl.GetString() : null;
                        return await UpdateMemberCaseAsync(mcid, st, tenantId, ct);
                    }
                    return new { success = true, aggregateId = cmd.aggregateId, version = (cmd.expectedVersion ?? 0) + 1, serverTime = now.ToString("o") };
                }

            case "org.escalation.raise":
                {
                    string fromId = targetScopeId;
                    string fromName = targetScopeName;
                    string fromLevel = targetScopeLevel;
                    if (p.TryGetProperty("from", out var fromEl) && fromEl.ValueKind == System.Text.Json.JsonValueKind.Object)
                    {
                        if (fromEl.TryGetProperty("id", out var fId)) fromId = fId.GetString() ?? fromId;
                        if (fromEl.TryGetProperty("name", out var fNm)) fromName = fNm.GetString() ?? fromName;
                        if (fromEl.TryGetProperty("level", out var fLv)) fromLevel = fLv.GetString() ?? fromLevel;
                    }

                    string toId = "22222222-2222-2222-2222-222222222222";
                    string toName = "Krishnagiri Region";
                    string toLevel = "REGION";
                    if (p.TryGetProperty("to", out var toEl) && toEl.ValueKind == System.Text.Json.JsonValueKind.Object)
                    {
                        if (toEl.TryGetProperty("id", out var tId)) toId = tId.GetString() ?? toId;
                        if (toEl.TryGetProperty("name", out var tNm)) toName = tNm.GetString() ?? toName;
                        if (toEl.TryGetProperty("level", out var tLv)) toLevel = tLv.GetString() ?? toLevel;
                    }
                    else if (p.TryGetProperty("targetScope", out var tgEl) && tgEl.ValueKind == System.Text.Json.JsonValueKind.Object)
                    {
                        if (tgEl.TryGetProperty("id", out var tId)) toId = tId.GetString() ?? toId;
                        if (tgEl.TryGetProperty("name", out var tNm)) toName = tNm.GetString() ?? toName;
                        if (tgEl.TryGetProperty("level", out var tLv)) toLevel = tLv.GetString() ?? toLevel;
                    }

                    var esc = new EscalationRecord
                    {
                        TenantId = tenantId,
                        Title = p.TryGetProperty("title", out var titleEl) ? titleEl.GetString() ?? "Escalation" : "Escalation",
                        SourceType = p.TryGetProperty("sourceType", out var stEl) ? stEl.GetString() ?? "MANUAL" : "MANUAL",
                        SourceId = p.TryGetProperty("sourceId", out var sidEl) ? sidEl.GetString() ?? fromId : fromId,
                        FromScopeId = fromId,
                        FromScopeName = fromName,
                        FromScopeLevel = fromLevel,
                        ToScopeId = toId,
                        ToScopeName = toName,
                        ToScopeLevel = toLevel,
                        Owner = p.TryGetProperty("owner", out var owEl) ? owEl.GetString() ?? (actorScope?.Name ?? "DBN Officer") : (actorScope?.Name ?? "DBN Officer"),
                        Severity = p.TryGetProperty("severity", out var sevEl) ? sevEl.GetString() ?? "HIGH" : (p.TryGetProperty("priority", out var prioEl) ? prioEl.GetString() ?? "HIGH" : "HIGH"),
                        Status = "OPEN"
                    };
                    return await RaiseEscalationAsync(esc, ct);
                }

            case "org.escalation.update":
                {
                    if (Guid.TryParse(cmd.aggregateId, out var eid))
                    {
                        var esc = await _repo.GetEscalationByIdAsync(eid, tenantId, ct);
                        if (esc != null)
                        {
                            if (p.TryGetProperty("status", out var st)) esc.Status = st.GetString() ?? esc.Status;
                            esc.Version += 1;
                            await _repo.SaveEscalationAsync(esc, ct);
                            return new { success = true, aggregateId = esc.Id.ToString("D"), version = esc.Version, serverTime = now.ToString("o") };
                        }
                    }
                    return new { success = true, aggregateId = cmd.aggregateId, version = (cmd.expectedVersion ?? 0) + 1, serverTime = now.ToString("o") };
                }

            case "org.kyt.create":
                {
                    var kyt = new KytRecord
                    {
                        TenantId = tenantId,
                        ScopeId = cmd.organisationScope,
                        MemberId = p.TryGetProperty("memberId", out var mId) ? mId.GetString() ?? "" : "",
                        MemberName = p.TryGetProperty("memberName", out var mName) ? mName.GetString() ?? "" : "",
                        Stage = "Planned",
                        DueDate = p.TryGetProperty("scheduledAt", out var sch) ? sch.GetString() ?? now.AddDays(7).ToString("o") : now.AddDays(7).ToString("o"),
                        Notes = "KYT Session planned"
                    };
                    await _repo.SaveKytAsync(kyt, ct);
                    return new { success = true, aggregateId = kyt.Id.ToString("D"), version = 1, serverTime = now.ToString("o") };
                }

            case "org.kyt.update":
                {
                    if (Guid.TryParse(cmd.aggregateId, out var kid))
                    {
                        var k = await _repo.GetKytByIdAsync(kid, tenantId, ct);
                        if (k != null)
                        {
                            if (p.TryGetProperty("status", out var stEl)) k.Stage = stEl.GetString() ?? k.Stage;
                            k.Version += 1;
                            await _repo.SaveKytAsync(k, ct);
                            return new { success = true, aggregateId = k.Id.ToString("D"), version = k.Version, serverTime = now.ToString("o") };
                        }
                    }
                    return new { success = true, aggregateId = cmd.aggregateId, version = (cmd.expectedVersion ?? 0) + 1, serverTime = now.ToString("o") };
                }

            case "org.member-presentation.create":
                {
                    var pres = new MemberPresentationRecord
                    {
                        TenantId = tenantId,
                        ScopeId = cmd.organisationScope,
                        MemberId = p.TryGetProperty("memberId", out var mId) ? mId.GetString() ?? "" : "",
                        MemberName = p.TryGetProperty("memberName", out var mName) ? mName.GetString() ?? "" : "",
                        Topic = p.TryGetProperty("topic", out var top) ? top.GetString() ?? "Business Presentation" : "Business Presentation",
                        ScheduledDate = p.TryGetProperty("scheduledAt", out var sch) ? sch.GetString() ?? now.AddDays(7).ToString("yyyy-MM-dd") : now.AddDays(7).ToString("yyyy-MM-dd"),
                        Status = "SCHEDULED",
                        DurationMinutes = p.TryGetProperty("durationMinutes", out var dur) && dur.TryGetInt32(out var d) ? d : 10
                    };
                    await _repo.SavePresentationAsync(pres, ct);
                    return new { success = true, aggregateId = pres.Id.ToString("D"), version = 1, serverTime = now.ToString("o") };
                }

            case "org.member-presentation.update":
                {
                    if (Guid.TryParse(cmd.aggregateId, out var pid))
                    {
                        var pres = await _repo.GetPresentationByIdAsync(pid, tenantId, ct);
                        if (pres != null)
                        {
                            if (p.TryGetProperty("status", out var st)) pres.Status = st.GetString() ?? pres.Status;
                            pres.Version += 1;
                            await _repo.SavePresentationAsync(pres, ct);
                            return new { success = true, aggregateId = pres.Id.ToString("D"), version = pres.Version, serverTime = now.ToString("o") };
                        }
                    }
                    return new { success = true, aggregateId = cmd.aggregateId, version = (cmd.expectedVersion ?? 0) + 1, serverTime = now.ToString("o") };
                }

            case "org.risk.create":
            case "org.risk.update":
                {
                    if (cmd.commandType == "org.risk.update" && Guid.TryParse(cmd.aggregateId, out var rid))
                    {
                        var r = await _repo.GetRiskByIdAsync(rid, tenantId, ct);
                        if (r != null)
                        {
                            if (p.TryGetProperty("status", out var st)) r.Status = st.GetString() ?? r.Status;
                            if (p.TryGetProperty("title", out var titEl) && !string.IsNullOrWhiteSpace(titEl.GetString())) r.Title = titEl.GetString()!;
                            if (p.TryGetProperty("impact", out var impEl) && !string.IsNullOrWhiteSpace(impEl.GetString())) r.Impact = impEl.GetString()!;
                            if (p.TryGetProperty("likelihood", out var lhEl) && !string.IsNullOrWhiteSpace(lhEl.GetString())) r.Likelihood = lhEl.GetString()!;
                            if (p.TryGetProperty("owner", out var owEl) && !string.IsNullOrWhiteSpace(owEl.GetString())) r.Owner = owEl.GetString()!;
                            r.Version += 1;
                            await _repo.SaveRiskAsync(r, ct);
                            return new { success = true, aggregateId = r.Id.ToString("D"), version = r.Version, serverTime = now.ToString("o") };
                        }
                    }
                    var newRisk = new RiskRecord
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        ScopeId = targetScopeId,
                        ScopeName = targetScopeName,
                        ScopeLevel = targetScopeLevel,
                        Title = p.TryGetProperty("title", out var tEl) ? tEl.GetString() ?? "Operational Risk" : "Operational Risk",
                        Owner = p.TryGetProperty("owner", out var owEl2) ? owEl2.GetString() ?? (actorScope?.Name ?? "Officer") : (actorScope?.Name ?? "Officer"),
                        Status = p.TryGetProperty("status", out var stEl) ? stEl.GetString() ?? "ACTIVE" : "ACTIVE",
                        Impact = p.TryGetProperty("impact", out var impEl2) ? impEl2.GetString() ?? "MEDIUM" : (p.TryGetProperty("severity", out var sEl) ? sEl.GetString() ?? "MEDIUM" : "MEDIUM"),
                        Likelihood = p.TryGetProperty("likelihood", out var lkEl) ? lkEl.GetString() ?? "LOW" : "LOW",
                        ReviewDate = p.TryGetProperty("reviewDate", out var rdEl) ? rdEl.GetString() ?? now.AddDays(30).ToString("yyyy-MM-dd") : now.AddDays(30).ToString("yyyy-MM-dd"),
                        Version = 1,
                        CreatedAt = now
                    };
                    await _repo.SaveRiskAsync(newRisk, ct);
                    return new { success = true, aggregateId = newRisk.Id.ToString("D"), version = 1, serverTime = now.ToString("o") };
                }

            case "org.issue.create":
            case "org.issue.update":
                {
                    if (cmd.commandType == "org.issue.update" && Guid.TryParse(cmd.aggregateId, out var iid))
                    {
                        var issue = await _repo.GetIssueByIdAsync(iid, tenantId, ct);
                        if (issue != null)
                        {
                            if (p.TryGetProperty("status", out var st)) issue.Status = st.GetString() ?? issue.Status;
                            if (p.TryGetProperty("title", out var titEl) && !string.IsNullOrWhiteSpace(titEl.GetString())) issue.Title = titEl.GetString()!;
                            if (p.TryGetProperty("impact", out var impEl) && !string.IsNullOrWhiteSpace(impEl.GetString())) issue.Impact = impEl.GetString()!;
                            if (p.TryGetProperty("owner", out var owEl) && !string.IsNullOrWhiteSpace(owEl.GetString())) issue.Owner = owEl.GetString()!;
                            issue.Version += 1;
                            await _repo.SaveIssueAsync(issue, ct);
                            return new { success = true, aggregateId = issue.Id.ToString("D"), version = issue.Version, serverTime = now.ToString("o") };
                        }
                    }
                    var newIssue = new IssueRecord
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        ScopeId = targetScopeId,
                        ScopeName = targetScopeName,
                        ScopeLevel = targetScopeLevel,
                        Title = p.TryGetProperty("title", out var tEl) ? tEl.GetString() ?? "Operational Issue" : "Operational Issue",
                        Owner = p.TryGetProperty("owner", out var owEl2) ? owEl2.GetString() ?? (actorScope?.Name ?? "Officer") : (actorScope?.Name ?? "Officer"),
                        Status = p.TryGetProperty("status", out var stEl) ? stEl.GetString() ?? "OPEN" : "OPEN",
                        Impact = p.TryGetProperty("impact", out var impEl2) ? impEl2.GetString() ?? "HIGH" : (p.TryGetProperty("severity", out var sEl) ? sEl.GetString() ?? "HIGH" : "HIGH"),
                        SourceType = p.TryGetProperty("sourceType", out var stpEl) ? stpEl.GetString() ?? "MANUAL" : "MANUAL",
                        SourceId = p.TryGetProperty("sourceId", out var sidEl) ? sidEl.GetString() ?? "" : "",
                        Version = 1,
                        CreatedAt = now
                    };
                    await _repo.SaveIssueAsync(newIssue, ct);
                    return new { success = true, aggregateId = newIssue.Id.ToString("D"), version = 1, serverTime = now.ToString("o") };
                }

            case "org.exception.create":
            case "org.exception.decide":
            case "org.exception.update":
                {
                    if ((cmd.commandType == "org.exception.decide" || cmd.commandType == "org.exception.update") && Guid.TryParse(cmd.aggregateId, out var exid))
                    {
                        var exc = await _repo.GetExceptionByIdAsync(exid, tenantId, ct);
                        if (exc != null)
                        {
                            var decision = p.TryGetProperty("decision", out var dec) ? dec.GetString() : (p.TryGetProperty("status", out var st) ? st.GetString() : "APPROVED");
                            exc.Status = decision ?? "APPROVED";
                            exc.Decision = decision ?? "APPROVED";
                            exc.Version += 1;
                            await _repo.SaveExceptionAsync(exc, ct);
                            return new { success = true, aggregateId = exc.Id.ToString("D"), version = exc.Version, serverTime = now.ToString("o") };
                        }
                    }
                    var newExc = new OperationalExceptionRecord
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        ScopeId = targetScopeId,
                        ScopeName = targetScopeName,
                        ScopeLevel = targetScopeLevel,
                        Title = p.TryGetProperty("title", out var tEl) ? tEl.GetString() ?? "Operational Exception" : "Operational Exception",
                        Description = p.TryGetProperty("description", out var dEl) ? dEl.GetString() ?? "" : (p.TryGetProperty("reason", out var rEl) ? rEl.GetString() ?? "" : ""),
                        Status = p.TryGetProperty("status", out var stEl) ? stEl.GetString() ?? "OPEN" : "OPEN",
                        Decision = p.TryGetProperty("decision", out var decEl) ? decEl.GetString() ?? "PENDING" : "PENDING",
                        Owner = p.TryGetProperty("owner", out var owEl) ? owEl.GetString() ?? (actorScope?.Name ?? "Officer") : (actorScope?.Name ?? "Officer"),
                        Version = 1,
                        CreatedAt = now
                    };
                    await _repo.SaveExceptionAsync(newExc, ct);
                    return new { success = true, aggregateId = newExc.Id.ToString("D"), version = 1, serverTime = now.ToString("o") };
                }

            case "org.decision.create":
            case "org.decision.record":
            case "org.decision.update":
                {
                    if (cmd.commandType == "org.decision.update" && Guid.TryParse(cmd.aggregateId, out var did))
                    {
                        var dec = await _repo.GetDecisionByIdAsync(did, tenantId, ct);
                        if (dec != null)
                        {
                            if (p.TryGetProperty("status", out var st)) dec.Status = st.GetString() ?? dec.Status;
                            if (p.TryGetProperty("subject", out var sb) && !string.IsNullOrWhiteSpace(sb.GetString())) dec.Subject = sb.GetString()!;
                            if (p.TryGetProperty("authority", out var au) && !string.IsNullOrWhiteSpace(au.GetString())) dec.Authority = au.GetString()!;
                            if (p.TryGetProperty("reason", out var rs) && !string.IsNullOrWhiteSpace(rs.GetString())) dec.Reason = rs.GetString()!;
                            dec.Version += 1;
                            await _repo.SaveDecisionAsync(dec, ct);
                            return new { success = true, aggregateId = dec.Id.ToString("D"), version = dec.Version, serverTime = now.ToString("o") };
                        }
                    }
                    var newDec = new DecisionRecord
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        ScopeId = targetScopeId,
                        ScopeName = targetScopeName,
                        ScopeLevel = targetScopeLevel,
                        Subject = p.TryGetProperty("subject", out var sEl) ? sEl.GetString() ?? "Operational Decision" : (p.TryGetProperty("title", out var tEl) ? tEl.GetString() ?? "Operational Decision" : "Operational Decision"),
                        Authority = p.TryGetProperty("authority", out var aEl) ? aEl.GetString() ?? "Chapter Executive Committee" : "Chapter Executive Committee",
                        Reason = p.TryGetProperty("reason", out var rEl) ? rEl.GetString() ?? "" : (p.TryGetProperty("summary", out var smEl) ? smEl.GetString() ?? "" : ""),
                        EffectiveDate = p.TryGetProperty("effectiveDate", out var edEl) ? edEl.GetString() ?? now.ToString("yyyy-MM-dd") : now.ToString("yyyy-MM-dd"),
                        Status = p.TryGetProperty("status", out var stEl) ? stEl.GetString() ?? "APPROVED" : "APPROVED",
                        SourceType = p.TryGetProperty("sourceType", out var stpEl) ? stpEl.GetString() ?? "MC_MEETING" : "MC_MEETING",
                        SourceId = p.TryGetProperty("sourceId", out var sidEl) ? sidEl.GetString() ?? "" : "",
                        Version = 1,
                        CreatedAt = now
                    };
                    await _repo.SaveDecisionAsync(newDec, ct);
                    return new { success = true, aggregateId = newDec.Id.ToString("D"), version = 1, serverTime = now.ToString("o") };
                }

            case "org.handoff.create":
                {
                    var sw = p.TryGetProperty("sourceWorkspace", out var swEl) ? swEl.GetString() ?? "ORGANISATIONAL" : "ORGANISATIONAL";
                    var st = p.TryGetProperty("sourceType", out var stEl) ? stEl.GetString() ?? "WORKSPACE" : "WORKSPACE";
                    var sid = p.TryGetProperty("sourceId", out var sidEl) ? sidEl.GetString() ?? cmd.organisationScope : cmd.organisationScope;
                    var tw = p.TryGetProperty("targetWorkspace", out var twEl) ? twEl.GetString() ?? "PLATFORM_ADMIN" : "PLATFORM_ADMIN";
                    var rc = p.TryGetProperty("requestedCapability", out var rcEl) ? rcEl.GetString() ?? "SUPPORT" : "SUPPORT";
                    var rs = p.TryGetProperty("reason", out var rsEl) ? rsEl.GetString() ?? "Operational handoff" : "Operational handoff";

                    var hId = Guid.NewGuid();
                    var h = new HandoffRecord
                    {
                        Id = hId,
                        TenantId = tenantId,
                        SourceWorkspace = sw,
                        SourceType = st,
                        SourceId = sid,
                        TargetWorkspace = tw,
                        RequestedCapability = rc,
                        Reason = rs,
                        Status = p.TryGetProperty("status", out var stStat) ? stStat.GetString() ?? "Requested" : "Requested",
                        CorrelationId = $"CORR-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
                        Version = 1,
                        CreatedAt = now
                    };
                    await _repo.SaveHandoffAsync(h, ct);
                    return new { success = true, aggregateId = h.Id.ToString("D"), version = 1, serverTime = now.ToString("o") };
                }

            case "org.handoff.update":
                {
                    if (Guid.TryParse(cmd.aggregateId, out var hid))
                    {
                        var h = await _repo.GetHandoffByIdAsync(hid, tenantId, ct);
                        if (h != null)
                        {
                            if (p.TryGetProperty("status", out var st)) h.Status = st.GetString() ?? h.Status;
                            h.Version += 1;
                            await _repo.SaveHandoffAsync(h, ct);
                            return new { success = true, aggregateId = h.Id.ToString("D"), version = h.Version, serverTime = now.ToString("o") };
                        }
                        throw new KeyNotFoundException($"Handoff record with ID {hid} was not found.");
                    }
                    throw new ArgumentException("A valid handoff aggregateId GUID is required.");
                }

            case "org.availability.update":
                {
                    var actorId = !string.IsNullOrWhiteSpace(actorScope?.ActorId)
                        ? actorScope.ActorId
                        : (p.TryGetProperty("actorId", out var act) ? act.GetString() ?? "" : "");
                    var scopeIdToSave = p.TryGetProperty("scope", out var sc) ? sc.GetString() ?? cmd.organisationScope : cmd.organisationScope;

                    Guid availId = Guid.NewGuid();
                    if (!string.IsNullOrWhiteSpace(cmd.aggregateId) && Guid.TryParse(cmd.aggregateId, out var parsedAvailId) && parsedAvailId != Guid.Empty)
                    {
                        availId = parsedAvailId;
                    }

                    var avail = new MemberAvailabilityRecord
                    {
                        Id = availId,
                        TenantId = tenantId,
                        ActorId = actorId,
                        ScopeId = scopeIdToSave,
                        Availability = p.TryGetProperty("availability", out var av) ? av.GetString() ?? "Available" : "Available",
                        EffectiveFrom = p.TryGetProperty("effectiveFrom", out var ef) ? ef.GetString() : now.ToString("o"),
                        EffectiveTo = p.TryGetProperty("effectiveTo", out var et) ? et.GetString() : now.AddDays(14).ToString("o"),
                        Reason = p.TryGetProperty("reason", out var rs) ? rs.GetString() : "",
                        Version = (cmd.expectedVersion ?? 0) + 1,
                        CreatedAt = DateTimeOffset.UtcNow
                    };
                    await _repo.SaveAvailabilityAsync(avail, ct);
                    return new { success = true, aggregateId = avail.Id.ToString("D"), version = avail.Version, serverTime = now.ToString("o") };
                }

            case "org.delegation.create":
                {
                    var delegatorRaw = p.TryGetProperty("delegatorId", out var dg) ? dg.GetString() : null;
                    var delegateRaw = p.TryGetProperty("delegateId", out var dt) ? dt.GetString() : null;

                    if (!Guid.TryParse(delegatorRaw, out var dId) || dId == Guid.Empty)
                    {
                        if (!string.IsNullOrWhiteSpace(actorScope?.ActorId) && Guid.TryParse(actorScope.ActorId, out var parsedActor))
                        {
                            dId = parsedActor;
                        }
                        else
                        {
                            throw new ArgumentException("A valid delegatorId GUID is required.");
                        }
                    }

                    if (!Guid.TryParse(delegateRaw, out var dtId) || dtId == Guid.Empty)
                    {
                        throw new ArgumentException("A valid delegateId GUID is required.");
                    }

                    var startDt = p.TryGetProperty("start", out var stEl) && DateTimeOffset.TryParse(stEl.GetString(), out var parsedStart) ? parsedStart : now;
                    var endDt = p.TryGetProperty("end", out var endEl) && DateTimeOffset.TryParse(endEl.GetString(), out var parsedEnd) ? parsedEnd : now.AddDays(30);
                    if (endDt <= startDt)
                    {
                        endDt = startDt.AddDays(30);
                    }

                    string permissionText = "operational follow-through";
                    if (p.TryGetProperty("functions", out var fnEl) && fnEl.ValueKind == System.Text.Json.JsonValueKind.Array)
                    {
                        var fnList = new List<string>();
                        foreach (var item in fnEl.EnumerateArray())
                        {
                            var str = item.GetString();
                            if (!string.IsNullOrWhiteSpace(str)) fnList.Add(str);
                        }
                        if (fnList.Count > 0)
                        {
                            permissionText = string.Join(", ", fnList);
                            if (permissionText.Length > 160) permissionText = permissionText.Substring(0, 160);
                        }
                    }

                    var chapterGuid = Guid.TryParse(cmd.organisationScope, out var scG) ? scG : (Guid.TryParse(actorScope?.ScopeId, out var aG) ? aG : Guid.Empty);

                    var del = new Delegation
                    {
                        TenantId = tenantId,
                        ChapterId = chapterGuid,
                        DelegatorId = dId,
                        DelegateId = dtId,
                        Permission = permissionText,
                        StartsAt = startDt,
                        EndsAt = endDt,
                        Revoked = false
                    };
                    await _repo.SaveDelegationAsync(del, ct);
                    return new { success = true, aggregateId = del.Id.ToString("D"), version = 1, serverTime = now.ToString("o") };
                }

            case "org.delegation.revoke":
                {
                    if (Guid.TryParse(cmd.aggregateId, out var delId))
                    {
                        var del = await _repo.GetDelegationByIdAsync(delId, tenantId, ct);
                        if (del != null)
                        {
                            del.Revoked = true;
                            await _repo.SaveDelegationAsync(del, ct);
                            return new { success = true, aggregateId = del.Id.ToString("D"), version = 2, serverTime = now.ToString("o") };
                        }
                        throw new KeyNotFoundException($"Delegation with ID {delId} was not found.");
                    }
                    throw new ArgumentException("A valid delegation aggregateId GUID is required for revocation.");
                }

            case "org.handover.prepare":
                {
                    var assignmentId = (p.TryGetProperty("assignmentId", out var asEl) ? asEl.GetString() : null) ?? cmd.aggregateId ?? "";
                    var outgoing = p.TryGetProperty("outgoingMemberId", out var outEl) ? outEl.GetString() ?? actorScope?.ActorId ?? "" : actorScope?.ActorId ?? "";
                    var incoming = p.TryGetProperty("incomingMemberId", out var inEl) ? inEl.GetString() ?? "" : "";
                    if (string.IsNullOrWhiteSpace(incoming))
                    {
                        throw new ArgumentException("A valid incomingMemberId is required to prepare a handover.");
                    }

                    var openTaskIds = p.TryGetProperty("openTaskIds", out var otEl) ? otEl.GetRawText() : "[]";
                    var openActionIds = p.TryGetProperty("openActionIds", out var oaEl) ? oaEl.GetRawText() : "[]";
                    var openCaseIds = p.TryGetProperty("openCaseIds", out var ocEl) ? ocEl.GetRawText() : "[]";
                    var meetingIds = p.TryGetProperty("meetingIds", out var mtEl) ? mtEl.GetRawText() : "[]";
                    var programmeIds = p.TryGetProperty("programmeIds", out var prEl) ? prEl.GetRawText() : "[]";
                    var documentIds = p.TryGetProperty("documentIds", out var dcEl) ? dcEl.GetRawText() : "[]";
                    var summary = p.TryGetProperty("summary", out var smEl) ? smEl.GetRawText() : null;

                    var ho = new HandoverRecord
                    {
                        TenantId = tenantId,
                        AssignmentId = assignmentId,
                        OutgoingMemberId = outgoing,
                        IncomingMemberId = incoming,
                        ScopeId = cmd.organisationScope,
                        Status = "Prepared",
                        PreparedAt = now.ToString("o"),
                        OpenTaskIdsJson = openTaskIds,
                        OpenActionIdsJson = openActionIds,
                        OpenCaseIdsJson = openCaseIds,
                        MeetingIdsJson = meetingIds,
                        ProgrammeIdsJson = programmeIds,
                        DocumentIdsJson = documentIds,
                        SummaryJson = summary,
                        Version = 1,
                        CreatedAt = now,
                        UpdatedAt = now
                    };
                    await _repo.SaveHandoverAsync(ho, ct);
                    return new { success = true, aggregateId = ho.Id.ToString("D"), version = 1, serverTime = now.ToString("o") };
                }

            case "org.handover.accept":
                {
                    if (Guid.TryParse(cmd.aggregateId, out var hoId))
                    {
                        var ho = await _repo.GetHandoverByIdAsync(hoId, tenantId, ct);
                        if (ho != null)
                        {
                            ho.Status = "Accepted";
                            ho.AcceptedAt = now.ToString("o");
                            ho.Version += 1;
                            ho.UpdatedAt = now;
                            await _repo.SaveHandoverAsync(ho, ct);
                            return new { success = true, aggregateId = ho.Id.ToString("D"), version = ho.Version, serverTime = now.ToString("o") };
                        }
                        throw new KeyNotFoundException($"Handover with ID {hoId} was not found.");
                    }
                    throw new ArgumentException("A valid handover aggregateId GUID is required.");
                }

            case "org.handover.complete":
                {
                    if (Guid.TryParse(cmd.aggregateId, out var hoId))
                    {
                        var ho = await _repo.GetHandoverByIdAsync(hoId, tenantId, ct);
                        if (ho != null)
                        {
                            ho.Status = "Completed";
                            ho.CompletedAt = now.ToString("o");
                            ho.Version += 1;
                            ho.UpdatedAt = now;
                            await _repo.SaveHandoverAsync(ho, ct);
                            return new { success = true, aggregateId = ho.Id.ToString("D"), version = ho.Version, serverTime = now.ToString("o") };
                        }
                        throw new KeyNotFoundException($"Handover with ID {hoId} was not found.");
                    }
                    throw new ArgumentException("A valid handover aggregateId GUID is required.");
                }

            case "org.data-quality.report":
                {
                    var dq = new DataQualityFindingRecord
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        ScopeId = cmd.organisationScope ?? "",
                        ScopeName = actorScope?.ScopeName ?? "Thanjavur Chapter",
                        ScopeLevel = actorScope?.ScopeLevel ?? "CHAPTER",
                        Title = p.TryGetProperty("title", out var tEl) ? tEl.GetString() ?? "Data Anomaly Detected" : "Data Anomaly Detected",
                        Description = p.TryGetProperty("description", out var dEl) ? dEl.GetString() ?? "" : "",
                        Severity = p.TryGetProperty("severity", out var sEl) ? sEl.GetString() ?? "Medium" : "Medium",
                        Status = "Open",
                        EntityType = p.TryGetProperty("entityType", out var etEl) ? etEl.GetString() ?? "MEMBER" : "MEMBER",
                        EntityId = p.TryGetProperty("entityId", out var eiEl) ? eiEl.GetString() ?? "" : "",
                        Version = 1,
                        CreatedAt = now
                    };
                    await _repo.SaveDataQualityFindingAsync(dq, ct);
                    return new { success = true, aggregateId = dq.Id.ToString("D"), version = 1, serverTime = now.ToString("o") };
                }

            case "org.data-quality.update":
            case "org.data-quality.correct":
            case "org.data-quality.assign":
            case "org.data-quality.close":
            case "org.data-quality.revalidate":
                {
                    if (Guid.TryParse(cmd.aggregateId, out var dqid))
                    {
                        var dq = await _repo.GetDataQualityFindingByIdAsync(dqid, tenantId, ct);
                        if (dq != null)
                        {
                            if (cmd.commandType == "org.data-quality.correct")
                            {
                                dq.Status = "Corrected";
                            }
                            else if (cmd.commandType == "org.data-quality.close")
                            {
                                dq.Status = "Closed";
                            }
                            else if (cmd.commandType == "org.data-quality.revalidate")
                            {
                                dq.Status = "Verified";
                            }

                            if (p.TryGetProperty("status", out var st) && !string.IsNullOrWhiteSpace(st.GetString()))
                            {
                                dq.Status = st.GetString()!;
                            }
                            if (p.TryGetProperty("title", out var tEl) && !string.IsNullOrWhiteSpace(tEl.GetString()))
                            {
                                dq.Title = tEl.GetString()!;
                            }
                            if (p.TryGetProperty("description", out var dEl) && !string.IsNullOrWhiteSpace(dEl.GetString()))
                            {
                                dq.Description = dEl.GetString()!;
                            }
                            if (p.TryGetProperty("severity", out var sEl) && !string.IsNullOrWhiteSpace(sEl.GetString()))
                            {
                                dq.Severity = sEl.GetString()!;
                            }
                            if (p.TryGetProperty("resolution", out var resEl) && !string.IsNullOrWhiteSpace(resEl.GetString()))
                            {
                                dq.Description = string.IsNullOrWhiteSpace(dq.Description)
                                    ? $"[Resolution]: {resEl.GetString()}"
                                    : $"{dq.Description}\n\n[Resolution]: {resEl.GetString()}";
                            }
                            dq.Version += 1;
                            await _repo.SaveDataQualityFindingAsync(dq, ct);
                            return new { success = true, aggregateId = dq.Id.ToString("D"), version = dq.Version, serverTime = now.ToString("o") };
                        }
                        throw new KeyNotFoundException($"Data quality finding with ID {dqid} was not found.");
                    }
                    throw new ArgumentException("A valid data quality aggregateId GUID is required.");
                }

            case "org.goal.update":
            case "org.plan.update":
                {
                    if (Guid.TryParse(cmd.aggregateId, out var gid))
                    {
                        var g = await _repo.GetGoalByIdAsync(gid, tenantId, ct);
                        if (g != null)
                        {
                            if (p.TryGetProperty("title", out var tEl) && !string.IsNullOrWhiteSpace(tEl.GetString())) g.Title = tEl.GetString()!;
                            if (p.TryGetProperty("status", out var st)) g.Status = st.GetString() ?? g.Status;
                            if (p.TryGetProperty("progress", out var pr) && pr.TryGetInt32(out var pVal)) g.Progress = pVal;
                            if (p.TryGetProperty("owner", out var owEl) && !string.IsNullOrWhiteSpace(owEl.GetString())) g.Owner = owEl.GetString()!;
                            g.Version += 1;
                            await _repo.SaveGoalAsync(g, ct);
                            return new { success = true, aggregateId = g.Id.ToString("D"), version = g.Version, serverTime = now.ToString("o") };
                        }
                    }
                    return new { success = true, aggregateId = cmd.aggregateId, version = (cmd.expectedVersion ?? 0) + 1, serverTime = now.ToString("o") };
                }

            case "org.communication.publish":
            case "org.communication.update":
                {
                    CommunicationRecord? comm = null;
                    if (Guid.TryParse(cmd.aggregateId, out var commId))
                    {
                        comm = await _repo.GetCommunicationByIdAsync(commId, tenantId, ct);
                    }
                    if (comm != null)
                    {
                        if (p.TryGetProperty("status", out var stEl) && !string.IsNullOrWhiteSpace(stEl.GetString()))
                        {
                            comm.Status = stEl.GetString()!;
                        }
                        else if (cmd.commandType == "org.communication.publish")
                        {
                            comm.Status = "Published";
                            comm.PublishedAt = now.ToString("o");
                        }
                        if (p.TryGetProperty("title", out var tEl) && !string.IsNullOrWhiteSpace(tEl.GetString()))
                        {
                            comm.Title = tEl.GetString()!;
                        }
                        if (p.TryGetProperty("body", out var bEl) && !string.IsNullOrWhiteSpace(bEl.GetString()))
                        {
                            comm.Body = bEl.GetString()!;
                        }
                        comm.Version += 1;
                        await _repo.SaveCommunicationAsync(comm, ct);
                        return new { success = true, aggregateId = comm.Id.ToString("D"), version = comm.Version, serverTime = now.ToString("o") };
                    }
                    else
                    {
                        var reqPrio = p.TryGetProperty("priority", out var prEl) ? prEl.GetString()?.ToLowerInvariant() ?? "normal" : "normal";
                        var reqAck = p.TryGetProperty("acknowledgementRequired", out var ackEl) && ackEl.GetBoolean();
                        var reqAud = p.TryGetProperty("audience", out var aEl) ? aEl.GetString() ?? "All Chapter Members" : "All Chapter Members";
                        var encodedAudience = $"{reqPrio}|{reqAck}|{reqAud}";

                        var resolvedScopeId = p.TryGetProperty("scopeId", out var scIdEl) && !string.IsNullOrWhiteSpace(scIdEl.GetString()) ? scIdEl.GetString()! : targetScopeId;
                        var resolvedScopeName = p.TryGetProperty("scopeName", out var scNameEl) && !string.IsNullOrWhiteSpace(scNameEl.GetString()) ? scNameEl.GetString()! : targetScopeName;

                        var newComm = new CommunicationRecord
                        {
                            Id = Guid.TryParse(cmd.aggregateId, out var gid) ? gid : Guid.NewGuid(),
                            TenantId = tenantId,
                            ScopeId = resolvedScopeId,
                            ScopeName = resolvedScopeName,
                            ScopeLevel = targetScopeLevel,
                            AudienceScopeId = resolvedScopeId,
                            AudienceLevel = targetScopeLevel,
                            IncludeDescendants = true,
                            Title = p.TryGetProperty("title", out var tEl) ? tEl.GetString() ?? "Announcement" : "Announcement",
                            Body = p.TryGetProperty("content", out var cEl) ? cEl.GetString() ?? "" : (p.TryGetProperty("body", out var bEl) ? bEl.GetString() ?? "" : ""),
                            Audience = encodedAudience,
                            Status = cmd.commandType == "org.communication.publish" ? "Published" : (p.TryGetProperty("status", out var stEl) ? stEl.GetString() ?? "Review" : "Draft"),
                            PublishedAt = now.ToString("o"),
                            Version = 1,
                            CreatedAt = now
                        };
                        await _repo.SaveCommunicationAsync(newComm, ct);
                        return new { success = true, aggregateId = newComm.Id.ToString("D"), version = 1, serverTime = now.ToString("o") };
                    }
                }

            case "org.dues.reconcile":
                {
                    var memberId = p.TryGetProperty("memberId", out var mEl) ? mEl.GetString() : null;
                    var targetId = cmd.aggregateId ?? "";
                    if (targetId.StartsWith("dues:", StringComparison.OrdinalIgnoreCase))
                    {
                        targetId = targetId.Substring(5);
                    }

                    DbnMemberRegistration? dbnMember = null;
                    if (Guid.TryParse(targetId, out var parsedGuid))
                    {
                        dbnMember = await _repo.GetDbnMemberRegistrationByIdAsync(parsedGuid, tenantId, ct);
                    }
                    if (dbnMember == null && !string.IsNullOrEmpty(memberId) && Guid.TryParse(memberId, out var parsedMemberGuid))
                    {
                        dbnMember = await _repo.GetDbnMemberRegistrationByIdAsync(parsedMemberGuid, tenantId, ct);
                    }
                    if (dbnMember == null && !string.IsNullOrEmpty(memberId))
                    {
                        var all = await _repo.GetDbnMemberRegistrationsAsync(tenantId, null, null, ct);
                        dbnMember = all.FirstOrDefault(m => string.Equals(m.AssignedMemberId, memberId, StringComparison.OrdinalIgnoreCase));
                    }

                    if (dbnMember != null)
                    {
                        dbnMember.TrustPaymentVerifiedAt = now;
                        dbnMember.TrustPaymentVerifiedBy = actorScope?.Name ?? "Chapter Treasurer";
                        dbnMember.TrustPaymentVerifiedRole = actorScope?.Position ?? "Treasurer";
                        await _repo.SaveDbnMemberRegistrationAsync(dbnMember, ct);

                        try
                        {
                            await _repo.SaveAuditLogAsync(new Audit
                            {
                                Id = Guid.NewGuid(),
                                TenantId = tenantId,
                                ActorId = Guid.TryParse(actorScope?.ActorId, out var aid) ? aid : Guid.Parse("00000000-0000-0000-0000-000000000099"),
                                ResourceId = dbnMember.Id,
                                Operation = "org.dues.reconcile",
                                Event = $"Membership dues reconciled and matched for {dbnMember.ApplicantFullName} ({dbnMember.BusinessName}) by {dbnMember.TrustPaymentVerifiedBy}",
                                CorrelationId = !string.IsNullOrEmpty(cmd.commandId) ? cmd.commandId : Guid.NewGuid().ToString("D"),
                                OccurredAt = now
                            }, ct);
                        }
                        catch { }

                        return new { success = true, aggregateId = dbnMember.Id.ToString("D"), version = 2, status = "Matched", serverTime = now.ToString("o") };
                    }

                    return new { success = true, aggregateId = cmd.aggregateId, version = (cmd.expectedVersion ?? 0) + 1, status = "Matched", serverTime = now.ToString("o") };
                }

            case "org.feedback.update":
            case "org.poll.update":
            case "org.survey.update":
            case "org.poll.vote":
            case "org.feedback.vote":
            case "org.survey.submit":
                {
                    if (Guid.TryParse(cmd.aggregateId, out var fid))
                    {
                        var f = await _repo.GetFeedbackByIdAsync(fid, tenantId, ct);
                        if (f != null)
                        {
                            if (p.TryGetProperty("status", out var st)) f.Status = st.GetString() ?? f.Status;
                            if (cmd.commandType.EndsWith(".vote", StringComparison.OrdinalIgnoreCase) || cmd.commandType.EndsWith(".submit", StringComparison.OrdinalIgnoreCase))
                            {
                                f.ResponsesCount += 1;
                            }
                            f.Version += 1;
                            await _repo.SaveFeedbackAsync(f, ct);
                            return new { success = true, aggregateId = f.Id.ToString("D"), version = f.Version, responsesCount = f.ResponsesCount, serverTime = now.ToString("o") };
                        }
                    }
                    return new { success = true, aggregateId = cmd.aggregateId, version = (cmd.expectedVersion ?? 0) + 1, serverTime = now.ToString("o") };
                }

            case "org.job.request":
                {
                    var kindVal = p.TryGetProperty("kind", out var ky) ? ky.GetString() ?? "EXPORT" : "EXPORT";
                    var requestedByName = !string.IsNullOrWhiteSpace(actorScope?.Name) ? actorScope.Name : "Saravanan";
                    var job = new JobRecord
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        ScopeId = cmd.organisationScope ?? "",
                        ScopeName = actorScope?.ScopeName ?? "Thanjavur Chapter",
                        ScopeLevel = actorScope?.ScopeLevel ?? "CHAPTER",
                        Title = p.TryGetProperty("title", out var tEl) ? tEl.GetString() ?? $"{kindVal} Processing Job" : $"{kindVal} Processing Job",
                        Kind = kindVal.ToUpperInvariant(),
                        Status = "Completed",
                        Progress = 100,
                        RequestedAt = now.ToString("o"),
                        RequestedBy = requestedByName,
                        CreatedAt = now
                    };
                    await _repo.SaveJobAsync(job, ct);
                    return new { success = true, aggregateId = job.Id.ToString("D"), version = 1, serverTime = now.ToString("o") };
                }



            case "org.programme.update":
                {
                    if (Guid.TryParse(cmd.aggregateId, out var progId))
                    {
                        var prog = await _repo.GetProgrammeByIdAsync(progId, tenantId, ct);
                        if (prog != null)
                        {
                            if (p.TryGetProperty("status", out var st)) prog.Status = st.GetString() ?? prog.Status;
                            if (p.TryGetProperty("progress", out var pr) && pr.TryGetInt32(out var prVal)) prog.Progress = prVal;
                            prog.Version += 1;
                            prog.UpdatedAt = now;
                            await _repo.SaveProgrammeAsync(prog, ct);
                            return new { success = true, aggregateId = prog.Id.ToString("D"), version = prog.Version, serverTime = now.ToString("o") };
                        }
                    }
                    return new { success = true, aggregateId = cmd.aggregateId, version = (cmd.expectedVersion ?? 0) + 1, serverTime = now.ToString("o") };
                }

            case "org.programme.create":
            case "org.project.create":
                {
                    var progId = Guid.TryParse(cmd.aggregateId, out var pid) ? pid : Guid.NewGuid();
                    var prog = new ProgrammeRecord
                    {
                        Id = progId,
                        TenantId = tenantId,
                        ScopeId = targetScopeId,
                        ScopeName = targetScopeName,
                        ScopeLevel = targetScopeLevel,
                        Name = p.TryGetProperty("name", out var nameEl) ? nameEl.GetString() ?? "New Programme" : (p.TryGetProperty("title", out var tEl) ? tEl.GetString() ?? "New Programme" : "New Programme"),
                        Category = cmd.commandType == "org.project.create" || (p.TryGetProperty("category", out var catEl) && catEl.GetString() == "PROJECT") ? "PROJECT" : "PROGRAMME",
                        Owner = p.TryGetProperty("owner", out var ownerEl) ? ownerEl.GetString() ?? "Officer" : "Officer",
                        Sponsor = p.TryGetProperty("sponsor", out var spEl) ? spEl.GetString() ?? "Executive Committee" : "Executive Committee",
                        CommitteeId = p.TryGetProperty("committeeId", out var cIdEl) ? cIdEl.GetString() : null,
                        NextMilestone = p.TryGetProperty("nextMilestone", out var nmEl) ? nmEl.GetString() ?? "Initial Milestone" : "Initial Milestone",
                        Progress = p.TryGetProperty("progress", out var prEl) && prEl.TryGetInt32(out var prVal) ? prVal : 0,
                        Risk = p.TryGetProperty("risk", out var rkEl) ? rkEl.GetString() ?? "LOW" : "LOW",
                        Status = p.TryGetProperty("status", out var stEl) ? stEl.GetString() ?? "ACTIVE" : "ACTIVE",
                        Version = 1,
                        CreatedAt = now,
                        UpdatedAt = now
                    };
                    await _repo.SaveProgrammeAsync(prog, ct);
                    return new { success = true, aggregateId = prog.Id.ToString("D"), version = 1, serverTime = now.ToString("o") };
                }

            case "org.goal.create":
            case "org.plan.create":
                {
                    var goalId = Guid.TryParse(cmd.aggregateId, out var gid) ? gid : Guid.NewGuid();
                    var goal = new GoalRecord
                    {
                        Id = goalId,
                        TenantId = tenantId,
                        ScopeId = targetScopeId,
                        ScopeName = targetScopeName,
                        ScopeLevel = targetScopeLevel,
                        Title = p.TryGetProperty("title", out var titleEl) ? titleEl.GetString() ?? "Annual Objective" : "Annual Objective",
                        Owner = p.TryGetProperty("owner", out var ownerEl) ? ownerEl.GetString() ?? "Officer" : "Officer",
                        ReviewCadence = p.TryGetProperty("reviewCadence", out var rcEl) ? rcEl.GetString() ?? "Monthly" : "Monthly",
                        Progress = p.TryGetProperty("progress", out var prEl) && prEl.TryGetInt32(out var prVal) ? prVal : 0,
                        Status = p.TryGetProperty("status", out var stEl) ? stEl.GetString() ?? "Active" : "Active",
                        Version = 1,
                        CreatedAt = now
                    };
                    await _repo.SaveGoalAsync(goal, ct);
                    return new { success = true, aggregateId = goal.Id.ToString("D"), version = 1, serverTime = now.ToString("o") };
                }

            case "org.assignment.create":
                {
                    var appt = new Appointment
                    {
                        TenantId = tenantId,
                        ChapterId = Guid.TryParse(cmd.organisationScope, out var chId) ? chId : Guid.NewGuid(),
                        RoleCode = p.TryGetProperty("roleType", out var rt) ? rt.GetString() ?? "MEMBER" : "MEMBER",
                        StartsAt = now,
                        EndsAt = now.AddYears(1)
                    };
                    await _repo.SaveAppointmentAsync(appt, ct);
                    return new { success = true, aggregateId = appt.Id.ToString("D"), version = 1, serverTime = now.ToString("o") };
                }

            case "org.support-request.create":
            case "org.support-request.update":
                {
                    string reqScopeId = targetScopeId;
                    string reqScopeName = targetScopeName;
                    string reqScopeLevel = targetScopeLevel;
                    if (p.TryGetProperty("requesterScope", out var rqEl) && rqEl.ValueKind == System.Text.Json.JsonValueKind.Object)
                    {
                        if (rqEl.TryGetProperty("id", out var rqId)) reqScopeId = rqId.GetString() ?? reqScopeId;
                        if (rqEl.TryGetProperty("name", out var rqNm)) reqScopeName = rqNm.GetString() ?? reqScopeName;
                        if (rqEl.TryGetProperty("level", out var rqLv)) reqScopeLevel = rqLv.GetString() ?? reqScopeLevel;
                    }

                    string tgtScopeId = "22222222-2222-2222-2222-222222222222";
                    string tgtScopeName = "Krishnagiri Region";
                    string tgtScopeLevel = "REGION";
                    if (p.TryGetProperty("targetScope", out var tgEl) && tgEl.ValueKind == System.Text.Json.JsonValueKind.Object)
                    {
                        if (tgEl.TryGetProperty("id", out var tgId)) tgtScopeId = tgId.GetString() ?? tgtScopeId;
                        if (tgEl.TryGetProperty("name", out var tgNm)) tgtScopeName = tgNm.GetString() ?? tgtScopeName;
                        if (tgEl.TryGetProperty("level", out var tgLv)) tgtScopeLevel = tgLv.GetString() ?? tgtScopeLevel;
                    }

                    if (cmd.commandType == "org.support-request.update" && Guid.TryParse(cmd.aggregateId, out var mcid))
                    {
                        var existing = await _repo.GetMemberCaseByIdAsync(mcid, tenantId, ct);
                        if (existing != null)
                        {
                            if (p.TryGetProperty("status", out var st)) existing.Status = st.GetString() ?? existing.Status;
                            existing.Version += 1;
                            existing.UpdatedAt = now;
                            await _repo.SaveMemberCaseAsync(existing, ct);
                            return new { success = true, aggregateId = existing.Id.ToString("D"), version = existing.Version, serverTime = now.ToString("o") };
                        }
                    }

                    var mc = new MemberCaseRecord
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        ScopeId = reqScopeId,
                        ScopeName = reqScopeName,
                        ScopeLevel = reqScopeLevel,
                        MemberId = tgtScopeId,
                        MemberMessage = $"{tgtScopeName}|{tgtScopeLevel}",
                        Title = p.TryGetProperty("title", out var tEl) ? tEl.GetString() ?? "Support Request" : "Support Request",
                        Type = "SUPPORT",
                        Owner = actorScope?.Name ?? "Officer",
                        Status = "OPEN",
                        Priority = "MEDIUM",
                        InternalNote = p.TryGetProperty("summary", out var sm) ? sm.GetString() ?? "" : (p.TryGetProperty("desiredHelp", out var dh) ? dh.GetString() ?? "" : ""),
                        Version = 1,
                        CreatedAt = now,
                        UpdatedAt = now
                    };
                    await _repo.SaveMemberCaseAsync(mc, ct);
                    return new { success = true, aggregateId = mc.Id.ToString("D"), version = 1, serverTime = now.ToString("o") };
                }

            default:
                return new
                {
                    success = true,
                    commandId = cmd.commandId,
                    aggregateId = cmd.aggregateId ?? Guid.NewGuid().ToString("D"),
                    version = (cmd.expectedVersion ?? 0) + 1,
                    serverTime = now.ToString("o")
                };
        }
    }

    private async Task RecordCommandAuditAsync(OrgCommandRequestDto cmd, object? result, Guid tenantId, ResolvedActorScope? actorScope, CancellationToken ct)
    {
        try
        {
            var actorGuid = Guid.TryParse(actorScope?.ActorId, out var g) ? g : Guid.Parse("00000000-0000-0000-0000-000000000099");
            Guid resGuid = Guid.Empty;
            if (Guid.TryParse(cmd.aggregateId, out var parsedAggr))
            {
                resGuid = parsedAggr;
            }
            else if (result != null)
            {
                var aggrProp = result.GetType().GetProperty("aggregateId");
                if (aggrProp != null)
                {
                    var val = aggrProp.GetValue(result)?.ToString();
                    if (!string.IsNullOrEmpty(val) && Guid.TryParse(val, out var valGuid))
                    {
                        resGuid = valGuid;
                    }
                }
            }

            var reasonText = !string.IsNullOrWhiteSpace(cmd.reason) ? cmd.reason : $"Executed {cmd.commandType}";
            var payloadStr = cmd.payload.ValueKind != System.Text.Json.JsonValueKind.Undefined ? cmd.payload.ToString() : null;

            var eventPacket = new
            {
                action = cmd.commandType,
                actor = actorScope?.Name ?? "Saravanan",
                role = actorScope?.Position ?? actorScope?.Role ?? "Chapter President",
                scope = cmd.organisationScope ?? actorScope?.ScopeName ?? "Chapter Scope",
                reason = reasonText,
                payload = payloadStr,
                outcome = "SUCCESS"
            };

            await _repo.SaveAuditLogAsync(new Audit
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ActorId = actorGuid,
                ResourceId = resGuid,
                Operation = cmd.commandType,
                CorrelationId = !string.IsNullOrWhiteSpace(cmd.commandId) ? cmd.commandId : ("cmd-" + Guid.NewGuid().ToString("D").Substring(0, 8)),
                Event = System.Text.Json.JsonSerializer.Serialize(eventPacket),
                OccurredAt = DateTimeOffset.UtcNow
            }, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to record audit log for command {CommandType}", cmd.commandType);
        }
    }
}

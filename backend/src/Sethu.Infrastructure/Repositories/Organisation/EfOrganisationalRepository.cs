using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Sethu.Domain.Entities;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Abstractions.Organisation;

namespace Sethu.Infrastructure.Repositories.Organisation;

public sealed class EfOrganisationalRepository : IOrganisationalRepository
{
    private readonly SethuDbContext _db;
    private readonly ILogger<EfOrganisationalRepository> _logger;

    public EfOrganisationalRepository(SethuDbContext db, ILogger<EfOrganisationalRepository> logger)
    {
        _db = db;
        _logger = logger;
    }

    // Units
    public async Task<List<Unit>> GetUnitsAsync(Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.Units.AsNoTracking().Where(u => u.TenantId == tenantId).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Units from DB.");
            return new List<Unit>();
        }
    }

    public async Task<Unit?> GetUnitByIdAsync(Guid unitId, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.Units.AsNoTracking().FirstOrDefaultAsync(u => u.Id == unitId && u.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Unit {UnitId} from DB.", unitId);
            return null;
        }
    }

    // Tasks
    public async Task<List<TaskRecord>> GetTasksAsync(Guid tenantId, string? status = null, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            var q = _db.OrganisationTasks.AsNoTracking().Where(t => t.TenantId == tenantId);
            if (!string.IsNullOrWhiteSpace(status))
            {
                q = q.Where(t => t.Status == status);
            }
            return await q.OrderByDescending(t => t.UpdatedAt).Take(limit).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Tasks from DB.");
            return new List<TaskRecord>();
        }
    }

    public async Task<TaskRecord?> GetTaskByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationTasks.FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Task {Id} from DB.", id);
            return null;
        }
    }

    public async Task SaveTaskAsync(TaskRecord task, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.OrganisationTasks.FirstOrDefaultAsync(t => t.Id == task.Id && t.TenantId == task.TenantId, ct);
            if (existing is null)
            {
                await _db.OrganisationTasks.AddAsync(task, ct);
            }
            else
            {
                _db.Entry(existing).CurrentValues.SetValues(task);
            }
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Task {Id} to DB.", task.Id);
        }
    }

    // Approvals
    public async Task<List<ApprovalRecord>> GetApprovalsAsync(Guid tenantId, string? status = null, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            var q = _db.OrganisationApprovals.AsNoTracking().Where(a => a.TenantId == tenantId);
            if (!string.IsNullOrWhiteSpace(status))
            {
                q = q.Where(a => a.Status == status);
            }
            return await q.OrderByDescending(a => a.CreatedAt).Take(limit).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Approvals from DB.");
            return new List<ApprovalRecord>();
        }
    }

    public async Task<ApprovalRecord?> GetApprovalByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationApprovals.FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Approval {Id} from DB.", id);
            return null;
        }
    }

    public async Task SaveApprovalAsync(ApprovalRecord approval, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.OrganisationApprovals.FirstOrDefaultAsync(a => a.Id == approval.Id && a.TenantId == approval.TenantId, ct);
            if (existing is null)
            {
                await _db.OrganisationApprovals.AddAsync(approval, ct);
            }
            else
            {
                _db.Entry(existing).CurrentValues.SetValues(approval);
            }
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Approval {Id} to DB.", approval.Id);
            throw; // Never report a committed approval when PostgreSQL rejected the write.
        }
    }

    // Actions
    public async Task<List<ActionItemRecord>> GetActionsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationActions.AsNoTracking()
                .Where(a => a.TenantId == tenantId)
                .OrderByDescending(a => a.UpdatedAt)
                .Take(limit)
                .ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Actions from DB.");
            return new List<ActionItemRecord>();
        }
    }

    public async Task<ActionItemRecord?> GetActionByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationActions.FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Action {Id} from DB.", id);
            return null;
        }
    }

    public async Task SaveActionAsync(ActionItemRecord action, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.OrganisationActions.FirstOrDefaultAsync(a => a.Id == action.Id && a.TenantId == action.TenantId, ct);
            if (existing is null)
            {
                await _db.OrganisationActions.AddAsync(action, ct);
            }
            else
            {
                _db.Entry(existing).CurrentValues.SetValues(action);
            }
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Action {Id} to DB.", action.Id);
        }
    }

    // Meetings
    public async Task<List<MeetingRecord>> GetMeetingsAsync(Guid tenantId, string? status = null, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            var defaultTenant1 = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var defaultTenant2 = Guid.Parse("11111111-1111-1111-1111-111111111111");

            var q = _db.OrganisationMeetings.AsNoTracking().AsQueryable();
            if (tenantId != Guid.Empty && tenantId != defaultTenant1 && tenantId != defaultTenant2)
            {
                q = q.Where(m => m.TenantId == tenantId || m.TenantId == defaultTenant1 || m.TenantId == defaultTenant2 || m.ScopeId == tenantId.ToString("D"));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                q = q.Where(m => m.Status == status);
            }
            return await q.OrderBy(m => m.ScheduledAt).Take(limit).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Meetings from DB.");
            return new List<MeetingRecord>();
        }
    }

    public async Task<MeetingRecord?> GetMeetingByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationMeetings.FirstOrDefaultAsync(m => m.Id == id, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Meeting {Id} from DB.", id);
            return null;
        }
    }

    public async Task SaveMeetingAsync(MeetingRecord meeting, CancellationToken ct = default)
    {
        try
        {
            var isNew = false;
            var existing = await _db.OrganisationMeetings.FirstOrDefaultAsync(m => m.Id == meeting.Id, ct);
            if (existing is null)
            {
                isNew = true;
                await _db.OrganisationMeetings.AddAsync(meeting, ct);
            }
            else
            {
                _db.Entry(existing).CurrentValues.SetValues(meeting);
            }
            await _db.SaveChangesAsync(ct);

            if (isNew)
            {
                await NotifyChapterMembersOfEventAsync(meeting, ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Meeting {Id} to DB.", meeting.Id);
        }
    }

    private async Task NotifyChapterMembersOfEventAsync(MeetingRecord meeting, CancellationToken ct)
    {
        try
        {
            var scopeId = meeting.ScopeId ?? "";
            var scopeName = meeting.ScopeName ?? "";
            var isAllChapters = scopeId.Equals("all", StringComparison.OrdinalIgnoreCase) ||
                                scopeName.Contains("All Chapters", StringComparison.OrdinalIgnoreCase);

            Guid parsedChapterId = Guid.Empty;
            Guid.TryParse(scopeId, out parsedChapterId);

            var query = _db.DbnMemberRegistrations.AsNoTracking().AsQueryable();
            if (!isAllChapters)
            {
                if (parsedChapterId != Guid.Empty)
                {
                    query = query.Where(r => r.ChapterId == parsedChapterId || r.ChapterName.ToLower().Contains(scopeName.ToLower()));
                }
                else if (!string.IsNullOrWhiteSpace(scopeName))
                {
                    var cleanScope = scopeName.Replace("Chapter", "", StringComparison.OrdinalIgnoreCase).Trim().ToLower();
                    query = query.Where(r => r.ChapterName.ToLower().Contains(cleanScope));
                }
            }

            var chapterRegistrations = await query.ToListAsync(ct);
            var memberIdsToNotify = new HashSet<Guid>();

            foreach (var reg in chapterRegistrations)
            {
                if (Guid.TryParse(reg.AssignedMemberId, out var parsedMid))
                {
                    memberIdsToNotify.Add(parsedMid);
                }
                else
                {
                    memberIdsToNotify.Add(reg.Id);
                }
            }

            var users = await _db.UserIdentities.AsNoTracking().ToListAsync(ct);
            foreach (var u in users)
            {
                memberIdsToNotify.Add(u.Id);
            }

            if (memberIdsToNotify.Count == 0)
            {
                memberIdsToNotify.Add(Guid.Parse("11111111-1111-1111-1111-111111111111"));
            }

            var notifications = new List<NetworkNotification>();
            var title = $"New Chapter Event: {meeting.Title}";
            var scheduledStr = !string.IsNullOrWhiteSpace(meeting.ScheduledAt) ? meeting.ScheduledAt : "Upcoming";
            var locationStr = !string.IsNullOrWhiteSpace(meeting.Location) ? $" at {meeting.Location}" : "";
            var body = $"New event '{meeting.Title}' scheduled for {scheduledStr}{locationStr}. Please confirm your attendance (Attending, Not Available, or Substitute).";

            foreach (var mid in memberIdsToNotify)
            {
                notifications.Add(new NetworkNotification
                {
                    Id = Guid.NewGuid(),
                    TenantId = meeting.TenantId != Guid.Empty ? meeting.TenantId : Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    MemberId = mid,
                    Title = title,
                    Body = body,
                    Type = "event",
                    ReferenceId = $"/app/events/{meeting.Id}",
                    IsRead = false,
                    CreatedAt = DateTimeOffset.UtcNow
                });
            }

            if (notifications.Count > 0)
            {
                await _db.Notifications.AddRangeAsync(notifications, ct);
                await _db.SaveChangesAsync(ct);
                _logger.LogInformation("Dispatched {Count} notifications for new event {EventId} ({Title})", notifications.Count, meeting.Id, meeting.Title);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to dispatch notifications for meeting {Id}", meeting.Id);
        }
    }

    public async Task DeleteMeetingAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.OrganisationMeetings.FirstOrDefaultAsync(m => m.Id == id, ct);
            if (existing != null)
            {
                _db.OrganisationMeetings.Remove(existing);
                await _db.SaveChangesAsync(ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting Meeting {Id} from DB.", id);
        }
    }

    // KYT
    public async Task<List<KytRecord>> GetKytsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationKyts.AsNoTracking().Where(k => k.TenantId == tenantId).Take(limit).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Kyts from DB.");
            return new List<KytRecord>();
        }
    }

    public async Task<KytRecord?> GetKytByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationKyts.FirstOrDefaultAsync(k => k.Id == id && k.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Kyt {Id} from DB.", id);
            return null;
        }
    }

    public async Task SaveKytAsync(KytRecord kyt, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.OrganisationKyts.FirstOrDefaultAsync(k => k.Id == kyt.Id && k.TenantId == kyt.TenantId, ct);
            if (existing is null) await _db.OrganisationKyts.AddAsync(kyt, ct);
            else _db.Entry(existing).CurrentValues.SetValues(kyt);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Kyt to DB.");
        }
    }

    // Presentations
    public async Task<List<MemberPresentationRecord>> GetPresentationsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationMemberPresentations.AsNoTracking().Where(p => p.TenantId == tenantId).Take(limit).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Presentations from DB.");
            return new List<MemberPresentationRecord>();
        }
    }

    public async Task<MemberPresentationRecord?> GetPresentationByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationMemberPresentations.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Presentation {Id} from DB.", id);
            return null;
        }
    }

    public async Task SavePresentationAsync(MemberPresentationRecord presentation, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.OrganisationMemberPresentations.FirstOrDefaultAsync(p => p.Id == presentation.Id && p.TenantId == presentation.TenantId, ct);
            if (existing is null) await _db.OrganisationMemberPresentations.AddAsync(presentation, ct);
            else _db.Entry(existing).CurrentValues.SetValues(presentation);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Presentation to DB.");
        }
    }

    // Member Cases
    public async Task<List<MemberCaseRecord>> GetMemberCasesAsync(Guid tenantId, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationMemberCases.AsNoTracking().Where(c => c.TenantId == tenantId).Take(limit).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading MemberCases from DB.");
            return new List<MemberCaseRecord>();
        }
    }

    public async Task<MemberCaseRecord?> GetMemberCaseByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationMemberCases.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading MemberCase {Id} from DB.", id);
            return null;
        }
    }

    public async Task SaveMemberCaseAsync(MemberCaseRecord memberCase, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.OrganisationMemberCases.FirstOrDefaultAsync(c => c.Id == memberCase.Id && c.TenantId == memberCase.TenantId, ct);
            if (existing is null) await _db.OrganisationMemberCases.AddAsync(memberCase, ct);
            else _db.Entry(existing).CurrentValues.SetValues(memberCase);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving MemberCase to DB.");
        }
    }

    // Programmes
    public async Task<List<ProgrammeRecord>> GetProgrammesAsync(Guid tenantId, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationProgrammes.AsNoTracking().Where(p => p.TenantId == tenantId).Take(limit).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Programmes from DB.");
            return new List<ProgrammeRecord>();
        }
    }

    public async Task<ProgrammeRecord?> GetProgrammeByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationProgrammes.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Programme {Id} from DB.", id);
            return null;
        }
    }

    public async Task SaveProgrammeAsync(ProgrammeRecord programme, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.OrganisationProgrammes.FirstOrDefaultAsync(p => p.Id == programme.Id && p.TenantId == programme.TenantId, ct);
            if (existing is null) await _db.OrganisationProgrammes.AddAsync(programme, ct);
            else _db.Entry(existing).CurrentValues.SetValues(programme);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Programme to DB.");
        }
    }

    // Escalations
    public async Task<List<EscalationRecord>> GetEscalationsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationEscalations.AsNoTracking().Where(e => e.TenantId == tenantId).Take(limit).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Escalations from DB.");
            return new List<EscalationRecord>();
        }
    }

    public async Task<EscalationRecord?> GetEscalationByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationEscalations.FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Escalation {Id} from DB.", id);
            return null;
        }
    }

    public async Task SaveEscalationAsync(EscalationRecord escalation, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.OrganisationEscalations.FirstOrDefaultAsync(e => e.Id == escalation.Id && e.TenantId == escalation.TenantId, ct);
            if (existing is null) await _db.OrganisationEscalations.AddAsync(escalation, ct);
            else _db.Entry(existing).CurrentValues.SetValues(escalation);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Escalation to DB.");
        }
    }

    // Risks
    public async Task<List<RiskRecord>> GetRisksAsync(Guid tenantId, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationRisks.AsNoTracking().Where(r => r.TenantId == tenantId).Take(limit).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Risks from DB.");
            return new List<RiskRecord>();
        }
    }

    public async Task<RiskRecord?> GetRiskByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationRisks.FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Risk {Id} from DB.", id);
            return null;
        }
    }

    public async Task SaveRiskAsync(RiskRecord risk, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.OrganisationRisks.FirstOrDefaultAsync(r => r.Id == risk.Id && r.TenantId == risk.TenantId, ct);
            if (existing is null) await _db.OrganisationRisks.AddAsync(risk, ct);
            else _db.Entry(existing).CurrentValues.SetValues(risk);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Risk to DB.");
        }
    }

    // Issues
    public async Task<List<IssueRecord>> GetIssuesAsync(Guid tenantId, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationIssues.AsNoTracking().Where(i => i.TenantId == tenantId).Take(limit).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Issues from DB.");
            return new List<IssueRecord>();
        }
    }

    public async Task<IssueRecord?> GetIssueByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationIssues.FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Issue {Id} from DB.", id);
            return null;
        }
    }

    public async Task SaveIssueAsync(IssueRecord issue, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.OrganisationIssues.FirstOrDefaultAsync(i => i.Id == issue.Id && i.TenantId == issue.TenantId, ct);
            if (existing is null) await _db.OrganisationIssues.AddAsync(issue, ct);
            else _db.Entry(existing).CurrentValues.SetValues(issue);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Issue to DB.");
        }
    }

    // Decisions
    public async Task<List<DecisionRecord>> GetDecisionsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationDecisions.AsNoTracking().Where(d => d.TenantId == tenantId).Take(limit).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Decisions from DB.");
            return new List<DecisionRecord>();
        }
    }

    public async Task<DecisionRecord?> GetDecisionByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationDecisions.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Decision {Id} from DB.", id);
            return null;
        }
    }

    public async Task SaveDecisionAsync(DecisionRecord decision, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.OrganisationDecisions.FirstOrDefaultAsync(d => d.Id == decision.Id && d.TenantId == decision.TenantId, ct);
            if (existing is null) await _db.OrganisationDecisions.AddAsync(decision, ct);
            else _db.Entry(existing).CurrentValues.SetValues(decision);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Decision to DB.");
        }
    }

    // Handoffs
    public async Task<List<HandoffRecord>> GetHandoffsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationHandoffs.AsNoTracking().Where(h => h.TenantId == tenantId).OrderByDescending(h => h.CreatedAt).Take(limit).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Handoffs from DB.");
            return new List<HandoffRecord>();
        }
    }

    public async Task<HandoffRecord?> GetHandoffByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationHandoffs.FirstOrDefaultAsync(h => h.Id == id && h.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Handoff {Id} from DB.", id);
            return null;
        }
    }

    public async Task SaveHandoffAsync(HandoffRecord handoff, CancellationToken ct = default)
    {
        try
        {
            if (handoff.Id == Guid.Empty)
            {
                handoff.Id = Guid.NewGuid();
            }
            if (string.IsNullOrWhiteSpace(handoff.CorrelationId))
            {
                handoff.CorrelationId = $"CORR-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
            }
            var existing = await _db.OrganisationHandoffs.FirstOrDefaultAsync(h => h.Id == handoff.Id && h.TenantId == handoff.TenantId, ct);
            if (existing is null) await _db.OrganisationHandoffs.AddAsync(handoff, ct);
            else _db.Entry(existing).CurrentValues.SetValues(handoff);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Handoff to DB.");
        }
    }

    // Exceptions
    public async Task<List<OperationalExceptionRecord>> GetExceptionsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationExceptions.AsNoTracking().Where(e => e.TenantId == tenantId).Take(limit).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Exceptions from DB.");
            return new List<OperationalExceptionRecord>();
        }
    }

    public async Task<OperationalExceptionRecord?> GetExceptionByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationExceptions.FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Exception {Id} from DB.", id);
            return null;
        }
    }

    public async Task SaveExceptionAsync(OperationalExceptionRecord exception, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.OrganisationExceptions.FirstOrDefaultAsync(e => e.Id == exception.Id && e.TenantId == exception.TenantId, ct);
            if (existing is null) await _db.OrganisationExceptions.AddAsync(exception, ct);
            else _db.Entry(existing).CurrentValues.SetValues(exception);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Exception to DB.");
        }
    }

    // Jobs
    public async Task<List<JobRecord>> GetJobsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationJobs.AsNoTracking()
                .Where(j => j.TenantId == tenantId)
                .OrderByDescending(j => j.CreatedAt)
                .Take(limit)
                .ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Jobs from DB.");
            return new List<JobRecord>();
        }
    }

    public async Task<JobRecord?> GetJobByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationJobs.FirstOrDefaultAsync(j => j.Id == id && j.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Job {Id} from DB.", id);
            return null;
        }
    }

    public async Task SaveJobAsync(JobRecord job, CancellationToken ct = default)
    {
        try
        {
            if (job.Id == Guid.Empty)
            {
                job.Id = Guid.NewGuid();
            }
            var existing = await _db.OrganisationJobs.FirstOrDefaultAsync(j => j.Id == job.Id && j.TenantId == job.TenantId, ct);
            if (existing is null) await _db.OrganisationJobs.AddAsync(job, ct);
            else _db.Entry(existing).CurrentValues.SetValues(job);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Job to DB.");
        }
    }

    // Goals
    public async Task<List<GoalRecord>> GetGoalsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationGoals.AsNoTracking().Where(g => g.TenantId == tenantId).Take(limit).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Goals from DB.");
            return new List<GoalRecord>();
        }
    }

    public async Task<GoalRecord?> GetGoalByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationGoals.FirstOrDefaultAsync(g => g.Id == id && g.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Goal {Id} from DB.", id);
            return null;
        }
    }

    public async Task SaveGoalAsync(GoalRecord goal, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.OrganisationGoals.FirstOrDefaultAsync(g => g.Id == goal.Id && g.TenantId == goal.TenantId, ct);
            if (existing is null) await _db.OrganisationGoals.AddAsync(goal, ct);
            else _db.Entry(existing).CurrentValues.SetValues(goal);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Goal to DB.");
        }
    }

    // Communications
    public async Task<List<CommunicationRecord>> GetCommunicationsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationCommunications.AsNoTracking().Where(c => c.TenantId == tenantId).Take(limit).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Communications from DB.");
            return new List<CommunicationRecord>();
        }
    }

    public async Task<CommunicationRecord?> GetCommunicationByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationCommunications.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Communication {Id} from DB.", id);
            return null;
        }
    }

    public async Task SaveCommunicationAsync(CommunicationRecord communication, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.OrganisationCommunications.FirstOrDefaultAsync(c => c.Id == communication.Id && c.TenantId == communication.TenantId, ct);
            if (existing is null) await _db.OrganisationCommunications.AddAsync(communication, ct);
            else _db.Entry(existing).CurrentValues.SetValues(communication);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Communication to DB.");
        }
    }

    // Feedbacks
    public async Task<List<FeedbackRecord>> GetFeedbacksAsync(Guid tenantId, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationFeedbacks.AsNoTracking().Where(f => f.TenantId == tenantId).Take(limit).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Feedbacks from DB.");
            return new List<FeedbackRecord>();
        }
    }

    public async Task<FeedbackRecord?> GetFeedbackByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationFeedbacks.FirstOrDefaultAsync(f => f.Id == id && f.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Feedback {Id} from DB.", id);
            return null;
        }
    }

    public async Task SaveFeedbackAsync(FeedbackRecord feedback, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.OrganisationFeedbacks.FirstOrDefaultAsync(f => f.Id == feedback.Id && f.TenantId == feedback.TenantId, ct);
            if (existing is null) await _db.OrganisationFeedbacks.AddAsync(feedback, ct);
            else _db.Entry(existing).CurrentValues.SetValues(feedback);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Feedback to DB.");
        }
    }

    // Data Quality
    public async Task<List<DataQualityFindingRecord>> GetDataQualityFindingsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationDataQualityFindings.AsNoTracking()
                .Where(d => d.TenantId == tenantId)
                .OrderByDescending(d => d.CreatedAt)
                .Take(limit)
                .ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading DataQualityFindings from DB.");
            return new List<DataQualityFindingRecord>();
        }
    }

    public async Task<DataQualityFindingRecord?> GetDataQualityFindingByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationDataQualityFindings.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading DataQualityFinding {Id} from DB.", id);
            return null;
        }
    }

    public async Task SaveDataQualityFindingAsync(DataQualityFindingRecord finding, CancellationToken ct = default)
    {
        try
        {
            if (finding.Id == Guid.Empty)
            {
                finding.Id = Guid.NewGuid();
            }
            var existing = await _db.OrganisationDataQualityFindings.FirstOrDefaultAsync(d => d.Id == finding.Id && d.TenantId == finding.TenantId, ct);
            if (existing is null) await _db.OrganisationDataQualityFindings.AddAsync(finding, ct);
            else _db.Entry(existing).CurrentValues.SetValues(finding);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving DataQualityFinding to DB.");
        }
    }

    // Availability
    public async Task<List<MemberAvailabilityRecord>> GetAvailabilitiesAsync(Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationMemberAvailabilities.AsNoTracking().Where(a => a.TenantId == tenantId).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Availabilities from DB.");
            return new List<MemberAvailabilityRecord>();
        }
    }

    public async Task<MemberAvailabilityRecord?> GetAvailabilityByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationMemberAvailabilities.FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Availability {Id} from DB.", id);
            return null;
        }
    }

    public async Task SaveAvailabilityAsync(MemberAvailabilityRecord availability, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.OrganisationMemberAvailabilities.FirstOrDefaultAsync(a => a.Id == availability.Id && a.TenantId == availability.TenantId, ct);
            if (existing is null) await _db.OrganisationMemberAvailabilities.AddAsync(availability, ct);
            else _db.Entry(existing).CurrentValues.SetValues(availability);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Availability to DB.");
        }
    }

    // Committees & Appointments
    public async Task<List<Committee>> GetCommitteesAsync(Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.Committees.AsNoTracking().Where(c => c.TenantId == tenantId).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Committees from DB.");
            return new List<Committee>();
        }
    }

    public async Task<List<Appointment>> GetAppointmentsAsync(Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.Appointments.AsNoTracking().Where(a => a.TenantId == tenantId).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Appointments from DB.");
            return new List<Appointment>();
        }
    }

    public async Task SaveAppointmentAsync(Appointment appointment, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.Appointments.FirstOrDefaultAsync(a => a.Id == appointment.Id && a.TenantId == appointment.TenantId, ct);
            if (existing is null) await _db.Appointments.AddAsync(appointment, ct);
            else _db.Entry(existing).CurrentValues.SetValues(appointment);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Appointment to DB.");
        }
    }

    public async Task<List<UserIdentity>> GetUsersAsync(Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.UserIdentities.AsNoTracking().Where(u => u.Active).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading UserIdentities from DB.");
            return new List<UserIdentity>();
        }
    }

    public async Task SaveUserIdentityAsync(UserIdentity user, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.UserIdentities.FirstOrDefaultAsync(u => u.Id == user.Id, ct);
            if (existing is null)
            {
                await _db.UserIdentities.AddAsync(user, ct);
            }
            else
            {
                _db.Entry(existing).CurrentValues.SetValues(user);
            }
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving UserIdentity to DB.");
        }
    }

    // Delegations
    public async Task<List<Delegation>> GetDelegationsAsync(Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.Delegations.AsNoTracking().Where(d => d.TenantId == tenantId).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Delegations from DB.");
            return new List<Delegation>();
        }
    }

    public async Task<Delegation?> GetDelegationByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.Delegations.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Delegation by Id from DB.");
            return null;
        }
    }

    public async Task SaveDelegationAsync(Delegation delegation, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.Delegations.FirstOrDefaultAsync(d => d.Id == delegation.Id && d.TenantId == delegation.TenantId, ct);
            if (existing is null) await _db.Delegations.AddAsync(delegation, ct);
            else _db.Entry(existing).CurrentValues.SetValues(delegation);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Delegation to DB.");
        }
    }

    // Handovers
    public async Task<List<HandoverRecord>> GetHandoversAsync(Guid tenantId, string? scopeId = null, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            var q = _db.OrganisationHandovers.AsNoTracking().Where(h => h.TenantId == tenantId);
            if (!string.IsNullOrWhiteSpace(scopeId) && scopeId != "all")
            {
                q = q.Where(h => h.ScopeId == scopeId);
            }
            return await q.OrderByDescending(h => h.CreatedAt).Take(limit).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Handovers from DB.");
            return new List<HandoverRecord>();
        }
    }

    public async Task<HandoverRecord?> GetHandoverByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.OrganisationHandovers.FirstOrDefaultAsync(h => h.Id == id && h.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Handover by Id from DB.");
            return null;
        }
    }

    public async Task SaveHandoverAsync(HandoverRecord handover, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.OrganisationHandovers.FirstOrDefaultAsync(h => h.Id == handover.Id && h.TenantId == handover.TenantId, ct);
            if (existing is null) await _db.OrganisationHandovers.AddAsync(handover, ct);
            else _db.Entry(existing).CurrentValues.SetValues(handover);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Handover to DB.");
        }
    }

    // Audit
    public async Task<List<Audit>> GetAuditLogsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            return await _db.Audits.AsNoTracking().Where(a => a.TenantId == tenantId).OrderByDescending(a => a.OccurredAt).Take(limit).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Audit logs from DB.");
            return new List<Audit>();
        }
    }

    public async Task SaveAuditLogAsync(Audit audit, CancellationToken ct = default)
    {
        try
        {
            await _db.Audits.AddAsync(audit, ct);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Audit log to DB.");
        }
    }

    // Converse (Conversations & Messages)
    public async Task<List<Conversation>> GetConversationsAsync(Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.Conversations.AsNoTracking().Where(c => c.TenantId == tenantId).OrderByDescending(c => c.UpdatedAt).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Conversations from DB.");
            return new List<Conversation>();
        }
    }

    public async Task<List<ConversationMessage>> GetMessagesAsync(Guid tenantId, Guid? conversationId, int limit = 50, CancellationToken ct = default)
    {
        try
        {
            var q = _db.Messages.AsNoTracking().Where(m => m.TenantId == tenantId);
            if (conversationId.HasValue && conversationId.Value != Guid.Empty)
            {
                q = q.Where(m => m.ConversationId == conversationId.Value);
            }
            return await q.OrderBy(m => m.CreatedAt).Take(limit).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading Messages from DB.");
            return new List<ConversationMessage>();
        }
    }

    public async Task SaveConversationAsync(Conversation conversation, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.Conversations.FirstOrDefaultAsync(c => c.Id == conversation.Id && c.TenantId == conversation.TenantId, ct);
            if (existing is null) await _db.Conversations.AddAsync(conversation, ct);
            else _db.Entry(existing).CurrentValues.SetValues(conversation);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Conversation to DB.");
        }
    }

    public async Task SaveMessageAsync(ConversationMessage message, CancellationToken ct = default)
    {
        try
        {
            await _db.Messages.AddAsync(message, ct);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving Message to DB.");
        }
    }

    // Attendance Records
    public async Task<List<AttendanceRecord>> GetAttendanceRecordsAsync(Guid tenantId, int limit = 100, CancellationToken ct = default)
    {
        try
        {
            return await _db.AttendanceRecords.AsNoTracking()
                .Where(a => a.TenantId == tenantId)
                .OrderByDescending(a => a.UpdatedAt)
                .Take(limit)
                .ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading AttendanceRecords from DB.");
            return new List<AttendanceRecord>();
        }
    }

    public async Task<AttendanceRecord?> GetAttendanceRecordByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.AttendanceRecords.FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading AttendanceRecord {Id} from DB.", id);
            return null;
        }
    }

    public async Task SaveAttendanceRecordAsync(AttendanceRecord record, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.AttendanceRecords.FirstOrDefaultAsync(a => a.Id == record.Id && a.TenantId == record.TenantId, ct);
            if (existing is null)
            {
                await _db.AttendanceRecords.AddAsync(record, ct);
            }
            else
            {
                _db.Entry(existing).CurrentValues.SetValues(record);
            }
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving AttendanceRecord to DB.");
            throw;
        }
    }

    // DBN Member Registrations (Members & Dues)
    public async Task<List<DbnMemberRegistration>> GetDbnMemberRegistrationsAsync(Guid tenantId, string? chapterId = null, string? stage = null, CancellationToken ct = default)
    {
        try
        {
            var q = _db.DbnMemberRegistrations.AsNoTracking().Where(r => r.TenantId == tenantId);
            if (!string.IsNullOrWhiteSpace(stage))
            {
                q = q.Where(r => r.Stage == stage);
            }
            if (!string.IsNullOrWhiteSpace(chapterId) && Guid.TryParse(chapterId, out var chGuid))
            {
                q = q.Where(r => r.ChapterId == chGuid);
            }
            return await q.OrderByDescending(r => r.CreatedAt).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading DbnMemberRegistrations from DB.");
            return new List<DbnMemberRegistration>();
        }
    }

    public async Task<DbnMemberRegistration?> GetDbnMemberRegistrationByIdAsync(Guid id, Guid tenantId, CancellationToken ct = default)
    {
        try
        {
            return await _db.DbnMemberRegistrations.FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading DbnMemberRegistration {Id} from DB.", id);
            return null;
        }
    }

    public async Task SaveDbnMemberRegistrationAsync(DbnMemberRegistration reg, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.DbnMemberRegistrations.FirstOrDefaultAsync(r => r.Id == reg.Id && r.TenantId == reg.TenantId, ct);
            if (existing is null)
            {
                await _db.DbnMemberRegistrations.AddAsync(reg, ct);
            }
            else
            {
                _db.Entry(existing).CurrentValues.SetValues(reg);
            }
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving DbnMemberRegistration {Id} to DB.", reg.Id);
            throw;
        }
    }

    // Chapter Leaders & People
    public async Task<List<ChapterLeader>> GetChapterLeadersAsync(Guid? chapterId = null, CancellationToken ct = default)
    {
        try
        {
            var q = _db.ChapterLeaders.AsNoTracking().Where(l => l.IsActive);
            if (chapterId.HasValue && chapterId.Value != Guid.Empty)
            {
                q = q.Where(l => l.ChapterId == chapterId);
            }
            return await q.OrderBy(l => l.Position).ToListAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading ChapterLeaders from DB.");
            return new List<ChapterLeader>();
        }
    }

    public async Task SaveChapterLeaderAsync(ChapterLeader leader, CancellationToken ct = default)
    {
        try
        {
            var existing = await _db.ChapterLeaders.FirstOrDefaultAsync(l => l.Id == leader.Id, ct);
            if (existing is null)
            {
                await _db.ChapterLeaders.AddAsync(leader, ct);
            }
            else
            {
                _db.Entry(existing).CurrentValues.SetValues(leader);
            }
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving ChapterLeader to DB.");
            throw;
        }
    }

    // Networking Metrics
    public async Task<(int connections, int oneToOnes, int referencesGiven, int opportunityResponses, decimal recordedOutcomeValue, int activeMembers)> GetNetworkingMetricsAsync(Guid tenantId, Guid? chapterId = null, CancellationToken ct = default)
    {
        try
        {
            var activeMembers = await _db.DbnMemberRegistrations.AsNoTracking()
                .Where(r => r.TenantId == tenantId && r.Stage == "Activated" && (!chapterId.HasValue || r.ChapterId == chapterId))
                .CountAsync(ct);

            var oneToOnes = await _db.AttendanceRecords.AsNoTracking()
                .Where(a => a.TenantId == tenantId && a.Status == "present")
                .CountAsync(ct);

            var referencesGiven = await _db.ThankYouNotes.AsNoTracking()
                .Where(t => t.TenantId == tenantId)
                .CountAsync(ct);

            var opportunityResponses = await _db.Transactions.AsNoTracking()
                .Where(t => t.TenantId == tenantId && t.OpportunityId.HasValue)
                .CountAsync(ct);

            var recordedOutcomeValue = await _db.Transactions.AsNoTracking()
                .Where(t => t.TenantId == tenantId)
                .SumAsync(t => (decimal?)t.Amount, ct) ?? 0m;

            var connections = await _db.Conversations.AsNoTracking()
                .Where(c => c.TenantId == tenantId)
                .CountAsync(ct);

            return (connections, oneToOnes, referencesGiven, opportunityResponses, recordedOutcomeValue, activeMembers);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading NetworkingMetrics from DB.");
            return (0, 0, 0, 0, 0m, 0);
        }
    }
}
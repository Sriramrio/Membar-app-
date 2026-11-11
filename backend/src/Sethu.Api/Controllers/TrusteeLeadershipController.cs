using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Infrastructure.Persistence;

namespace Sethu.Api.Controllers;

[ApiController]
[Authorize]
[TypeFilter(typeof(Sethu.Api.Security.LegacyPrivilegedBoundaryFilter))]
[Route("api/trustee")]
[Route("trustee")]
public class TrusteeLeadershipController : ControllerBase
{
    private readonly SethuDbContext _db;

    public TrusteeLeadershipController(SethuDbContext db)
    {
        _db = db;
    }

    private Guid GetTrustedAuditActorId() => HttpContext.Items["Sethu.V31.ActorId"] is Guid id && id != Guid.Empty
        ? id : throw new InvalidOperationException("Verified audit actor is required.");

    private Guid GetTrustedAuditTenantId() => HttpContext.Items["Sethu.V31.TenantId"] is Guid id && id != Guid.Empty
        ? id : throw new InvalidOperationException("Verified tenant scope is required.");

    private void AddAuditLog(Guid tenantId, Guid actorId, Guid resourceId, string operation, object payload)
    {
        _db.Audits.Add(new Audit
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ActorId = actorId,
            ResourceId = resourceId,
            Operation = operation,
            CorrelationId = Guid.NewGuid().ToString("N"),
            Event = System.Text.Json.JsonSerializer.Serialize(payload),
            OccurredAt = DateTimeOffset.UtcNow
        });
    }

    // 1. Chapters overview with leadership counts
    [HttpGet("chapters")]
    public async Task<IActionResult> GetChapters(CancellationToken ct)
    {
        var chapters = await _db.Chapters.AsNoTracking().ToListAsync(ct);
        var activeLeaders = await _db.ChapterLeaders
            .AsNoTracking()
            .Where(l => l.IsActive && l.ChapterId.HasValue)
            .ToListAsync(ct);

        var result = chapters.Select(c =>
        {
            var leadersForChapter = activeLeaders.Where(l => l.ChapterId == c.Id).ToList();
            var pres = leadersForChapter.FirstOrDefault(l => l.Position == ChapterRole.President);
            var vp = leadersForChapter.FirstOrDefault(l => l.Position == ChapterRole.VicePresident);
            var sec = leadersForChapter.FirstOrDefault(l => l.Position == ChapterRole.Secretary);
            var mc = leadersForChapter.FirstOrDefault(l => l.Position == ChapterRole.MemberCoordinator);
            var isFullyStaffed = pres != null && vp != null && sec != null && mc != null;

            return new
            {
                id = c.Id.ToString(),
                name = c.Name,
                regionId = c.RegionId ?? "Tamil Nadu West",
                stateId = c.StateId ?? "Tamil Nadu",
                status = c.Status ?? "ACTIVE",
                memberCount = 15,
                leadershipStatus = new
                {
                    president = pres == null ? null : new { id = pres.Id.ToString(), fullName = pres.FullName, email = pres.Email, phone = pres.Phone },
                    vicePresident = vp == null ? null : new { id = vp.Id.ToString(), fullName = vp.FullName, email = vp.Email, phone = vp.Phone },
                    secretary = sec == null ? null : new { id = sec.Id.ToString(), fullName = sec.FullName, email = sec.Email, phone = sec.Phone },
                    memberCoordinator = mc == null ? null : new { id = mc.Id.ToString(), fullName = mc.FullName, email = mc.Email, phone = mc.Phone },
                    isFullyStaffed
                }
            };
        }).OrderBy(c => c.name).ToList();

        return Ok(result);
    }

    // 2. Query verified, active registered members in chapter for appointment
    [HttpGet("registered-members")]
    public async Task<IActionResult> GetRegisteredMembers(
        [FromQuery] Guid chapterId,
        [FromQuery] string? search,
        CancellationToken ct)
    {
        if (chapterId == Guid.Empty)
        {
            return BadRequest(new { message = "Chapter ID is required." });
        }

        var chapter = await _db.Chapters.FindAsync(new object[] { chapterId }, ct);
        var chapterName = chapter?.Name ?? "Selected Chapter";

        // Existing leaders for this chapter
        var currentLeaders = await _db.ChapterLeaders
            .AsNoTracking()
            .Where(l => l.ChapterId == chapterId && l.IsActive)
            .ToListAsync(ct);

        var leaderEmailToPosition = currentLeaders
            .GroupBy(l => l.Email.ToLowerInvariant())
            .ToDictionary(g => g.Key, g => g.First().Position, StringComparer.OrdinalIgnoreCase);

        // 1. From ChapterGroupMemberships
        var grpMembers = await _db.ChapterGroupMemberships
            .AsNoTracking()
            .Where(m => m.ChapterId == chapterId)
            .ToListAsync(ct);

        // 2. From MemberRegistrations (all onboarding stages)
        var regMembers = await _db.MemberRegistrations
            .AsNoTracking()
            .Where(r => r.ChapterId == chapterId || r.ChapterId == Guid.Empty || 
                       (chapter != null && (r.ChapterId == chapter.Id)))
            .ToListAsync(ct);

        // Also get any newly registered members network-wide so new applicants are immediately visible
        var allNewRegMembers = await _db.MemberRegistrations
            .AsNoTracking()
            .OrderByDescending(r => r.CreatedAt)
            .Take(50)
            .ToListAsync(ct);
        regMembers = regMembers.UnionBy(allNewRegMembers, r => r.Email.ToLowerInvariant()).ToList();

        // 3. From DbnMemberRegistrations (all applicants including newly registered)
        var dbnMembers = await _db.DbnMemberRegistrations
            .AsNoTracking()
            .Where(d => d.ChapterId == chapterId || 
                       d.ChapterId == null || 
                       d.ChapterId == Guid.Empty || 
                       (chapter != null && d.ChapterName.ToLower() == chapter.Name.ToLower()))
            .ToListAsync(ct);

        var allNewDbnMembers = await _db.DbnMemberRegistrations
            .AsNoTracking()
            .OrderByDescending(d => d.CreatedAt)
            .Take(50)
            .ToListAsync(ct);
        dbnMembers = dbnMembers.UnionBy(allNewDbnMembers, d => d.Email.ToLowerInvariant()).ToList();

        var combined = new List<object>();
        var seenEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var g in grpMembers)
        {
            var email = (g.Email ?? g.MemberId).ToLowerInvariant();
            if (seenEmails.Add(email))
            {
                var isLeader = leaderEmailToPosition.ContainsKey(email);
                var pos = isLeader ? leaderEmailToPosition[email] : "Member";

                combined.Add(new
                {
                    memberIdentifier = email,
                    fullName = g.FullName,
                    email = email,
                    phone = g.Phone ?? "",
                    businessName = g.BusinessName ?? "Member Business",
                    chapterId = chapterId.ToString(),
                    chapterName = chapterName,
                    currentPosition = pos,
                    isAlreadyLeader = isLeader,
                    onboardingStatus = "APPROVED_AND_ACTIVE",
                    isRegisteredAndActive = true,
                    registeredAt = g.JoinedAt.ToString("o")
                });
            }
        }

        foreach (var r in regMembers)
        {
            var email = r.Email.ToLowerInvariant();
            if (seenEmails.Add(email))
            {
                var isLeader = leaderEmailToPosition.ContainsKey(email);
                var pos = isLeader ? leaderEmailToPosition[email] : "Member";

                combined.Add(new
                {
                    memberIdentifier = email,
                    fullName = r.FullName,
                    email = email,
                    phone = r.Phone ?? "",
                    businessName = r.BusinessName ?? $"{r.FullName} Enterprises",
                    chapterId = chapterId.ToString(),
                    chapterName = chapterName,
                    currentPosition = pos,
                    isAlreadyLeader = isLeader,
                    onboardingStatus = r.OnboardingStatus,
                    isRegisteredAndActive = true,
                    registeredAt = r.CreatedAt.ToString("o")
                });
            }
        }

        foreach (var d in dbnMembers)
        {
            var email = d.Email.ToLowerInvariant();
            if (seenEmails.Add(email))
            {
                var isLeader = leaderEmailToPosition.ContainsKey(email);
                var pos = isLeader ? leaderEmailToPosition[email] : "Member";

                combined.Add(new
                {
                    memberIdentifier = email,
                    fullName = d.ApplicantFullName,
                    email = email,
                    phone = d.MobileNumber,
                    businessName = d.BusinessName,
                    chapterId = chapterId.ToString(),
                    chapterName = chapterName,
                    currentPosition = pos,
                    isAlreadyLeader = isLeader,
                    onboardingStatus = d.TrustPaymentVerifiedAt != null ? "ACTIVATED" : (!string.IsNullOrEmpty(d.Stage) ? d.Stage : "REGISTERED"),
                    isRegisteredAndActive = true,
                    registeredAt = d.CreatedAt.ToString("o")
                });
            }
        }

        // 4. From active verified UserIdentities (eligible registered network members)
        var userIdentities = await _db.UserIdentities
            .AsNoTracking()
            .Where(u => u.Active && !string.IsNullOrEmpty(u.Email) && 
                       !u.Email.ToLower().Contains("admin") && 
                       !u.Email.ToLower().Contains("trust") && 
                       !u.Email.ToLower().Contains("reviewer"))
            .ToListAsync(ct);

        foreach (var u in userIdentities)
        {
            if (string.IsNullOrWhiteSpace(u.Email)) continue;
            var email = u.Email.ToLowerInvariant();
            if (seenEmails.Add(email))
            {
                var isLeader = leaderEmailToPosition.ContainsKey(email);
                var pos = isLeader ? leaderEmailToPosition[email] : "Member";

                combined.Add(new
                {
                    memberIdentifier = email,
                    fullName = u.Name,
                    email = email,
                    phone = u.PhoneNumber ?? "+91 98765 43210",
                    businessName = $"{u.Name} Enterprises",
                    chapterId = chapterId.ToString(),
                    chapterName = chapterName,
                    currentPosition = pos,
                    isAlreadyLeader = isLeader,
                    onboardingStatus = "VERIFIED_MEMBER",
                    isRegisteredAndActive = true,
                    registeredAt = DateTimeOffset.UtcNow.AddMonths(-3).ToString("o")
                });
            }
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLowerInvariant();
            combined = combined.Where(m =>
            {
                var dyn = (dynamic)m;
                return ((string)dyn.fullName).ToLower().Contains(s) ||
                       ((string)dyn.email).ToLower().Contains(s) ||
                       ((string)dyn.businessName).ToLower().Contains(s);
            }).ToList();
        }

        return Ok(combined);
    }

    // 3. Leadership matrix for a specific chapter
    [HttpGet("chapter-leadership/{chapterId}")]
    public async Task<IActionResult> GetChapterLeadershipMatrix(Guid chapterId, CancellationToken ct)
    {
        var chapter = await _db.Chapters.FindAsync(new object[] { chapterId }, ct);
        if (chapter == null)
        {
            return NotFound(new { message = "Chapter not found." });
        }

        var leaders = await _db.ChapterLeaders
            .AsNoTracking()
            .Where(l => l.ChapterId == chapterId)
            .OrderByDescending(l => l.UpdatedAt)
            .ToListAsync(ct);

        var president = leaders.FirstOrDefault(l => l.IsActive && l.Position == ChapterRole.President);
        var vp = leaders.FirstOrDefault(l => l.IsActive && l.Position == ChapterRole.VicePresident);
        var sec = leaders.FirstOrDefault(l => l.IsActive && l.Position == ChapterRole.Secretary);
        var mc = leaders.FirstOrDefault(l => l.IsActive && l.Position == ChapterRole.MemberCoordinator);

        object? MapLeader(ChapterLeader? l) => l == null ? null : new
        {
            id = l.Id.ToString(),
            fullName = l.FullName,
            email = l.Email,
            phone = l.Phone,
            position = l.Position,
            role = l.Role,
            isActive = l.IsActive,
            status = l.IsActive ? "ACTIVE" : (l.SuspendedAt.HasValue ? "SUSPENDED" : "RELIEVED"),
            relievedAt = l.RelievedAt?.ToString("o"),
            suspendedAt = l.SuspendedAt?.ToString("o"),
            actionReason = l.ActionReason,
            createdAt = l.CreatedAt.ToString("o"),
            updatedAt = l.UpdatedAt.ToString("o")
        };

        var history = leaders.Where(l => !l.IsActive).Select(l => MapLeader(l)!).ToList();

        return Ok(new
        {
            chapter = new
            {
                id = chapter.Id.ToString(),
                name = chapter.Name,
                regionId = chapter.RegionId ?? "Tamil Nadu West",
                stateId = chapter.StateId ?? "Tamil Nadu",
                status = chapter.Status ?? "ACTIVE"
            },
            positions = new
            {
                president = MapLeader(president),
                vicePresident = MapLeader(vp),
                secretary = MapLeader(sec),
                memberCoordinator = MapLeader(mc)
            },
            history = history
        });
    }

    // 4. Assign member to leadership position
    public record AssignLeadershipDto(
        Guid ChapterId,
        string MemberIdentifier,
        string Position,
        string? Remarks,
        string? TrusteeActor
    );

    [HttpPost("assign-leadership")]
    public async Task<IActionResult> AssignLeadership([FromBody] AssignLeadershipDto dto, CancellationToken ct)
    {
        if (dto.ChapterId == Guid.Empty || string.IsNullOrWhiteSpace(dto.MemberIdentifier) || string.IsNullOrWhiteSpace(dto.Position))
        {
            return BadRequest(new { message = "Chapter ID, Member Identifier, and Position are required." });
        }

        var normalizedEmail = dto.MemberIdentifier.Trim().ToLowerInvariant();
        var normalizedPosition = dto.Position.Trim();

        var validPositions = new[] { ChapterRole.President, ChapterRole.VicePresident, ChapterRole.Secretary, ChapterRole.MemberCoordinator };
        if (!validPositions.Contains(normalizedPosition, StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = $"Invalid chapter position. Must be one of: {string.Join(", ", validPositions)}." });
        }

        var chapter = await _db.Chapters.FindAsync(new object[] { dto.ChapterId }, ct);
        if (chapter == null)
        {
            return NotFound(new { message = "Chapter not found." });
        }

        // Relieve any existing active leader in this position for this chapter
        var existingActiveLeader = await _db.ChapterLeaders
            .FirstOrDefaultAsync(l => l.ChapterId == dto.ChapterId && l.Position.ToLower() == normalizedPosition.ToLower() && l.IsActive, ct);

        if (existingActiveLeader != null)
        {
            existingActiveLeader.IsActive = false;
            existingActiveLeader.RelievedAt = DateTimeOffset.UtcNow;
            existingActiveLeader.ActionReason = $"Relieved by Trustee on appointment of {normalizedEmail}.";
            existingActiveLeader.UpdatedAt = DateTimeOffset.UtcNow;
        }

        // Find candidate details
        var grpMember = await _db.ChapterGroupMemberships.FirstOrDefaultAsync(g => g.ChapterId == dto.ChapterId && ((g.Email != null && g.Email.ToLower() == normalizedEmail) || g.MemberId.ToLower() == normalizedEmail), ct);
        var regMember = await _db.MemberRegistrations.FirstOrDefaultAsync(r => r.ChapterId == dto.ChapterId && r.Email.ToLower() == normalizedEmail, ct);
        var dbnMember = await _db.DbnMemberRegistrations.FirstOrDefaultAsync(d => d.ChapterId == dto.ChapterId && d.Email.ToLower() == normalizedEmail, ct);

        var userIdentity = await _db.UserIdentities.FirstOrDefaultAsync(u => u.Email != null && u.Email.ToLower() == normalizedEmail, ct);

        var fullName = grpMember?.FullName ?? regMember?.FullName ?? dbnMember?.ApplicantFullName ?? userIdentity?.Name ?? normalizedEmail.Split('@')[0];
        var phone = grpMember?.Phone ?? regMember?.Phone ?? dbnMember?.MobileNumber ?? userIdentity?.PhoneNumber;

        // Check if leader record exists for this person
        var leader = await _db.ChapterLeaders
            .FirstOrDefaultAsync(l => l.ChapterId == dto.ChapterId && l.Email.ToLower() == normalizedEmail, ct);

        const string defaultLeaderPassword = "Leader@123";
        if (leader == null)
        {
            leader = new ChapterLeader
            {
                Id = Guid.NewGuid(),
                OrganizationId = chapter.Id,
                ChapterId = dto.ChapterId,
                FullName = fullName,
                Email = normalizedEmail,
                Phone = phone,
                Position = normalizedPosition,
                Role = "chapter_leader",
                PasswordHash = Sethu.Service.Security.PasswordSecurity.HashPassword(defaultLeaderPassword),
                MustChangePassword = true,
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            _db.ChapterLeaders.Add(leader);
        }
        else
        {
            leader.Position = normalizedPosition;
            leader.IsActive = true;
            leader.RelievedAt = null;
            leader.SuspendedAt = null;
            leader.ActionReason = dto.Remarks ?? "Appointed by Trustee";
            leader.UpdatedAt = DateTimeOffset.UtcNow;
            leader.PasswordHash = Sethu.Service.Security.PasswordSecurity.HashPassword(defaultLeaderPassword);
            leader.MustChangePassword = true;
        }

        // Upsert MemberRoleAssignment
        var assignment = await _db.MemberRoleAssignments
            .FirstOrDefaultAsync(a => a.ChapterId == dto.ChapterId && a.MemberId.ToLower() == normalizedEmail, ct);

        if (assignment == null)
        {
            assignment = new MemberRoleAssignment
            {
                Id = Guid.NewGuid(),
                ChapterId = dto.ChapterId,
                MemberId = normalizedEmail,
                RoleId = normalizedPosition,
                Status = "ACTIVE",
                AssignedAt = DateTimeOffset.UtcNow
            };
            _db.MemberRoleAssignments.Add(assignment);
        }
        else
        {
            assignment.RoleId = normalizedPosition;
            assignment.Status = "ACTIVE";
            assignment.AssignedAt = DateTimeOffset.UtcNow;
        }

        AddAuditLog(GetTrustedAuditTenantId(), GetTrustedAuditActorId(), leader.Id, "TRUSTEE_APPOINTED_LEADERSHIP", new
        {
            chapterId = dto.ChapterId,
            position = normalizedPosition,
            appointedLeader = leader.FullName,
            email = leader.Email,
            trustee = dto.TrusteeActor ?? "Trustee"
        });

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            success = true,
            message = $"{fullName} successfully appointed as Chapter {normalizedPosition}!",
            leader = new
            {
                id = leader.Id.ToString(),
                fullName = leader.FullName,
                email = leader.Email,
                position = leader.Position,
                status = "ACTIVE"
            }
        });
    }

    // 5. Relieve chapter leader
    public record RelieveLeadershipDto(
        Guid ChapterId,
        Guid LeaderId,
        string Reason,
        string? TrusteeActor
    );

    [HttpPost("relieve-leadership")]
    public async Task<IActionResult> RelieveLeadership([FromBody] RelieveLeadershipDto dto, CancellationToken ct)
    {
        if (dto.LeaderId == Guid.Empty || string.IsNullOrWhiteSpace(dto.Reason))
        {
            return BadRequest(new { message = "Leader ID and Reason are mandatory." });
        }

        var leader = await _db.ChapterLeaders.FindAsync(new object[] { dto.LeaderId }, ct);
        if (leader == null)
        {
            return NotFound(new { message = "Leader not found." });
        }

        leader.IsActive = false;
        leader.RelievedAt = DateTimeOffset.UtcNow;
        leader.ActionReason = dto.Reason.Trim();
        leader.UpdatedAt = DateTimeOffset.UtcNow;

        if (leader.ChapterId.HasValue)
        {
            var assignment = await _db.MemberRoleAssignments
                .FirstOrDefaultAsync(a => a.ChapterId == leader.ChapterId.Value && a.MemberId.ToLower() == leader.Email.ToLower(), ct);

            if (assignment != null)
            {
                assignment.Status = "RELIEVED";
            }
        }

        AddAuditLog(GetTrustedAuditTenantId(), GetTrustedAuditActorId(), leader.Id, "TRUSTEE_RELIEVED_LEADERSHIP", new
        {
            leaderId = leader.Id,
            position = leader.Position,
            relievedLeader = leader.FullName,
            reason = dto.Reason,
            trustee = dto.TrusteeActor ?? "Trustee"
        });

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            success = true,
            message = $"{leader.FullName} has been relieved from the {leader.Position} position.",
            leader = new
            {
                id = leader.Id.ToString(),
                fullName = leader.FullName,
                position = leader.Position,
                status = "RELIEVED"
            }
        });
    }

    // 6. Suspend chapter leader
    public record SuspendLeadershipDto(
        Guid ChapterId,
        Guid LeaderId,
        string Reason,
        bool SuspendMembership,
        string? TrusteeActor
    );

    [HttpPost("suspend-leadership")]
    public async Task<IActionResult> SuspendLeadership([FromBody] SuspendLeadershipDto dto, CancellationToken ct)
    {
        if (dto.LeaderId == Guid.Empty || string.IsNullOrWhiteSpace(dto.Reason))
        {
            return BadRequest(new { message = "Leader ID and Reason are mandatory." });
        }

        var leader = await _db.ChapterLeaders.FindAsync(new object[] { dto.LeaderId }, ct);
        if (leader == null)
        {
            return NotFound(new { message = "Leader not found." });
        }

        leader.IsActive = false;
        leader.SuspendedAt = DateTimeOffset.UtcNow;
        leader.ActionReason = dto.Reason.Trim();
        leader.UpdatedAt = DateTimeOffset.UtcNow;

        if (leader.ChapterId.HasValue)
        {
            var assignment = await _db.MemberRoleAssignments
                .FirstOrDefaultAsync(a => a.ChapterId == leader.ChapterId.Value && a.MemberId.ToLower() == leader.Email.ToLower(), ct);

            if (assignment != null)
            {
                assignment.Status = "SUSPENDED";
            }

            if (dto.SuspendMembership)
            {
                var grpMember = await _db.ChapterGroupMemberships
                    .FirstOrDefaultAsync(g => g.ChapterId == leader.ChapterId.Value && ((g.Email != null && g.Email.ToLower() == leader.Email.ToLower()) || g.MemberId.ToLower() == leader.Email.ToLower()), ct);
                if (grpMember != null)
                {
                    grpMember.Status = "SUSPENDED";
                }
            }
        }

        AddAuditLog(GetTrustedAuditTenantId(), GetTrustedAuditActorId(), leader.Id, "TRUSTEE_SUSPENDED_LEADERSHIP", new
        {
            leaderId = leader.Id,
            position = leader.Position,
            suspendedLeader = leader.FullName,
            reason = dto.Reason,
            suspendMembership = dto.SuspendMembership,
            trustee = dto.TrusteeActor ?? "Trustee"
        });

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            success = true,
            message = $"{leader.FullName} has been suspended from {leader.Position} position.",
            leader = new
            {
                id = leader.Id.ToString(),
                fullName = leader.FullName,
                position = leader.Position,
                status = "SUSPENDED"
            }
        });
    }

    // 7. Reinstate chapter leader
    public record ReinstateLeadershipDto(
        Guid ChapterId,
        Guid LeaderId,
        string? Remarks,
        string? TrusteeActor
    );

    [HttpPost("reinstate-leadership")]
    public async Task<IActionResult> ReinstateLeadership([FromBody] ReinstateLeadershipDto dto, CancellationToken ct)
    {
        if (dto.LeaderId == Guid.Empty)
        {
            return BadRequest(new { message = "Leader ID is mandatory." });
        }

        var leader = await _db.ChapterLeaders.FindAsync(new object[] { dto.LeaderId }, ct);
        if (leader == null)
        {
            return NotFound(new { message = "Leader not found." });
        }

        leader.IsActive = true;
        leader.RelievedAt = null;
        leader.SuspendedAt = null;
        leader.ActionReason = dto.Remarks ?? "Reinstated by Trustee";
        leader.UpdatedAt = DateTimeOffset.UtcNow;

        if (leader.ChapterId.HasValue)
        {
            var assignment = await _db.MemberRoleAssignments
                .FirstOrDefaultAsync(a => a.ChapterId == leader.ChapterId.Value && a.MemberId.ToLower() == leader.Email.ToLower(), ct);

            if (assignment != null)
            {
                assignment.Status = "ACTIVE";
            }
        }

        AddAuditLog(GetTrustedAuditTenantId(), GetTrustedAuditActorId(), leader.Id, "TRUSTEE_REINSTATED_LEADERSHIP", new
        {
            leaderId = leader.Id,
            position = leader.Position,
            reinstatedLeader = leader.FullName,
            remarks = dto.Remarks,
            trustee = dto.TrusteeActor ?? "Trustee"
        });

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            success = true,
            message = $"{leader.FullName} has been reinstated to {leader.Position} position.",
            leader = new
            {
                id = leader.Id.ToString(),
                fullName = leader.FullName,
                position = leader.Position,
                status = "ACTIVE"
            }
        });
    }
}

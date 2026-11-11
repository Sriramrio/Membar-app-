using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Sethu.Domain.Entities;
using Sethu.Domain.Organisation;
using Sethu.Domain.Security;
using Sethu.Infrastructure.Persistence;
using Sethu.Infrastructure.Seed;

namespace Sethu.Api.Controllers;

[ApiController]
[Authorize]
[TypeFilter(typeof(Sethu.Api.Security.LegacyPrivilegedBoundaryFilter))]
[Route("api")]
[Route("")]
public class ChapterWorkflowController(SethuDbContext db) : ControllerBase
{
    // ==========================================
    // 1. CHAPTER MANAGEMENT
    // ==========================================

    public record CreateChapterRequest(string Name, string? RegionId, string? StateId, string? Image = null, string? Logo = null, string? ChapterImage = null, string? ChapterLogo = null);

    [HttpPost("chapters")]
    public async Task<IActionResult> CreateChapter([FromBody] CreateChapterRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Chapter name is required." });

        var img = request.Image ?? request.ChapterImage ?? request.Logo ?? request.ChapterLogo;
        var logo = request.Logo ?? request.ChapterLogo ?? request.Image ?? request.ChapterImage;

        var chapter = new Chapter
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            RegionId = request.RegionId?.Trim(),
            StateId = request.StateId?.Trim(),
            Status = "ACTIVE",
            CreatedAt = DateTimeOffset.UtcNow,
            Image = img,
            Logo = logo
        };

        db.Chapters.Add(chapter);

        // Also add corresponding Unit to Units table so hierarchy resolution and scope match immediately
        var resolvedTenantId = HttpContext.Items["Sethu.V31.TenantId"] is Guid tid && tid != Guid.Empty
            ? tid
            : DevDataSeeder.DefaultTenantId;
        var stateUnit = await db.Units.FirstOrDefaultAsync(u => (u.TenantId == resolvedTenantId || u.TenantId == DevDataSeeder.DefaultTenantId || u.TenantId == Guid.Parse("00000000-0000-0000-0000-000000000001")) && u.Level == UnitLevel.State, ct);

        db.Units.Add(new Unit
        {
            Id = chapter.Id,
            TenantId = resolvedTenantId,
            ParentId = stateUnit?.Id,
            Level = UnitLevel.Chapter,
            Code = chapter.Name,
            Active = true,
            Version = 1
        });

        await db.SaveChangesAsync(ct);

        return Ok(chapter);
    }

    [HttpGet("chapters")]
    public async Task<IActionResult> GetChapters(
        [FromQuery] Guid? chapterId,
        [FromQuery] bool? all,
        [FromQuery] bool? scoped,
        CancellationToken ct)
    {
        try
        {
            var query = db.Chapters.AsQueryable();

            if (chapterId.HasValue && chapterId.Value != Guid.Empty)
            {
                query = query.Where(c => c.Id == chapterId.Value);
            }
            else if (scoped == true && all != true)
            {
                // Never authorize scope from a caller-controlled X-Chapter-Id header.
                var (isLeader, leaderChapterId, _) = await ResolveLeaderChapterIdAsync(ct);
                if (!isLeader || leaderChapterId == Guid.Empty)
                    return Forbid();
                query = query.Where(c => c.Id == leaderChapterId);
            }

            var chapters = await query
                .OrderBy(c => c.Name)
                .ToListAsync(ct);

            // Real active coordinators from appointments + user_identities
            var activeAppointments = await db.Appointments.AsNoTracking()
                .Where(a => a.RoleCode == "CHAPTER_COORDINATOR" && a.Status == AppointmentStatus.Active)
                .ToListAsync(ct);

            var coordUserIds = activeAppointments.Select(a => a.UserId).Distinct().ToList();
            var coordUsers = await db.UserIdentities.AsNoTracking()
                .Where(u => coordUserIds.Contains(u.Id))
                .ToListAsync(ct);

            // Real open tasks per chapter scope
            var openTasks = await db.OrganisationTasks.AsNoTracking()
                .Where(t => t.Status != "DONE")
                .GroupBy(t => t.ScopeId)
                .Select(g => new { ScopeId = g.Key, Count = g.Count() })
                .ToListAsync(ct);

            var taskMap = openTasks.ToDictionary(t => t.ScopeId ?? "", t => t.Count, StringComparer.OrdinalIgnoreCase);

            // Real leaders / members count
            var leaders = await db.ChapterLeaders.AsNoTracking()
                .Where(l => l.ChapterId.HasValue)
                .GroupBy(l => l.ChapterId!.Value)
                .Select(g => new { ChapterId = g.Key, Count = g.Count() })
                .ToListAsync(ct);
            var leaderMap = leaders.ToDictionary(l => l.ChapterId, l => l.Count);

            var result = chapters.Select(c =>
            {
                var appt = activeAppointments.FirstOrDefault(a => a.ChapterId == c.Id);
                var coordUser = appt != null ? coordUsers.FirstOrDefault(u => u.Id == appt.UserId) : null;
                var coordName = coordUser?.Name ?? (!string.IsNullOrWhiteSpace(coordUser?.Email) ? coordUser.Email : null);

                var cIdStr = c.Id.ToString("D");
                taskMap.TryGetValue(cIdStr, out var openTaskCount);
                leaderMap.TryGetValue(c.Id, out var leaderCount);

                // Compute health dynamically from open tasks: 100 base, deduction per open task
                var computedHealth = Math.Max(70, 100 - (openTaskCount * 10));

                return new
                {
                    id = c.Id,
                    name = c.Name,
                    regionId = c.RegionId,
                    stateId = c.StateId,
                    status = c.Status,
                    createdAt = c.CreatedAt,
                    image = c.Image ?? c.Logo,
                    logo = c.Logo ?? c.Image,
                    coordinatorName = coordName,
                    coordinatorEmail = coordUser?.Email,
                    coordinatorPhone = coordUser?.PhoneNumber,
                    memberCount = Math.Max(1, leaderCount),
                    openTasks = openTaskCount,
                    health = computedHealth
                };
            }).ToList();

            return Ok(result);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return StatusCode(499);
        }
    }

    [HttpGet("chapters/{id:guid}")]
    public async Task<IActionResult> GetChapterById([FromRoute] Guid id, CancellationToken ct)
    {
        var chapter = await db.Chapters.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);
        if (chapter == null) return NotFound(new { message = "Chapter not found." });
        return Ok(new
        {
            id = chapter.Id,
            name = chapter.Name,
            regionId = chapter.RegionId,
            stateId = chapter.StateId,
            status = chapter.Status,
            image = chapter.Image ?? chapter.Logo,
            logo = chapter.Logo ?? chapter.Image,
            createdAt = chapter.CreatedAt
        });
    }

    [HttpGet("chapters/by-name/{name}")]
    public async Task<IActionResult> GetChapterByName([FromRoute] string name, CancellationToken ct)
    {
        var clean = name.Trim().ToLowerInvariant();
        var chapter = await db.Chapters.AsNoTracking().FirstOrDefaultAsync(c => c.Name.ToLower() == clean, ct);
        if (chapter == null)
        {
            // Try prefix/suffix search
            chapter = await db.Chapters.AsNoTracking().FirstOrDefaultAsync(c => c.Name.ToLower().Contains(clean) || clean.Contains(c.Name.ToLower()), ct);
        }
        if (chapter == null) return NotFound(new { message = "Chapter not found." });
        return Ok(new
        {
            id = chapter.Id,
            name = chapter.Name,
            regionId = chapter.RegionId,
            stateId = chapter.StateId,
            status = chapter.Status,
            image = chapter.Image ?? chapter.Logo,
            logo = chapter.Logo ?? chapter.Image,
            createdAt = chapter.CreatedAt
        });
    }

    public record UpdateChapterBrandingRequest(string? Image, string? Logo);

    [HttpPost("chapters/{id:guid}/branding")]
    public async Task<IActionResult> UpdateChapterBranding([FromRoute] Guid id, [FromBody] UpdateChapterBrandingRequest req, CancellationToken ct)
    {
        var chapter = await db.Chapters.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (chapter == null) return NotFound(new { message = "Chapter not found." });

        if (req.Image != null) chapter.Image = req.Image;
        if (req.Logo != null) chapter.Logo = req.Logo;
        await db.SaveChangesAsync(ct);

        return Ok(new
        {
            id = chapter.Id,
            name = chapter.Name,
            image = chapter.Image ?? chapter.Logo,
            logo = chapter.Logo ?? chapter.Image
        });
    }

    [HttpGet("chapters/{id:guid}/members")]
    public async Task<IActionResult> GetChapterMembers([FromRoute] Guid id, CancellationToken ct)
    {
        var members = await db.ChapterGroupMemberships
            .Where(m => m.ChapterId == id && m.Status == "ACTIVE")
            .OrderBy(m => m.FullName)
            .ToListAsync(ct);
        return Ok(members);
    }

    [HttpGet("chapters/{chapterId:guid}/verified-members")]
    public async Task<IActionResult> GetVerifiedChapterMembers([FromRoute] Guid chapterId, CancellationToken ct)
    {
        var chapter = await db.Chapters.FindAsync(new object[] { chapterId }, ct);
        var chapterName = chapter?.Name?.Trim() ?? "";
        var cleanTargetName = chapterName
            .Replace("Chapter", "", StringComparison.OrdinalIgnoreCase)
            .Replace("DBN", "", StringComparison.OrdinalIgnoreCase)
            .Trim()
            .ToLowerInvariant();

        // 1. Retrieve member registrations in this chapter where payment is verified
        var verifiedRegistrations = await (
            from reg in db.MemberRegistrations
            join pay in db.PaymentRecords on reg.Id equals pay.RegistrationId
            where reg.ChapterId == chapterId
               && pay.PaymentStatus == "SUCCESS"
               && reg.OnboardingStatus != OnboardingStatus.PENDING_PAYMENT
               && reg.OnboardingStatus != OnboardingStatus.REJECTED
            orderby reg.FullName
            select new
            {
                MemberIdentifier = !string.IsNullOrEmpty(reg.Email) ? reg.Email : reg.Id.ToString(),
                reg.FullName,
                reg.Email,
                reg.Phone,
                reg.BusinessName,
                reg.ChapterId,
                PaymentStatus = "VERIFIED",
                AmountPaid = pay.Amount,
                reg.OnboardingStatus
            }
        ).ToListAsync(ct);

        // 2. Retrieve DBN Member Registrations belonging to this chapter with payment verified
        var verifiedDbnMembers = await db.DbnMemberRegistrations
            .Where(d =>
                (d.ChapterId == chapterId ||
                 (!string.IsNullOrEmpty(chapterName) && (
                     d.ChapterName.ToLower() == chapterName.ToLower() ||
                     d.ChapterName.ToLower().Contains(chapterName.ToLower()) ||
                     chapterName.ToLower().Contains(d.ChapterName.ToLower()) ||
                     (!string.IsNullOrEmpty(cleanTargetName) && (
                         d.ChapterName.ToLower().Contains(cleanTargetName) ||
                         cleanTargetName.Contains(d.ChapterName.ToLower())
                     ))
                 )))
                && (d.TrustPaymentVerifiedAt != null ||
                    d.Stage == "Activated" ||
                    d.Stage == "CommitteeApproved" ||
                    d.Stage == "DocumentsVerified" ||
                    !string.IsNullOrEmpty(d.UpiReference) ||
                    !string.IsNullOrEmpty(d.NeftReference) ||
                    d.DonationAmount > 0)
                && d.Stage != "Rejected"
            )
            .OrderBy(d => d.ApplicantFullName)
            .Select(d => new
            {
                MemberIdentifier = !string.IsNullOrEmpty(d.AssignedMemberId) ? d.AssignedMemberId : (!string.IsNullOrEmpty(d.Email) ? d.Email : d.Id.ToString()),
                FullName = d.ApplicantFullName,
                Email = d.Email,
                Phone = d.MobileNumber,
                BusinessName = d.BusinessName,
                ChapterId = chapterId,
                PaymentStatus = "VERIFIED",
                AmountPaid = d.DonationAmount > 0 ? d.DonationAmount : 6000m,
                OnboardingStatus = d.Stage == "Activated" ? OnboardingStatus.APPROVED_AND_ACTIVE : OnboardingStatus.PAYMENT_VERIFIED
            })
            .ToListAsync(ct);

        // 3. Also retrieve active group members belonging to this chapter
        var activeGroupMembers = await db.ChapterGroupMemberships
            .Where(m => m.ChapterId == chapterId && m.Status == "ACTIVE")
            .Select(m => new
            {
                MemberIdentifier = !string.IsNullOrEmpty(m.MemberId) ? m.MemberId : (!string.IsNullOrEmpty(m.Email) ? m.Email : m.Id.ToString()),
                m.FullName,
                Email = m.Email ?? "",
                Phone = m.Phone ?? "",
                BusinessName = m.BusinessName ?? "",
                m.ChapterId,
                PaymentStatus = "VERIFIED",
                AmountPaid = 6000m,
                OnboardingStatus = OnboardingStatus.APPROVED_AND_ACTIVE
            })
            .ToListAsync(ct);

        var combined = verifiedRegistrations
            .Concat(verifiedDbnMembers)
            .Concat(activeGroupMembers)
            .GroupBy(x => !string.IsNullOrWhiteSpace(x.FullName) 
                ? $"{x.FullName.Trim().ToLowerInvariant()}_{x.Email.Trim().ToLowerInvariant()}" 
                : x.MemberIdentifier.Trim().ToLowerInvariant())
            .Select(g => g.First())
            .OrderBy(x => x.FullName)
            .ToList();

        return Ok(combined);
    }

    // ==========================================
    // 2. ROLE HIERARCHY & ASSIGNMENTS
    // ==========================================

    public record AssignRoleRequest(
        string MemberId,
        Guid ChapterId,
        string RoleId, // President, Vice President, Secretary, Member Coordinator, Member
        DateTimeOffset? ValidUntil = null
    );

    [HttpPost("roles/assign")]
    public async Task<IActionResult> AssignRole([FromBody] AssignRoleRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.MemberId) || string.IsNullOrWhiteSpace(request.RoleId))
            return BadRequest(new { message = "MemberId and RoleId are required." });

        var chapter = await db.Chapters.FindAsync(new object[] { request.ChapterId }, ct);
        if (chapter == null)
            return NotFound(new { message = "Chapter not found." });

        var roleId = request.RoleId.Trim();
        var memberId = request.MemberId.Trim();

        // Find member details to sync name and email
        string memberName = memberId;
        string memberEmail = memberId.Contains('@') ? memberId : $"{memberId}@sethu.network";
        string memberPhone = "";

        var regMember = await db.MemberRegistrations.FirstOrDefaultAsync(r => r.Email == memberId || r.Id.ToString() == memberId, ct);
        if (regMember != null)
        {
            memberName = regMember.FullName;
            memberEmail = regMember.Email;
            memberPhone = regMember.Phone;
        }
        else
        {
            var dbnMember = await db.DbnMemberRegistrations.FirstOrDefaultAsync(d => d.AssignedMemberId == memberId || d.Email == memberId, ct);
            if (dbnMember != null)
            {
                memberName = dbnMember.ApplicantFullName;
                memberEmail = dbnMember.Email;
                memberPhone = dbnMember.MobileNumber;
            }
            else
            {
                var grpMember = await db.ChapterGroupMemberships.FirstOrDefaultAsync(m => m.MemberId == memberId || m.Email == memberId, ct);
                if (grpMember != null)
                {
                    memberName = grpMember.FullName;
                    memberEmail = grpMember.Email ?? memberEmail;
                    memberPhone = grpMember.Phone ?? "";
                }
            }
        }

        // Deactivate previous assignment for this role in this chapter
        var previousAssignments = await db.MemberRoleAssignments
            .Where(r => r.ChapterId == request.ChapterId && r.RoleId == roleId && r.Status == "ACTIVE")
            .ToListAsync(ct);
        foreach (var pa in previousAssignments)
        {
            pa.Status = "INACTIVE";
        }

        // Upsert or add role assignment
        var existing = await db.MemberRoleAssignments
            .FirstOrDefaultAsync(r => r.MemberId == memberId && r.ChapterId == request.ChapterId, ct);

        if (existing != null)
        {
            existing.RoleId = roleId;
            existing.Status = "ACTIVE";
            existing.AssignedAt = DateTimeOffset.UtcNow;
            existing.ValidUntil = request.ValidUntil;
        }
        else
        {
            existing = new MemberRoleAssignment
            {
                Id = Guid.NewGuid(),
                MemberId = memberId,
                ChapterId = request.ChapterId,
                RoleId = roleId,
                Status = "ACTIVE",
                AssignedAt = DateTimeOffset.UtcNow,
                ValidUntil = request.ValidUntil
            };
            db.MemberRoleAssignments.Add(existing);
        }

        // If this is an executive role, automatically sync / create ChapterLeader account so Governed Leaders and Hierarchy match
        if (roleId is ChapterRole.President or ChapterRole.VicePresident or ChapterRole.Secretary or ChapterRole.MemberCoordinator)
        {
            var existingLeaders = await db.ChapterLeaders
                .Where(l => l.ChapterId == request.ChapterId && l.Position == roleId && l.IsActive)
                .ToListAsync(ct);
            foreach (var el in existingLeaders)
            {
                el.IsActive = false;
                el.UpdatedAt = DateTimeOffset.UtcNow;
            }

            var leader = await db.ChapterLeaders
                .FirstOrDefaultAsync(l => l.ChapterId == request.ChapterId && l.Email.ToLower() == memberEmail.ToLower(), ct);
            if (leader != null)
            {
                leader.Position = roleId;
                leader.IsActive = true;
                leader.FullName = memberName;
                leader.Phone = string.IsNullOrEmpty(leader.Phone) ? memberPhone : leader.Phone;
                leader.UpdatedAt = DateTimeOffset.UtcNow;
            }
            else
            {
                var leaderTenantId = HttpContext.Items["Sethu.V31.TenantId"] is Guid tid && tid != Guid.Empty
                    ? tid
                    : DevDataSeeder.DefaultTenantId;
                leader = new ChapterLeader
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = leaderTenantId,
                    ChapterId = request.ChapterId,
                    FullName = memberName,
                    Email = memberEmail.ToLowerInvariant(),
                    Phone = memberPhone,
                    Position = roleId,
                    Role = "chapter_leader",
                    PasswordHash = Sethu.Service.Security.PasswordSecurity.HashPassword("Leader@123"),
                    MustChangePassword = true,
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };
                db.ChapterLeaders.Add(leader);
            }
        }

        await db.SaveChangesAsync(ct);
        return Ok(existing);
    }

    [HttpGet("roles/chapter/{chapterId:guid}")]
    public async Task<IActionResult> GetChapterRoleAssignments([FromRoute] Guid chapterId, CancellationToken ct)
    {
        // Retrieve explicit assignments
        var assignments = await db.MemberRoleAssignments
            .Where(r => r.ChapterId == chapterId && r.Status == "ACTIVE")
            .ToListAsync(ct);

        // Also retrieve active chapter leaders
        var leaders = await db.ChapterLeaders
            .Where(l => l.ChapterId == chapterId && l.IsActive)
            .ToListAsync(ct);

        var result = new List<object>();

        // Add leaders first
        foreach (var l in leaders)
        {
            result.Add(new
            {
                id = l.Id,
                roleId = l.Position,
                memberId = l.Email,
                fullName = l.FullName,
                email = l.Email,
                assignedAt = l.CreatedAt,
                status = "ACTIVE"
            });
        }

        // Add member assignments if not already covered by leader
        foreach (var a in assignments)
        {
            if (!leaders.Any(l => l.Position == a.RoleId))
            {
                result.Add(new
                {
                    id = a.Id,
                    roleId = a.RoleId,
                    memberId = a.MemberId,
                    fullName = a.MemberId,
                    email = a.MemberId.Contains('@') ? a.MemberId : "",
                    assignedAt = a.AssignedAt,
                    status = a.Status
                });
            }
        }

        return Ok(result);
    }

    // ==========================================
    // 3. MEMBER REGISTRATION & ONBOARDING
    // ==========================================

    public record PublicMemberRegistrationRequest(
        string FullName,
        string Email,
        string Phone,
        string BusinessName,
        string? CategoryId,
        Guid ChapterId
    );

    [HttpPost("members/register")]
    public async Task<IActionResult> RegisterMember([FromBody] PublicMemberRegistrationRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Phone) ||
            string.IsNullOrWhiteSpace(request.BusinessName))
        {
            return BadRequest(new { message = "Full name, email, phone, and business name are required." });
        }

        var chapter = await db.Chapters.FindAsync(new object[] { request.ChapterId }, ct);
        if (chapter == null)
            return BadRequest(new { message = "Selected Chapter is invalid." });

        var reg = new MemberRegistration
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Phone = request.Phone.Trim(),
            BusinessName = request.BusinessName.Trim(),
            CategoryId = request.CategoryId?.Trim(),
            ChapterId = request.ChapterId,
            OnboardingStatus = OnboardingStatus.PENDING_DOC_VERIFICATION,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.MemberRegistrations.Add(reg);

        // Pre-create pending payment record so it is available for Trust verification once approved
        db.PaymentRecords.Add(new PaymentRecord
        {
            Id = Guid.NewGuid(),
            RegistrationId = reg.Id,
            Amount = 6000m,
            PaymentRef = $"PAY-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
            PaymentStatus = "PENDING",
            VerifiedAt = null
        });

        await db.SaveChangesAsync(ct);

        return Ok(new
        {
            registrationId = reg.Id,
            status = reg.OnboardingStatus,
            message = "Registration submitted successfully. Application is queued for Member Coordinator document and KYC verification.",
            registration = reg
        });
    }

    // ==========================================
    // 4. PAYMENT VERIFICATION GATE
    // ==========================================

    public record VerifyPaymentRequest(
        Guid RegistrationId,
        decimal Amount,
        string PaymentRef,
        string PaymentStatus = "SUCCESS"
    );

    [HttpPost("payments/verify")]
    public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentRequest request, CancellationToken ct)
    {
        var reg = await db.MemberRegistrations.FindAsync(new object[] { request.RegistrationId }, ct);
        if (reg == null)
            return NotFound(new { message = "Registration not found." });

        var payment = await db.PaymentRecords.FirstOrDefaultAsync(p => p.RegistrationId == reg.Id, ct);
        if (payment == null)
        {
            payment = new PaymentRecord
            {
                Id = Guid.NewGuid(),
                RegistrationId = reg.Id,
                Amount = request.Amount > 0 ? request.Amount : 6000m,
                PaymentRef = string.IsNullOrWhiteSpace(request.PaymentRef) ? $"PAY-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}" : request.PaymentRef.Trim(),
                PaymentStatus = request.PaymentStatus.ToUpperInvariant(),
                VerifiedAt = DateTimeOffset.UtcNow
            };
            db.PaymentRecords.Add(payment);
        }
        else
        {
            payment.Amount = request.Amount > 0 ? request.Amount : payment.Amount;
            payment.PaymentRef = string.IsNullOrWhiteSpace(request.PaymentRef) ? payment.PaymentRef : request.PaymentRef.Trim();
            payment.PaymentStatus = request.PaymentStatus.ToUpperInvariant();
            payment.VerifiedAt = DateTimeOffset.UtcNow;
        }

        if (payment.PaymentStatus == "SUCCESS")
        {
            reg.OnboardingStatus = OnboardingStatus.APPROVED_AND_ACTIVE;
            reg.UpdatedAt = DateTimeOffset.UtcNow;
        }
        else
        {
            reg.OnboardingStatus = OnboardingStatus.REJECTED;
            reg.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(ct);

        return Ok(new
        {
            registrationId = reg.Id,
            status = reg.OnboardingStatus,
            payment,
            message = payment.PaymentStatus == "SUCCESS"
                ? "Payment verified. Member is now approved and active."
                : "Payment verification failed."
        });
    }

    // ==========================================
    // 5. MEMBER COORDINATOR: DOCUMENT VERIFICATION
    // ==========================================

    [HttpGet("onboarding/coordinator/queue")]
    public async Task<IActionResult> GetCoordinatorQueue(CancellationToken ct)
    {
        // Items in PENDING_DOC_VERIFICATION or awaiting initial KYC
        var items = await (
            from r in db.MemberRegistrations
            join c in db.Chapters on r.ChapterId equals c.Id
            where r.OnboardingStatus == OnboardingStatus.PENDING_DOC_VERIFICATION 
               || r.OnboardingStatus == "Submitted"
               || (r.OnboardingStatus == OnboardingStatus.PENDING_PAYMENT && !db.DocumentVerifications.Any(d => d.RegistrationId == r.Id && d.Status == "VERIFIED"))
            orderby r.CreatedAt descending
            select new
            {
                RegistrationId = r.Id,
                r.FullName,
                r.Email,
                r.Phone,
                r.BusinessName,
                r.CategoryId,
                ChapterId = c.Id,
                ChapterName = c.Name,
                Status = r.OnboardingStatus,
                r.CreatedAt,
                Payment = db.PaymentRecords
                    .Where(p => p.RegistrationId == r.Id)
                    .OrderByDescending(p => p.VerifiedAt)
                    .FirstOrDefault()
            }
        ).ToListAsync(ct);

        return Ok(items);
    }

    public record VerifyDocumentRequest(
        Guid RegistrationId,
        string DocumentUrl,
        string VerifiedBy, // MemberCoordinatorId or name
        string Status, // VERIFIED | REJECTED
        string? Notes
    );

    [HttpPost("onboarding/coordinator/verify-doc")]
    public async Task<IActionResult> VerifyDocument([FromBody] VerifyDocumentRequest request, CancellationToken ct)
    {
        var reg = await db.MemberRegistrations.FindAsync(new object[] { request.RegistrationId }, ct);
        if (reg == null)
            return NotFound(new { message = "Registration not found." });

        // Member Coordinator performs KYC & Document Verification first (does not require prior payment)
        var docVerification = new DocumentVerification
        {
            Id = Guid.NewGuid(),
            RegistrationId = reg.Id,
            DocumentUrl = string.IsNullOrWhiteSpace(request.DocumentUrl) ? "https://documents.sethu.network/kyc/verified-doc.pdf" : request.DocumentUrl.Trim(),
            VerifiedBy = string.IsNullOrWhiteSpace(request.VerifiedBy) ? "Member Coordinator" : request.VerifiedBy.Trim(),
            Status = request.Status.ToUpperInvariant(),
            Notes = request.Notes?.Trim(),
            VerifiedAt = DateTimeOffset.UtcNow
        };

        db.DocumentVerifications.Add(docVerification);

        if (docVerification.Status == "VERIFIED")
        {
            // Transition to PENDING_EXECUTIVE_APPROVAL -> Chapter leaders (President, VP, Secretary) review next
            reg.OnboardingStatus = OnboardingStatus.PENDING_EXECUTIVE_APPROVAL;
            reg.UpdatedAt = DateTimeOffset.UtcNow;
        }
        else
        {
            reg.OnboardingStatus = OnboardingStatus.REJECTED;
            reg.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(ct);

        return Ok(new
        {
            registrationId = reg.Id,
            status = reg.OnboardingStatus,
            documentVerification = docVerification,
            message = docVerification.Status == "VERIFIED"
                ? "Document KYC verified. Application forwarded to Chapter Leadership (President, Vice President, Secretary) for approval."
                : "Document verification rejected."
        });
    }

    // ==========================================
    // 6. CHAPTER LEADERSHIP: EXECUTIVE APPROVAL (President, Vice President, Secretary)
    // ==========================================

    [HttpGet("onboarding/executive/queue")]
    public async Task<IActionResult> GetExecutiveQueue(CancellationToken ct)
    {
        // Items in PENDING_EXECUTIVE_APPROVAL or DOC_VERIFIED
        var items = await (
            from r in db.MemberRegistrations
            join c in db.Chapters on r.ChapterId equals c.Id
            where r.OnboardingStatus == OnboardingStatus.PENDING_EXECUTIVE_APPROVAL || r.OnboardingStatus == OnboardingStatus.DOC_VERIFIED
            orderby r.UpdatedAt descending
            select new
            {
                RegistrationId = r.Id,
                r.FullName,
                r.Email,
                r.Phone,
                r.BusinessName,
                r.CategoryId,
                ChapterId = c.Id,
                ChapterName = c.Name,
                Status = r.OnboardingStatus,
                r.CreatedAt,
                Payment = db.PaymentRecords
                    .Where(p => p.RegistrationId == r.Id)
                    .OrderByDescending(p => p.VerifiedAt)
                    .FirstOrDefault(),
                DocumentVerification = db.DocumentVerifications
                    .Where(d => d.RegistrationId == r.Id && d.Status == "VERIFIED")
                    .OrderByDescending(d => d.VerifiedAt)
                    .FirstOrDefault()
            }
        ).ToListAsync(ct);

        return Ok(items);
    }

    public record ExecutiveApproveRequest(
        Guid RegistrationId,
        string ApprovedBy, // President, VP, or Secretary name/ID
        string RoleAtApproval, // President | Vice President | Secretary
        string Status, // APPROVED | REJECTED
        string? Remarks
    );

    [HttpPost("onboarding/executive/approve")]
    public async Task<IActionResult> ExecutiveApprove([FromBody] ExecutiveApproveRequest request, CancellationToken ct)
    {
        var reg = await db.MemberRegistrations.FindAsync(new object[] { request.RegistrationId }, ct);
        if (reg == null)
            return NotFound(new { message = "Registration not found." });

        // Gate check: Document Verification must have been completed by Member Coordinator
        var hasDocVerified = await db.DocumentVerifications.AnyAsync(d => d.RegistrationId == reg.Id && d.Status == "VERIFIED", ct);
        if (!hasDocVerified)
            return BadRequest(new { message = "Cannot approve: Documents have not yet been verified by Member Coordinator." });

        var approval = new ChapterApproval
        {
            Id = Guid.NewGuid(),
            RegistrationId = reg.Id,
            ApprovedBy = string.IsNullOrWhiteSpace(request.ApprovedBy) ? "Chapter Leader" : request.ApprovedBy.Trim(),
            RoleAtApproval = string.IsNullOrWhiteSpace(request.RoleAtApproval) ? ChapterRole.President : request.RoleAtApproval.Trim(),
            Status = request.Status.ToUpperInvariant(),
            Remarks = request.Remarks?.Trim(),
            ApprovedAt = DateTimeOffset.UtcNow
        };

        db.ChapterApprovals.Add(approval);

        if (approval.Status == "APPROVED")
        {
            // Forward to Trust: Member is approved by chapter leadership, now awaiting Trust payment verification
            reg.OnboardingStatus = OnboardingStatus.PENDING_PAYMENT;
            reg.UpdatedAt = DateTimeOffset.UtcNow;

            // Ensure a pending payment record is present for Trust Payment Verification
            var existingPay = await db.PaymentRecords.FirstOrDefaultAsync(p => p.RegistrationId == reg.Id, ct);
            if (existingPay == null)
            {
                db.PaymentRecords.Add(new PaymentRecord
                {
                    Id = Guid.NewGuid(),
                    RegistrationId = reg.Id,
                    Amount = 6000m,
                    PaymentRef = $"PAY-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                    PaymentStatus = "PENDING",
                    VerifiedAt = null
                });
            }
        }
        else
        {
            reg.OnboardingStatus = OnboardingStatus.REJECTED;
            reg.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(ct);

        return Ok(new
        {
            registrationId = reg.Id,
            status = reg.OnboardingStatus,
            approval,
            message = approval.Status == "APPROVED"
                ? "Member approved by Chapter Leadership. Application forwarded to Trust for payment verification."
                : "Application rejected by Chapter Leadership."
        });
    }

    // ==========================================
    // 7. APPLICATION STATUS TRACKING & ACCESS
    // ==========================================

    [HttpGet("onboarding/status/{registrationId:guid}")]
    public async Task<IActionResult> GetOnboardingStatus([FromRoute] Guid registrationId, CancellationToken ct)
    {
        var reg = await db.MemberRegistrations.FindAsync(new object[] { registrationId }, ct);
        if (reg == null)
            return NotFound(new { message = "Registration not found." });

        var chapter = await db.Chapters.FindAsync(new object[] { reg.ChapterId }, ct);
        var payment = await db.PaymentRecords
            .Where(p => p.RegistrationId == reg.Id)
            .OrderByDescending(p => p.VerifiedAt)
            .FirstOrDefaultAsync(ct);

        var docVerification = await db.DocumentVerifications
            .Where(d => d.RegistrationId == reg.Id)
            .OrderByDescending(d => d.VerifiedAt)
            .FirstOrDefaultAsync(ct);

        var approval = await db.ChapterApprovals
            .Where(a => a.RegistrationId == reg.Id)
            .OrderByDescending(a => a.ApprovedAt)
            .FirstOrDefaultAsync(ct);

        var membership = await db.ChapterGroupMemberships
            .FirstOrDefaultAsync(m => m.ChapterId == reg.ChapterId && m.Email == reg.Email, ct);

        return Ok(new
        {
            registration = reg,
            chapter = chapter?.Name ?? "Unknown Chapter",
            currentStatus = reg.OnboardingStatus,
            payment,
            documentVerification = docVerification,
            executiveApproval = approval,
            groupMembership = membership
        });
    }

    [HttpGet("onboarding/status/by-user")]
    public async Task<IActionResult> GetOnboardingStatusByUser([FromQuery] string identifier, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(identifier))
            return BadRequest(new { message = "User identifier (email or memberId) is required." });

        var normalized = identifier.Trim().ToLowerInvariant();

        // 1. Try finding in MemberRegistrations
        var reg = await db.MemberRegistrations
            .Where(r => r.Email.ToLower() == normalized || r.FullName.ToLower() == normalized)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (reg != null)
        {
            var chapter = await db.Chapters.FindAsync(new object[] { reg.ChapterId }, ct);
            var payment = await db.PaymentRecords
                .Where(p => p.RegistrationId == reg.Id)
                .OrderByDescending(p => p.VerifiedAt)
                .FirstOrDefaultAsync(ct);

            var docVerification = await db.DocumentVerifications
                .Where(d => d.RegistrationId == reg.Id)
                .OrderByDescending(d => d.VerifiedAt)
                .FirstOrDefaultAsync(ct);

            var approval = await db.ChapterApprovals
                .Where(a => a.RegistrationId == reg.Id)
                .OrderByDescending(a => a.ApprovedAt)
                .FirstOrDefaultAsync(ct);

            var membership = await db.ChapterGroupMemberships
                .FirstOrDefaultAsync(m => m.ChapterId == reg.ChapterId && m.Email == reg.Email, ct);

            return Ok(new
            {
                registration = reg,
                chapter = chapter?.Name ?? "Unknown Chapter",
                currentStatus = reg.OnboardingStatus,
                payment,
                documentVerification = docVerification,
                executiveApproval = approval,
                groupMembership = membership
            });
        }

        // 2. Try finding in DbnMemberRegistrations
        var dbnReg = await db.DbnMemberRegistrations
            .Where(r => r.Email.ToLower() == normalized || r.MobileNumber.Contains(normalized))
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (dbnReg != null)
        {
            return Ok(new
            {
                registration = new
                {
                    Id = dbnReg.Id,
                    FullName = dbnReg.ApplicantFullName,
                    Email = dbnReg.Email,
                    Phone = dbnReg.MobileNumber,
                    BusinessName = dbnReg.BusinessName,
                    CategoryId = dbnReg.PrimaryBusinessCategory,
                    ChapterId = dbnReg.ChapterId,
                    ChapterName = dbnReg.ChapterName,
                    OnboardingStatus = dbnReg.Stage == "Activated" ? OnboardingStatus.APPROVED_AND_ACTIVE :
                                      dbnReg.Stage == "CommitteeApproved" ? OnboardingStatus.PENDING_EXECUTIVE_APPROVAL :
                                      dbnReg.Stage == "DocumentsVerified" ? OnboardingStatus.DOC_VERIFIED :
                                      OnboardingStatus.PAYMENT_VERIFIED,
                    CreatedAt = dbnReg.CreatedAt
                },
                chapter = dbnReg.ChapterName,
                currentStatus = dbnReg.Stage == "Activated" ? OnboardingStatus.APPROVED_AND_ACTIVE :
                               dbnReg.Stage == "CommitteeApproved" ? OnboardingStatus.PENDING_EXECUTIVE_APPROVAL :
                               dbnReg.Stage == "DocumentsVerified" ? OnboardingStatus.DOC_VERIFIED :
                               OnboardingStatus.PAYMENT_VERIFIED,
                payment = new
                {
                    Amount = dbnReg.DonationAmount,
                    PaymentRef = dbnReg.UpiReference ?? dbnReg.NeftReference ?? "VERIFIED",
                    PaymentStatus = "SUCCESS",
                    VerifiedAt = dbnReg.CreatedAt
                },
                documentVerification = dbnReg.DocumentsVerifiedAt.HasValue ? new
                {
                    VerifiedBy = dbnReg.DocumentsVerifiedBy,
                    VerifiedAt = dbnReg.DocumentsVerifiedAt,
                    Status = "VERIFIED"
                } : null,
                executiveApproval = dbnReg.CommitteeApprovedAt.HasValue ? new
                {
                    ApprovedBy = dbnReg.CommitteeApprovedBy,
                    ApprovedAt = dbnReg.CommitteeApprovedAt,
                    Status = "APPROVED"
                } : null,
                groupMembership = !string.IsNullOrWhiteSpace(dbnReg.AssignedMemberId) ? new
                {
                    MemberId = dbnReg.AssignedMemberId,
                    Status = "ACTIVE"
                } : null
            });
        }

        return NotFound(new { message = "No registration records found for this identifier." });
    }

    // ==========================================
    // 8. LIST ALL REGISTRATIONS & PAYMENT-VERIFIED MEMBERS
    // ==========================================

    [HttpGet("members/registrations")]
    public async Task<IActionResult> GetMemberRegistrations([FromQuery] Guid? chapterId, [FromQuery] string? status, CancellationToken ct)
    {
        var query = from r in db.MemberRegistrations
                    join c in db.Chapters on r.ChapterId equals c.Id
                    select new
                    {
                        RegistrationId = r.Id,
                        r.FullName,
                        r.Email,
                        r.Phone,
                        r.BusinessName,
                        r.CategoryId,
                        ChapterId = c.Id,
                        ChapterName = c.Name,
                        Status = r.OnboardingStatus,
                        r.CreatedAt,
                        r.UpdatedAt,
                        Payment = db.PaymentRecords
                            .Where(p => p.RegistrationId == r.Id)
                            .OrderByDescending(p => p.VerifiedAt)
                            .FirstOrDefault(),
                        DocumentVerification = db.DocumentVerifications
                            .Where(d => d.RegistrationId == r.Id)
                            .OrderByDescending(d => d.VerifiedAt)
                            .FirstOrDefault(),
                        ExecutiveApproval = db.ChapterApprovals
                            .Where(a => a.RegistrationId == r.Id)
                            .OrderByDescending(a => a.ApprovedAt)
                            .FirstOrDefault()
                    };

        if (chapterId.HasValue && chapterId.Value != Guid.Empty)
        {
            query = query.Where(q => q.ChapterId == chapterId.Value);
        }

        var results = await query.OrderByDescending(q => q.CreatedAt).ToListAsync(ct);
        return Ok(results);
    }

    // ==========================================
    // 9. LEADERSHIP ASSIGNMENT & ACCESS CHECK FOR ORGANISATION WORKSPACE
    // ==========================================

    [HttpGet("roles/user-access")]
    public async Task<IActionResult> GetUserLeadershipAccess([FromQuery] string identifier, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(identifier))
            return BadRequest(new { message = "User identifier is required." });

        var normalized = identifier.Trim().ToLowerInvariant();

        // Gather all candidate identifiers for this user (email, member id, full name, guid)
        var candidateIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { normalized };

        var dbnMatches = await db.DbnMemberRegistrations
            .Where(r => r.Email.ToLower() == normalized 
                     || (r.AssignedMemberId != null && r.AssignedMemberId.ToLower() == normalized)
                     || r.ApplicantFullName.ToLower() == normalized
                     || r.Id.ToString().ToLower() == normalized)
            .ToListAsync(ct);
        foreach (var r in dbnMatches)
        {
            if (!string.IsNullOrEmpty(r.Email)) candidateIds.Add(r.Email.ToLower());
            if (!string.IsNullOrEmpty(r.AssignedMemberId)) candidateIds.Add(r.AssignedMemberId.ToLower());
            candidateIds.Add(r.Id.ToString().ToLower());
        }

        var regMatches = await db.MemberRegistrations
            .Where(r => r.Email.ToLower() == normalized 
                     || r.FullName.ToLower() == normalized
                     || r.Id.ToString().ToLower() == normalized)
            .ToListAsync(ct);
        foreach (var r in regMatches)
        {
            if (!string.IsNullOrEmpty(r.Email)) candidateIds.Add(r.Email.ToLower());
            candidateIds.Add(r.Id.ToString().ToLower());
            candidateIds.Add($"member:{r.Id.ToString().Substring(0, 8)}".ToLower());
        }

        var userMatches = await db.UserIdentities
            .Where(u => (u.Email != null && u.Email.ToLower() == normalized) 
                     || (u.Name != null && u.Name.ToLower() == normalized)
                     || u.Id.ToString().ToLower() == normalized)
            .ToListAsync(ct);
        foreach (var u in userMatches)
        {
            if (!string.IsNullOrEmpty(u.Email)) candidateIds.Add(u.Email.ToLower());
            if (u.MemberId.HasValue) candidateIds.Add(u.MemberId.Value.ToString().ToLower());
        }

        var candidateList = candidateIds.ToList();

        // Find active leadership roles assigned to this member or email
        var assignments = await (
            from a in db.MemberRoleAssignments
            join c in db.Chapters on a.ChapterId equals c.Id
            where a.Status == "ACTIVE" && candidateList.Contains(a.MemberId.ToLower())
            select new
            {
                AssignmentId = a.Id,
                MemberId = a.MemberId,
                ChapterId = c.Id,
                ChapterName = c.Name,
                RoleId = a.RoleId,
                AssignedAt = a.AssignedAt
            }
        ).ToListAsync(ct);

        var isAuthorized = assignments.Count > 0;
        var primaryAssignment = assignments.FirstOrDefault();

        return Ok(new
        {
            isAuthorized,
            identifier,
            assignments,
            primaryChapterId = primaryAssignment?.ChapterId,
            primaryChapterName = primaryAssignment?.ChapterName,
            primaryRole = primaryAssignment?.RoleId
        });
    }

    // ==========================================
    // 10. LEADER-SCOPED DATA ISOLATION (ORGANIZATION WEB)
    // ==========================================

    private async Task<(bool success, Guid chapterId, string? error)> ResolveLeaderChapterIdAsync(CancellationToken ct)
    {
        // 1. Prioritize chapter_id claim from validated JWT
        var chapterClaim = User.FindFirst("chapter_id")?.Value;
        if (!string.IsNullOrEmpty(chapterClaim) && Guid.TryParse(chapterClaim, out var claimChapterId))
        {
            return (true, claimChapterId, null);
        }

        // 2. Fallback to authenticated identity check against active assignments in DB
        var sub = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;

        if (string.IsNullOrEmpty(sub) && string.IsNullOrEmpty(email))
        {
            return (false, Guid.Empty, "Authentication credentials or session token missing.");
        }

        var normalizedSub = (sub ?? "").Trim().ToLowerInvariant();
        var normalizedEmail = (email ?? "").Trim().ToLowerInvariant();

        var candidateIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrEmpty(normalizedSub)) candidateIds.Add(normalizedSub);
        if (!string.IsNullOrEmpty(normalizedEmail)) candidateIds.Add(normalizedEmail);

        if (!string.IsNullOrEmpty(normalizedEmail))
        {
            var dbn = await db.DbnMemberRegistrations
                .Where(r => r.Email.ToLower() == normalizedEmail || (r.AssignedMemberId != null && r.AssignedMemberId.ToLower() == normalizedEmail))
                .FirstOrDefaultAsync(ct);
            if (dbn != null)
            {
                if (!string.IsNullOrEmpty(dbn.Email)) candidateIds.Add(dbn.Email.ToLower());
                if (!string.IsNullOrEmpty(dbn.AssignedMemberId)) candidateIds.Add(dbn.AssignedMemberId.ToLower());
                candidateIds.Add(dbn.Id.ToString().ToLower());
            }
        }

        var candidateList = candidateIds.ToList();

        var assignment = await (
            from a in db.MemberRoleAssignments
            where a.Status == "ACTIVE" && candidateList.Contains(a.MemberId.ToLower()) && (
                a.RoleId == ChapterRole.President ||
                a.RoleId == ChapterRole.VicePresident ||
                a.RoleId == ChapterRole.Secretary ||
                a.RoleId == ChapterRole.MemberCoordinator
            )
            select a.ChapterId
        ).FirstOrDefaultAsync(ct);

        if (assignment != Guid.Empty)
        {
            return (true, assignment, null);
        }

        return (false, Guid.Empty, "Only members who have a leadership role can access this resource.");
    }

    [HttpGet("org/my-chapter")]
    public async Task<IActionResult> GetMyChapter(CancellationToken ct)
    {
        var (success, chapterId, error) = await ResolveLeaderChapterIdAsync(ct);
        if (!success)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { code = "LEADERSHIP_ROLE_REQUIRED", message = error });
        }

        var chapter = await db.Chapters.FindAsync(new object[] { chapterId }, ct);
        if (chapter == null)
            return NotFound(new { message = "Assigned chapter not found." });

        return Ok(chapter);
    }

    [HttpGet("org/my-chapter/registrations")]
    public async Task<IActionResult> GetMyChapterRegistrations([FromQuery] Guid? requestedChapterId, CancellationToken ct)
    {
        var (success, leaderChapterId, error) = await ResolveLeaderChapterIdAsync(ct);
        if (!success)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { code = "LEADERSHIP_ROLE_REQUIRED", message = error });
        }

        // Return 403 Forbidden if another chapter's data is requested
        if (requestedChapterId.HasValue && requestedChapterId.Value != Guid.Empty && requestedChapterId.Value != leaderChapterId)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new 
            { 
                code = "CROSS_CHAPTER_ACCESS_FORBIDDEN", 
                message = "Access Denied: You cannot access or view registrations outside of your assigned chapter." 
            });
        }

        var chapter = await db.Chapters.FindAsync(new object[] { leaderChapterId }, ct);
        var chapterName = chapter?.Name?.Trim() ?? "";
        var cleanTargetName = chapterName
            .Replace("Chapter", "", StringComparison.OrdinalIgnoreCase)
            .Replace("DBN", "", StringComparison.OrdinalIgnoreCase)
            .Trim()
            .ToLowerInvariant();

        // Leader strictly sees only their own chapter's registrations
        var registrations = await (
            from r in db.MemberRegistrations
            join c in db.Chapters on r.ChapterId equals c.Id
            where r.ChapterId == leaderChapterId
            orderby r.CreatedAt descending
            select new
            {
                RegistrationId = r.Id,
                r.FullName,
                r.Email,
                r.Phone,
                r.BusinessName,
                r.CategoryId,
                ChapterId = c.Id,
                ChapterName = c.Name,
                Status = r.OnboardingStatus,
                r.CreatedAt,
                r.UpdatedAt,
                Payment = db.PaymentRecords
                    .Where(p => p.RegistrationId == r.Id)
                    .OrderByDescending(p => p.VerifiedAt)
                    .FirstOrDefault(),
                DocumentVerification = db.DocumentVerifications
                    .Where(d => d.RegistrationId == r.Id)
                    .OrderByDescending(d => d.VerifiedAt)
                    .FirstOrDefault(),
                ExecutiveApproval = db.ChapterApprovals
                    .Where(a => a.RegistrationId == r.Id)
                    .OrderByDescending(a => a.ApprovedAt)
                    .FirstOrDefault()
            }
        ).ToListAsync(ct);

        // Also retrieve DBN registrations strictly for leader's chapter
        var dbnRegistrations = await db.DbnMemberRegistrations
            .Where(d => d.ChapterId == leaderChapterId ||
                        (!string.IsNullOrEmpty(chapterName) && (
                            d.ChapterName.ToLower() == chapterName.ToLower() ||
                            d.ChapterName.ToLower().Contains(chapterName.ToLower()) ||
                            chapterName.ToLower().Contains(d.ChapterName.ToLower()) ||
                            (!string.IsNullOrEmpty(cleanTargetName) && (
                                d.ChapterName.ToLower().Contains(cleanTargetName) ||
                                cleanTargetName.Contains(d.ChapterName.ToLower())
                            ))
                        )))
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new
            {
                RegistrationId = d.Id,
                FullName = d.ApplicantFullName,
                Email = d.Email,
                Phone = d.MobileNumber,
                BusinessName = d.BusinessName,
                CategoryId = d.PrimaryBusinessCategory,
                ChapterId = leaderChapterId,
                ChapterName = chapterName,
                Status = d.Stage == "Activated" ? OnboardingStatus.APPROVED_AND_ACTIVE :
                         d.Stage == "CommitteeApproved" ? OnboardingStatus.PENDING_EXECUTIVE_APPROVAL :
                         d.Stage == "DocumentsVerified" ? OnboardingStatus.DOC_VERIFIED :
                         OnboardingStatus.PAYMENT_VERIFIED,
                CreatedAt = d.CreatedAt,
                UpdatedAt = d.UpdatedAt,
                Payment = new PaymentRecord
                {
                    Id = Guid.NewGuid(),
                    RegistrationId = d.Id,
                    Amount = d.DonationAmount,
                    PaymentRef = d.UpiReference ?? d.NeftReference ?? "VERIFIED",
                    PaymentStatus = "SUCCESS",
                    VerifiedAt = d.CreatedAt
                },
                DocumentVerification = d.DocumentsVerifiedAt.HasValue ? new DocumentVerification
                {
                    Id = Guid.NewGuid(),
                    RegistrationId = d.Id,
                    DocumentUrl = "",
                    VerifiedBy = d.DocumentsVerifiedBy ?? "Member Coordinator",
                    VerifiedAt = d.DocumentsVerifiedAt.Value,
                    Status = "VERIFIED"
                } : null,
                ExecutiveApproval = d.CommitteeApprovedAt.HasValue ? new ChapterApproval
                {
                    Id = Guid.NewGuid(),
                    RegistrationId = d.Id,
                    ApprovedBy = d.CommitteeApprovedBy ?? "President",
                    RoleAtApproval = ChapterRole.President,
                    ApprovedAt = d.CommitteeApprovedAt.Value,
                    Status = "APPROVED"
                } : null
            })
            .ToListAsync(ct);

        var allScoped = registrations
            .Concat(dbnRegistrations)
            .OrderByDescending(x => x.CreatedAt)
            .ToList();

        return Ok(allScoped);
    }
}

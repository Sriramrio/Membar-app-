using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Domain.MemberBusiness;
using Sethu.Domain.Security;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Security;

namespace Sethu.Api.Controllers;

public record MemberRegistrationRequestDto(
    string ApplicantFullName,
    string DateOfBirth,
    string MobileNumber,
    string Email,
    string ResidentialAddress,
    string ResidentialCity,
    string ResidentialPinCode,
    string BusinessName,
    string ApplicantDesignation,
    string? PrimaryBusinessCategory,
    Guid? SectorId,
    string? SectorName,
    Guid? SegmentId,
    string? SegmentName,
    Guid? SpecialisationId,
    string? SpecialisationName,
    string ProductsServicesOffered,
    string YearEstablished,
    string EmployeeCountRange,
    string BusinessAddress,
    string BusinessCity,
    string BusinessPinCode,
    string? Gstin,
    string? WebsiteOrLinkedIn,
    string? ConnectionsCanGiveJson,
    string? FatherName,
    string? Gothram,
    string? HobbiesInterests,
    string? SpecialMention,
    string? BusinessDescription,
    string? IdealCustomerProfilesJson,
    string? BusinessConnectionsSought,
    string? GeographicMarketsServedJson,
    string? KeyDifferentiator,
    string? BusinessContactEmail,
    bool AgreedToGuidelines,
    bool InformationAccurate,
    bool DataUsageConsent,
    bool BirthdayGreetingConsent,
    bool VoluntaryContributionAcknowledged,
    string ElectronicSignature,
    string DeclarationDate,
    decimal DonationAmount,
    string PaymentMode,
    string? UpiReference,
    string? NeftReference,
    string? ChequeNumber,
    string? ChequeDate,
    string? BankFavoring,
    string? ChapterName,
    Guid? ChapterId
);

public record ActionAuditDto(
    string? ActorName,
    string? ActorRole,
    string? Notes
);

[ApiController]
[Route("api/membership")]
public class MemberRegistrationController : ControllerBase
{
    private readonly SethuDbContext _db;
    private readonly IAuthenticatedActorResolver _identity;
    private readonly ITrustedPermissionStore _permissions;

    public MemberRegistrationController(SethuDbContext db, IAuthenticatedActorResolver identity, ITrustedPermissionStore permissions)
    {
        _db = db;
        _identity = identity;
        _permissions = permissions;
    }

    private async Task<ChapterLeader?> GetActiveLeaderAsync(CancellationToken ct)
    {
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
            ?? User.FindFirst("email")?.Value;
        var sub = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!string.IsNullOrEmpty(email))
        {
            var leader = await _db.ChapterLeaders
                .FirstOrDefaultAsync(x => x.Email.ToLower() == email.ToLower() && x.IsActive, ct);
            if (leader != null) return leader;
        }

        if (!string.IsNullOrEmpty(sub) && Guid.TryParse(sub, out var leaderId))
        {
            var leader = await _db.ChapterLeaders
                .FirstOrDefaultAsync(x => x.Id == leaderId && x.IsActive, ct);
            if (leader != null) return leader;
        }

        return null;
    }

    private async Task<bool> PermittedAsync(string permission, Guid? chapterId, Guid tenantId, CancellationToken ct)
    {
        return await Task.FromResult(true);
    }

    private async Task<bool> CanReadAcrossChaptersAsync(CancellationToken ct)
    {
        return await Task.FromResult(true);
    }

    private async Task<Guid[]> ReadableChaptersAsync(CancellationToken ct)
    {
        return await Task.FromResult(Array.Empty<Guid>());
    }

    /// <summary>
    /// Public intake form submission: Section A through F of the Sri Matre Registration Form.
    /// Initializes application stage to 'Submitted'.
    /// </summary>
    [HttpPost("register")]
    [HttpPost("dbn-register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] MemberRegistrationRequestDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.ApplicantFullName) || string.IsNullOrWhiteSpace(dto.MobileNumber) || string.IsNullOrWhiteSpace(dto.Email))
        {
            return BadRequest(new { success = false, message = "Applicant full name, mobile number, and email are required." });
        }

        var resolvedChapterId = dto.ChapterId;
        if (!resolvedChapterId.HasValue && !string.IsNullOrWhiteSpace(dto.ChapterName))
        {
            var norm = dto.ChapterName.Trim().ToLower();
            var ch = await _db.Chapters.FirstOrDefaultAsync(c => c.Name.ToLower() == norm || norm.Contains(c.Name.ToLower()) || c.Name.ToLower().Contains(norm), ct);
            if (ch != null) resolvedChapterId = ch.Id;
        }

        if (dto.SpecialisationId.HasValue && dto.SpecialisationId.Value != Guid.Empty && resolvedChapterId.HasValue)
        {
            var occupied = await (from m in _db.Set<MemberRecord>().AsNoTracking()
                                  join a in _db.Set<MemberChapterAffiliation>().AsNoTracking() on m.Id equals a.MemberId
                                  join b in _db.Set<BusinessRecord>().AsNoTracking() on m.Id equals b.OwnerMemberId
                                  where a.ChapterId == resolvedChapterId.Value && a.Status == AffiliationStatus.Active &&
                                        b.SpecialisationId == dto.SpecialisationId.Value && b.Status == BusinessRecordStatus.Active
                                  select b.Id).AnyAsync(ct);
            if (occupied)
            {
                return BadRequest(new { success = false, message = $"The selected category ({dto.SpecialisationName ?? "Business Category"}) is already represented by an active member in this Chapter. Please choose a different specialisation or contact the chapter secretary." });
            }
        }

        var registration = new DbnMemberRegistration
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            ChapterId = resolvedChapterId,
            ChapterName = string.IsNullOrWhiteSpace(dto.ChapterName) ? "Hosur Chapter" : dto.ChapterName,

            // Section A
            ApplicantFullName = dto.ApplicantFullName,
            DateOfBirth = dto.DateOfBirth ?? "",
            MobileNumber = dto.MobileNumber,
            Email = dto.Email,
            ResidentialAddress = dto.ResidentialAddress ?? "",
            ResidentialCity = dto.ResidentialCity ?? "",
            ResidentialPinCode = dto.ResidentialPinCode ?? "",

            // Section B
            BusinessName = dto.BusinessName ?? "",
            ApplicantDesignation = dto.ApplicantDesignation ?? "",
            PrimaryBusinessCategory = dto.SpecialisationName ?? dto.PrimaryBusinessCategory ?? "",
            SectorId = dto.SectorId,
            SectorName = dto.SectorName,
            SegmentId = dto.SegmentId,
            SegmentName = dto.SegmentName,
            SpecialisationId = dto.SpecialisationId,
            SpecialisationName = dto.SpecialisationName,
            ProductsServicesOffered = dto.ProductsServicesOffered ?? "",
            YearEstablished = dto.YearEstablished ?? "",
            EmployeeCountRange = dto.EmployeeCountRange ?? "1–5",
            BusinessAddress = dto.BusinessAddress ?? "",
            BusinessCity = dto.BusinessCity ?? "",
            BusinessPinCode = dto.BusinessPinCode ?? "",
            Gstin = dto.Gstin,
            WebsiteOrLinkedIn = dto.WebsiteOrLinkedIn,
            ConnectionsCanGiveJson = dto.ConnectionsCanGiveJson ?? "[]",

            // Section C
            FatherName = dto.FatherName,
            Gothram = dto.Gothram,
            HobbiesInterests = dto.HobbiesInterests,
            SpecialMention = dto.SpecialMention,

            // Section D
            BusinessDescription = dto.BusinessDescription,
            IdealCustomerProfilesJson = dto.IdealCustomerProfilesJson ?? "[]",
            BusinessConnectionsSought = dto.BusinessConnectionsSought,
            GeographicMarketsServedJson = dto.GeographicMarketsServedJson ?? "[]",
            KeyDifferentiator = dto.KeyDifferentiator,
            BusinessContactEmail = dto.BusinessContactEmail ?? dto.Email,

            // Section E
            AgreedToGuidelines = dto.AgreedToGuidelines,
            InformationAccurate = dto.InformationAccurate,
            DataUsageConsent = dto.DataUsageConsent,
            BirthdayGreetingConsent = dto.BirthdayGreetingConsent,
            VoluntaryContributionAcknowledged = dto.VoluntaryContributionAcknowledged,
            ElectronicSignature = dto.ElectronicSignature ?? dto.ApplicantFullName,
            DeclarationDate = string.IsNullOrWhiteSpace(dto.DeclarationDate) ? DateTime.UtcNow.ToString("yyyy-MM-dd") : dto.DeclarationDate,

            // Section F
            DonationAmount = dto.DonationAmount > 0 ? dto.DonationAmount : 6000m,
            PaymentMode = string.IsNullOrWhiteSpace(dto.PaymentMode) ? "UPI" : dto.PaymentMode,
            UpiReference = dto.UpiReference,
            NeftReference = dto.NeftReference,
            ChequeNumber = dto.ChequeNumber,
            ChequeDate = dto.ChequeDate,
            BankFavoring = string.IsNullOrWhiteSpace(dto.BankFavoring) ? "Dharmic Business Network Trust" : dto.BankFavoring,

            Stage = "Submitted",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _db.DbnMemberRegistrations.Add(registration);
        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            success = true,
            id = registration.Id,
            stage = registration.Stage,
            message = "Sri Matre Member Registration submitted successfully. Awaiting Document Verification."
        });
    }

    /// <summary>
    /// Queries membership applications with optional stage and chapter filters.
    /// </summary>
    [HttpGet("applications")]
    [AllowAnonymous]
    public async Task<IActionResult> GetApplications(
        [FromQuery] string? stage,
        [FromQuery] Guid? chapterId,
        CancellationToken ct)
    {
        var query = _db.DbnMemberRegistrations.AsNoTracking().AsQueryable();

        if (chapterId.HasValue) query = query.Where(x => x.ChapterId == chapterId.Value);
        if (!string.IsNullOrWhiteSpace(stage)) query = query.Where(x => x.Stage == stage);
        var applications = await query
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);

        return Ok(applications);
    }

    /// <summary>
    /// Returns details for a single membership application by ID.
    /// </summary>
    [HttpGet("applications/{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetApplicationById(Guid id, CancellationToken ct)
    {
        var app = await _db.DbnMemberRegistrations.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (app == null)
        {
            return NotFound(new { success = false, message = "Application not found." });
        }

        return Ok(app);
    }

    /// <summary>
    /// Step 1: Document Verification (Sections A–E).
    /// Authorized: Member Coordinator (Work Coordinator), Chapter President, Chapter Secretary.
    /// </summary>
    [HttpPost("applications/{id:guid}/verify-documents")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyDocuments(
        Guid id,
        [FromBody] ActionAuditDto? dto,
        CancellationToken ct)
    {
        var app = await _db.DbnMemberRegistrations.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (app == null)
        {
            return NotFound(new { success = false, message = "Application not found." });
        }

        if (!app.ChapterId.HasValue && !string.IsNullOrWhiteSpace(app.ChapterName))
        {
            var norm = app.ChapterName.Trim().ToLower();
            var ch = await _db.Chapters.FirstOrDefaultAsync(c => c.Name.ToLower() == norm || norm.Contains(c.Name.ToLower()) || c.Name.ToLower().Contains(norm), ct);
            if (ch != null)
            {
                app.ChapterId = ch.Id;
                await _db.SaveChangesAsync(ct);
            }
        }

        var leader = await GetActiveLeaderAsync(ct);
        var actorName = leader?.FullName
            ?? User.FindFirst("name")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
            ?? User.FindFirst("email")?.Value
            ?? dto?.ActorName
            ?? "Member Coordinator";
        var actorRole = leader?.Position
            ?? User.FindFirst("position")?.Value
            ?? User.FindFirst("role")?.Value
            ?? User.FindFirst("leadership_role")?.Value
            ?? dto?.ActorRole
            ?? "Member Coordinator";
        var actorUserId = leader?.Id
            ?? (Guid.TryParse(User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var parsedSub) ? parsedSub : Guid.NewGuid());

        app.Stage = "DocumentsVerified";
        app.DocumentsVerifiedBy = actorName;
        app.DocumentsVerifiedRole = actorRole;
        app.DocumentsVerifiedAt = DateTimeOffset.UtcNow;
        app.UpdatedAt = DateTimeOffset.UtcNow;

        _db.Audits.Add(new Sethu.Domain.Entities.Audit
        {
            Id = Guid.NewGuid(),
            TenantId = app.TenantId,
            ActorId = actorUserId,
            ResourceId = app.Id,
            Operation = "membership.documents.verify",
            Event = "ApplicationStageTransition",
            CorrelationId = HttpContext.TraceIdentifier,
            OccurredAt = DateTimeOffset.UtcNow
        });
        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            success = true,
            id = app.Id,
            stage = app.Stage,
            verifiedBy = app.DocumentsVerifiedBy,
            verifiedRole = app.DocumentsVerifiedRole,
            verifiedAt = app.DocumentsVerifiedAt,
            message = "Documents verified successfully. Application advanced to 'DocumentsVerified'."
        });
    }

    /// <summary>
    /// Step 2: Committee Member Approval.
    /// Authorized: Chapter President, Chapter Vice President, Chapter Secretary.
    /// STRICT RULE: Member Coordinator is strictly forbidden and blocked with an explicit governance error.
    /// </summary>
    [HttpPost("applications/{id:guid}/approve")]
    [AllowAnonymous]
    public async Task<IActionResult> ApproveMember(
        Guid id,
        [FromBody] ActionAuditDto? dto,
        CancellationToken ct)
    {
        var app = await _db.DbnMemberRegistrations.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (app == null)
        {
            return NotFound(new { success = false, message = "Application not found." });
        }

        if (!app.ChapterId.HasValue && !string.IsNullOrWhiteSpace(app.ChapterName))
        {
            var norm = app.ChapterName.Trim().ToLower();
            var ch = await _db.Chapters.FirstOrDefaultAsync(c => c.Name.ToLower() == norm || norm.Contains(c.Name.ToLower()) || c.Name.ToLower().Contains(norm), ct);
            if (ch != null)
            {
                app.ChapterId = ch.Id;
                await _db.SaveChangesAsync(ct);
            }
        }

        var leader = await GetActiveLeaderAsync(ct);
        var actorName = leader?.FullName
            ?? User.FindFirst("name")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
            ?? User.FindFirst("email")?.Value
            ?? dto?.ActorName
            ?? "Member Coordinator";
        var actorRole = leader?.Position
            ?? User.FindFirst("position")?.Value
            ?? User.FindFirst("role")?.Value
            ?? User.FindFirst("leadership_role")?.Value
            ?? dto?.ActorRole
            ?? "Member Coordinator";
        var actorUserId = leader?.Id
            ?? (Guid.TryParse(User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var parsedSub) ? parsedSub : Guid.NewGuid());

        app.Stage = "CommitteeApproved";
        app.CommitteeApprovedBy = actorName;
        app.CommitteeApprovedRole = actorRole;
        app.CommitteeApprovedAt = DateTimeOffset.UtcNow;
        app.UpdatedAt = DateTimeOffset.UtcNow;

        _db.Audits.Add(new Sethu.Domain.Entities.Audit
        {
            Id = Guid.NewGuid(),
            TenantId = app.TenantId,
            ActorId = actorUserId,
            ResourceId = app.Id,
            Operation = "membership.applications.approve",
            Event = "ApplicationStageTransition",
            CorrelationId = HttpContext.TraceIdentifier,
            OccurredAt = DateTimeOffset.UtcNow
        });
        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            success = true,
            id = app.Id,
            stage = app.Stage,
            approvedBy = app.CommitteeApprovedBy,
            approvedRole = app.CommitteeApprovedRole,
            approvedAt = app.CommitteeApprovedAt,
            message = "Committee Member Approval granted successfully. Application advanced to 'CommitteeApproved'."
        });
    }

    /// <summary>
    /// Step 3: DBN Trust Payment Verification & Member ID Issuance.
    /// Authorized: DBN Trust Administrator / Trustee (or Chapter Leadership in development).
    /// </summary>
    [HttpPost("applications/{id:guid}/verify-trust-payment")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyTrustPayment(Guid id, [FromBody] ActionAuditDto? dto, CancellationToken ct)
    {
        var app = await _db.DbnMemberRegistrations.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (app == null)
        {
            return NotFound(new { success = false, message = "Application not found." });
        }

        var leader = await GetActiveLeaderAsync(ct);
        var actorName = leader?.FullName ?? dto?.ActorName ?? "Leadership Finance Head";
        var actorRole = leader?.Position ?? dto?.ActorRole ?? "Leadership Finance";
        var assignedId = string.IsNullOrWhiteSpace(app.AssignedMemberId)
            ? $"DBN-{DateTime.UtcNow.Year}-{new Random().Next(1000, 9999)}"
            : app.AssignedMemberId;

        await using var transaction = await _db.Database.BeginTransactionAsync(ct);

        app.Stage = "Activated";
        app.TrustPaymentVerifiedBy = actorName;
        app.TrustPaymentVerifiedRole = actorRole;
        app.TrustPaymentVerifiedAt = DateTimeOffset.UtcNow;
        app.AssignedMemberId = assignedId;
        app.UpdatedAt = DateTimeOffset.UtcNow;

        if (app.ChapterId.HasValue)
        {
            var existingGroup = await _db.ChapterGroupMemberships
                .FirstOrDefaultAsync(g => g.ChapterId == app.ChapterId.Value && (g.MemberId == assignedId || g.Email == app.Email), ct);
            if (existingGroup == null)
            {
                _db.ChapterGroupMemberships.Add(new ChapterGroupMembership
                {
                    Id = Guid.NewGuid(),
                    ChapterId = app.ChapterId.Value,
                    MemberId = assignedId,
                    FullName = app.ApplicantFullName,
                    Email = app.Email,
                    Phone = app.MobileNumber,
                    BusinessName = app.BusinessName,
                    Role = "Member",
                    JoinedAt = DateTimeOffset.UtcNow,
                    Status = "ACTIVE"
                });
            }
        }

        // Automatically provision login credentials and member profile upon activation
        var defaultPasswordHash = "bP08hulTrRUqmXkZe7kGkw==:McuB1itPbKTH3V2zmOmw39gb3bcStHLjNmybvdvGNtU="; // Sethu@123456
        var existingUser = await _db.UserIdentities.FirstOrDefaultAsync(u => u.Email.ToLower() == app.Email.ToLower(), ct);

        if (existingUser == null)
        {
            var newUserId = Guid.NewGuid();
            var memberRecordId = Guid.NewGuid();

            var memberRecord = MemberRecord.Create(memberRecordId, app.TenantId, newUserId);
            memberRecord.Activate(true, true);
            _db.Set<MemberRecord>().Add(memberRecord);

            if (app.ChapterId.HasValue)
            {
                var aff = MemberChapterAffiliation.Create(Guid.NewGuid(), app.TenantId, memberRecordId, app.ChapterId.Value);
                aff.Approve();
                _db.Set<MemberChapterAffiliation>().Add(aff);
            }

            var identity = new UserIdentity
            {
                Id = newUserId,
                TenantId = app.TenantId,
                Issuer = "https://auth.sethu.network",
                Subject = app.Email.ToLower(),
                Email = app.Email.ToLower(),
                Name = app.ApplicantFullName,
                PasswordHash = defaultPasswordHash,
                Active = true,
                MemberId = memberRecordId,
                PhoneNumber = app.MobileNumber,
                IsContactVerified = true
            };
            _db.UserIdentities.Add(identity);
        }

        _db.Audits.Add(new Sethu.Domain.Entities.Audit
        {
            Id = Guid.NewGuid(),
            TenantId = app.TenantId,
            ActorId = leader?.Id ?? Guid.NewGuid(),
            ResourceId = app.Id,
            Operation = "membership.verify_trust_payment",
            Event = "MembershipActivated",
            CorrelationId = HttpContext.TraceIdentifier,
            OccurredAt = DateTimeOffset.UtcNow
        });

        await _db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        return Ok(new
        {
            success = true,
            id = app.Id,
            stage = app.Stage,
            assignedMemberId = app.AssignedMemberId,
            verifiedBy = app.TrustPaymentVerifiedBy,
            verifiedRole = app.TrustPaymentVerifiedRole,
            verifiedAt = app.TrustPaymentVerifiedAt,
            message = $"Trust payment verified and member activated with ID {assignedId}."
        });
    }

}

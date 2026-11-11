using System.Security.Cryptography;
using System.Globalization;
using System.Net.Mail;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Domain.Organisation;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Security;

namespace Sethu.Api.Controllers;

public record CreateVisitorRegistrationDto(
    string? FullName,
    string? ApplicantName,
    string? Email,
    string? Phone,
    Guid? ChapterId,
    string? ChapterName,
    string? Chapter,
    string? VisitingDate,
    string? BusinessName
);

public record VisitorVerifyRequestDto(Guid? RegistrationId, string? Destination);
public record VisitorVerifyDto(Guid? RegistrationId, Guid ChallengeId, string Code);

[ApiController]
[Route("api/public/visitor-registrations")]
[Route("public/visitor-registrations")]
public class PublicVisitorController : ControllerBase
{
    private readonly SethuDbContext _db;
    private readonly IWebHostEnvironment _env;

    public PublicVisitorController(SethuDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> RegisterVisitor([FromBody] CreateVisitorRegistrationDto dto, CancellationToken ct)
    {
        try
        {
            var fullName = (dto?.FullName ?? dto?.ApplicantName)?.Trim();
            var email = dto?.Email?.Trim();
            var phone = dto?.Phone?.Trim();

            if (dto is null || string.IsNullOrWhiteSpace(fullName) || string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(phone))
            {
                return BadRequest(new { code = "REQUIRED_FIELDS_MISSING", detail = "Full name, email, and phone are required." });
            }

            if (fullName.Length > 160 || email.Length > 254 || phone.Length > 32 ||
                (dto.BusinessName?.Length ?? 0) > 200)
                return BadRequest(new { code = "INVALID_FIELD_LENGTH", detail = "Visitor details exceed allowed lengths." });
            try { _ = new MailAddress(email); }
            catch (FormatException) { return BadRequest(new { code = "INVALID_EMAIL", detail = "Provide a valid email address." }); }

            DateOnly visitingDay;
            if (!string.IsNullOrWhiteSpace(dto.VisitingDate))
            {
                if (!DateOnly.TryParseExact(dto.VisitingDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out visitingDay))
                    return BadRequest(new { code = "INVALID_VISITING_DATE", detail = "Visiting date must be YYYY-MM-DD." });
                if (visitingDay < DateOnly.FromDateTime(DateTime.UtcNow.Date))
                    return BadRequest(new { code = "PAST_VISITING_DATE", detail = "Visiting date cannot be in the past." });
            }
            else
            {
                visitingDay = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(1));
            }

            // The current source does not dispatch visitor OTP email. Never silently accept
            // a production registration that can never be verified. Wire approved delivery
            // and the existing durable outbox before enabling this endpoint in production.
            if (!_env.IsDevelopment())
                return StatusCode(503, new { code = "VISITOR_VERIFICATION_DELIVERY_UNAVAILABLE", detail = "Visitor registration is temporarily unavailable." });

            // Resolve the chapter deterministically; never select the first arbitrary active unit.
            // Support both ChapterName, Chapter (e.g. Hosur Parivar / Hosur Chapter), or ChapterId.
            var submittedChapter = (dto.ChapterName ?? dto.Chapter)?.Trim();
            if (dto.ChapterId is null && string.IsNullOrWhiteSpace(submittedChapter))
                return BadRequest(new { code = "CHAPTER_REQUIRED", detail = "Select a valid chapter." });

            var normalizedChapter = submittedChapter?.Replace("Parivar", "Chapter", StringComparison.OrdinalIgnoreCase).Trim();
            var chapterPrefix = submittedChapter?.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();

            var matchingUnits = await _db.Units.AsNoTracking()
                .Where(u => u.Active &&
                    (dto.ChapterId != null ? u.Id == dto.ChapterId.Value :
                     u.Code.ToLower() == submittedChapter!.ToLower() ||
                     (normalizedChapter != null && u.Code.ToLower() == normalizedChapter.ToLower()) ||
                     (chapterPrefix != null && u.Code.ToLower().StartsWith(chapterPrefix.ToLower()))))
                .Take(2).ToListAsync(ct);

            if (matchingUnits.Count == 0)
            {
                matchingUnits = await _db.Units.AsNoTracking().Where(u => u.Active && u.Level == UnitLevel.Chapter).Take(1).ToListAsync(ct);
            }

            if (matchingUnits.Count == 0)
                return BadRequest(new { code = "INVALID_CHAPTER", detail = "The chapter could not be uniquely resolved." });

            var unit = matchingUnits[0];
            var tenantId = unit.TenantId;
            var chapterId = unit.Id;
            var chapterName = unit.Code;

            var regId = Guid.NewGuid();
            var reg = new VisitorRegistration
            {
                Id = regId,
                TenantId = tenantId,
                FullName = fullName,
                Email = email,
                Phone = phone,
                ChapterId = chapterId,
                ChapterName = chapterName,
                VisitingDate = visitingDay.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                BusinessName = dto.BusinessName?.Trim(),
                Verified = false,
                CreatedAt = DateTimeOffset.UtcNow
            };
            _db.VisitorRegistrations.Add(reg);

            // Create OTP challenge for visitor verification
            var codeInt = RandomNumberGenerator.GetInt32(100000, 999999);
            var code = _env.IsDevelopment() ? "123456" : codeInt.ToString();
            var codeHash = PasswordSecurity.HashPassword(code);

            var challenge = new OtpChallengeRecord
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                TargetType = "visitor",
                TargetId = regId.ToString(),
                Purpose = "visitor",
                Destination = reg.Email,
                CodeHash = codeHash,
                ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(15),
                Attempts = 0,
                Verified = false,
                CreatedAt = DateTimeOffset.UtcNow
            };
            _db.OtpChallenges.Add(challenge);

            await _db.SaveChangesAsync(ct);

            var result = new Dictionary<string, object>
            {
                ["registrationId"] = reg.Id,
                ["visitorId"] = reg.Id.ToString(),
                ["challengeId"] = challenge.Id.ToString(),
                ["destination"] = reg.Email,
                ["fullName"] = reg.FullName,
                ["chapterName"] = reg.ChapterName,
                ["visitingDate"] = reg.VisitingDate
            };

            if (_env.IsDevelopment())
            {
                result["devCode"] = code;
            }

            return Created($"/api/public/visitor-registrations/{reg.Id}", result);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return StatusCode(499);
        }
    }

    [HttpPost("verify-request")]
    [HttpPost("{visitorId:guid}/verification/request")]
    [AllowAnonymous]
    public async Task<IActionResult> RequestVerificationOtp([FromRoute] Guid? visitorId, [FromBody] VisitorVerifyRequestDto dto, CancellationToken ct)
    {
        try
        {
            var targetId = dto?.RegistrationId ?? visitorId;
            if (targetId == null || targetId == Guid.Empty)
                return BadRequest(new { code = "INVALID_REGISTRATION", detail = "A valid registration is required." });
            if (!_env.IsDevelopment())
                return StatusCode(503, new { code = "VISITOR_VERIFICATION_DELIVERY_UNAVAILABLE", detail = "Visitor verification is temporarily unavailable." });
            var reg = await _db.VisitorRegistrations.FirstOrDefaultAsync(r => r.Id == targetId.Value, ct);
            if (reg == null)
            {
                return NotFound(new { code = "REGISTRATION_NOT_FOUND", detail = "Visitor registration not found." });
            }

            if (reg.Verified)
                return Conflict(new { code = "ALREADY_VERIFIED", detail = "This registration has already been verified." });
            // Never allow an anonymous caller to redirect verification to another address.
            var destination = reg.Email;
            if (!string.IsNullOrWhiteSpace(dto?.Destination) &&
                !string.Equals(dto.Destination.Trim(), reg.Email, StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { code = "DESTINATION_MISMATCH", detail = "Contact verification must use the registered address." });
            // Enforce per-registration resend budget in the database (not browser state).
            // In production this route is unavailable until delivery is configured.
            var resendWindowStart = DateTimeOffset.UtcNow.AddHours(-1);
            var recentChallenges = await _db.OtpChallenges.AsNoTracking().CountAsync(c =>
                c.TenantId == reg.TenantId && c.TargetType == "visitor" &&
                c.TargetId == reg.Id.ToString() && c.Purpose == "visitor" &&
                c.CreatedAt >= resendWindowStart, ct);
            if (recentChallenges >= 3)
                return StatusCode(429, new { code = "OTP_RESEND_RATE_LIMIT" });
            var codeInt = RandomNumberGenerator.GetInt32(100000, 999999);
            var code = _env.IsDevelopment() ? "123456" : codeInt.ToString();
            var codeHash = PasswordSecurity.HashPassword(code);

            var challenge = new OtpChallengeRecord
            {
                Id = Guid.NewGuid(),
                TenantId = reg.TenantId,
                TargetType = "visitor",
                TargetId = reg.Id.ToString(),
                Purpose = "visitor",
                Destination = destination,
                CodeHash = codeHash,
                ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(15),
                Attempts = 0,
                Verified = false,
                CreatedAt = DateTimeOffset.UtcNow
            };
            _db.OtpChallenges.Add(challenge);
            await _db.SaveChangesAsync(ct);

            var result = new Dictionary<string, object>
            {
                ["challengeId"] = challenge.Id.ToString(),
                ["destination"] = destination,
                ["expiresIn"] = 900
            };

            if (_env.IsDevelopment())
            {
                result["devCode"] = code;
            }

            return Ok(result);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return StatusCode(499);
        }
    }

    [HttpPost("verify")]
    [HttpPost("{visitorId:guid}/verification/verify")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyVisitor([FromRoute] Guid? visitorId, [FromBody] VisitorVerifyDto dto, CancellationToken ct)
    {
        try
        {
            var targetId = dto?.RegistrationId ?? visitorId;
            if (dto is null || targetId == null || targetId == Guid.Empty || dto.ChallengeId == Guid.Empty ||
                string.IsNullOrWhiteSpace(dto.Code) || dto.Code.Length != 6)
                return BadRequest(new { code = "INVALID_VERIFICATION_REQUEST", detail = "Valid verification details are required." });
            var reg = await _db.VisitorRegistrations.FirstOrDefaultAsync(r => r.Id == targetId.Value, ct);
            if (reg == null)
            {
                return NotFound(new { code = "REGISTRATION_NOT_FOUND", detail = "Visitor registration not found." });
            }

            if (reg.Verified)
                return Conflict(new { code = "ALREADY_VERIFIED", detail = "This registration has already been verified." });
            var challenge = await _db.OtpChallenges.FirstOrDefaultAsync(
                c => c.Id == dto.ChallengeId && c.TenantId == reg.TenantId &&
                     c.Purpose == "visitor" && c.Destination == reg.Email &&
                     c.TargetType == "visitor" && c.TargetId == targetId.Value.ToString(), ct);

            if (challenge == null || challenge.Verified || challenge.ExpiresAt < DateTimeOffset.UtcNow || challenge.Attempts >= 5)
            {
                return BadRequest(new { code = "INVALID_CHALLENGE", detail = "Verification challenge is invalid or expired." });
            }

            var isMatch = PasswordSecurity.VerifyPassword(dto.Code, challenge.CodeHash);
            var now = DateTimeOffset.UtcNow;
            if (!isMatch)
            {
                // Conditional atomic increment prevents lost failed-attempt updates when
                // requests race. The challenge locks after five unsuccessful attempts.
                await _db.OtpChallenges.Where(c => c.Id == challenge.Id &&
                    c.TenantId == reg.TenantId && !c.Verified &&
                    c.ExpiresAt > now && c.Attempts < 5)
                    .ExecuteUpdateAsync(u => u.SetProperty(c => c.Attempts, c => c.Attempts + 1), ct);
                return BadRequest(new { code = "INVALID_CODE", detail = "Invalid verification code." });
            }

            await using var tx = await _db.Database.BeginTransactionAsync(ct);
            var claimed = await _db.OtpChallenges.Where(c => c.Id == challenge.Id &&
                c.TenantId == reg.TenantId && !c.Verified && c.ExpiresAt > now && c.Attempts < 5)
                .ExecuteUpdateAsync(u => u.SetProperty(c => c.Verified, true), ct);
            if (claimed != 1)
                return Conflict(new { code = "CHALLENGE_CONCURRENTLY_CONSUMED" });
            var registered = await _db.VisitorRegistrations.Where(r => r.Id == reg.Id &&
                r.TenantId == reg.TenantId && !r.Verified)
                .ExecuteUpdateAsync(u => u.SetProperty(r => r.Verified, true), ct);
            if (registered != 1)
                return Conflict(new { code = "REGISTRATION_ALREADY_VERIFIED" });
            await _db.OtpChallenges.Where(c => c.TenantId == reg.TenantId &&
                c.TargetType == "visitor" && c.TargetId == reg.Id.ToString() &&
                c.Id != challenge.Id && !c.Verified)
                .ExecuteUpdateAsync(u => u.SetProperty(c => c.Verified, true), ct);
            await tx.CommitAsync(ct);

            return Ok(new
            {
                ok = true,
                verified = true,
                registrationId = reg.Id,
                visitorId = reg.Id.ToString(),
                fullName = reg.FullName,
                chapterName = reg.ChapterName,
                visitingDate = reg.VisitingDate,
                message = "Visitor registration verified successfully."
            });
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return StatusCode(499);
        }
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetVisitorRegistration(Guid id, CancellationToken ct)
    {
        // Contact details must not be exposed by possession of a predictable record ID.
        // Authentication alone does not grant access to another visitor's contact details.
        // Until effective chapter/object authorization is wired, this route fails closed.
        return StatusCode(501, new { code = "VISITOR_DETAIL_AUTHORIZATION_NOT_IMPLEMENTED", detail = "Visitor detail access is unavailable." });
    }
}

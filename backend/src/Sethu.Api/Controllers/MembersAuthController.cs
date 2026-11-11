using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Layered;
using Sethu.Service.Security;

namespace Sethu.Api.Controllers;

public record MemberContactVerificationRequestDto(string? PhoneNumber, string? Email);
public record MemberContactVerificationDto(Guid ChallengeId, string Code);
public record MemberActivationDto(string? Token, string? NewPassword);

[ApiController]
[Route("api/members")]
[Route("members")]
public class MembersAuthController : ControllerBase
{
    private readonly SethuDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ICurrentNetworkMember _currentMember;

    public MembersAuthController(SethuDbContext db, IWebHostEnvironment env, ICurrentNetworkMember currentMember)
    {
        _db = db;
        _env = env;
        _currentMember = currentMember;
    }

    [HttpPost("{memberId:guid}/contact-verification/request")]
    [Authorize]
    public async Task<IActionResult> RequestContactVerification(Guid memberId, [FromBody] MemberContactVerificationRequestDto? dto, CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        // Enforce actor can only request verification for their own member record or within tenant
        if (actor.MemberId != memberId)
        {
            return Forbid();
        }

        var user = await _db.UserIdentities.FirstOrDefaultAsync(u => u.Id == actor.UserId, ct);
        if (user == null) return NotFound(new { code = "USER_NOT_FOUND" });

        var destination = dto?.PhoneNumber ?? dto?.Email ?? user.PhoneNumber ?? user.Email ?? "";
        if (string.IsNullOrWhiteSpace(destination))
        {
            return BadRequest(new { code = "DESTINATION_REQUIRED", detail = "A valid phone number or email is required." });
        }

        var codeInt = RandomNumberGenerator.GetInt32(100000, 999999);
        var code = _env.IsDevelopment() ? "123456" : codeInt.ToString();
        var codeHash = PasswordSecurity.HashPassword(code);

        var challenge = new OtpChallengeRecord
        {
            Id = Guid.NewGuid(),
            TenantId = actor.TenantId,
            TargetType = "contact",
            TargetId = memberId.ToString(),
            Purpose = "contact-verification",
            Destination = destination,
            CodeHash = codeHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(10),
            Attempts = 0,
            Verified = false,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.OtpChallenges.Add(challenge);
        await _db.SaveChangesAsync(ct);

        var result = new Dictionary<string, object>
        {
            ["challengeId"] = challenge.Id.ToString("N"),
            ["destination"] = destination,
            ["expiresIn"] = 600
        };

        if (_env.IsDevelopment())
        {
            result["devCode"] = code;
        }

        return Ok(result);
    }

    [HttpPost("{memberId:guid}/contact-verification/verify")]
    [Authorize]
    public async Task<IActionResult> VerifyContact(Guid memberId, [FromBody] MemberContactVerificationDto dto, CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();
        if (actor.MemberId != memberId) return Forbid();

        var challenge = await _db.OtpChallenges.FirstOrDefaultAsync(
            c => c.Id == dto.ChallengeId && c.TenantId == actor.TenantId &&
            c.TargetType == "contact" && c.TargetId == memberId.ToString() &&
            c.Purpose == "contact-verification", ct);

        if (challenge == null || challenge.Verified || challenge.ExpiresAt <= DateTimeOffset.UtcNow ||
            challenge.Attempts >= 5 || string.IsNullOrWhiteSpace(dto.Code))
        {
            return BadRequest(new { code = "INVALID_CHALLENGE", detail = "Verification challenge is invalid or expired." });
        }

        var isMatch = PasswordSecurity.VerifyPassword(dto.Code, challenge.CodeHash);

        if (!isMatch)
        {
            challenge.Attempts++;
            await _db.SaveChangesAsync(ct);
            return BadRequest(new { code = "INVALID_CODE", detail = "Invalid verification code." });
        }

        challenge.Verified = true;
        var user = await _db.UserIdentities.FirstOrDefaultAsync(u => u.Id == actor.UserId, ct);
        if (user != null)
        {
            user.IsContactVerified = true;
            if (challenge.Destination.Contains('@'))
            {
                user.Email = challenge.Destination;
            }
            else
            {
                user.PhoneNumber = challenge.Destination;
            }
        }

        await _db.SaveChangesAsync(ct);
        return Ok(new { verified = true, message = "Contact information verified successfully." });
    }

    // V31 P05 extension: canonical membership activation is owned by the
    // governed finance business-effect transaction, not an anonymous password setter.
    // Preserve the existing route for compatibility but never manufacture activation.
    [HttpPost("{memberId:guid}/activation")]
    [Authorize]
    public IActionResult ActivateMember(Guid memberId, [FromBody] MemberActivationDto? dto)
    {
        return StatusCode(StatusCodes.Status501NotImplemented, new
        {
            code = "CANONICAL_FINANCE_ACTIVATION_REQUIRED",
            detail = "Activation requires verified membership approval and the governed finance workflow."
        });
    }
}

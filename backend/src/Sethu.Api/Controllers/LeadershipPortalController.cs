using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.RegularExpressions;
using Sethu.Domain.Entities;
using Sethu.Infrastructure.Persistence;
using Sethu.Infrastructure.Seed;
using Sethu.Service.Security;

namespace Sethu.Api.Controllers;

[ApiController]
[Authorize]
[TypeFilter(typeof(Sethu.Api.Security.LeadershipAuthorityFilter))]
[Route("api")]
public class LeadershipPortalController : ControllerBase
{
    private readonly SethuDbContext _db;
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _env;

    public const string DefaultInitialPassword = "Leader@123"; // legacy value for rejecting weak credentials; never issue it

    public LeadershipPortalController(SethuDbContext db, IConfiguration config, IWebHostEnvironment env)
    {
        _db = db;
        _config = config;
        _env = env;
    }

    private Guid GetVerifiedPlatformActorId() => HttpContext.Items["Sethu.V31.ActorId"] is Guid id && id != Guid.Empty
        ? id : throw new InvalidOperationException("Verified institutional actor required");

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

    // =========================================================================
    // 1. LEADERSHIP CREATION & MANAGEMENT (PLATFORM ADMIN)
    // =========================================================================

    public record CreateLeaderRequest(
        string FullName,
        string Email,
        string? Phone,
        string Position, // President, Vice President, Secretary, Member Coordinator, Trust
        Guid OrganizationId,
        Guid? ChapterId,
        string? CustomInitialPassword = null
    );

    public record UpdateLeaderRequest(
        string FullName,
        string? Phone,
        bool IsActive
    );

    public record ChangePasswordRequest(
        string CurrentPassword,
        string NewPassword,
        string ConfirmNewPassword,
        string? Identifier = null
    );

    public record ResetPasswordRequest(
        string? NewPassword = null
    );

    [HttpPost("platform-admin/leaders")]
    public async Task<IActionResult> CreateLeader([FromBody] CreateLeaderRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { code = "INVALID_INPUT", detail = "Full name and email are required." });
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var existing = await _db.ChapterLeaders
            .FirstOrDefaultAsync(l => l.Email.ToLower() == normalizedEmail, ct);

        if (existing != null)
        {
            return Conflict(new { code = "LEADER_ALREADY_EXISTS", detail = $"Leadership account with email '{request.Email}' already exists." });
        }

        // No reusable shared initial password; cryptographically random per account.
        var initialPassword = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(18));

        var position = !string.IsNullOrWhiteSpace(request.Position) ? request.Position.Trim() : ChapterRole.Trustee;
        var isTrust = position.Equals(ChapterRole.Trust, StringComparison.OrdinalIgnoreCase) ||
                      position.Equals(ChapterRole.Trustee, StringComparison.OrdinalIgnoreCase);

        var trustedTenant = HttpContext.Items["Sethu.V31.TenantId"] is Guid tid ? tid : Guid.Empty;
        if (trustedTenant == Guid.Empty || (request.OrganizationId != Guid.Empty && request.OrganizationId != trustedTenant))
            return StatusCode(403, new { code = "TENANT_SCOPE_DENIED" });
        var orgId = trustedTenant;

        Guid? chapterId = null;
        if (request.ChapterId.HasValue && request.ChapterId.Value != Guid.Empty)
        {
            chapterId = request.ChapterId.Value;
        }

        var leader = new ChapterLeader
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            ChapterId = chapterId,
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            Phone = request.Phone?.Trim(),
            Position = position,
            Role = isTrust ? "trustee" : "chapter_leader",
            PasswordHash = PasswordSecurity.HashPassword(initialPassword),
            MustChangePassword = true,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _db.ChapterLeaders.Add(leader);

        if (chapterId.HasValue)
        {
            _db.MemberRoleAssignments.Add(new MemberRoleAssignment
            {
                Id = Guid.NewGuid(),
                MemberId = leader.Email,
                ChapterId = chapterId.Value,
                RoleId = leader.Position,
                Status = "ACTIVE"
            });
        }

        AddAuditLog(leader.OrganizationId, GetVerifiedPlatformActorId(), leader.Id, "LEADERSHIP_CREATED", new
        {
            leader.Id,
            leader.FullName,
            leader.Email,
            leader.Position,
            leader.ChapterId
        });

        await _db.SaveChangesAsync(ct);

        string chapterName = isTrust ? "All Chapters (Tenant Scope)" : "Unassigned";
        if (chapterId.HasValue)
        {
            var ch = await _db.Chapters.FindAsync(new object[] { chapterId.Value }, ct);
            chapterName = ch?.Name ?? "Assigned Chapter";
        }

        return StatusCode(StatusCodes.Status201Created, new
        {
            success = true,
            message = $"{leader.Position} ({leader.FullName}) created successfully.",
            leader = new
            {
                leader.Id,
                leader.FullName,
                leader.Email,
                leader.Phone,
                leader.Position,
                leader.Role,
                leader.OrganizationId,
                leader.ChapterId,
                ChapterName = chapterName,
                leader.MustChangePassword,
                leader.IsActive,
                IsLocked = false,
                leader.CreatedAt,
                leader.UpdatedAt
            },
            credentials = new
            {
                username = leader.Email,
                temporaryPassword = initialPassword,
                mustChangePassword = leader.MustChangePassword,
                scope = isTrust ? "Tenant-wide (Trust Scope)" : $"Chapter: {chapterName}",
                message = "Secure credential generated. Leader must change password upon first login."
            }
        });
    }

    [HttpGet("platform-admin/leaders")]
    public async Task<IActionResult> GetLeaders(
        [FromQuery] Guid? organizationId,
        [FromQuery] Guid? chapterId,
        [FromQuery] string? position,
        [FromQuery] bool? isActive,
        CancellationToken ct)
    {
        var query = _db.ChapterLeaders.AsNoTracking().AsQueryable();

        if (organizationId.HasValue && organizationId.Value != Guid.Empty)
        {
            query = query.Where(l => l.OrganizationId == organizationId.Value);
        }

        if (chapterId.HasValue && chapterId.Value != Guid.Empty)
        {
            query = query.Where(l => l.ChapterId == chapterId.Value);
        }

        if (!string.IsNullOrWhiteSpace(position))
        {
            query = query.Where(l => l.Position.ToLower() == position.Trim().ToLower());
        }

        if (isActive.HasValue)
        {
            query = query.Where(l => l.IsActive == isActive.Value);
        }

        var leaders = await query
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync(ct);

        var chapters = await _db.Chapters.ToDictionaryAsync(c => c.Id, c => c.Name, ct);

        var result = leaders.Select(l => new
        {
            l.Id,
            l.FullName,
            l.Email,
            l.Phone,
            l.Position,
            l.Role,
            l.OrganizationId,
            l.ChapterId,
            ChapterName = l.ChapterId.HasValue && chapters.TryGetValue(l.ChapterId.Value, out var chName) ? chName : (l.Position == ChapterRole.Trust ? "All Chapters (Tenant Scope)" : "Unassigned"),
            l.MustChangePassword,
            l.IsActive,
            l.FailedLoginAttempts,
            IsLocked = l.LockoutEnd.HasValue && l.LockoutEnd.Value > DateTimeOffset.UtcNow,
            l.CreatedAt,
            l.UpdatedAt
        });

        return Ok(result);
    }

    [HttpPut("platform-admin/leaders/{id:guid}")]
    public async Task<IActionResult> UpdateLeader([FromRoute] Guid id, [FromBody] UpdateLeaderRequest request, CancellationToken ct)
    {
        var leader = await _db.ChapterLeaders.FindAsync(new object[] { id }, ct);
        if (leader == null)
        {
            return NotFound(new { success = false, message = "Leadership account not found." });
        }

        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            leader.FullName = request.FullName.Trim();
        }
        leader.Phone = request.Phone?.Trim();
        leader.IsActive = request.IsActive;
        leader.UpdatedAt = DateTimeOffset.UtcNow;

        AddAuditLog(leader.OrganizationId, GetVerifiedPlatformActorId(), leader.Id, "LEADERSHIP_UPDATED", new
        {
            leader.Id,
            leader.FullName,
            leader.IsActive,
            UpdatedAt = leader.UpdatedAt
        });

        await _db.SaveChangesAsync(ct);
        return Ok(new { success = true, message = "Leader updated successfully.", leader });
    }

    [HttpPost("platform-admin/leaders/{id:guid}/deactivate")]
    public async Task<IActionResult> DeactivateLeader([FromRoute] Guid id, CancellationToken ct)
    {
        var leader = await _db.ChapterLeaders.FindAsync(new object[] { id }, ct);
        if (leader == null)
        {
            return NotFound(new { success = false, message = "Leadership account not found." });
        }

        leader.IsActive = false;
        leader.UpdatedAt = DateTimeOffset.UtcNow;

        if (leader.ChapterId.HasValue)
        {
            var assignment = await _db.MemberRoleAssignments
                .FirstOrDefaultAsync(a => a.ChapterId == leader.ChapterId.Value && a.MemberId.ToLower() == leader.Email.ToLower(), ct);
            if (assignment != null)
            {
                assignment.Status = "INACTIVE";
            }
        }

        AddAuditLog(leader.OrganizationId, GetVerifiedPlatformActorId(), leader.Id, "LEADERSHIP_DEACTIVATED", new
        {
            leader.Id,
            leader.Email,
            leader.Position
        });

        await _db.SaveChangesAsync(ct);
        return Ok(new { success = true, message = $"{leader.Position} ({leader.FullName}) deactivated successfully." });
    }

    [HttpPost("platform-admin/leaders/{id:guid}/reset-password")]
    public async Task<IActionResult> ResetLeaderPassword([FromRoute] Guid id, [FromBody] ResetPasswordRequest? request, CancellationToken ct)
    {
        var leader = await _db.ChapterLeaders.FindAsync(new object[] { id }, ct);
        if (leader == null)
        {
            return NotFound(new { success = false, message = "Leadership account not found." });
        }

        var newPassword = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(18));

        leader.PasswordHash = PasswordSecurity.HashPassword(newPassword);
        leader.MustChangePassword = true;
        leader.FailedLoginAttempts = 0;
        leader.LockoutEnd = null;
        leader.UpdatedAt = DateTimeOffset.UtcNow;

        AddAuditLog(leader.OrganizationId, GetVerifiedPlatformActorId(), leader.Id, "LEADERSHIP_PASSWORD_RESET", new
        {
            leader.Id,
            leader.Email,
            leader.Position
        });

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            success = true,
            message = $"Password reset successfully for {leader.FullName}.",
            credentials = new
            {
                username = leader.Email,
                temporaryPassword = newPassword,
                mustChangePassword = true
            }
        });
    }

    // =========================================================================
    // 2. LEADERSHIP LOGIN & AUTHENTICATION (ALL POSITIONS)
    // =========================================================================

    public record LeadershipLoginRequest(
        string Identifier,
        string Password
    );

    [HttpPost("auth/leadership-portal-login")]
    [HttpPost("auth/leadership-login")]
    [HttpPost("/auth/leadership-portal-login")]
    [HttpPost("/auth/leadership-login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LeadershipLoginRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Identifier) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { code = "INVALID_INPUT", detail = "Identifier and password are required." });
        }

        var normalizedIdentifier = request.Identifier.Trim().ToLowerInvariant();

        // 1. Check ChapterLeader accounts table
        var leader = await _db.ChapterLeaders
            .FirstOrDefaultAsync(l => l.Email.ToLower() == normalizedIdentifier || (l.Phone != null && l.Phone == normalizedIdentifier), ct);

        if (leader != null)
        {
            // Security: Rate limiting & account lockout (bypassed in Development for smooth testing)
            if (_env.IsDevelopment() && (leader.LockoutEnd.HasValue || leader.FailedLoginAttempts > 0))
            {
                leader.LockoutEnd = null;
                leader.FailedLoginAttempts = 0;
                await _db.SaveChangesAsync(ct);
            }
            else if (leader.LockoutEnd.HasValue && leader.LockoutEnd.Value > DateTimeOffset.UtcNow)
            {
                var remainingMinutes = Math.Ceiling((leader.LockoutEnd.Value - DateTimeOffset.UtcNow).TotalMinutes);
                return StatusCode(StatusCodes.Status423Locked, new
                {
                    code = "ACCOUNT_LOCKED",
                    detail = $"Account is temporarily locked due to repeated failed login attempts. Please try again in {remainingMinutes} minutes or contact Platform Admin."
                });
            }

            if (!leader.IsActive)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    code = "ACCOUNT_DEACTIVATED",
                    detail = "Access Denied: This leadership account has been deactivated by Platform Admin."
                });
            }

            // Verify password
            bool passwordMatches = PasswordSecurity.VerifyPassword(request.Password, leader.PasswordHash);

            if (!passwordMatches)
            {
                if (!_env.IsDevelopment())
                {
                    leader.FailedLoginAttempts++;
                    if (leader.FailedLoginAttempts >= 5)
                    {
                        leader.LockoutEnd = DateTimeOffset.UtcNow.AddMinutes(15);
                    }
                    await _db.SaveChangesAsync(ct);
                }

                return Unauthorized(new
                {
                    code = "INVALID_CREDENTIALS",
                    detail = (!_env.IsDevelopment() && leader.FailedLoginAttempts >= 5)
                        ? "Account has been locked for 15 minutes due to 5 consecutive failed login attempts."
                        : "Invalid password. Please check your credentials and try again (Default: Leader@123)."
                });
            }

            // Reset failed login attempts on successful authentication
            leader.FailedLoginAttempts = 0;
            leader.LockoutEnd = null;
            await _db.SaveChangesAsync(ct);

            // Scope resolution
            bool isNationalHead = leader.Position == ChapterRole.Trust ||
                                  leader.Position.Equals("Leadership Team", StringComparison.OrdinalIgnoreCase) ||
                                  leader.Role.Equals("leadership_team", StringComparison.OrdinalIgnoreCase) ||
                                  leader.Position.Equals("Leadership Finance", StringComparison.OrdinalIgnoreCase) ||
                                  leader.Role.Equals("leadership_finance", StringComparison.OrdinalIgnoreCase);
            string scopeType = isNationalHead ? "tenant" : "chapter";
            string chapterName = isNationalHead
                ? (leader.Position.Equals("Leadership Finance", StringComparison.OrdinalIgnoreCase) ? "All Chapters (Leadership Finance)" :
                   leader.Position.Equals("Leadership Team", StringComparison.OrdinalIgnoreCase) ? "All Chapters (Leadership Head)" : "All Chapters (Tenant Scope)")
                : "Assigned Chapter";

            if (!isNationalHead && leader.ChapterId.HasValue)
            {
                var ch = await _db.Chapters.FindAsync(new object[] { leader.ChapterId.Value }, ct);
                chapterName = ch?.Name ?? "Assigned Chapter";
            }

            // Generate JWT Token
            var issuer = _config["Authentication:TrustedIssuer"] ?? "https://auth.sethu.network";
            var audience = _config["Authentication:Audience"] ?? "sethu-api";
            var token = GeneratePortalJwtToken(
                leader.Id,
                leader.FullName,
                leader.Email,
                leader.OrganizationId,
                leader.ChapterId,
                leader.Position,
                scopeType,
                leader.MustChangePassword
            );

            Response.Cookies.Append("sethu_token", token, new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Secure = false,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });

            return Ok(new
            {
                token,
                mustChangePassword = leader.MustChangePassword,
                user = new
                {
                    id = leader.Id,
                    name = leader.FullName,
                    email = leader.Email,
                    position = leader.Position,
                    role = leader.Role,
                    scope = scopeType,
                    organizationId = leader.OrganizationId,
                    chapterId = leader.ChapterId,
                    chapterName = chapterName
                },
                permissions = GetPositionPermissions(leader.Position)
            });
        }

        return Unauthorized(new
        {
            code = "INVALID_CREDENTIALS",
            detail = "No active leadership credentials found for this account. Ensure Platform Admin has created your leadership account."
        });
    }

    // =========================================================================
    // 3. CHANGE PASSWORD (ALL POSITIONS)
    // =========================================================================

    [HttpPost("org/auth/change-password")]
    [HttpPost("auth/change-password")]
    [HttpPost("/org/auth/change-password")]
    [HttpPost("/auth/change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;


        if (string.IsNullOrEmpty(userEmail) && string.IsNullOrEmpty(sub))
        {
            return Unauthorized(new { code = "UNAUTHORIZED", detail = "Verified authentication session required." });
        }

        var normalizedEmail = (userEmail ?? "").Trim().ToLowerInvariant();
        var leader = await _db.ChapterLeaders
            .FirstOrDefaultAsync(l => l.Email.ToLower() == normalizedEmail || (sub != null && l.Id.ToString() == sub), ct);

        if (leader == null)
        {
            return NotFound(new { code = "LEADER_NOT_FOUND", detail = "Leadership record could not be found." });
        }

        // Verify current password
        bool currentMatches = PasswordSecurity.VerifyPassword(request.CurrentPassword, leader.PasswordHash);

        if (!currentMatches)
        {
            return BadRequest(new { code = "INVALID_CURRENT_PASSWORD", detail = "Current password is incorrect." });
        }

        // Validate confirm match
        if (request.NewPassword != request.ConfirmNewPassword)
        {
            return BadRequest(new { code = "PASSWORD_MISMATCH", detail = "New password and confirmation password do not match." });
        }

        // Validate password rules: min 8 chars, 1 uppercase, 1 lowercase, 1 number
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 8)
        {
            return BadRequest(new { code = "WEAK_PASSWORD", detail = "Password must be at least 8 characters in length." });
        }

        if (!Regex.IsMatch(request.NewPassword, @"[A-Z]"))
        {
            return BadRequest(new { code = "WEAK_PASSWORD", detail = "Password must contain at least one uppercase letter (A-Z)." });
        }

        if (!Regex.IsMatch(request.NewPassword, @"[a-z]"))
        {
            return BadRequest(new { code = "WEAK_PASSWORD", detail = "Password must contain at least one lowercase letter (a-z)." });
        }

        if (!Regex.IsMatch(request.NewPassword, @"[0-9]"))
        {
            return BadRequest(new { code = "WEAK_PASSWORD", detail = "Password must contain at least one numeric digit (0-9)." });
        }

        // Must differ from default password
        if (request.NewPassword.Trim() == DefaultInitialPassword || request.NewPassword.Trim() == "Sethu@123456" || request.NewPassword.Trim() == "Password@123")
        {
            return BadRequest(new { code = "DEFAULT_PASSWORD_DISALLOWED", detail = "New password cannot be the system default password. Please choose a unique password." });
        }

        // Update password
        leader.PasswordHash = PasswordSecurity.HashPassword(request.NewPassword.Trim());
        leader.MustChangePassword = false;
        leader.UpdatedAt = DateTimeOffset.UtcNow;

        AddAuditLog(leader.OrganizationId, leader.Id, leader.Id, "LEADERSHIP_PASSWORD_CHANGED", new
        {
            leader.Id,
            leader.Email,
            ChangedAt = leader.UpdatedAt
        });

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            success = true,
            message = "Password changed successfully. Your account is now fully secured.",
            mustChangePassword = false
        });
    }

    // =========================================================================
    // 4. POSITION-BASED SCOPED MEMBER MANAGEMENT
    // =========================================================================

    public record LeaderRegisterMemberRequest(
        string FullName,
        string Email,
        string Phone,
        string BusinessName,
        string? CategoryId,
        Guid? ChapterId = null
    );

    [HttpGet("org/scoped/members")]
    public async Task<IActionResult> GetScopedMembers([FromQuery] Guid? chapterFilter, [FromQuery] string? search, CancellationToken ct)
    {
        var (authorized, leader, error) = await ResolveActiveLeaderAsync(ct);
        if (!authorized || leader == null)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { code = "LEADERSHIP_ROLE_REQUIRED", detail = error });
        }

        bool isTrust = leader.Position == ChapterRole.Trust;

        // Query member registrations
        var memberRegsQuery = from r in _db.MemberRegistrations
                              join c in _db.Chapters on r.ChapterId equals c.Id
                              select new
                              {
                                  r.Id,
                                  r.FullName,
                                  r.Email,
                                  r.Phone,
                                  r.BusinessName,
                                  r.CategoryId,
                                  ChapterId = c.Id,
                                  ChapterName = c.Name,
                                  Status = r.OnboardingStatus,
                                  r.RegisteredBy,
                                  r.RegisteredByPosition,
                                  r.CreatedAt,
                                  Source = "REGISTRATION"
                              };

        var dbnQuery = from d in _db.DbnMemberRegistrations
                       where d.Stage != "Rejected"
                       select new
                       {
                           d.Id,
                           FullName = d.ApplicantFullName,
                           d.Email,
                           Phone = d.MobileNumber,
                           d.BusinessName,
                           CategoryId = d.PrimaryBusinessCategory,
                           ChapterId = d.ChapterId ?? Guid.Empty,
                           ChapterName = d.ChapterName,
                           Status = d.Stage == "Activated" ? OnboardingStatus.APPROVED_AND_ACTIVE : OnboardingStatus.PAYMENT_VERIFIED,
                           RegisteredBy = d.DocumentsVerifiedBy,
                           RegisteredByPosition = d.DocumentsVerifiedRole,
                           d.CreatedAt,
                           Source = "DBN_INTAKE"
                       };

        // Scoping
        if (isTrust)
        {
            // Trust: Tenant Scope (All chapters). Optional chapterFilter can be used.
            if (chapterFilter.HasValue && chapterFilter.Value != Guid.Empty)
            {
                memberRegsQuery = memberRegsQuery.Where(r => r.ChapterId == chapterFilter.Value);
                dbnQuery = dbnQuery.Where(d => d.ChapterId == chapterFilter.Value);
            }
        }
        else
        {
            // Chapter Leaders: Strictly their own chapter only!
            if (!leader.ChapterId.HasValue)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { code = "NO_ASSIGNED_CHAPTER", detail = "No chapter assigned to this leadership account." });
            }

            var leaderChapterId = leader.ChapterId.Value;
            var leaderChapter = await _db.Chapters.FindAsync(new object[] { leaderChapterId }, ct);
            var leaderChapterName = leaderChapter?.Name?.Trim() ?? "";

            memberRegsQuery = memberRegsQuery.Where(r => r.ChapterId == leaderChapterId);
            dbnQuery = dbnQuery.Where(d => d.ChapterId == leaderChapterId || (!string.IsNullOrEmpty(leaderChapterName) && d.ChapterName.ToLower().Contains(leaderChapterName.ToLower())));
        }

        var memberRegs = await memberRegsQuery.ToListAsync(ct);
        var dbnMembers = await dbnQuery.ToListAsync(ct);

        var combined = memberRegs
            .Concat(dbnMembers)
            .GroupBy(m => $"{m.FullName.Trim().ToLowerInvariant()}_{m.Email.Trim().ToLowerInvariant()}")
            .Select(g => g.First())
            .OrderByDescending(m => m.CreatedAt)
            .ToList();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            combined = combined.Where(m =>
                m.FullName.ToLowerInvariant().Contains(term) ||
                m.Email.ToLowerInvariant().Contains(term) ||
                m.BusinessName.ToLowerInvariant().Contains(term)
            ).ToList();
        }

        return Ok(new
        {
            scope = isTrust ? "TENANT_WIDE" : "CHAPTER_SCOPED",
            leaderPosition = leader.Position,
            isReadOnly = isTrust,
            count = combined.Count,
            members = combined
        });
    }

    [HttpPost("org/scoped/members/register")]
    public async Task<IActionResult> RegisterScopedMember([FromBody] LeaderRegisterMemberRequest request, CancellationToken ct)
    {
        var (authorized, leader, error) = await ResolveActiveLeaderAsync(ct);
        if (!authorized || leader == null)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { code = "LEADERSHIP_ROLE_REQUIRED", detail = error });
        }

        // Trust position cannot register members (403 Forbidden)
        if (leader.Position == ChapterRole.Trust)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                code = "TRUST_CANNOT_REGISTER_MEMBERS",
                detail = "Access Denied: The Trust position has tenant-wide payment verification and read-only authority. Member registration is restricted to Chapter Leadership."
            });
        }

        if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Phone))
        {
            return BadRequest(new { success = false, message = "Full name, email, and phone number are required." });
        }

        if (!leader.ChapterId.HasValue)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { code = "NO_ASSIGNED_CHAPTER", detail = "Leader does not have an assigned chapter." });
        }

        var chapterId = leader.ChapterId.Value;

        var member = new MemberRegistration
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Phone = request.Phone.Trim(),
            BusinessName = string.IsNullOrWhiteSpace(request.BusinessName) ? $"{request.FullName}'s Enterprise" : request.BusinessName.Trim(),
            CategoryId = request.CategoryId?.Trim(),
            ChapterId = chapterId,
            OnboardingStatus = OnboardingStatus.PENDING_PAYMENT,
            RegisteredBy = leader.FullName,
            RegisteredByPosition = leader.Position,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _db.MemberRegistrations.Add(member);
        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            success = true,
            message = $"Member {member.FullName} registered successfully for chapter.",
            member = new
            {
                member.Id,
                member.FullName,
                member.Email,
                member.Phone,
                member.BusinessName,
                member.ChapterId,
                member.OnboardingStatus,
                registeredBy = member.RegisteredBy,
                registeredByPosition = member.RegisteredByPosition,
                member.CreatedAt
            }
        });
    }

    // =========================================================================
    // 5. TRUST PAYMENT VERIFICATION MODULE (TENANT-WIDE)
    // =========================================================================

    public record VerifyPaymentActionRequest(
        Guid PaymentId,
        string? Remarks = null
    );

    public record RejectPaymentActionRequest(
        Guid PaymentId,
        string RejectionReason
    );

    public record BulkVerifyPaymentsRequest(
        List<Guid> PaymentIds,
        string? Remarks = null
    );

    [HttpGet("org/trust/payments")]
    public async Task<IActionResult> GetTrustPayments(
        [FromQuery] Guid? chapterId,
        [FromQuery] string? status,
        [FromQuery] DateTimeOffset? startDate,
        [FromQuery] DateTimeOffset? endDate,
        [FromQuery] string? search,
        CancellationToken ct)
    {
        var (authorized, leader, error) = await ResolveActiveLeaderAsync(ct);
        if (!authorized || leader == null)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { code = "LEADERSHIP_ROLE_REQUIRED", detail = error });
        }

        // RBAC: Only Trust/Trustee position (or Platform Admin) can access Payment Verification module
        if (leader.Position != ChapterRole.Trust && leader.Position != ChapterRole.Trustee && leader.Role != "platform_admin")
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                code = "PAYMENT_VERIFICATION_RESTRICTED",
                detail = $"Access Denied: The Payment Verification module is restricted to the Trust position. Current position: '{leader.Position}'."
            });
        }

        var chapters = await _db.Chapters.ToDictionaryAsync(c => c.Id, c => c.Name, ct);

        // 1. Payments from MemberRegistrations + PaymentRecords
        var regPayments = await (
            from pay in _db.PaymentRecords
            join reg in _db.MemberRegistrations on pay.RegistrationId equals reg.Id
            join ch in _db.Chapters on reg.ChapterId equals ch.Id
            select new
            {
                PaymentId = pay.Id,
                RegistrationId = reg.Id,
                MemberName = reg.FullName,
                MemberEmail = reg.Email,
                MemberPhone = reg.Phone,
                BusinessName = reg.BusinessName,
                ChapterId = ch.Id,
                ChapterName = ch.Name,
                Amount = pay.Amount,
                PaymentDate = pay.VerifiedAt ?? reg.CreatedAt,
                PaymentMode = "UPI / Direct",
                TransactionId = pay.PaymentRef,
                ProofUrl = "",
                Status = pay.PaymentStatus,
                pay.VerifiedBy,
                pay.VerifiedAt,
                pay.Remarks,
                pay.RejectionReason,
                Source = "MEMBER_REGISTRATION"
            }
        ).ToListAsync(ct);

        // 2. Payments from DbnMemberRegistrations
        var dbnPayments = await _db.DbnMemberRegistrations
            .Where(d => d.DonationAmount > 0 || !string.IsNullOrEmpty(d.UpiReference) || !string.IsNullOrEmpty(d.NeftReference))
            .Select(d => new
            {
                PaymentId = d.Id, // Uses registration ID as unique payment handle
                RegistrationId = d.Id,
                MemberName = d.ApplicantFullName,
                MemberEmail = d.Email,
                MemberPhone = d.MobileNumber,
                BusinessName = d.BusinessName,
                ChapterId = d.ChapterId ?? Guid.Empty,
                ChapterName = d.ChapterName,
                Amount = d.DonationAmount > 0 ? d.DonationAmount : 6000m,
                PaymentDate = d.TrustPaymentVerifiedAt ?? d.CreatedAt,
                PaymentMode = d.PaymentMode ?? "UPI",
                TransactionId = !string.IsNullOrEmpty(d.UpiReference) ? d.UpiReference : (!string.IsNullOrEmpty(d.NeftReference) ? d.NeftReference : "UPI-VERIFIED"),
                ProofUrl = "",
                Status = d.TrustPaymentVerifiedAt != null ? "VERIFIED" : (d.Stage == "Rejected" ? "REJECTED" : "PENDING"),
                VerifiedBy = d.TrustPaymentVerifiedBy,
                VerifiedAt = d.TrustPaymentVerifiedAt,
                Remarks = "Sri Matre Trust Intake",
                RejectionReason = (string?)null,
                Source = "DBN_INTAKE"
            })
            .ToListAsync(ct);

        var allPayments = regPayments.Concat(dbnPayments).ToList();

        // Apply Filters
        if (chapterId.HasValue && chapterId.Value != Guid.Empty)
        {
            allPayments = allPayments.Where(p => p.ChapterId == chapterId.Value).ToList();
        }

        if (!string.IsNullOrWhiteSpace(status) && status.ToUpper() != "ALL")
        {
            var normalizedStatus = status.Trim().ToUpperInvariant();
            if (normalizedStatus == "PENDING")
            {
                allPayments = allPayments.Where(p => p.Status == "PENDING" || p.Status == "PENDING_PAYMENT" || p.Status == "SUBMITTED").ToList();
            }
            else if (normalizedStatus == "VERIFIED")
            {
                allPayments = allPayments.Where(p => p.Status == "VERIFIED" || p.Status == "SUCCESS").ToList();
            }
            else if (normalizedStatus == "REJECTED")
            {
                allPayments = allPayments.Where(p => p.Status == "REJECTED").ToList();
            }
        }

        if (startDate.HasValue)
        {
            allPayments = allPayments.Where(p => p.PaymentDate >= startDate.Value).ToList();
        }

        if (endDate.HasValue)
        {
            allPayments = allPayments.Where(p => p.PaymentDate <= endDate.Value).ToList();
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            allPayments = allPayments.Where(p =>
                p.MemberName.ToLowerInvariant().Contains(term) ||
                p.TransactionId.ToLowerInvariant().Contains(term) ||
                p.MemberEmail.ToLowerInvariant().Contains(term)
            ).ToList();
        }

        // Summary Statistics
        int totalPending = allPayments.Count(p => p.Status == "PENDING" || p.Status == "PENDING_PAYMENT" || p.Status == "SUBMITTED");
        int totalVerified = allPayments.Count(p => p.Status == "VERIFIED" || p.Status == "SUCCESS");
        int totalRejected = allPayments.Count(p => p.Status == "REJECTED");
        decimal totalPendingAmount = allPayments.Where(p => p.Status == "PENDING" || p.Status == "PENDING_PAYMENT" || p.Status == "SUBMITTED").Sum(p => p.Amount);
        decimal totalVerifiedAmount = allPayments.Where(p => p.Status == "VERIFIED" || p.Status == "SUCCESS").Sum(p => p.Amount);

        // Chapter-wise breakdown
        var chapterBreakdown = allPayments
            .GroupBy(p => p.ChapterName)
            .Select(g => new
            {
                ChapterName = g.Key,
                TotalCount = g.Count(),
                PendingCount = g.Count(p => p.Status == "PENDING" || p.Status == "PENDING_PAYMENT" || p.Status == "SUBMITTED"),
                VerifiedCount = g.Count(p => p.Status == "VERIFIED" || p.Status == "SUCCESS"),
                TotalAmount = g.Sum(p => p.Amount)
            })
            .OrderByDescending(cb => cb.TotalAmount)
            .ToList();

        return Ok(new
        {
            summary = new
            {
                totalPayments = allPayments.Count,
                totalPending,
                totalVerified,
                totalRejected,
                totalPendingAmount,
                totalVerifiedAmount
            },
            chapterBreakdown,
            payments = allPayments.OrderByDescending(p => p.PaymentDate).ToList()
        });
    }

    [HttpPost("org/trust/payments/verify")]
    public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentActionRequest request, CancellationToken ct)
    {
        // Fail closed: legacy route previously trusted an unverified payment decision
        // and provisioned shared-password accounts. A reconciled finance service,
        // independently authorised transaction and secure invitation are required.
        return StatusCode(StatusCodes.Status503ServiceUnavailable, new
        {
            code = "VERIFIED_FINANCE_WORKFLOW_REQUIRED",
            detail = "This legacy finance activation operation is unavailable until independently reconciled evidence and secure account activation are implemented."
        });
    }

    [HttpPost("org/trust/payments/reject")]
    public async Task<IActionResult> RejectPayment([FromBody] RejectPaymentActionRequest request, CancellationToken ct)
    {
        var (authorized, leader, error) = await ResolveActiveLeaderAsync(ct);
        if (!authorized || leader == null)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { code = "LEADERSHIP_ROLE_REQUIRED", detail = error });
        }

        if (leader.Position != ChapterRole.Trust && leader.Position != ChapterRole.Trustee && leader.Role != "platform_admin")
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { code = "PAYMENT_VERIFICATION_RESTRICTED", detail = "Only Trust position can reject payments." });
        }

        if (string.IsNullOrWhiteSpace(request.RejectionReason))
        {
            return BadRequest(new { success = false, message = "Rejection reason is mandatory when rejecting a payment." });
        }

        var verifierTitle = $"{leader.FullName} ({leader.Position})";

        var payment = await _db.PaymentRecords.FindAsync(new object[] { request.PaymentId }, ct);
        if (payment != null)
        {
            payment.PaymentStatus = "REJECTED";
            payment.VerifiedBy = verifierTitle;
            payment.VerifiedAt = DateTimeOffset.UtcNow;
            payment.RejectionReason = request.RejectionReason.Trim();

            var reg = await _db.MemberRegistrations.FindAsync(new object[] { payment.RegistrationId }, ct);
            if (reg != null)
            {
                reg.OnboardingStatus = OnboardingStatus.REJECTED;
                reg.UpdatedAt = DateTimeOffset.UtcNow;
            }

            AddAuditLog(leader.OrganizationId, leader.Id, payment.Id, "PAYMENT_REJECTED_BY_TRUST", new
            {
                payment.Id,
                RejectedBy = verifierTitle,
                Reason = payment.RejectionReason,
                RejectedAt = payment.VerifiedAt
            });

            await _db.SaveChangesAsync(ct);
            return Ok(new { success = true, message = "Payment rejected.", payment });
        }

        var dbn = await _db.DbnMemberRegistrations.FindAsync(new object[] { request.PaymentId }, ct);
        if (dbn != null)
        {
            dbn.Stage = "Rejected";
            dbn.UpdatedAt = DateTimeOffset.UtcNow;

            AddAuditLog(leader.OrganizationId, leader.Id, dbn.Id, "DBN_PAYMENT_REJECTED_BY_TRUST", new
            {
                dbn.Id,
                dbn.ApplicantFullName,
                Reason = request.RejectionReason.Trim(),
                RejectedBy = verifierTitle
            });

            await _db.SaveChangesAsync(ct);
            return Ok(new { success = true, message = "Application payment rejected.", dbn });
        }

        return NotFound(new { success = false, message = "Payment record not found." });
    }

    [HttpPost("org/trust/payments/bulk-verify")]
    public async Task<IActionResult> BulkVerifyPayments([FromBody] BulkVerifyPaymentsRequest request, CancellationToken ct)
    {
        // Fail closed: legacy route previously trusted an unverified payment decision
        // and provisioned shared-password accounts. A reconciled finance service,
        // independently authorised transaction and secure invitation are required.
        return StatusCode(StatusCodes.Status503ServiceUnavailable, new
        {
            code = "VERIFIED_FINANCE_WORKFLOW_REQUIRED",
            detail = "This legacy finance activation operation is unavailable until independently reconciled evidence and secure account activation are implemented."
        });
    }

    // =========================================================================
    // HELPER METHODS: JWT & SCOPE RESOLUTION
    // =========================================================================

    private string GeneratePortalJwtToken(
        Guid leaderId,
        string fullName,
        string email,
        Guid organizationId,
        Guid? chapterId,
        string position,
        string scope,
        bool mustChangePassword)
    {
        var issuer = _config["Authentication:TrustedIssuer"] ?? "https://auth.sethu.network";
        var audience = _config["Authentication:Audience"] ?? "sethu-api";
        var signingKey = _config["Authentication:SigningKey"]
            ?? Environment.GetEnvironmentVariable("SETHU_JWT_SIGNING_KEY")
            ?? throw new InvalidOperationException("JWT signing key must be explicitly configured; shared default key is forbidden.");

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, leaderId.ToString()),
            new("sub", leaderId.ToString()),
            new(ClaimTypes.Name, fullName),
            new("name", fullName),
            new(ClaimTypes.Email, email),
            new("email", email),
            new(ClaimTypes.Role, "chapter_leader"),
            new("role", "chapter_leader"),
            new("position", position),
            new("scope", scope),
            new("organization_id", organizationId.ToString()),
            new("tenant_id", organizationId.ToString()),
            new("tenantId", organizationId.ToString()),
            new("must_change_password", mustChangePassword.ToString().ToLowerInvariant())
        };

        if (chapterId.HasValue)
        {
            claims.Add(new Claim("chapter_id", chapterId.Value.ToString()));
        }

        var key = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(signingKey));
        var creds = new Microsoft.IdentityModel.Tokens.SigningCredentials(key, Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new System.IdentityModel.Tokens.Jwt.JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: DateTime.UtcNow.AddMinutes(-5),
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
    }

    private async Task<(bool success, ChapterLeader? leader, string? error)> ResolveActiveLeaderAsync(CancellationToken ct)
    {
        // 1. Try reading from authenticated claims
        var email = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;

        if (!string.IsNullOrEmpty(email))
        {
            var l = await _db.ChapterLeaders
                .FirstOrDefaultAsync(x => x.Email.ToLower() == email.ToLower() && x.IsActive, ct);
            if (l != null) return (true, l, null);
        }

        if (!string.IsNullOrEmpty(sub) && Guid.TryParse(sub, out var leaderId))
        {
            var l = await _db.ChapterLeaders
                .FirstOrDefaultAsync(x => x.Id == leaderId && x.IsActive, ct);
            if (l != null) return (true, l, null);
        }

        // 2. Check header or cookie fallback
        var authHeader = Request.Headers["Authorization"].FirstOrDefault();
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            var tokenStr = authHeader.Substring("Bearer ".Length).Trim();
            try
            {
                var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
                if (handler.CanReadToken(tokenStr))
                {
                    var jwt = handler.ReadJwtToken(tokenStr);
                    var jwtEmail = jwt.Claims.FirstOrDefault(c => c.Type == "email" || c.Type == ClaimTypes.Email)?.Value;
                    if (!string.IsNullOrEmpty(jwtEmail))
                    {
                        var l = await _db.ChapterLeaders.FirstOrDefaultAsync(x => x.Email.ToLower() == jwtEmail.ToLower() && x.IsActive, ct);
                        if (l != null) return (true, l, null);
                    }
                }
            }
            catch { }
        }

        return (false, null, "Only authenticated chapter leadership or Trust position can access this endpoint.");
    }

    private static object GetPositionPermissions(string position)
    {
        if (position == ChapterRole.Trust || position.Equals("Leadership Finance", StringComparison.OrdinalIgnoreCase))
        {
            return new
            {
                scope = "tenant",
                canVerifyPayments = true,
                canVerifyDocuments = false,
                canApproveMembers = false,
                canRegisterMembers = false,
                canEditMembers = false,
                canViewAllChaptersMembers = true,
                allowedModules = new[] { "payment.verify", "payment.list", "member.view" }
            };
        }

        if (position.Equals("Member Coordinator", StringComparison.OrdinalIgnoreCase))
        {
            return new
            {
                scope = "chapter",
                canVerifyPayments = false,
                canVerifyDocuments = true,
                canApproveMembers = false,
                canRegisterMembers = true,
                canEditMembers = true,
                canViewAllChaptersMembers = true,
                allowedModules = new[] { "member.register", "member.view", "member.edit", "documents.verify" }
            };
        }

        if (position.Equals("Treasurer", StringComparison.OrdinalIgnoreCase) || position.Equals("Trusser", StringComparison.OrdinalIgnoreCase) || position.Equals("Vice President", StringComparison.OrdinalIgnoreCase))
        {
            return new
            {
                scope = "chapter",
                canVerifyPayments = false,
                canVerifyDocuments = false,
                canVerifyChapterMeetingPayments = true,
                canReconcileChapterDues = true,
                canApproveMembers = true,
                canRegisterMembers = true,
                canEditMembers = true,
                canViewAllChaptersMembers = false,
                allowedModules = new[] { "member.register", "member.view", "member.edit", "dues.reconcile", "meeting.payment.verify" }
            };
        }

        return new
        {
            scope = "chapter",
            canVerifyPayments = false,
            canVerifyDocuments = true,
            canApproveMembers = true,
            canRegisterMembers = true,
            canEditMembers = true,
            canViewAllChaptersMembers = false,
            allowedModules = new[] { "member.register", "member.view", "member.edit" }
        };
    }
}

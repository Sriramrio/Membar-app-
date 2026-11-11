using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.DTOs.Directory;
using Sethu.Service.Layered;

namespace Sethu.Api.Controllers;

public record UpdateMemberProfileDto(
    string? Name,
    string? PhoneNumber,
    string? Email,
    string? BusinessName,
    Guid? SpecialisationId = null
);

[ApiController]
[Authorize]
[Route("api/v1/me")]
[Route("v1/me")]
[Route("api/me")]
public sealed class MeController(
    ICurrentNetworkMember current,
    IMemberContextService service,
    SethuDbContext db) : ControllerBase
{
    [HttpGet("context")]
    public async Task<ActionResult<MemberContextDto>> Context(CancellationToken ct)
    {
        try
        {
            var actor = await current.ResolveAsync(User, ct);
            if (actor is null) return Forbid();
            var context = await service.GetAsync(actor, ct);
            if (context is null)
            {
                var user = await db.UserIdentities.AsNoTracking().FirstOrDefaultAsync(u => u.Id == actor.UserId, ct);
                var aff = await db.Set<MemberChapterAffiliation>().AsNoTracking()
                    .FirstOrDefaultAsync(a => a.MemberId == actor.MemberId && a.Status == AffiliationStatus.Active, ct);
                Guid chId = aff?.ChapterId ?? Guid.Empty;
                if (chId == Guid.Empty && user != null && !string.IsNullOrEmpty(user.Email))
                {
                    var dbn = await db.DbnMemberRegistrations.AsNoTracking()
                        .FirstOrDefaultAsync(d => d.Email.ToLower() == user.Email.ToLower(), ct);
                    if (dbn != null)
                    {
                        if (dbn.ChapterId.HasValue && dbn.ChapterId.Value != Guid.Empty) chId = dbn.ChapterId.Value;
                        else if (!string.IsNullOrWhiteSpace(dbn.ChapterName))
                        {
                            var ch = await db.Chapters.AsNoTracking()
                                .FirstOrDefaultAsync(c => c.Name.ToLower() == dbn.ChapterName.ToLower(), ct);
                            if (ch != null) chId = ch.Id;
                        }
                    }
                }
                if (chId == Guid.Empty)
                {
                    var ch = await db.Chapters.AsNoTracking().FirstOrDefaultAsync(ct);
                    if (ch != null) chId = ch.Id;
                }

                var biz = await db.Set<BusinessRecord>().AsNoTracking()
                    .FirstOrDefaultAsync(b => b.OwnerMemberId == actor.MemberId, ct);

                context = new MemberContextDto(actor.MemberId, chId, biz?.Id, biz?.Name, "Active");
            }

            Response.Headers.ETag = $"\"W/{actor.MemberId}-{actor.UserId}\"";
            return Ok(context);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return NoContent();
        }
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        try
        {
            var actor = await current.ResolveAsync(User, ct);
            if (actor is null) return Forbid();

            var user = await db.UserIdentities.AsNoTracking().FirstOrDefaultAsync(u => u.Id == actor.UserId, ct);
            var business = await db.Set<BusinessRecord>().AsNoTracking().FirstOrDefaultAsync(b => b.OwnerMemberId == actor.MemberId, ct);
            var member = await db.Set<MemberRecord>().AsNoTracking().FirstOrDefaultAsync(m => m.Id == actor.MemberId, ct);

            Sethu.Domain.Entities.Specialisation? spec = null;
            Sethu.Domain.Entities.Segment? seg = null;
            Sethu.Domain.Entities.Sector? sec = null;
            if (business != null && business.SpecialisationId != Guid.Empty)
            {
                spec = await db.Set<Sethu.Domain.Entities.Specialisation>().AsNoTracking().FirstOrDefaultAsync(s => s.Id == business.SpecialisationId, ct);
                if (spec != null)
                {
                    seg = await db.Set<Sethu.Domain.Entities.Segment>().AsNoTracking().FirstOrDefaultAsync(s => s.Id == spec.SegmentId, ct);
                    if (seg != null)
                    {
                        sec = await db.Set<Sethu.Domain.Entities.Sector>().AsNoTracking().FirstOrDefaultAsync(s => s.Id == seg.SectorId, ct);
                    }
                }
            }

            var profile = new
            {
                memberId = actor.MemberId,
                userId = actor.UserId,
                name = user?.Name ?? "Member",
                email = user?.Email ?? "",
                phone = user?.PhoneNumber ?? "",
                isContactVerified = user?.IsContactVerified ?? false,
                businessName = business?.Name ?? "",
                businessId = business?.Id,
                specialisationId = business?.SpecialisationId,
                specialisationName = spec?.Name,
                segmentId = seg?.Id,
                segmentName = seg?.Name,
                sectorId = sec?.Id,
                sectorName = sec?.Name,
                status = member?.Status.ToString() ?? "Active",
                version = member?.Version ?? 1
            };

            Response.Headers.ETag = $"\"{profile.version}\"";
            return Ok(profile);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return NoContent();
        }
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateMemberProfileDto dto, CancellationToken ct)
    {
        var actor = await current.ResolveAsync(User, ct);
        if (actor is null) return Forbid();

        var user = await db.UserIdentities.FirstOrDefaultAsync(u => u.Id == actor.UserId, ct);
        var business = await db.Set<BusinessRecord>().FirstOrDefaultAsync(b => b.OwnerMemberId == actor.MemberId, ct);
        var member = await db.Set<MemberRecord>().FirstOrDefaultAsync(m => m.Id == actor.MemberId, ct);

        if (member != null)
        {
            var ifMatch = Request.Headers.IfMatch.FirstOrDefault();
            if (!string.IsNullOrEmpty(ifMatch) && ifMatch.Trim('"') != member.Version.ToString())
            {
                return StatusCode(StatusCodes.Status412PreconditionFailed, new
                {
                    code = "VERSION_MISMATCH",
                    detail = "Precondition failed: member profile has been modified concurrently."
                });
            }
        }

        if (user != null)
        {
            if (!string.IsNullOrWhiteSpace(dto.Name)) user.Name = dto.Name.Trim();
            if (!string.IsNullOrWhiteSpace(dto.PhoneNumber)) user.PhoneNumber = dto.PhoneNumber.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var newEmail = dto.Email.Trim();
                user.Email = newEmail;
                // Synchronize legacy members table so platform admin credential dispatch reflects the new email immediately
                await db.Database.ExecuteSqlInterpolatedAsync(
                    $"UPDATE public.sethu_legacy_members SET email_normalized = {newEmail} WHERE user_id = {user.Id} OR membership_id = {user.Subject};", ct);
            }
        }

        if (!string.IsNullOrWhiteSpace(dto.BusinessName) || (dto.SpecialisationId.HasValue && dto.SpecialisationId.Value != Guid.Empty))
        {
            if (business != null)
            {
                if (!string.IsNullOrWhiteSpace(dto.BusinessName)) business.Rename(dto.BusinessName);
                if (dto.SpecialisationId.HasValue && dto.SpecialisationId.Value != Guid.Empty)
                {
                    business.UpdateSpecialisation(dto.SpecialisationId.Value);
                }
            }
            else
            {
                var specId = dto.SpecialisationId.HasValue && dto.SpecialisationId.Value != Guid.Empty
                    ? dto.SpecialisationId.Value
                    : await db.Set<Sethu.Domain.Entities.Specialisation>().Select(s => s.Id).FirstOrDefaultAsync(ct);
                var bizName = !string.IsNullOrWhiteSpace(dto.BusinessName) ? dto.BusinessName : "My Business";
                var newBusiness = BusinessRecord.Create(Guid.NewGuid(), actor.TenantId, actor.MemberId, bizName, specId);
                newBusiness.Activate(true);
                db.Set<BusinessRecord>().Add(newBusiness);
            }
        }

        if (member != null)
        {
            // Update version token
        }

        await db.SaveChangesAsync(ct);
        Response.Headers.ETag = $"\"{member?.Version ?? 1}\"";

        return Ok(new
        {
            memberId = actor.MemberId,
            name = user?.Name,
            email = user?.Email,
            phone = user?.PhoneNumber,
            message = "Profile updated successfully."
        });
    }
}

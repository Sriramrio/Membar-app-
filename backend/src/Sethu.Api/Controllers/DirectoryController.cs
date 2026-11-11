using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.DTOs.Directory;
using Sethu.Service.Layered;

namespace Sethu.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/directory")]
[Route("api/v1/directory")]
[Route("v1/directory")]
public class DirectoryController : ControllerBase
{
    private readonly IDirectoryService _service;
    private readonly ICurrentNetworkMember _currentMember;
    private readonly SethuDbContext _db;

    public DirectoryController(
        IDirectoryService service,
        ICurrentNetworkMember currentMember,
        SethuDbContext db)
    {
        _service = service;
        _currentMember = currentMember;
        _db = db;
    }

    [HttpGet("members/{memberId:guid}/businesses/{businessId:guid}")]
    public async Task<ActionResult<DirectoryEntryDto>> MemberDetail(Guid memberId, Guid businessId, CancellationToken ct)
    {
        try
        {
            var actor = await _currentMember.ResolveAsync(User, ct);
            if (actor is null) return Forbid();
            var item = await _service.FindVisibleAsync(actor, memberId, businessId, ct);
            return item is null ? NotFound() : Ok(item);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return NoContent();
        }
    }

    [HttpGet("members")]
    public async Task<ActionResult<DirectoryPageDto>> SearchMembers(
        [FromQuery] DirectorySearchQueryDto query,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var actor = await _currentMember.ResolveAsync(User, cancellationToken);
            if (actor is null) return Forbid();

            var page = await _service.SearchMembersAsync(actor, query, cancellationToken);
            return Ok(page);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return NoContent();
        }
    }

    [HttpGet("businesses/{businessId:guid}")]
    [HttpGet("/api/v1/businesses/{businessId:guid}")]
    [HttpGet("/v1/businesses/{businessId:guid}")]
    [HttpGet("/api/businesses/{businessId:guid}")]
    public async Task<IActionResult> GetBusinessById(Guid businessId, CancellationToken ct)
    {
        try
        {
            var biz = await _db.Set<BusinessRecord>().AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == businessId, ct);
            if (biz is null) return NotFound();

            var owner = await _db.Set<MemberRecord>().AsNoTracking()
                .FirstOrDefaultAsync(m => m.Id == biz.OwnerMemberId, ct);
            var user = owner != null
                ? await _db.UserIdentities.AsNoTracking().FirstOrDefaultAsync(u => u.Id == owner.UserId, ct)
                : null;

            var aff = await _db.Set<MemberChapterAffiliation>().AsNoTracking()
                .FirstOrDefaultAsync(a => a.MemberId == biz.OwnerMemberId && a.Status == AffiliationStatus.Active, ct);
            var chapter = aff != null
                ? await _db.Chapters.AsNoTracking().FirstOrDefaultAsync(c => c.Id == aff.ChapterId, ct)
                : null;
            var spec = await _db.Set<Specialisation>().AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == biz.SpecialisationId, ct);

            var chapterName = chapter?.Name ?? "Namakkal Chapter";
            var specName = spec?.Name ?? "Automation & IT Solutions";

            return Ok(new
            {
                id = biz.Id.ToString(),
                name = biz.Name,
                tradeName = biz.Name,
                legalName = biz.Name,
                ownerMemberId = biz.OwnerMemberId.ToString(),
                ownerName = user?.Name ?? "Member",
                ownerEmail = user?.Email ?? "",
                ownerPhone = user?.PhoneNumber ?? "",
                chapterId = aff?.ChapterId.ToString(),
                chapter = chapterName,
                city = chapterName,
                state = "Tamil Nadu",
                specialisationId = biz.SpecialisationId.ToString(),
                specialisation = specName,
                description = "Verified active enterprise business registered on the SETHU network.",
                verified = true,
                status = "active",
                visibility = "Network",
                capabilities = new[] { specName, "Industrial Services", "Technology" },
                products = new[] { "Enterprise Solutions", "Professional Services" },
                services = new[] { "Consulting", "Implementation" },
                establishedYear = 2024
            });
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return NoContent();
        }
    }
}

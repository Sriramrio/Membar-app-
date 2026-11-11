using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Layered;

namespace Sethu.Api.Controllers;

[ApiController]
[Authorize]
public class SuggestionsController : ControllerBase
{
    private readonly SethuDbContext _db;
    private readonly ICurrentNetworkMember _currentMember;

    public SuggestionsController(SethuDbContext db, ICurrentNetworkMember currentMember)
    {
        _db = db;
        _currentMember = currentMember;
    }

    [HttpGet("api/connections/suggestions")]
    [HttpGet("connections/suggestions")]
    public async Task<IActionResult> GetSuggestions(
        [FromQuery] string? scope = null,
        [FromQuery] int limit = 12,
        CancellationToken ct = default)
    {
        try
        {
            var actor = await _currentMember.ResolveAsync(User, ct);
            if (actor == null) return Forbid();

            // Find current member's chapter with tenant isolation
            var myAffiliation = await _db.Set<MemberChapterAffiliation>()
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.TenantId == actor.TenantId && a.MemberId == actor.MemberId && a.Status == AffiliationStatus.Active, ct);
            var myChapterId = myAffiliation?.ChapterId;

            // Existing connection partner IDs
            var existingConnections = await _db.Set<Connection>()
                .AsNoTracking()
                .Where(c => c.TenantId == actor.TenantId && (c.LowerMemberId == actor.MemberId || c.UpperMemberId == actor.MemberId))
                .ToListAsync(ct);

            var connectedMemberIds = existingConnections
                .Select(c => c.LowerMemberId == actor.MemberId ? c.UpperMemberId : c.LowerMemberId)
                .ToHashSet();
            connectedMemberIds.Add(actor.MemberId);

            // Fetch chapter metadata safely with deduplication
            var chapterList = await _db.Set<Chapter>()
                .AsNoTracking()
                .ToListAsync(ct);
            var chapters = chapterList
                .GroupBy(c => c.Id)
                .ToDictionary(g => g.Key, g => g.First().Name);

            // Candidate members from DB within same tenant
            var candidateUsersQuery = _db.UserIdentities
                .AsNoTracking()
                .Where(u => u.TenantId == actor.TenantId && u.Active && u.MemberId.HasValue && !connectedMemberIds.Contains(u.MemberId.Value));

            var candidateUsers = await candidateUsersQuery.ToListAsync(ct);
            var candidateMemberIds = candidateUsers.Select(u => u.MemberId!.Value).Distinct().ToList();

            // Safe dictionary lookups with GroupBy to prevent duplicate key crashes
            var businessRows = await _db.Set<BusinessRecord>()
                .AsNoTracking()
                .Where(b => b.TenantId == actor.TenantId && candidateMemberIds.Contains(b.OwnerMemberId))
                .ToListAsync(ct);
            var businesses = businessRows
                .GroupBy(b => b.OwnerMemberId)
                .ToDictionary(g => g.Key, g => g.First());

            var affiliationRows = await _db.Set<MemberChapterAffiliation>()
                .AsNoTracking()
                .Where(a => a.TenantId == actor.TenantId && candidateMemberIds.Contains(a.MemberId) && a.Status == AffiliationStatus.Active)
                .ToListAsync(ct);
            var affiliations = affiliationRows
                .GroupBy(a => a.MemberId)
                .ToDictionary(g => g.Key, g => g.First().ChapterId);

            var specRows = await _db.Set<Specialisation>()
                .AsNoTracking()
                .Where(s => s.TenantId == actor.TenantId)
                .ToListAsync(ct);
            var specs = specRows
                .GroupBy(s => s.Id)
                .ToDictionary(g => g.Key, g => g.First().Name);

            // Filter by scope if requested
            if (!string.IsNullOrEmpty(scope) && (scope.Equals("chapter", StringComparison.OrdinalIgnoreCase) || scope.Equals("YourChapter", StringComparison.OrdinalIgnoreCase)))
            {
                if (myChapterId.HasValue)
                {
                    candidateUsers = candidateUsers.Where(u => affiliations.TryGetValue(u.MemberId!.Value, out var cId) && cId == myChapterId.Value).ToList();
                }
            }

            var suggestions = candidateUsers.Select(u =>
            {
                var biz = businesses.TryGetValue(u.MemberId!.Value, out var b) ? b : null;
                var chId = affiliations.TryGetValue(u.MemberId!.Value, out var cid) ? cid : (Guid?)null;
                var rawChapterName = chId.HasValue && chapters.TryGetValue(chId.Value, out var cName) ? cName : "Network Chapter";
                var chapter = rawChapterName.Contains("Chapter", StringComparison.OrdinalIgnoreCase) ? rawChapterName : $"{rawChapterName} Chapter";

                var isSameChapter = chId.HasValue && myChapterId.HasValue && chId.Value == myChapterId.Value;
                var company = biz?.Name ?? "Enterprise Member";
                var specName = biz != null && specs.TryGetValue(biz.SpecialisationId, out var sn) ? sn : "Enterprise Services";

                var city = rawChapterName.Replace(" Chapter", "", StringComparison.OrdinalIgnoreCase).Trim();
                if (string.IsNullOrWhiteSpace(city) || city.Equals("Network", StringComparison.OrdinalIgnoreCase))
                {
                    city = "Tamil Nadu";
                }

                var designation = biz != null ? "Managing Director" : "Business Owner";

                var rawInitials = string.Join("", (u.Name ?? "NM").Split(' ', StringSplitOptions.RemoveEmptyEntries).Select(s => s[0])).ToUpperInvariant();
                var initials = rawInitials.Length > 2 ? rawInitials[..2] : (rawInitials.Length > 0 ? rawInitials : "NM");

                return new
                {
                    memberId = u.MemberId!.Value.ToString(),
                    id = u.MemberId!.Value.ToString(),
                    name = u.Name ?? "Network Member",
                    email = u.Email,
                    companyName = company,
                    chapter = chapter,
                    city = city,
                    designation = designation,
                    avatarText = initials,
                    bio = $"{designation} at {company}, focused on dependable B2B collaboration and long-term partnerships.",
                    reason = isSameChapter ? "Same Chapter" : "Network Member",
                    context = isSameChapter ? "Same Chapter" : "Network Member",
                    expertise = new[] { specName, "Pilot to production", "B2B supply" },
                    businessId = biz?.Id.ToString()
                };
            })
            .OrderByDescending(s => s.context == "Same Chapter")
            .ThenBy(s => s.name)
            .Take(limit);

            return Ok(suggestions);
        }
        catch (OperationCanceledException)
        {
            // Client aborted connection (tab switch, unmount or refresh) - gracefully handled
            return StatusCode(499);
        }
    }

    [HttpGet("api/connections/businesses")]
    [HttpGet("connections/businesses")]
    public async Task<IActionResult> GetBusinesses(
        [FromQuery] string? scope = null,
        [FromQuery] int limit = 12,
        CancellationToken ct = default)
    {
        try
        {
            var actor = await _currentMember.ResolveAsync(User, ct);
            if (actor == null) return Forbid();

            var myAffiliation = await _db.Set<MemberChapterAffiliation>()
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.TenantId == actor.TenantId && a.MemberId == actor.MemberId && a.Status == AffiliationStatus.Active, ct);
            var myChapterId = myAffiliation?.ChapterId;

            var chapterList = await _db.Set<Chapter>()
                .AsNoTracking()
                .ToListAsync(ct);
            var chapters = chapterList
                .GroupBy(c => c.Id)
                .ToDictionary(g => g.Key, g => g.First().Name);

            var specRows = await _db.Set<Specialisation>()
                .AsNoTracking()
                .Where(s => s.TenantId == actor.TenantId)
                .ToListAsync(ct);
            var specs = specRows
                .GroupBy(s => s.Id)
                .ToDictionary(g => g.Key, g => g.First().Name);

            var affiliationRows = await _db.Set<MemberChapterAffiliation>()
                .AsNoTracking()
                .Where(a => a.TenantId == actor.TenantId && a.Status == AffiliationStatus.Active)
                .ToListAsync(ct);
            var affiliations = affiliationRows
                .GroupBy(a => a.MemberId)
                .ToDictionary(g => g.Key, g => g.First().ChapterId);

            // Fetch DB businesses (excluding current user's business) within tenant
            var businessesQuery = _db.Set<BusinessRecord>()
                .AsNoTracking()
                .Where(b => b.TenantId == actor.TenantId && b.Status == BusinessRecordStatus.Active && b.OwnerMemberId != actor.MemberId);

            var bizList = await businessesQuery.ToListAsync(ct);

            if (!string.IsNullOrEmpty(scope) && (scope.Equals("chapter", StringComparison.OrdinalIgnoreCase) || scope.Equals("YourChapter", StringComparison.OrdinalIgnoreCase)))
            {
                if (myChapterId.HasValue)
                {
                    bizList = bizList.Where(b => affiliations.TryGetValue(b.OwnerMemberId, out var cId) && cId == myChapterId.Value).ToList();
                }
            }

            var result = bizList.Select(b =>
            {
                var chId = affiliations.TryGetValue(b.OwnerMemberId, out var cid) ? cid : (Guid?)null;
                var rawChapterName = chId.HasValue && chapters.TryGetValue(chId.Value, out var cName) ? cName : "Network Chapter";
                var chapter = rawChapterName.Contains("Chapter", StringComparison.OrdinalIgnoreCase) ? rawChapterName : $"{rawChapterName} Chapter";

                var isSameChapter = chId.HasValue && myChapterId.HasValue && chId.Value == myChapterId.Value;
                var specName = specs.TryGetValue(b.SpecialisationId, out var sn) ? sn : "Enterprise Solutions";

                var city = rawChapterName.Replace(" Chapter", "", StringComparison.OrdinalIgnoreCase).Trim();
                if (string.IsNullOrWhiteSpace(city) || city.Equals("Network", StringComparison.OrdinalIgnoreCase))
                {
                    city = "Tamil Nadu";
                }

                var rawInitials = string.Join("", b.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries).Select(s => s[0])).ToUpperInvariant();
                var logo = rawInitials.Length > 2 ? rawInitials[..2] : (rawInitials.Length > 0 ? rawInitials : "BZ");

                return new
                {
                    id = b.Id.ToString(),
                    ownerMemberId = b.OwnerMemberId.ToString(),
                    name = b.Name,
                    chapter = chapter,
                    city = city,
                    state = "Tamil Nadu",
                    verified = true,
                    logoText = logo,
                    description = $"{b.Name} delivers high-grade {specName.ToLowerInvariant()} engineered for industrial B2B supply, reliable client commitments, and standard excellence.",
                    capabilities = new[] { specName, "Pilot to production", "B2B supply" },
                    categoryIds = new[] { "cat-001" },
                    context = isSameChapter ? "same chapter · same state" : "same state",
                    reason = isSameChapter ? "same chapter · same state" : "same state"
                };
            })
            .OrderByDescending(b => b.context.Contains("same chapter"))
            .ThenBy(b => b.name)
            .Take(limit);

            return Ok(result);
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499);
        }
    }
}

using Microsoft.EntityFrameworkCore;
using Sethu.Service.MemberNetwork;
using Sethu.Service.Layered;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Domain.Entities;
namespace Sethu.Infrastructure.Layered;

public sealed class EfDirectoryRepository(SethuDbContext db) : IDirectoryRepository
{
    public async Task<DirectoryEntry?> FindVisibleAsync(NetworkActor actor, Guid memberId, Guid businessId, CancellationToken ct)
    {
        // Require an active requester with a chapter, and an active target in the same tenant.
        var member = db.Set<MemberRecord>().AsNoTracking();
        var affiliation = db.Set<MemberChapterAffiliation>().AsNoTracking();
        var activeRequester = await member.AnyAsync(m => m.Id == actor.MemberId && m.UserId == actor.UserId &&
            m.TenantId == actor.TenantId && m.Status == MemberRecordStatus.Active, ct);
        var affiliated = await affiliation.AnyAsync(a => a.MemberId == actor.MemberId &&
            a.TenantId == actor.TenantId && a.Status == AffiliationStatus.Active, ct);
        if (!activeRequester || !affiliated) return null;
        var rows = from m in member
                   join b in db.Set<BusinessRecord>().AsNoTracking() on m.Id equals b.OwnerMemberId
                   join a in affiliation on m.Id equals a.MemberId
                   where m.Id == memberId && b.Id == businessId && m.TenantId == actor.TenantId &&
                         b.TenantId == actor.TenantId && a.TenantId == actor.TenantId &&
                         m.Status == MemberRecordStatus.Active && b.Status == BusinessRecordStatus.Active &&
                         a.Status == AffiliationStatus.Active
                   orderby a.ChapterId
                   select new DirectoryEntry(m.Id, b.Id, b.Name, b.SpecialisationId, a.ChapterId);
        try
        {
            return await rows.FirstOrDefaultAsync(ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return null;
        }
    }

    public Task<DirectoryPage> SearchAsync(NetworkActor current, NetworkScope scope, string? term, Guid? specialisation, int page, int size, CancellationToken ct)
        => SearchAsync(current, scope, term, null, null, specialisation, page, size, ct);

    public async Task<DirectoryPage> SearchAsync(NetworkActor current, NetworkScope scope, string? term, Guid? sectorId, Guid? segmentId, Guid? specialisation, int page, int size, CancellationToken ct)
    {
        var tenantId = current.TenantId; var actor = current.MemberId;
        var member = db.Set<MemberRecord>();
        var affiliation = db.Set<MemberChapterAffiliation>();
        var business = db.Set<BusinessRecord>();
        var isActive = await member.AsNoTracking().AnyAsync(x => x.Id == actor && x.TenantId == tenantId && x.Status == MemberRecordStatus.Active, ct);
        if (!isActive) return new(Array.Empty<DirectoryEntry>(), page, size, false);
        var myChapters = affiliation.AsNoTracking().Where(x => x.TenantId == tenantId && x.MemberId == actor && x.Status == AffiliationStatus.Active).Select(x => x.ChapterId);
        if (!await myChapters.AnyAsync(ct)) return new(Array.Empty<DirectoryEntry>(), page, size, false);
        var query = from m in member.AsNoTracking()
                    join b in business.AsNoTracking() on m.Id equals b.OwnerMemberId
                    join a in affiliation.AsNoTracking() on m.Id equals a.MemberId
                    where m.TenantId == tenantId && b.TenantId == tenantId && a.TenantId == tenantId &&
                          m.Status == MemberRecordStatus.Active && b.Status == BusinessRecordStatus.Active && a.Status == AffiliationStatus.Active
                    select new { m, b, a };
        if (scope == NetworkScope.ForYou && !specialisation.HasValue && !segmentId.HasValue && !sectorId.HasValue)
        {
            var peerIds = db.Set<Connection>().AsNoTracking()
                .Where(x => x.TenantId == tenantId && x.State == ConnectionState.Accepted &&
                    (x.LowerMemberId == actor || x.UpperMemberId == actor))
                .Select(x => x.LowerMemberId == actor ? x.UpperMemberId : x.LowerMemberId);
            query = query.Where(x => x.m.Id == actor || peerIds.Contains(x.m.Id));
        }
        else if (scope == NetworkScope.YourChapter) query = query.Where(x => myChapters.Contains(x.a.ChapterId));
        if (specialisation.HasValue)
        {
            query = query.Where(x => x.b.SpecialisationId == specialisation.Value);
        }
        else if (segmentId.HasValue)
        {
            var specIdsInSegment = db.Set<Sethu.Domain.Entities.Specialisation>().AsNoTracking()
                .Where(s => s.SegmentId == segmentId.Value)
                .Select(s => s.Id);
            query = query.Where(x => specIdsInSegment.Contains(x.b.SpecialisationId));
        }
        else if (sectorId.HasValue)
        {
            var segmentIdsInSector = db.Set<Sethu.Domain.Entities.Segment>().AsNoTracking()
                .Where(seg => seg.SectorId == sectorId.Value)
                .Select(seg => seg.Id);
            var specIdsInSector = db.Set<Sethu.Domain.Entities.Specialisation>().AsNoTracking()
                .Where(s => segmentIdsInSector.Contains(s.SegmentId))
                .Select(s => s.Id);
            query = query.Where(x => specIdsInSector.Contains(x.b.SpecialisationId));
        }
        if (!string.IsNullOrWhiteSpace(term))
        {
            var escaped = term.Trim().Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
            var matchingSpecIds = await db.Set<Sethu.Domain.Entities.Specialisation>().AsNoTracking()
                .Where(s => EF.Functions.ILike(s.Name, "%" + escaped + "%", "\\"))
                .Select(s => s.Id).ToListAsync(ct);
            var matchingUserMemberIds = await db.UserIdentities.AsNoTracking()
                .Where(u => EF.Functions.ILike(u.Name, "%" + escaped + "%", "\\") && u.MemberId.HasValue)
                .Select(u => u.MemberId!.Value).ToListAsync(ct);

            query = query.Where(x => EF.Functions.ILike(x.b.Name, "%" + escaped + "%", "\\") ||
                                     matchingSpecIds.Contains(x.b.SpecialisationId) ||
                                     matchingUserMemberIds.Contains(x.m.Id));
        }
        try
        {
            var rows = await query.OrderBy(x => x.b.Name).ThenBy(x => x.m.Id).ThenBy(x => x.a.ChapterId)
                .Skip((page - 1) * size).Take(size + 1).ToListAsync(ct);
            return new(rows.Take(size).Select(x => new DirectoryEntry(x.m.Id, x.b.Id, x.b.Name, x.b.SpecialisationId, x.a.ChapterId)).ToArray(), page, size, rows.Count > size);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return new(Array.Empty<DirectoryEntry>(), page, size, false);
        }
    }
}

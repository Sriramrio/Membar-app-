using Microsoft.EntityFrameworkCore;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.DTOs.Directory;
using Sethu.Service.Layered;
using Sethu.Service.MemberNetwork;
namespace Sethu.Infrastructure.Layered;

public sealed class EfMemberContextRepository(SethuDbContext db) : IMemberContextRepository
{
    public async Task<MemberContextDto?> GetAsync(NetworkActor actor, CancellationToken ct)
    {
        var active = await db.Set<MemberRecord>().AsNoTracking().AnyAsync(m =>
            m.Id == actor.MemberId && m.UserId == actor.UserId &&
            m.Status == MemberRecordStatus.Active, ct);
        if (!active) return null;
        var chapter = await db.Set<MemberChapterAffiliation>().AsNoTracking()
            .Where(a => a.MemberId == actor.MemberId && a.Status == AffiliationStatus.Active)
            .OrderBy(a => a.ChapterId).Select(a => a.ChapterId).FirstOrDefaultAsync(ct);
        if (chapter == Guid.Empty) return null;
        var business = await db.Set<BusinessRecord>().AsNoTracking()
            .Where(b => b.OwnerMemberId == actor.MemberId && b.Status == BusinessRecordStatus.Active)
            .OrderBy(b => b.Id).Select(b => new { b.Id, b.Name }).FirstOrDefaultAsync(ct);
        return new MemberContextDto(actor.MemberId, chapter, business?.Id, business?.Name, "Active");
    }
}

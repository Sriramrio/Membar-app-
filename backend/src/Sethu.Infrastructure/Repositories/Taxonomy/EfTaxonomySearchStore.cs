using Microsoft.EntityFrameworkCore;
using Sethu.Service.Taxonomy;
using Sethu.Infrastructure.Persistence;
using Sethu.Domain.Entities;
namespace Sethu.Infrastructure.Taxonomy;

public sealed class EfTaxonomySearchStore(SethuDbContext db):ITaxonomySearchStore
{
    public async Task<IReadOnlyList<TaxonomyHit>> SearchAsync(Guid tenantId,string q,int take,CancellationToken ct)
    {
        // Database filtering and ranking; never bring the entire taxonomy into process memory.
        var candidates=from sp in db.Set<Specialisation>().AsNoTracking()
                       join seg in db.Set<Segment>().AsNoTracking() on sp.SegmentId equals seg.Id
                       join sec in db.Set<Sector>().AsNoTracking() on seg.SectorId equals sec.Id
                       where sp.TenantId==tenantId&&seg.TenantId==tenantId&&sec.TenantId==tenantId&&sp.Active&&seg.Active&&sec.Active
                       where sp.Name.ToLower().Contains(q)||db.Set<TaxonomyTerm>().Any(t=>t.TenantId==tenantId&&t.SpecialisationId==sp.Id&&t.NormalizedTerm.Contains(q))
                       select new TaxonomyHit(sec.Id,seg.Id,sp.Id,sp.Name,sp.Name.ToLower()==q?0:sp.Name.ToLower().StartsWith(q)?1:2);
        return await candidates.OrderBy(x=>x.Rank).ThenBy(x=>x.Name).ThenBy(x=>x.SpecialisationId).Take(take).ToListAsync(ct);
    }
}

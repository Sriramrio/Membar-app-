using System.Text;
using Sethu.Service.Security;
namespace Sethu.Service.Taxonomy;

public sealed class TaxonomySearchService(ITaxonomySearchStore store)
{
    // Search results are classification candidates, not protected Chapter vacancy certifications.
    public Task<IReadOnlyList<TaxonomyHit>> SearchAsync(Guid tenantId,string query,int take,CancellationToken ct)
    {
        if(tenantId==Guid.Empty || string.IsNullOrWhiteSpace(query) || query.Length>160 || take<1 || take>25)
            return Task.FromResult<IReadOnlyList<TaxonomyHit>>(Array.Empty<TaxonomyHit>());
        var normalized=query.Trim().Normalize(NormalizationForm.FormKC).ToLowerInvariant();
        return store.SearchAsync(tenantId,normalized,take,ct);
    }
}

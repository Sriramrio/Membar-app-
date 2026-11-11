using System.Text;
using Sethu.Service.Security;
namespace Sethu.Service.Taxonomy;

public interface ITaxonomySearchStore
{
    Task<IReadOnlyList<TaxonomyHit>> SearchAsync(Guid tenantId,string normalizedQuery,int take,CancellationToken ct);
}

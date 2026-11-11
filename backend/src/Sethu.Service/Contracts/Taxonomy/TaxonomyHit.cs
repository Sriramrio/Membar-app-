using System.Text;
using Sethu.Service.Security;
namespace Sethu.Service.Taxonomy;

public sealed record TaxonomyHit(Guid SectorId,Guid SegmentId,Guid SpecialisationId,string Name,int Rank);

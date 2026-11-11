using Microsoft.EntityFrameworkCore;
using Sethu.Service.Taxonomy;
using Sethu.Infrastructure.Persistence;
using Sethu.Domain.Entities;
namespace Sethu.Infrastructure.Taxonomy;

public static class TaxonomyEfMapping
{
    public static void Configure(ModelBuilder m)
    {
        m.Entity<Sector>(e=>{e.ToTable("business_sectors");e.HasKey(x=>x.Id);e.Property(x=>x.Name).HasMaxLength(160).IsRequired();e.HasIndex(x=>new{x.TenantId,x.Name}).IsUnique();});
        m.Entity<Segment>(e=>{e.ToTable("business_segments");e.HasKey(x=>x.Id);e.Property(x=>x.Name).HasMaxLength(160).IsRequired();e.HasIndex(x=>new{x.TenantId,x.SectorId,x.Name}).IsUnique();e.HasOne<Sector>().WithMany().HasForeignKey(x=>x.SectorId).OnDelete(DeleteBehavior.Restrict);});
        m.Entity<Specialisation>(e=>{e.ToTable("business_specialisations");e.HasKey(x=>x.Id);e.Property(x=>x.Name).HasMaxLength(160).IsRequired();e.HasIndex(x=>new{x.TenantId,x.SegmentId,x.Name}).IsUnique();e.HasOne<Segment>().WithMany().HasForeignKey(x=>x.SegmentId).OnDelete(DeleteBehavior.Restrict);});
        m.Entity<TaxonomyTerm>(e=>{e.ToTable("business_taxonomy_terms");e.HasKey(x=>x.Id);e.Property(x=>x.NormalizedTerm).HasMaxLength(160).IsRequired();e.HasIndex(x=>new{x.TenantId,x.SpecialisationId,x.NormalizedTerm}).IsUnique();e.HasOne<Specialisation>().WithMany().HasForeignKey(x=>x.SpecialisationId).OnDelete(DeleteBehavior.Restrict);});
    }
}

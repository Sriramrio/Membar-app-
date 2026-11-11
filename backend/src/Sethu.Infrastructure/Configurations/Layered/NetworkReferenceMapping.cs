using Microsoft.EntityFrameworkCore;
using Sethu.Service.Layered;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Domain.Entities;
namespace Sethu.Infrastructure.Layered;

public static class NetworkReferenceMapping
{
    public static void Configure(ModelBuilder model)
    {
        model.Entity<NetworkReferenceHistory>(e=>{
            e.ToTable("network_reference_history");e.HasKey(x=>x.Id);
            e.HasIndex(x=>new{x.TenantId,x.ReferenceId,x.OccurredAt});
            e.Property(x=>x.PreviousStatus).HasMaxLength(32);
            e.Property(x=>x.NewStatus).HasMaxLength(32);
            e.Property(x=>x.Action).HasMaxLength(32);
            e.HasOne<NetworkReference>().WithMany().HasForeignKey(x=>x.ReferenceId).OnDelete(DeleteBehavior.Restrict);
        });
        model.Entity<NetworkReference>(e=>{
            e.ToTable("network_references");e.HasKey(x=>x.Id);
            e.Property(x=>x.Status).HasMaxLength(32);
            e.Property(x=>x.Outcome).HasMaxLength(512);
            e.Property(x=>x.Version).IsConcurrencyToken();
            e.Property(x=>x.ConsentedAt);
            e.HasIndex(x=>new{x.TenantId,x.FromMemberId,x.CreatedAt});
            e.HasIndex(x=>new{x.TenantId,x.ToMemberId,x.CreatedAt});
            e.HasOne<MemberRecord>().WithMany().HasForeignKey(x=>x.FromMemberId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<MemberRecord>().WithMany().HasForeignKey(x=>x.ToMemberId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<MemberRecord>().WithMany().HasForeignKey(x=>x.IntroducedMemberId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}

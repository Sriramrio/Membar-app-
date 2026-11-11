using Microsoft.EntityFrameworkCore;
using Sethu.Service.Layered;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Domain.Entities;
namespace Sethu.Infrastructure.Layered;

public static class NetworkWorkspaceMapping
{
    public static void Configure(ModelBuilder model)
    {
        model.Entity<NetworkMeeting>(e=>{
            e.ToTable("network_one_to_one");e.HasKey(x=>x.Id);e.Property(x=>x.Status).HasMaxLength(32);
            e.Property(x=>x.TimeZoneId).HasMaxLength(100);e.Property(x=>x.Outcome).HasMaxLength(512);
            e.Property(x=>x.Version).IsConcurrencyToken();e.HasIndex(x=>new{x.TenantId,x.FromMemberId,x.ProposedAt});
            e.HasIndex(x=>new{x.TenantId,x.ToMemberId,x.ProposedAt});
            e.HasOne<MemberRecord>().WithMany().HasForeignKey(x=>x.FromMemberId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<MemberRecord>().WithMany().HasForeignKey(x=>x.ToMemberId).OnDelete(DeleteBehavior.Restrict);
        });
        model.Entity<NetworkOpportunity>(e=>{
            e.ToTable("network_opportunities");e.HasKey(x=>x.Id);e.Property(x=>x.Title).HasMaxLength(160);
            e.Property(x=>x.Status).HasMaxLength(32);e.Property(x=>x.Scope).HasMaxLength(32);
            e.Property(x=>x.Outcome).HasMaxLength(512);e.Property(x=>x.Version).IsConcurrencyToken();
            e.HasIndex(x=>new{x.TenantId,x.OwnerMemberId});e.HasOne<MemberRecord>().WithMany().HasForeignKey(x=>x.OwnerMemberId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<BusinessRecord>().WithMany().HasForeignKey(x=>x.BusinessId).OnDelete(DeleteBehavior.Restrict);
        });
        model.Entity<NetworkOpportunityResponse>(e=>{
            e.ToTable("network_opportunity_responses");e.HasKey(x=>x.Id);
            e.HasIndex(x=>new{x.TenantId,x.OpportunityId,x.MemberId}).IsUnique();e.Property(x=>x.Status).HasMaxLength(32);
            e.HasOne<NetworkOpportunity>().WithMany().HasForeignKey(x=>x.OpportunityId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<MemberRecord>().WithMany().HasForeignKey(x=>x.MemberId).OnDelete(DeleteBehavior.Restrict);
        });
        model.Entity<NetworkNote>(e=>{
            e.ToTable("network_private_notes");e.HasKey(x=>x.Id);e.Property(x=>x.Text).HasMaxLength(4000);
            e.Property(x=>x.ContextType).HasMaxLength(32);e.Property(x=>x.Version).IsConcurrencyToken();
            e.HasIndex(x=>new{x.TenantId,x.AuthorMemberId,x.UpdatedAt});
            e.HasOne<MemberRecord>().WithMany().HasForeignKey(x=>x.AuthorMemberId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}

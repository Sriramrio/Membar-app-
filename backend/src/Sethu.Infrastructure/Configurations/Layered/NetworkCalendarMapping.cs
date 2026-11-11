using Microsoft.EntityFrameworkCore;
using Sethu.Service.Layered;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Domain.Entities;
namespace Sethu.Infrastructure.Layered;

public static class NetworkCalendarMapping
{
    public static void Configure(ModelBuilder model)
    {
        model.Entity<NetworkFreeEvent>(e=>{
            e.ToTable("network_free_events");e.HasKey(x=>x.Id);
            e.Property(x=>x.Title).HasMaxLength(160).IsRequired();e.Property(x=>x.Status).HasMaxLength(32);
            e.Property(x=>x.Version).IsConcurrencyToken();e.HasIndex(x=>new{x.TenantId,x.ChapterId,x.StartsAt});
            e.HasOne<MemberRecord>().WithMany().HasForeignKey(x=>x.OrganiserMemberId).OnDelete(DeleteBehavior.Restrict);
            e.ToTable(tb => tb.HasCheckConstraint("CK_network_free_event_capacity","\"Capacity\" > 0 AND \"Registered\" >= 0 AND \"Registered\" <= \"Capacity\""));
            e.ToTable(tb => tb.HasCheckConstraint("CK_network_free_event_time","\"EndsAt\" > \"StartsAt\""));
            e.ToTable(tb => tb.HasCheckConstraint("CK_network_free_event_no_payment","\"IsPaid\" = false"));
        });
        model.Entity<NetworkFreeRegistration>(e=>{
            e.ToTable("network_free_registrations");e.HasKey(x=>x.Id);
            e.Property(x=>x.Status).HasMaxLength(32);e.HasIndex(x=>new{x.TenantId,x.EventId,x.MemberId}).IsUnique();
            e.HasOne<NetworkFreeEvent>().WithMany().HasForeignKey(x=>x.EventId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<MemberRecord>().WithMany().HasForeignKey(x=>x.MemberId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}

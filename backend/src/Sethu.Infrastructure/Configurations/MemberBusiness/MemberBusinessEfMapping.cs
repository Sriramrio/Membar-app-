using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sethu.Service.MemberBusiness;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.Persistence;

namespace Sethu.Infrastructure.MemberBusiness;

public static class MemberBusinessEfMapping
{
    public static void Configure(ModelBuilder model)
    {
        model.Entity<MemberRecord>(e => {e.Ignore(x=>x.PendingEvents);e.ToTable("members");e.HasKey(x=>x.Id);e.HasIndex(x=>new{x.TenantId,x.UserId}).IsUnique();e.Property(x=>x.Version).IsConcurrencyToken();});
        model.Entity<BusinessRecord>(e => {e.Ignore(x=>x.PendingEvents);e.ToTable("businesses");e.HasKey(x=>x.Id);e.HasIndex(x=>new{x.TenantId,x.OwnerMemberId});e.HasIndex(x=>new{x.TenantId,x.SpecialisationId});e.Property(x=>x.Name).HasMaxLength(200).IsRequired();e.Property(x=>x.Version).IsConcurrencyToken();
            // One active business per member; drafts are not counted as active ownership.
            e.HasIndex(x=>new{x.TenantId,x.OwnerMemberId}).IsUnique().HasFilter("\"Status\" = 1");
            e.HasOne<MemberRecord>().WithMany().HasForeignKey(x=>x.OwnerMemberId).OnDelete(DeleteBehavior.Restrict);
        });
        model.Entity<MemberChapterAffiliation>(e => {e.Ignore(x=>x.PendingEvents);e.ToTable("member_chapter_affiliations");e.HasKey(x=>x.Id);e.HasIndex(x=>new{x.TenantId,x.MemberId,x.ChapterId});e.Property(x=>x.Version).IsConcurrencyToken();e.HasOne<MemberRecord>().WithMany().HasForeignKey(x=>x.MemberId).OnDelete(DeleteBehavior.Restrict);});
    }
}

using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sethu.Service.MembershipIntake;
using Sethu.Domain.Membership;
using Sethu.Infrastructure.Persistence;
namespace Sethu.Infrastructure.MembershipIntake;

public static class MemberIntakeEfMapping
{
    public static void Configure(ModelBuilder m)
    {
        m.Entity<MemberIntake>(e=>{
            e.ToTable("member_intakes");e.HasKey(x=>x.Id);e.Ignore(x=>x.PendingEvents);e.Property(x=>x.ProposedSpecialisationId).HasColumnName("SpecialisationId");
            e.HasIndex(x=>new{x.TenantId,x.ApplicantUserId}).IsUnique().HasFilter("\"State\" NOT IN (9,10,8)");
            e.HasIndex(x=>new{x.TenantId,x.ChapterId,x.State});
            e.Property(x=>x.BusinessName).HasMaxLength(200).IsRequired();
            e.Property(x=>x.Version).IsConcurrencyToken();
        });
    }
}

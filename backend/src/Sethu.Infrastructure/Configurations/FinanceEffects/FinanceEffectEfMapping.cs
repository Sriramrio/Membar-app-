using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Sethu.Domain.Finance;
using Sethu.Domain.MemberBusiness;
using Sethu.Domain.Membership;
using Sethu.Infrastructure.Finance;
using Sethu.Infrastructure.MemberBusiness;
using Sethu.Infrastructure.MembershipIntake;
using Sethu.Infrastructure.MembershipWorkflow;
using Sethu.Infrastructure.Persistence;
using Sethu.Infrastructure.Taxonomy;
using Sethu.Domain.Entities;

namespace Sethu.Infrastructure.FinanceEffects;

public static class FinanceEffectEfMapping
{
    public static void Configure(ModelBuilder model)
    {
        model.Entity<MembershipPeriod>(e=>{e.ToTable("membership_periods");e.HasKey(x=>x.Id);e.HasIndex(x=>new{x.TenantId,x.PaymentId}).IsUnique();e.HasIndex(x=>new{x.TenantId,x.MemberId,x.EndsOn});e.ToTable(tb => tb.HasCheckConstraint("CK_period_dates","\"EndsOn\" >= \"StartsOn\""));e.HasOne<MemberRecord>().WithMany().HasForeignKey(x=>x.MemberId).OnDelete(DeleteBehavior.Restrict);});
        model.Entity<ChapterActivity>(e=>{e.ToTable("chapter_activities");e.HasKey(x=>x.Id);e.HasIndex(x=>new{x.TenantId,x.ChapterId,x.Purpose});e.Property(x=>x.Version).IsConcurrencyToken();e.ToTable(tb => tb.HasCheckConstraint("CK_activity_capacity","\"Capacity\" IS NULL OR \"Capacity\" > 0"));});
        model.Entity<ChapterActivityRegistration>(e=>{e.ToTable("chapter_activity_registrations");e.HasKey(x=>x.Id);e.HasIndex(x=>new{x.TenantId,x.ActivityId,x.MemberId}).IsUnique();e.HasIndex(x=>new{x.TenantId,x.PaymentId}).IsUnique().HasFilter("\"PaymentId\" IS NOT NULL");e.Property(x=>x.Version).IsConcurrencyToken();e.HasOne<ChapterActivity>().WithMany().HasForeignKey(x=>x.ActivityId).OnDelete(DeleteBehavior.Restrict);e.HasOne<MemberRecord>().WithMany().HasForeignKey(x=>x.MemberId).OnDelete(DeleteBehavior.Restrict);});
        model.Entity<RenewalValidityPolicy>(e=>{e.ToTable("renewal_validity_policies");e.HasKey(x=>x.Id);e.HasIndex(x=>x.TenantId);e.ToTable(tb => tb.HasCheckConstraint("CK_renewal_months","\"DurationMonths\" > 0"));e.Property(x=>x.StartRule).HasMaxLength(32);});
    }
}

using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sethu.Service.MembershipIntake;
using Sethu.Domain.Membership;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Infrastructure.MembershipIntake;
using Sethu.Infrastructure.MemberBusiness;
using Sethu.Infrastructure.Taxonomy;
using Sethu.Infrastructure.Finance;
using Sethu.Domain.Finance;
using Sethu.Domain.Entities;
namespace Sethu.Infrastructure.MembershipWorkflow;

public static class IntakeWorkflowEfMapping
{
    public static void Configure(ModelBuilder m)
    {
        m.Entity<FinanceBeneficiaryPolicy>(e=>{e.ToTable("finance_beneficiary_policies");e.HasKey(x=>x.Id);e.HasIndex(x=>x.TenantId).IsUnique().HasFilter("\"Active\"");e.Property(x=>x.Beneficiary).HasMaxLength(160).IsRequired();e.Property(x=>x.Currency).HasMaxLength(3).IsRequired();e.ToTable(tb => tb.HasCheckConstraint("CK_finance_fee_positive","\"ExpectedAmount\" > 0"));});
        m.Entity<ChapterSpecialisationClaim>(e=>{e.ToTable("chapter_specialisation_claims");e.HasKey(x=>x.Id);e.HasIndex(x=>new{x.TenantId,x.ChapterId,x.SpecialisationId}).IsUnique().HasFilter("\"Active\"");e.HasIndex(x=>new{x.TenantId,x.MemberId}).IsUnique().HasFilter("\"Active\"");});
        m.Entity<IntakeRequiredDocumentPolicy>(e=>{e.ToTable("intake_required_document_policies");e.HasKey(x=>x.Id);e.Property(x=>x.DocumentKind).HasMaxLength(80).IsRequired();e.HasIndex(x=>new{x.TenantId,x.ChapterId,x.DocumentKind,x.PolicyVersion}).IsUnique();e.ToTable(tb => tb.HasCheckConstraint("CK_intake_document_policy_version","\"PolicyVersion\" > 0"));});
        m.Entity<IntakeDocument>(e=>{e.ToTable("intake_documents");e.HasKey(x=>x.Id);e.Property(x=>x.Kind).HasMaxLength(80);e.Property(x=>x.SecureReference).HasMaxLength(500);e.HasIndex(x=>new{x.TenantId,x.IntakeId,x.Kind,x.DocumentVersion}).IsUnique();e.HasOne<MemberIntake>().WithMany().HasForeignKey(x=>x.IntakeId).OnDelete(DeleteBehavior.Restrict);});
        m.Entity<IntakeDecision>(e=>{e.ToTable("intake_decisions");e.HasKey(x=>x.Id);e.Property(x=>x.Decision).HasMaxLength(90);e.Property(x=>x.EvidenceReference).HasMaxLength(500);e.HasIndex(x=>new{x.TenantId,x.IntakeId,x.Decision});e.HasIndex(x=>new{x.TenantId,x.IntakeId,x.ActorId,x.Decision}).IsUnique().HasFilter("\"Decision\" = 'ApproveCommittee'");e.HasOne<MemberIntake>().WithMany().HasForeignKey(x=>x.IntakeId).OnDelete(DeleteBehavior.Restrict);});
        m.Entity<CommitteeApprovalPolicy>(e=>{e.ToTable("intake_approval_policies");e.HasKey(x=>x.Id);e.HasIndex(x=>new{x.TenantId,x.ChapterId}).IsUnique();e.ToTable(tb => tb.HasCheckConstraint("CK_intake_required_approvals","\"RequiredApprovals\" > 0"));e.Property(x=>x.Version).IsConcurrencyToken();});
        m.Entity<IntakePayment>(e=>{e.ToTable("intake_payments");e.HasKey(x=>x.Id);e.HasIndex(x=>new{x.TenantId,x.Reference}).IsUnique();e.HasIndex(x=>new{x.TenantId,x.IntakeId});e.Property(x=>x.Reference).HasMaxLength(160);e.Property(x=>x.Currency).HasMaxLength(3);e.Property(x=>x.BankEvidenceReference).HasMaxLength(300);e.ToTable(tb => tb.HasCheckConstraint("CK_intake_payment_amount","\"Amount\" > 0"));});
        m.Entity<FinanceBankRecord>(e=>{e.ToTable("verified_finance_bank_records");e.HasKey(x=>x.Id);e.HasIndex(x=>new{x.TenantId,x.Reference}).IsUnique();e.Property(x=>x.Reference).HasMaxLength(160);e.Property(x=>x.Currency).HasMaxLength(3);e.Property(x=>x.Beneficiary).HasMaxLength(160);e.Property(x=>x.Provenance).HasMaxLength(300);e.Property(x=>x.SourceDigest).HasMaxLength(128);});
        m.Entity<IntakeCertificate>(e=>{e.ToTable("intake_certificates");e.HasKey(x=>x.Id);e.HasIndex(x=>new{x.TenantId,x.MemberId});e.Property(x=>x.SecureReference).HasMaxLength(500);});
        m.Entity<MemberChapterAffiliation>().HasIndex(x=>new{x.TenantId,x.MemberId}).IsUnique().HasFilter("\"Status\" = 1");
        m.Entity<BusinessRecord>().HasIndex(x=>new{x.TenantId,x.SpecialisationId});
    }
}

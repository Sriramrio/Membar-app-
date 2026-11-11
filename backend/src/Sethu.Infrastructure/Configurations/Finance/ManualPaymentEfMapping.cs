using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sethu.Service.Finance;
using Sethu.Domain.Finance;
using Sethu.Infrastructure.Persistence;
using Sethu.Domain.Entities;

namespace Sethu.Infrastructure.Finance;

public static class ManualPaymentEfMapping
{
    public static void Configure(ModelBuilder model)
    {
        model.Entity<FinanceProcessingPolicy>(e=> {e.ToTable("finance_processing_policies");e.HasKey(x=>x.Id);
            e.HasIndex(x=>new{x.TenantId,x.Purpose,x.OwnerType,x.OwnerUnitId,x.Version}).IsUnique();
            e.Property(x=>x.PostVerificationMode).HasMaxLength(12);
            e.ToTable(tb => tb.HasCheckConstraint("CK_finance_processing_mode","\"PostVerificationMode\" IN ('AUTOMATIC','MANUAL')"));});
        model.Entity<ReceivingAccount>(e=> {e.ToTable("receiving_accounts");e.HasKey(x=>x.Id);
            e.HasIndex(x=>new{x.TenantId,x.OwnerType,x.OwnerUnitId,x.Currency}).IsUnique().HasFilter("\"Active\"");
            e.Property(x=>x.MaskedReference).HasMaxLength(100);e.Property(x=>x.Currency).HasMaxLength(3);e.Property(x=>x.Version).IsConcurrencyToken();});
        model.Entity<GovernedPayment>(e=> {e.ToTable("governed_payments");e.HasKey(x=>x.Id);
            e.HasIndex(x=>new{x.TenantId,x.ContextId,x.Purpose});e.Property(x=>x.ExpectedAmount).HasPrecision(18,2);
            e.Property(x=>x.Currency).HasMaxLength(3);e.Property(x=>x.Version).IsConcurrencyToken();
            e.Property(x=>x.Status).HasMaxLength(40);e.ToTable(tb => tb.HasCheckConstraint("CK_governed_amount","\"ExpectedAmount\" > 0"));
            e.HasOne<ReceivingAccount>().WithMany().HasForeignKey(x=>x.ReceivingAccountId).OnDelete(DeleteBehavior.Restrict);});
        model.Entity<PaymentClaim>(e=> {e.ToTable("manual_payment_claims");e.HasKey(x=>x.Id);
            e.HasIndex(x=>new{x.TenantId,x.PaymentId}).IsUnique().HasFilter("NOT \"Superseded\"");
            e.Property(x=>x.Utr).HasMaxLength(140);e.Property(x=>x.Currency).HasMaxLength(3);
            e.Property(x=>x.Amount).HasPrecision(18,2);e.HasOne<GovernedPayment>().WithMany().HasForeignKey(x=>x.PaymentId).OnDelete(DeleteBehavior.Restrict);});
        model.Entity<ManualPaymentDecision>(e=> {e.ToTable("manual_payment_decisions");e.HasKey(x=>x.Id);
            e.HasIndex(x=>new{x.TenantId,x.OwnerUnitId,x.CheckedUtr}).IsUnique().HasFilter("\"Decision\" = 2");e.HasIndex(x=>new{x.TenantId,x.PaymentId});e.Property(x=>x.CheckedSource).HasMaxLength(80);
            e.Property(x=>x.CheckedUtr).HasMaxLength(140);e.Property(x=>x.ReasonCode).HasMaxLength(120);
            e.Property(x=>x.CheckedAmount).HasPrecision(18,2);e.HasOne<PaymentClaim>().WithMany().HasForeignKey(x=>x.ClaimId).OnDelete(DeleteBehavior.Restrict);});
    }
}

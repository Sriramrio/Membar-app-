using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;

namespace Sethu.Infrastructure.Configurations.ChapterOnboarding;

public static class ChapterOnboardingEfMapping
{
    public static void Configure(ModelBuilder model)
    {
        model.Entity<Chapter>(e =>
        {
            e.ToTable("chapters");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(256).IsRequired();
            e.Property(x => x.RegionId).HasColumnName("region_id").HasMaxLength(128);
            e.Property(x => x.StateId).HasColumnName("state_id").HasMaxLength(128);
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(64).IsRequired();
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.Image).HasColumnName("image");
            e.Property(x => x.Logo).HasColumnName("logo");
        });

        model.Entity<ChapterLeader>(e =>
        {
            e.ToTable("chapter_leaders");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.OrganizationId).HasColumnName("organization_id").IsRequired();
            e.Property(x => x.ChapterId).HasColumnName("chapter_id");
            e.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(256).IsRequired();
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(256).IsRequired();
            e.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(64);
            e.Property(x => x.Position).HasColumnName("position").HasMaxLength(128).IsRequired();
            e.Property(x => x.Role).HasColumnName("role").HasMaxLength(64).IsRequired();
            e.Property(x => x.PasswordHash).HasColumnName("password_hash").HasMaxLength(512).IsRequired();
            e.Property(x => x.MustChangePassword).HasColumnName("must_change_password").IsRequired();
            e.Property(x => x.IsActive).HasColumnName("is_active").IsRequired();
            e.Property(x => x.FailedLoginAttempts).HasColumnName("failed_login_attempts").IsRequired();
            e.Property(x => x.LockoutEnd).HasColumnName("lockout_end");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.Property(x => x.RelievedAt).HasColumnName("relieved_at");
            e.Property(x => x.SuspendedAt).HasColumnName("suspended_at");
            e.Property(x => x.ActionReason).HasColumnName("action_reason");

            // Uniqueness index: chapter-level positions (only 1 active person per chapter + position)
            e.HasIndex(x => new { x.ChapterId, x.Position })
             .HasFilter("\"is_active\" = true AND \"chapter_id\" IS NOT NULL")
             .IsUnique();

            // Uniqueness index: Trust position (only 1 active Trust per organization)
            e.HasIndex(x => new { x.OrganizationId, x.Position })
             .HasFilter("\"is_active\" = true AND \"position\" = 'Trust'")
             .IsUnique();

            e.HasIndex(x => x.Email);
        });

        model.Entity<MemberRoleAssignment>(e =>
        {
            e.ToTable("member_role_assignments");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.MemberId).HasColumnName("member_id").HasMaxLength(128).IsRequired();
            e.Property(x => x.ChapterId).HasColumnName("chapter_id").IsRequired();
            e.Property(x => x.RoleId).HasColumnName("role_id").HasMaxLength(128).IsRequired();
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(64).IsRequired();
            e.Property(x => x.AssignedAt).HasColumnName("assigned_at");
            e.Property(x => x.ValidUntil).HasColumnName("valid_until");
            e.HasIndex(x => new { x.ChapterId, x.RoleId });
            e.HasIndex(x => new { x.MemberId, x.ChapterId });
        });

        model.Entity<MemberRegistration>(e =>
        {
            e.ToTable("member_registrations");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(256).IsRequired();
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(256).IsRequired();
            e.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(64).IsRequired();
            e.Property(x => x.BusinessName).HasColumnName("business_name").HasMaxLength(256).IsRequired();
            e.Property(x => x.CategoryId).HasColumnName("category_id").HasMaxLength(128);
            e.Property(x => x.ChapterId).HasColumnName("chapter_id").IsRequired();
            e.Property(x => x.OnboardingStatus).HasColumnName("onboarding_status").HasMaxLength(64).IsRequired();
            e.Property(x => x.RegisteredBy).HasColumnName("registered_by").HasMaxLength(128);
            e.Property(x => x.RegisteredByPosition).HasColumnName("registered_by_position").HasMaxLength(64);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.HasIndex(x => x.ChapterId);
            e.HasIndex(x => x.OnboardingStatus);
        });

        model.Entity<PaymentRecord>(e =>
        {
            e.ToTable("payment_records");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.RegistrationId).HasColumnName("registration_id").IsRequired();
            e.Property(x => x.Amount).HasColumnName("amount").HasPrecision(18, 2);
            e.Property(x => x.PaymentRef).HasColumnName("payment_ref").HasMaxLength(256).IsRequired();
            e.Property(x => x.PaymentStatus).HasColumnName("payment_status").HasMaxLength(64).IsRequired();
            e.Property(x => x.VerifiedBy).HasColumnName("verified_by").HasMaxLength(256);
            e.Property(x => x.VerifiedAt).HasColumnName("verified_at");
            e.Property(x => x.Remarks).HasColumnName("remarks");
            e.Property(x => x.RejectionReason).HasColumnName("rejection_reason");
            e.HasIndex(x => x.RegistrationId);
        });

        model.Entity<DocumentVerification>(e =>
        {
            e.ToTable("document_verifications");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.RegistrationId).HasColumnName("registration_id").IsRequired();
            e.Property(x => x.DocumentUrl).HasColumnName("document_url").IsRequired();
            e.Property(x => x.VerifiedBy).HasColumnName("verified_by").HasMaxLength(128).IsRequired();
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(64).IsRequired();
            e.Property(x => x.Notes).HasColumnName("notes");
            e.Property(x => x.VerifiedAt).HasColumnName("verified_at");
            e.HasIndex(x => x.RegistrationId);
        });

        model.Entity<ChapterApproval>(e =>
        {
            e.ToTable("chapter_approvals");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.RegistrationId).HasColumnName("registration_id").IsRequired();
            e.Property(x => x.ApprovedBy).HasColumnName("approved_by").HasMaxLength(128).IsRequired();
            e.Property(x => x.RoleAtApproval).HasColumnName("role_at_approval").HasMaxLength(128).IsRequired();
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(64).IsRequired();
            e.Property(x => x.Remarks).HasColumnName("remarks");
            e.Property(x => x.ApprovedAt).HasColumnName("approved_at");
            e.HasIndex(x => x.RegistrationId);
        });

        model.Entity<ChapterGroupMembership>(e =>
        {
            e.ToTable("chapter_group_memberships");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.ChapterId).HasColumnName("chapter_id").IsRequired();
            e.Property(x => x.MemberId).HasColumnName("member_id").HasMaxLength(128).IsRequired();
            e.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(256).IsRequired();
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(256);
            e.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(64);
            e.Property(x => x.BusinessName).HasColumnName("business_name").HasMaxLength(256);
            e.Property(x => x.Role).HasColumnName("role").HasMaxLength(128);
            e.Property(x => x.JoinedAt).HasColumnName("joined_at");
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(64).IsRequired();
            e.HasIndex(x => new { x.ChapterId, x.MemberId }).IsUnique();
        });

        model.Entity<SystemBranding>(e =>
        {
            e.ToTable("system_branding");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").HasMaxLength(64);
            e.Property(x => x.SidebarLogo).HasColumnName("sidebar_logo");
            e.Property(x => x.HeaderLogo).HasColumnName("header_logo");
            e.Property(x => x.SethuSize).HasColumnName("sethu_size");
            e.Property(x => x.HeaderLogoSize).HasColumnName("header_logo_size");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        });
    }
}

using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;

namespace Sethu.Infrastructure.MemberModules;

public static class MemberModulesEfMapping
{
    public static void Configure(ModelBuilder model)
    {
        model.Entity<NetworkNotification>(e =>
        {
            e.ToTable("network_notifications");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.MemberId, x.IsRead });
        });

        model.Entity<Conversation>(e =>
        {
            e.ToTable("converse_conversations");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.Kind });
            e.Property(x => x.Version).IsConcurrencyToken();
        });

        model.Entity<ConversationMessage>(e =>
        {
            e.ToTable("converse_messages");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.ConversationId, x.CreatedAt });
        });

        model.Entity<AttendanceRecord>(e =>
        {
            e.ToTable("member_attendance_records");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.MemberId, x.EventId }).IsUnique();
        });

        model.Entity<NetworkTransaction>(e =>
        {
            e.ToTable("network_transactions");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.MemberId });
            e.HasIndex(x => new { x.TenantId, x.BuyerBusinessId });
            e.HasIndex(x => new { x.TenantId, x.CounterpartyBusinessId });
            e.Property(x => x.Version).IsConcurrencyToken();
        });

        model.Entity<SavedItem>(e =>
        {
            e.ToTable("member_saved_items");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.MemberId, x.ItemType, x.ItemId }).IsUnique();
        });

        model.Entity<ThankYouNote>(e =>
        {
            e.ToTable("thank_you_notes");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.AuthorMemberId });
            e.HasIndex(x => new { x.TenantId, x.RecipientMemberId });
        });

        model.Entity<NetworkAnnouncement>(e =>
        {
            e.ToTable("network_announcements");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.ChapterId });
        });

        model.Entity<AnnouncementAcknowledgement>(e =>
        {
            e.ToTable("announcement_acknowledgements");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.AnnouncementId, x.MemberId }).IsUnique();
        });

        model.Entity<NetworkNewsItem>(e =>
        {
            e.ToTable("network_news");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.PublishedAt });
        });

        model.Entity<NetworkGalleryItem>(e =>
        {
            e.ToTable("network_gallery_items");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.ChapterId });
        });

        model.Entity<NetworkPartner>(e =>
        {
            e.ToTable("network_partners");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.Name });
        });

        model.Entity<NetworkResource>(e =>
        {
            e.ToTable("network_resources");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.Category });
        });

        model.Entity<SupportTicket>(e =>
        {
            e.ToTable("support_tickets");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.MemberId });
        });

        model.Entity<MemberFamilyInfo>(e =>
        {
            e.ToTable("member_family_info");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.MemberId }).IsUnique();
        });

        model.Entity<MemberSettings>(e =>
        {
            e.ToTable("member_settings");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.MemberId }).IsUnique();
        });

        model.Entity<VisitorInvitation>(e =>
        {
            e.ToTable("visitor_invitations");
            e.HasKey(x => x.Id);
            e.Property(x => x.Reference).HasMaxLength(32).IsRequired();
            e.Property(x => x.IdempotencyKey).HasMaxLength(120).IsRequired();
            e.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
            e.Property(x => x.LastName).HasMaxLength(100).IsRequired();
            e.Property(x => x.CompanyName).HasMaxLength(200).IsRequired();
            e.Property(x => x.Email).HasMaxLength(254).IsRequired();
            e.Property(x => x.Mobile).HasMaxLength(32).IsRequired();
            e.Property(x => x.Status).HasMaxLength(32).IsRequired();
            e.HasIndex(x => x.Reference).IsUnique();
            e.HasIndex(x => new { x.TenantId, x.InviterMemberId, x.IdempotencyKey }).IsUnique();
            e.HasIndex(x => new { x.TenantId, x.ChapterId, x.CreatedAt });
            e.HasIndex(x => x.VisitorRegistrationId).IsUnique().HasFilter("\"VisitorRegistrationId\" IS NOT NULL");
            e.HasOne<Sethu.Domain.MemberBusiness.MemberRecord>().WithMany().HasForeignKey(x => x.InviterMemberId).OnDelete(Microsoft.EntityFrameworkCore.DeleteBehavior.Restrict);
            e.HasOne<Unit>().WithMany().HasForeignKey(x => x.ChapterId).OnDelete(Microsoft.EntityFrameworkCore.DeleteBehavior.Restrict);
            e.HasOne<VisitorRegistration>().WithMany().HasForeignKey(x => x.VisitorRegistrationId).OnDelete(Microsoft.EntityFrameworkCore.DeleteBehavior.Restrict);
        });

        model.Entity<VisitorEventAttendance>(e =>
        {
            e.ToTable("visitor_event_attendance"); e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.RegistrationId, x.EventId }).IsUnique();
            e.HasIndex(x => new { x.TenantId, x.ChapterId, x.VerifiedAt });
            e.HasOne<VisitorRegistration>().WithMany().HasForeignKey(x => x.RegistrationId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<NetworkFreeEvent>().WithMany().HasForeignKey(x => x.EventId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<Unit>().WithMany().HasForeignKey(x => x.ChapterId).OnDelete(DeleteBehavior.Restrict);
        });
        model.Entity<VisitorFollowUp>(e =>
        {
            e.ToTable("visitor_follow_ups"); e.HasKey(x => x.Id);
            e.Property(x => x.Outcome).HasMaxLength(32).IsRequired();
            e.Property(x => x.Notes).HasMaxLength(2000).IsRequired();
            e.HasIndex(x => new { x.TenantId, x.ChapterId, x.UpdatedAt });
            e.HasOne<VisitorRegistration>().WithMany().HasForeignKey(x => x.RegistrationId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<Unit>().WithMany().HasForeignKey(x => x.ChapterId).OnDelete(DeleteBehavior.Restrict);
        });

        model.Entity<VisitorIntakeLink>(e =>
        {
            e.ToTable("visitor_intake_links");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.RegistrationId }).IsUnique();
            e.HasIndex(x => new { x.TenantId, x.IntakeId }).IsUnique();
            e.HasIndex(x => new { x.TenantId, x.ChapterId, x.LinkedAt });
            e.HasOne<VisitorRegistration>().WithMany().HasForeignKey(x => x.RegistrationId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<Sethu.Domain.Membership.MemberIntake>().WithMany().HasForeignKey(x => x.IntakeId).OnDelete(DeleteBehavior.Restrict);
        });

        model.Entity<VisitorConversionCredit>(e =>
        {
            e.ToTable("visitor_conversion_credits");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.MemberId }).IsUnique();
            e.HasIndex(x => new { x.TenantId, x.IntakeId }).IsUnique();
            e.HasIndex(x => new { x.TenantId, x.RegistrationId }).IsUnique();
            e.HasIndex(x => new { x.TenantId, x.InvitationId }).IsUnique();
            e.HasIndex(x => new { x.TenantId, x.InviterMemberId, x.ActivatedAt });
            e.HasIndex(x => new { x.TenantId, x.ChapterId, x.ActivatedAt });
            e.HasOne<Sethu.Domain.Membership.MemberIntake>().WithMany().HasForeignKey(x => x.IntakeId).OnDelete(DeleteBehavior.Restrict);
        });

        model.Entity<VisitorRegistration>(e =>
        {
            e.ToTable("visitor_registrations");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.Email });
        });

        model.Entity<OtpChallengeRecord>(e =>
        {
            e.ToTable("otp_challenges");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.TargetType, x.TargetId });
        });

        model.Entity<DbnMemberRegistration>(e =>
        {
            e.ToTable("dbn_member_registrations");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.Stage });
            e.HasIndex(x => new { x.TenantId, x.ChapterId });
            e.HasIndex(x => new { x.TenantId, x.Email });
        });
    }
}


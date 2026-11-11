using System;

namespace Sethu.Domain.Entities;

public static class OnboardingStatus
{
    public const string PENDING_PAYMENT = "PENDING_PAYMENT";
    public const string PAYMENT_VERIFIED = "PAYMENT_VERIFIED";
    public const string PENDING_DOC_VERIFICATION = "PENDING_DOC_VERIFICATION";
    public const string DOC_VERIFIED = "DOC_VERIFIED";
    public const string PENDING_EXECUTIVE_APPROVAL = "PENDING_EXECUTIVE_APPROVAL";
    public const string APPROVED_AND_ACTIVE = "APPROVED_AND_ACTIVE";
    public const string REJECTED = "REJECTED";
}

public static class ChapterRole
{
    public const string President = "President";
    public const string Treasurer = "Treasurer";
    public const string VicePresident = "Treasurer"; // Aliased to Treasurer for Parivar Managing Committee
    public const string Secretary = "Secretary";
    public const string MemberCoordinator = "Member Coordinator";
    public const string LeadershipFinance = "Leadership Finance";
    public const string Trust = "Trust";
    public const string Trustee = "Trustee";
    public const string Member = "Member";
}

public sealed class Chapter
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public string? RegionId { get; set; }
    public string? StateId { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public string? Image { get; set; }
    public string? Logo { get; set; }
}

public sealed class ChapterLeader
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; } = Guid.Parse("00000000-0000-0000-0000-000000000001");
    public Guid? ChapterId { get; set; }
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string? Phone { get; set; }
    public string Position { get; set; } = ChapterRole.President;
    public string Role { get; set; } = "chapter_leader";
    public string PasswordHash { get; set; } = "";
    public bool MustChangePassword { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public int FailedLoginAttempts { get; set; } = 0;
    public DateTimeOffset? LockoutEnd { get; set; }
    public DateTimeOffset? RelievedAt { get; set; }
    public DateTimeOffset? SuspendedAt { get; set; }
    public string? ActionReason { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class MemberRoleAssignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string MemberId { get; set; } = "";
    public Guid ChapterId { get; set; }
    public string RoleId { get; set; } = ChapterRole.Member;
    public string Status { get; set; } = "ACTIVE";
    public DateTimeOffset AssignedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ValidUntil { get; set; }
}

public sealed class MemberRegistration
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string BusinessName { get; set; } = "";
    public string? CategoryId { get; set; }
    public Guid ChapterId { get; set; }
    public string OnboardingStatus { get; set; } = Entities.OnboardingStatus.PENDING_PAYMENT;
    public string? RegisteredBy { get; set; }
    public string? RegisteredByPosition { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class PaymentRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RegistrationId { get; set; }
    public decimal Amount { get; set; } = 6000m;
    public string PaymentRef { get; set; } = "";
    public string PaymentStatus { get; set; } = "SUCCESS";
    public string? VerifiedBy { get; set; }
    public DateTimeOffset? VerifiedAt { get; set; } = DateTimeOffset.UtcNow;
    public string? Remarks { get; set; }
    public string? RejectionReason { get; set; }
}

public sealed class DocumentVerification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RegistrationId { get; set; }
    public string DocumentUrl { get; set; } = "";
    public string VerifiedBy { get; set; } = "";
    public string Status { get; set; } = "VERIFIED";
    public string? Notes { get; set; }
    public DateTimeOffset VerifiedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class ChapterApproval
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RegistrationId { get; set; }
    public string ApprovedBy { get; set; } = "";
    public string RoleAtApproval { get; set; } = ChapterRole.President;
    public string Status { get; set; } = "APPROVED";
    public string? Remarks { get; set; }
    public DateTimeOffset ApprovedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class ChapterGroupMembership
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ChapterId { get; set; }
    public string MemberId { get; set; } = "";
    public string FullName { get; set; } = "";
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? BusinessName { get; set; }
    public string Role { get; set; } = ChapterRole.Member;
    public DateTimeOffset JoinedAt { get; set; } = DateTimeOffset.UtcNow;
    public string Status { get; set; } = "ACTIVE";
}

public sealed class SystemBranding
{
    public string Id { get; set; } = "default";
    public string? SidebarLogo { get; set; }
    public string? HeaderLogo { get; set; }
    public int? SethuSize { get; set; }
    public int? HeaderLogoSize { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}

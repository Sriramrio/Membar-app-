using System;

namespace Sethu.Domain.Entities;

public sealed class NetworkNotification
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid MemberId { get; set; }
    public string Title { get; set; } = "";
    public string Body { get; set; } = "";
    public string Type { get; set; } = "system";
    public string? ReferenceId { get; set; }
    public bool IsRead { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class Conversation
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Kind { get; set; } = "direct"; // direct, chapter, chapter-group
    public string? Subject { get; set; }
    public string? GroupName { get; set; }
    public string? Chapter { get; set; }
    public string ParticipantIdsJson { get; set; } = "[]";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public long Version { get; set; } = 1;
}

public sealed class ConversationMessage
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid ConversationId { get; set; }
    public Guid SenderMemberId { get; set; }
    public string Text { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class AttendanceRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid MemberId { get; set; }
    public Guid EventId { get; set; }
    public string Status { get; set; } = "present"; // present, absent, late, excused
    public bool Finalised { get; set; }
    public string? PriorStatus { get; set; }
    public string? CorrectionReason { get; set; }
    public string? CorrectionStatus { get; set; } // none, pending, approved, rejected
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class NetworkTransaction
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid MemberId { get; set; }
    public Guid BuyerBusinessId { get; set; }
    public Guid CounterpartyBusinessId { get; set; }
    public Guid? ReferenceId { get; set; }
    public Guid? OpportunityId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string Status { get; set; } = "recorded"; // draft, recorded, acknowledged, verified, won, closed
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public long Version { get; set; } = 1;
}

public sealed class SavedItem
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid MemberId { get; set; }
    public string ItemType { get; set; } = ""; // business, opportunity
    public Guid ItemId { get; set; }
    public DateTimeOffset SavedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class ThankYouNote
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid AuthorMemberId { get; set; }
    public Guid RecipientMemberId { get; set; }
    public Guid? TransactionId { get; set; }
    public Guid? ReferenceId { get; set; }
    public string Message { get; set; } = "";
    public decimal? Amount { get; set; }
    public string Status { get; set; } = "sent"; // sent, acknowledged
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class NetworkAnnouncement
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid? ChapterId { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public string? ScopeId { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public string ScopeLevel { get; set; } = "CHAPTER";
    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public bool IncludeDescendants { get; set; } = true;
    public string Title { get; set; } = "";
    public string Content { get; set; } = "";
    public string Priority { get; set; } = "info"; // info, urgent, critical
    public DateTimeOffset PublishedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ExpiresAt { get; set; }
}

public sealed class AnnouncementAcknowledgement
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid AnnouncementId { get; set; }
    public Guid MemberId { get; set; }
    public DateTimeOffset AcknowledgedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class NetworkNewsItem
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public string? ScopeId { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public string ScopeLevel { get; set; } = "NATIONAL";
    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public bool IncludeDescendants { get; set; } = true;
    public string Title { get; set; } = "";
    public string Summary { get; set; } = "";
    public string Content { get; set; } = "";
    public string Category { get; set; } = "General";
    public DateTimeOffset PublishedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class NetworkGalleryItem
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Title { get; set; } = "";
    public string ImageUrl { get; set; } = "";
    public Guid? ChapterId { get; set; }
    public Guid? EventId { get; set; }
    public bool Published { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class NetworkPartner
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string? LogoUrl { get; set; }
    public string? WebsiteUrl { get; set; }
    public string Tier { get; set; } = "Silver";
}

public sealed class NetworkResource
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Category { get; set; } = "Guide";
    public string FileUrl { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class SupportTicket
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid MemberId { get; set; }
    public string Subject { get; set; } = "";
    public string Description { get; set; } = "";
    public string Priority { get; set; } = "Normal";
    public string Status { get; set; } = "open"; // open, in-progress, resolved, closed
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class MemberFamilyInfo
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid MemberId { get; set; }
    public string? SpouseName { get; set; }
    public string? AnniversaryDate { get; set; }
    public string? Children { get; set; }
    public string? Notes { get; set; }
}

public sealed class MemberSettings
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid MemberId { get; set; }
    public string? PrivacySettingsJson { get; set; }
    public string? NotificationSettingsJson { get; set; }
}

public sealed class VisitorRegistration
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public Guid ChapterId { get; set; }
    public string ChapterName { get; set; } = "";
    public string VisitingDate { get; set; } = "";
    public string? BusinessName { get; set; }
    public bool Verified { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class OtpChallengeRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string TargetType { get; set; } = ""; // account, visitor, contact
    public string TargetId { get; set; } = "";
    public string CodeHash { get; set; } = "";
    public string Purpose { get; set; } = ""; // login, recovery, activation, visitor, contact
    public string Destination { get; set; } = "";
    public DateTimeOffset ExpiresAt { get; set; }
    public int Attempts { get; set; }
    public bool Verified { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class DbnMemberRegistration
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid? ChapterId { get; set; }
    public string ChapterName { get; set; } = "Hosur Chapter";

    // Section A: Applicant & Basic Details
    public string ApplicantFullName { get; set; } = "";
    public string DateOfBirth { get; set; } = "";
    public string MobileNumber { get; set; } = "";
    public string Email { get; set; } = "";
    public string ResidentialAddress { get; set; } = "";
    public string ResidentialCity { get; set; } = "";
    public string ResidentialPinCode { get; set; } = "";

    // Section B: Business Profile
    public string BusinessName { get; set; } = "";
    public string ApplicantDesignation { get; set; } = "";
    public string PrimaryBusinessCategory { get; set; } = "";
    public Guid? SectorId { get; set; }
    public string? SectorName { get; set; }
    public Guid? SegmentId { get; set; }
    public string? SegmentName { get; set; }
    public Guid? SpecialisationId { get; set; }
    public string? SpecialisationName { get; set; }
    public string ProductsServicesOffered { get; set; } = "";
    public string YearEstablished { get; set; } = "";
    public string EmployeeCountRange { get; set; } = "";
    public string BusinessAddress { get; set; } = "";
    public string BusinessCity { get; set; } = "";
    public string BusinessPinCode { get; set; } = "";
    public string? Gstin { get; set; }
    public string? WebsiteOrLinkedIn { get; set; }
    public string? ConnectionsCanGiveJson { get; set; }

    // Section C: Personal & Community Details
    public string? FatherName { get; set; }
    public string? Gothram { get; set; }
    public string? HobbiesInterests { get; set; }
    public string? SpecialMention { get; set; }

    // Section D: Business & Networking Profile
    public string? BusinessDescription { get; set; }
    public string? IdealCustomerProfilesJson { get; set; }
    public string? BusinessConnectionsSought { get; set; }
    public string? GeographicMarketsServedJson { get; set; }
    public string? KeyDifferentiator { get; set; }
    public string? BusinessContactEmail { get; set; }

    // Section E: Declarations & Consent
    public bool AgreedToGuidelines { get; set; }
    public bool InformationAccurate { get; set; }
    public bool DataUsageConsent { get; set; }
    public bool BirthdayGreetingConsent { get; set; }
    public bool VoluntaryContributionAcknowledged { get; set; }
    public string ElectronicSignature { get; set; } = "";
    public string DeclarationDate { get; set; } = "";

    // Section F: Trust Payment Details
    public decimal DonationAmount { get; set; } = 6000m;
    public string PaymentMode { get; set; } = "UPI"; // UPI, NEFT, Cheque
    public string? UpiReference { get; set; }
    public string? NeftReference { get; set; }
    public string? ChequeNumber { get; set; }
    public string? ChequeDate { get; set; }
    public string BankFavoring { get; set; } = "Dharmic Business Network Trust";

    // Workflow Stages: Submitted -> DocumentsVerified -> CommitteeApproved -> Activated
    public string Stage { get; set; } = "Submitted";

    // Document Verification Audit
    public string? DocumentsVerifiedBy { get; set; }
    public string? DocumentsVerifiedRole { get; set; }
    public DateTimeOffset? DocumentsVerifiedAt { get; set; }

    // Committee Member Approval Audit
    public string? CommitteeApprovedBy { get; set; }
    public string? CommitteeApprovedRole { get; set; }
    public DateTimeOffset? CommitteeApprovedAt { get; set; }

    // DBN Trust Administrator Payment Verification & Activation Audit
    public string? TrustPaymentVerifiedBy { get; set; }
    public string? TrustPaymentVerifiedRole { get; set; }
    public DateTimeOffset? TrustPaymentVerifiedAt { get; set; }
    public string? AssignedMemberId { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}


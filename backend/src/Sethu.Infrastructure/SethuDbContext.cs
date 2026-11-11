using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Data;
using Sethu.Service.Security;
using Sethu.Domain.Organisation;
using Sethu.Domain.Security;
using System.Text.Json;
using Sethu.Domain.Entities;

namespace Sethu.Infrastructure.Persistence;

public sealed class SethuDbContext(DbContextOptions<SethuDbContext> options) : DbContext(options)
{
    public DbSet<UserIdentity> UserIdentities => Set<UserIdentity>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<PermissionGrant> PermissionGrants => Set<PermissionGrant>();
    public DbSet<Delegation> Delegations => Set<Delegation>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<Committee> Committees => Set<Committee>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<Idempotency> Idempotency => Set<Idempotency>();
    public DbSet<Audit> Audits => Set<Audit>();
    public DbSet<Outbox> Outbox => Set<Outbox>();

    public DbSet<NetworkNotification> Notifications => Set<NetworkNotification>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<ConversationMessage> Messages => Set<ConversationMessage>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<NetworkTransaction> Transactions => Set<NetworkTransaction>();
    public DbSet<SavedItem> SavedItems => Set<SavedItem>();
    public DbSet<ThankYouNote> ThankYouNotes => Set<ThankYouNote>();
    public DbSet<NetworkAnnouncement> Announcements => Set<NetworkAnnouncement>();
    public DbSet<AnnouncementAcknowledgement> AnnouncementAcknowledgements => Set<AnnouncementAcknowledgement>();
    public DbSet<NetworkNewsItem> NewsItems => Set<NetworkNewsItem>();
    public DbSet<NetworkGalleryItem> GalleryItems => Set<NetworkGalleryItem>();
    public DbSet<NetworkPartner> Partners => Set<NetworkPartner>();
    public DbSet<NetworkResource> Resources => Set<NetworkResource>();
    public DbSet<SupportTicket> SupportTickets => Set<SupportTicket>();
    public DbSet<MemberFamilyInfo> FamilyInfos => Set<MemberFamilyInfo>();
    public DbSet<MemberSettings> MemberSettings => Set<MemberSettings>();
    public DbSet<VisitorEventAttendance> VisitorEventAttendances => Set<VisitorEventAttendance>();
    public DbSet<VisitorFollowUp> VisitorFollowUps => Set<VisitorFollowUp>();
    public DbSet<VisitorInvitation> VisitorInvitations => Set<VisitorInvitation>();
    public DbSet<VisitorIntakeLink> VisitorIntakeLinks => Set<VisitorIntakeLink>();
    public DbSet<VisitorConversionCredit> VisitorConversionCredits => Set<VisitorConversionCredit>();
    public DbSet<VisitorRegistration> VisitorRegistrations => Set<VisitorRegistration>();
    public DbSet<OtpChallengeRecord> OtpChallenges => Set<OtpChallengeRecord>();
    public DbSet<MembershipRegistrationLink> MembershipRegistrationLinks => Set<MembershipRegistrationLink>();
    public DbSet<DbnMemberRegistration> DbnMemberRegistrations => Set<DbnMemberRegistration>();

    public DbSet<TaskRecord> OrganisationTasks => Set<TaskRecord>();
    public DbSet<ActionItemRecord> OrganisationActions => Set<ActionItemRecord>();
    public DbSet<ApprovalRecord> OrganisationApprovals => Set<ApprovalRecord>();
    public DbSet<MeetingRecord> OrganisationMeetings => Set<MeetingRecord>();
    public DbSet<MemberCaseRecord> OrganisationMemberCases => Set<MemberCaseRecord>();
    public DbSet<ProgrammeRecord> OrganisationProgrammes => Set<ProgrammeRecord>();
    public DbSet<EscalationRecord> OrganisationEscalations => Set<EscalationRecord>();
    public DbSet<HandoffRecord> OrganisationHandoffs => Set<HandoffRecord>();
    public DbSet<OperationalExceptionRecord> OrganisationExceptions => Set<OperationalExceptionRecord>();
    public DbSet<RiskRecord> OrganisationRisks => Set<RiskRecord>();
    public DbSet<IssueRecord> OrganisationIssues => Set<IssueRecord>();
    public DbSet<DecisionRecord> OrganisationDecisions => Set<DecisionRecord>();
    public DbSet<JobRecord> OrganisationJobs => Set<JobRecord>();
    public DbSet<GoalRecord> OrganisationGoals => Set<GoalRecord>();
    public DbSet<CommunicationRecord> OrganisationCommunications => Set<CommunicationRecord>();
    public DbSet<FeedbackRecord> OrganisationFeedbacks => Set<FeedbackRecord>();
    public DbSet<DataQualityFindingRecord> OrganisationDataQualityFindings => Set<DataQualityFindingRecord>();
    public DbSet<KytRecord> OrganisationKyts => Set<KytRecord>();
    public DbSet<MemberPresentationRecord> OrganisationMemberPresentations => Set<MemberPresentationRecord>();
    public DbSet<MemberAvailabilityRecord> OrganisationMemberAvailabilities => Set<MemberAvailabilityRecord>();
    public DbSet<HandoverRecord> OrganisationHandovers => Set<HandoverRecord>();
    public DbSet<EventRsvpRecord> EventRsvps => Set<EventRsvpRecord>();

        public DbSet<Chapter> Chapters => Set<Chapter>();
    public DbSet<ChapterLeader> ChapterLeaders => Set<ChapterLeader>();
    public DbSet<MemberRoleAssignment> MemberRoleAssignments => Set<MemberRoleAssignment>();
    public DbSet<MemberRegistration> MemberRegistrations => Set<MemberRegistration>();
    public DbSet<PaymentRecord> PaymentRecords => Set<PaymentRecord>();
    public DbSet<DocumentVerification> DocumentVerifications => Set<DocumentVerification>();
    public DbSet<ChapterApproval> ChapterApprovals => Set<ChapterApproval>();
    public DbSet<ChapterGroupMembership> ChapterGroupMemberships => Set<ChapterGroupMembership>();
    public DbSet<SystemBranding> SystemBrandings => Set<SystemBranding>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        Sethu.Infrastructure.MemberBusiness.MemberBusinessEfMapping.Configure(model);
        Sethu.Infrastructure.MembershipIntake.MemberIntakeEfMapping.Configure(model);
        Sethu.Infrastructure.MembershipWorkflow.IntakeWorkflowEfMapping.Configure(model);
        Sethu.Infrastructure.Finance.ManualPaymentEfMapping.Configure(model);
        Sethu.Infrastructure.FinanceEffects.FinanceEffectEfMapping.Configure(model);
        Sethu.Infrastructure.Taxonomy.TaxonomyEfMapping.Configure(model);
        Sethu.Infrastructure.MemberNetwork.MemberNetworkMapping.Configure(model);
        Sethu.Infrastructure.Layered.NetworkReferenceMapping.Configure(model);
        Sethu.Infrastructure.Layered.ConnectionTransitionMapping.Configure(model);
        Sethu.Infrastructure.Layered.NetworkWorkspaceMapping.Configure(model);
        Sethu.Infrastructure.Layered.NetworkCalendarMapping.Configure(model);
        Sethu.Infrastructure.MemberModules.MemberModulesEfMapping.Configure(model);
        Sethu.Infrastructure.Configurations.ChapterOnboarding.ChapterOnboardingEfMapping.Configure(model);
        model.HasDefaultSchema("public");
        model.Entity<MembershipRegistrationLink>(e=> {
            e.ToTable("membership_registration_links"); e.HasKey(x=>x.Id);
            e.HasIndex(x=>new{x.TenantId,x.RegistrationId}).IsUnique();
            e.HasIndex(x=>new{x.TenantId,x.IntakeId}).IsUnique();
            e.HasIndex(x=>new{x.TenantId,x.ApplicantUserId});
            e.Property(x=>x.EvidenceReference).HasMaxLength(512).IsRequired();
            e.HasOne<DbnMemberRegistration>().WithMany().HasForeignKey(x=>x.RegistrationId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<Sethu.Domain.Membership.MemberIntake>().WithMany().HasForeignKey(x=>x.IntakeId).OnDelete(DeleteBehavior.Restrict);
        });
        model.Entity<UserIdentity>(e=> {e.ToTable("user_identities");e.HasKey(x=>x.Id);e.Property(x=>x.Issuer).HasMaxLength(256);e.Property(x=>x.Subject).HasMaxLength(256);e.HasIndex(x=>new{x.Issuer,x.Subject}).IsUnique();e.HasIndex(x=>new{x.TenantId,x.Id});});
        model.Entity<Session>(e=> {e.ToTable("sessions");e.HasKey(x=>x.Id);e.Property(x=>x.Issuer).HasMaxLength(256);e.Property(x=>x.SessionId).HasMaxLength(256);e.HasIndex(x=>new{x.Issuer,x.SessionId}).IsUnique();e.HasIndex(x=>x.UserId);});
        model.Entity<PermissionGrant>(e=> {e.ToTable("permission_grants");e.HasKey(x=>x.Id);e.Property(x=>x.Permission).HasMaxLength(160);e.HasIndex(x=>new{x.TenantId,x.UserId,x.Permission});});
        model.Entity<Delegation>(e=> {e.ToTable("delegations");e.HasKey(x=>x.Id);e.Property(x=>x.Permission).HasMaxLength(160);e.HasIndex(x=>new{x.TenantId,x.DelegatorId,x.DelegateId}); e.ToTable(tb => tb.HasCheckConstraint("CK_delegation_tenure", "\"EndsAt\" > \"StartsAt\""));});
        model.Entity<Unit>(e => { e.ToTable("organisation_units"); e.HasKey(x=>x.Id); e.Property(x=>x.Version).IsConcurrencyToken(); e.Property(x=>x.Code).HasMaxLength(80).IsRequired(); e.HasIndex(x=>new{x.TenantId,x.Code}).IsUnique(); e.HasIndex(x=>new{x.TenantId,x.ParentId}); e.HasOne<Unit>().WithMany().HasForeignKey(x=>x.ParentId).OnDelete(DeleteBehavior.Restrict); });
        model.Entity<Committee>(e => {e.ToTable("committees"); e.HasKey(x=>new{x.TenantId,x.ChapterId}); e.Property(x=>x.Version).IsConcurrencyToken();});
        model.Entity<Appointment>(e => {e.ToTable("appointments");e.HasKey(x=>x.Id);e.Property(x=>x.RoleCode).HasMaxLength(128);e.HasIndex(x=>new{x.TenantId,x.ChapterId,x.RoleCode});e.ToTable(tb => tb.HasCheckConstraint("CK_appointment_tenure", "\"EndsAt\" > \"StartsAt\""));});
        model.Entity<Idempotency>(e => {e.ToTable("idempotency");e.HasKey(x=>new{x.TenantId,x.ActorId,x.Operation,x.Key});e.Property(x=>x.Operation).HasMaxLength(128);e.Property(x=>x.Key).HasMaxLength(128);e.Property(x=>x.PayloadSha256).HasMaxLength(64);});
        model.Entity<Audit>(e => {e.ToTable("audit_events");e.HasKey(x=>x.Id);e.HasIndex(x=>new{x.TenantId,x.ResourceId});});
        model.Entity<Outbox>(e => {e.ToTable("outbox_messages");e.HasKey(x=>x.Id);e.HasIndex(x=>x.DispatchedAt);});

        model.Entity<TaskRecord>(e => { e.ToTable("organisation_tasks"); e.HasKey(x => x.Id); });
        model.Entity<ActionItemRecord>(e => { e.ToTable("organisation_actions"); e.HasKey(x => x.Id); });
        model.Entity<ApprovalRecord>(e => { e.ToTable("organisation_approvals"); e.HasKey(x => x.Id); });
        model.Entity<MeetingRecord>(e => { e.ToTable("organisation_meetings"); e.HasKey(x => x.Id); });
        model.Entity<MemberCaseRecord>(e => { e.ToTable("organisation_member_cases"); e.HasKey(x => x.Id); });
        model.Entity<ProgrammeRecord>(e => { e.ToTable("organisation_programmes"); e.HasKey(x => x.Id); });
        model.Entity<EscalationRecord>(e => { e.ToTable("organisation_escalations"); e.HasKey(x => x.Id); });
        model.Entity<HandoffRecord>(e => { e.ToTable("organisation_handoffs"); e.HasKey(x => x.Id); });
        model.Entity<OperationalExceptionRecord>(e => { e.ToTable("organisation_exceptions"); e.HasKey(x => x.Id); });
        model.Entity<RiskRecord>(e => { e.ToTable("organisation_risks"); e.HasKey(x => x.Id); });
        model.Entity<IssueRecord>(e => { e.ToTable("organisation_issues"); e.HasKey(x => x.Id); });
        model.Entity<DecisionRecord>(e => { e.ToTable("organisation_decisions"); e.HasKey(x => x.Id); });
        model.Entity<JobRecord>(e => { e.ToTable("organisation_jobs"); e.HasKey(x => x.Id); });
        model.Entity<GoalRecord>(e => { e.ToTable("organisation_goals"); e.HasKey(x => x.Id); });
        model.Entity<CommunicationRecord>(e =>
        {
            e.ToTable("organisation_communications");
            e.HasKey(x => x.Id);
            e.Ignore(x => x.AudienceLevel);
            e.Ignore(x => x.AudienceScopeId);
            e.Ignore(x => x.IncludeDescendants);
        });
        model.Entity<FeedbackRecord>(e => { e.ToTable("organisation_feedback"); e.HasKey(x => x.Id); });
        model.Entity<DataQualityFindingRecord>(e => { e.ToTable("organisation_data_quality"); e.HasKey(x => x.Id); });
        model.Entity<KytRecord>(e => { e.ToTable("organisation_kyt"); e.HasKey(x => x.Id); });
        model.Entity<MemberPresentationRecord>(e => { e.ToTable("organisation_member_presentations"); e.HasKey(x => x.Id); });
        model.Entity<MemberAvailabilityRecord>(e => { e.ToTable("organisation_member_availability"); e.HasKey(x => x.Id); });
        model.Entity<HandoverRecord>(e => { e.ToTable("organisation_handovers"); e.HasKey(x => x.Id); });
        model.Entity<EventRsvpRecord>(e =>
        {
            e.ToTable("event_rsvps");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.EventId, x.MemberId }).IsUnique();
        });
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sethu.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganisationTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "dbn_member_registrations",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChapterId = table.Column<Guid>(type: "uuid", nullable: true),
                    ChapterName = table.Column<string>(type: "text", nullable: false),
                    ApplicantFullName = table.Column<string>(type: "text", nullable: false),
                    DateOfBirth = table.Column<string>(type: "text", nullable: false),
                    MobileNumber = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    ResidentialAddress = table.Column<string>(type: "text", nullable: false),
                    ResidentialCity = table.Column<string>(type: "text", nullable: false),
                    ResidentialPinCode = table.Column<string>(type: "text", nullable: false),
                    BusinessName = table.Column<string>(type: "text", nullable: false),
                    ApplicantDesignation = table.Column<string>(type: "text", nullable: false),
                    PrimaryBusinessCategory = table.Column<string>(type: "text", nullable: false),
                    ProductsServicesOffered = table.Column<string>(type: "text", nullable: false),
                    YearEstablished = table.Column<string>(type: "text", nullable: false),
                    EmployeeCountRange = table.Column<string>(type: "text", nullable: false),
                    BusinessAddress = table.Column<string>(type: "text", nullable: false),
                    BusinessCity = table.Column<string>(type: "text", nullable: false),
                    BusinessPinCode = table.Column<string>(type: "text", nullable: false),
                    Gstin = table.Column<string>(type: "text", nullable: true),
                    WebsiteOrLinkedIn = table.Column<string>(type: "text", nullable: true),
                    FatherName = table.Column<string>(type: "text", nullable: false),
                    Gothram = table.Column<string>(type: "text", nullable: false),
                    HobbiesInterests = table.Column<string>(type: "text", nullable: false),
                    SpecialMention = table.Column<string>(type: "text", nullable: true),
                    BusinessDescription = table.Column<string>(type: "text", nullable: false),
                    IdealCustomerProfilesJson = table.Column<string>(type: "text", nullable: false),
                    BusinessConnectionsSought = table.Column<string>(type: "text", nullable: false),
                    GeographicMarketsServedJson = table.Column<string>(type: "text", nullable: false),
                    KeyDifferentiator = table.Column<string>(type: "text", nullable: false),
                    AgreedToGuidelines = table.Column<bool>(type: "boolean", nullable: false),
                    InformationAccurate = table.Column<bool>(type: "boolean", nullable: false),
                    DataUsageConsent = table.Column<bool>(type: "boolean", nullable: false),
                    ElectronicSignature = table.Column<string>(type: "text", nullable: false),
                    DeclarationDate = table.Column<string>(type: "text", nullable: false),
                    DonationAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    PaymentMode = table.Column<string>(type: "text", nullable: false),
                    UpiReference = table.Column<string>(type: "text", nullable: true),
                    NeftReference = table.Column<string>(type: "text", nullable: true),
                    ChequeNumber = table.Column<string>(type: "text", nullable: true),
                    ChequeDate = table.Column<string>(type: "text", nullable: true),
                    BankFavoring = table.Column<string>(type: "text", nullable: false),
                    Stage = table.Column<string>(type: "text", nullable: false),
                    DocumentsVerifiedBy = table.Column<string>(type: "text", nullable: true),
                    DocumentsVerifiedRole = table.Column<string>(type: "text", nullable: true),
                    DocumentsVerifiedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CommitteeApprovedBy = table.Column<string>(type: "text", nullable: true),
                    CommitteeApprovedRole = table.Column<string>(type: "text", nullable: true),
                    CommitteeApprovedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    TrustPaymentVerifiedBy = table.Column<string>(type: "text", nullable: true),
                    TrustPaymentVerifiedRole = table.Column<string>(type: "text", nullable: true),
                    TrustPaymentVerifiedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    AssignedMemberId = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_dbn_member_registrations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organisation_actions",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScopeId = table.Column<string>(type: "text", nullable: false),
                    ScopeLevel = table.Column<string>(type: "text", nullable: false),
                    ScopeName = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Owner = table.Column<string>(type: "text", nullable: false),
                    SourceType = table.Column<string>(type: "text", nullable: false),
                    SourceId = table.Column<string>(type: "text", nullable: false),
                    Due = table.Column<string>(type: "text", nullable: false),
                    Priority = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_actions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organisation_approvals",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScopeId = table.Column<string>(type: "text", nullable: false),
                    ScopeLevel = table.Column<string>(type: "text", nullable: false),
                    ScopeName = table.Column<string>(type: "text", nullable: false),
                    Subject = table.Column<string>(type: "text", nullable: false),
                    Requester = table.Column<string>(type: "text", nullable: false),
                    SourceType = table.Column<string>(type: "text", nullable: false),
                    SourceId = table.Column<string>(type: "text", nullable: false),
                    Due = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Risk = table.Column<string>(type: "text", nullable: false),
                    DecisionReason = table.Column<string>(type: "text", nullable: true),
                    DecidedBy = table.Column<string>(type: "text", nullable: true),
                    DecidedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_approvals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organisation_communications",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScopeId = table.Column<string>(type: "text", nullable: false),
                    ScopeName = table.Column<string>(type: "text", nullable: false),
                    ScopeLevel = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Audience = table.Column<string>(type: "text", nullable: false),
                    PublishedAt = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_communications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organisation_data_quality",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScopeId = table.Column<string>(type: "text", nullable: false),
                    ScopeName = table.Column<string>(type: "text", nullable: false),
                    ScopeLevel = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Severity = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    EntityType = table.Column<string>(type: "text", nullable: false),
                    EntityId = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_data_quality", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organisation_decisions",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScopeId = table.Column<string>(type: "text", nullable: false),
                    ScopeName = table.Column<string>(type: "text", nullable: false),
                    ScopeLevel = table.Column<string>(type: "text", nullable: false),
                    Subject = table.Column<string>(type: "text", nullable: false),
                    Authority = table.Column<string>(type: "text", nullable: false),
                    SourceType = table.Column<string>(type: "text", nullable: false),
                    SourceId = table.Column<string>(type: "text", nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: false),
                    EffectiveDate = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_decisions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organisation_escalations",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    SourceType = table.Column<string>(type: "text", nullable: false),
                    SourceId = table.Column<string>(type: "text", nullable: false),
                    FromScopeId = table.Column<string>(type: "text", nullable: false),
                    FromScopeName = table.Column<string>(type: "text", nullable: false),
                    FromScopeLevel = table.Column<string>(type: "text", nullable: false),
                    ToScopeId = table.Column<string>(type: "text", nullable: false),
                    ToScopeName = table.Column<string>(type: "text", nullable: false),
                    ToScopeLevel = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Owner = table.Column<string>(type: "text", nullable: false),
                    Severity = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_escalations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organisation_exceptions",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScopeId = table.Column<string>(type: "text", nullable: false),
                    ScopeName = table.Column<string>(type: "text", nullable: false),
                    ScopeLevel = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Decision = table.Column<string>(type: "text", nullable: false),
                    Owner = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_exceptions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organisation_feedback",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScopeId = table.Column<string>(type: "text", nullable: false),
                    ScopeName = table.Column<string>(type: "text", nullable: false),
                    ScopeLevel = table.Column<string>(type: "text", nullable: false),
                    Kind = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ResponsesCount = table.Column<int>(type: "integer", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_feedback", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organisation_goals",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScopeId = table.Column<string>(type: "text", nullable: false),
                    ScopeName = table.Column<string>(type: "text", nullable: false),
                    ScopeLevel = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Progress = table.Column<int>(type: "integer", nullable: false),
                    Owner = table.Column<string>(type: "text", nullable: false),
                    ReviewCadence = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_goals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organisation_handoffs",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceWorkspace = table.Column<string>(type: "text", nullable: false),
                    SourceType = table.Column<string>(type: "text", nullable: false),
                    SourceId = table.Column<string>(type: "text", nullable: false),
                    TargetWorkspace = table.Column<string>(type: "text", nullable: false),
                    RequestedCapability = table.Column<string>(type: "text", nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    TargetReference = table.Column<string>(type: "text", nullable: true),
                    CorrelationId = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_handoffs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organisation_issues",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScopeId = table.Column<string>(type: "text", nullable: false),
                    ScopeName = table.Column<string>(type: "text", nullable: false),
                    ScopeLevel = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Owner = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Impact = table.Column<string>(type: "text", nullable: false),
                    SourceType = table.Column<string>(type: "text", nullable: false),
                    SourceId = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_issues", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organisation_jobs",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScopeId = table.Column<string>(type: "text", nullable: false),
                    ScopeName = table.Column<string>(type: "text", nullable: false),
                    ScopeLevel = table.Column<string>(type: "text", nullable: false),
                    Kind = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    RequestedBy = table.Column<string>(type: "text", nullable: false),
                    RequestedAt = table.Column<string>(type: "text", nullable: false),
                    Progress = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_jobs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organisation_kyt",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScopeId = table.Column<string>(type: "text", nullable: false),
                    ScopeName = table.Column<string>(type: "text", nullable: false),
                    ScopeLevel = table.Column<string>(type: "text", nullable: false),
                    MemberId = table.Column<string>(type: "text", nullable: false),
                    MemberName = table.Column<string>(type: "text", nullable: false),
                    Stage = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: false),
                    AssignedLead = table.Column<string>(type: "text", nullable: false),
                    DueDate = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_kyt", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organisation_meetings",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScopeId = table.Column<string>(type: "text", nullable: false),
                    ScopeLevel = table.Column<string>(type: "text", nullable: false),
                    ScopeName = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    ScheduledAt = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ParticipantsJson = table.Column<string>(type: "text", nullable: false),
                    QuorumRequired = table.Column<int>(type: "integer", nullable: false),
                    AgendaJson = table.Column<string>(type: "text", nullable: false),
                    Minutes = table.Column<string>(type: "text", nullable: true),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_meetings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organisation_member_availability",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActorId = table.Column<string>(type: "text", nullable: false),
                    ScopeId = table.Column<string>(type: "text", nullable: false),
                    Availability = table.Column<string>(type: "text", nullable: false),
                    EffectiveFrom = table.Column<string>(type: "text", nullable: true),
                    EffectiveTo = table.Column<string>(type: "text", nullable: true),
                    Reason = table.Column<string>(type: "text", nullable: true),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_member_availability", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organisation_member_cases",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScopeId = table.Column<string>(type: "text", nullable: false),
                    ScopeLevel = table.Column<string>(type: "text", nullable: false),
                    ScopeName = table.Column<string>(type: "text", nullable: false),
                    MemberId = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Owner = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Priority = table.Column<string>(type: "text", nullable: false),
                    InternalNote = table.Column<string>(type: "text", nullable: false),
                    MemberMessage = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_member_cases", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organisation_member_presentations",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScopeId = table.Column<string>(type: "text", nullable: false),
                    ScopeName = table.Column<string>(type: "text", nullable: false),
                    ScopeLevel = table.Column<string>(type: "text", nullable: false),
                    MemberId = table.Column<string>(type: "text", nullable: false),
                    MemberName = table.Column<string>(type: "text", nullable: false),
                    Topic = table.Column<string>(type: "text", nullable: false),
                    ScheduledDate = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_member_presentations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organisation_programmes",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScopeId = table.Column<string>(type: "text", nullable: false),
                    ScopeLevel = table.Column<string>(type: "text", nullable: false),
                    ScopeName = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    Owner = table.Column<string>(type: "text", nullable: false),
                    Sponsor = table.Column<string>(type: "text", nullable: true),
                    CommitteeId = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Progress = table.Column<int>(type: "integer", nullable: false),
                    NextMilestone = table.Column<string>(type: "text", nullable: false),
                    Risk = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_programmes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organisation_risks",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScopeId = table.Column<string>(type: "text", nullable: false),
                    ScopeName = table.Column<string>(type: "text", nullable: false),
                    ScopeLevel = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Owner = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Impact = table.Column<string>(type: "text", nullable: false),
                    Likelihood = table.Column<string>(type: "text", nullable: false),
                    ReviewDate = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_risks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organisation_tasks",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScopeId = table.Column<string>(type: "text", nullable: false),
                    ScopeLevel = table.Column<string>(type: "text", nullable: false),
                    ScopeName = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Owner = table.Column<string>(type: "text", nullable: false),
                    SourceType = table.Column<string>(type: "text", nullable: false),
                    SourceId = table.Column<string>(type: "text", nullable: false),
                    Due = table.Column<string>(type: "text", nullable: false),
                    Priority = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    TimelineJson = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_tasks", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_dbn_member_registrations_TenantId_ChapterId",
                schema: "public",
                table: "dbn_member_registrations",
                columns: new[] { "TenantId", "ChapterId" });

            migrationBuilder.CreateIndex(
                name: "IX_dbn_member_registrations_TenantId_Stage",
                schema: "public",
                table: "dbn_member_registrations",
                columns: new[] { "TenantId", "Stage" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "dbn_member_registrations",
                schema: "public");

            migrationBuilder.DropTable(
                name: "organisation_actions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "organisation_approvals",
                schema: "public");

            migrationBuilder.DropTable(
                name: "organisation_communications",
                schema: "public");

            migrationBuilder.DropTable(
                name: "organisation_data_quality",
                schema: "public");

            migrationBuilder.DropTable(
                name: "organisation_decisions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "organisation_escalations",
                schema: "public");

            migrationBuilder.DropTable(
                name: "organisation_exceptions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "organisation_feedback",
                schema: "public");

            migrationBuilder.DropTable(
                name: "organisation_goals",
                schema: "public");

            migrationBuilder.DropTable(
                name: "organisation_handoffs",
                schema: "public");

            migrationBuilder.DropTable(
                name: "organisation_issues",
                schema: "public");

            migrationBuilder.DropTable(
                name: "organisation_jobs",
                schema: "public");

            migrationBuilder.DropTable(
                name: "organisation_kyt",
                schema: "public");

            migrationBuilder.DropTable(
                name: "organisation_meetings",
                schema: "public");

            migrationBuilder.DropTable(
                name: "organisation_member_availability",
                schema: "public");

            migrationBuilder.DropTable(
                name: "organisation_member_cases",
                schema: "public");

            migrationBuilder.DropTable(
                name: "organisation_member_presentations",
                schema: "public");

            migrationBuilder.DropTable(
                name: "organisation_programmes",
                schema: "public");

            migrationBuilder.DropTable(
                name: "organisation_risks",
                schema: "public");

            migrationBuilder.DropTable(
                name: "organisation_tasks",
                schema: "public");
        }
    }
}

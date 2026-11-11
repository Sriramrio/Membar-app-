using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sethu.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "public");

            migrationBuilder.CreateTable(
                name: "appointments",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChapterId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleCode = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    StartsAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    EndsAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Exclusive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_appointments", x => x.Id);
                    table.CheckConstraint("CK_appointment_tenure", "\"EndsAt\" > \"StartsAt\"");
                });

            migrationBuilder.CreateTable(
                name: "audit_events",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActorId = table.Column<Guid>(type: "uuid", nullable: false),
                    ResourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    Operation = table.Column<string>(type: "text", nullable: false),
                    CorrelationId = table.Column<string>(type: "text", nullable: false),
                    Event = table.Column<string>(type: "text", nullable: false),
                    OccurredAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_events", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "business_sectors",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_business_sectors", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "chapter_activities",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChapterId = table.Column<Guid>(type: "uuid", nullable: false),
                    Purpose = table.Column<int>(type: "integer", nullable: false),
                    Capacity = table.Column<int>(type: "integer", nullable: true),
                    Cancelled = table.Column<bool>(type: "boolean", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chapter_activities", x => x.Id);
                    table.CheckConstraint("CK_activity_capacity", "\"Capacity\" IS NULL OR \"Capacity\" > 0");
                });

            migrationBuilder.CreateTable(
                name: "chapter_specialisation_claims",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChapterId = table.Column<Guid>(type: "uuid", nullable: false),
                    SpecialisationId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chapter_specialisation_claims", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "committees",
                schema: "public",
                columns: table => new
                {
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChapterId = table.Column<Guid>(type: "uuid", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_committees", x => new { x.TenantId, x.ChapterId });
                });

            migrationBuilder.CreateTable(
                name: "delegations",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChapterId = table.Column<Guid>(type: "uuid", nullable: false),
                    DelegatorId = table.Column<Guid>(type: "uuid", nullable: false),
                    DelegateId = table.Column<Guid>(type: "uuid", nullable: false),
                    Permission = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    StartsAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    EndsAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Revoked = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_delegations", x => x.Id);
                    table.CheckConstraint("CK_delegation_tenure", "\"EndsAt\" > \"StartsAt\"");
                });

            migrationBuilder.CreateTable(
                name: "finance_beneficiary_policies",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Beneficiary = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false),
                    ExpectedAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_finance_beneficiary_policies", x => x.Id);
                    table.CheckConstraint("CK_finance_fee_positive", "\"ExpectedAmount\" > 0");
                });

            migrationBuilder.CreateTable(
                name: "finance_processing_policies",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Purpose = table.Column<int>(type: "integer", nullable: false),
                    OwnerType = table.Column<int>(type: "integer", nullable: false),
                    OwnerUnitId = table.Column<Guid>(type: "uuid", nullable: false),
                    PostVerificationMode = table.Column<string>(type: "character varying(12)", maxLength: 12, nullable: false),
                    Approved = table.Column<bool>(type: "boolean", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    EffectiveFrom = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    EffectiveUntil = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_finance_processing_policies", x => x.Id);
                    table.CheckConstraint("CK_finance_processing_mode", "\"PostVerificationMode\" IN ('AUTOMATIC','MANUAL')");
                });

            migrationBuilder.CreateTable(
                name: "idempotency",
                schema: "public",
                columns: table => new
                {
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActorId = table.Column<Guid>(type: "uuid", nullable: false),
                    Operation = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Key = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    PayloadSha256 = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ResultJson = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_idempotency", x => new { x.TenantId, x.ActorId, x.Operation, x.Key });
                });

            migrationBuilder.CreateTable(
                name: "intake_approval_policies",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChapterId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequiredApprovals = table.Column<int>(type: "integer", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    EffectiveFrom = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    EffectiveUntil = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_intake_approval_policies", x => x.Id);
                    table.CheckConstraint("CK_intake_required_approvals", "\"RequiredApprovals\" > 0");
                });

            migrationBuilder.CreateTable(
                name: "intake_certificates",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    SecureReference = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    IssuerId = table.Column<Guid>(type: "uuid", nullable: false),
                    IssuedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_intake_certificates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "intake_payments",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    IntakeId = table.Column<Guid>(type: "uuid", nullable: false),
                    Reference = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    Verified = table.Column<bool>(type: "boolean", nullable: false),
                    VerifiedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    BankEvidenceReference = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_intake_payments", x => x.Id);
                    table.CheckConstraint("CK_intake_payment_amount", "\"Amount\" > 0");
                });

            migrationBuilder.CreateTable(
                name: "intake_required_document_policies",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChapterId = table.Column<Guid>(type: "uuid", nullable: false),
                    DocumentKind = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    PolicyVersion = table.Column<long>(type: "bigint", nullable: false),
                    Required = table.Column<bool>(type: "boolean", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false),
                    EffectiveFrom = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    EffectiveUntil = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_intake_required_document_policies", x => x.Id);
                    table.CheckConstraint("CK_intake_document_policy_version", "\"PolicyVersion\" > 0");
                });

            migrationBuilder.CreateTable(
                name: "member_intakes",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChapterId = table.Column<Guid>(type: "uuid", nullable: false),
                    ApplicantUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    SpecialisationId = table.Column<Guid>(type: "uuid", nullable: false),
                    State = table.Column<int>(type: "integer", nullable: false),
                    BusinessName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_member_intakes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "members",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_members", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organisation_units",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentId = table.Column<Guid>(type: "uuid", nullable: true),
                    Level = table.Column<int>(type: "integer", nullable: false),
                    Code = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_units", x => x.Id);
                    table.ForeignKey(
                        name: "FK_organisation_units_organisation_units_ParentId",
                        column: x => x.ParentId,
                        principalSchema: "public",
                        principalTable: "organisation_units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "outbox_messages",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ResourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    Event = table.Column<string>(type: "text", nullable: false),
                    OccurredAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DispatchedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Attempts = table.Column<int>(type: "integer", nullable: false),
                    NextAttemptAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DeadLettered = table.Column<bool>(type: "boolean", nullable: false),
                    LastErrorCode = table.Column<string>(type: "text", nullable: true),
                    LeaseOwner = table.Column<Guid>(type: "uuid", nullable: true),
                    LeaseExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_outbox_messages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "permission_grants",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChapterId = table.Column<Guid>(type: "uuid", nullable: true),
                    Permission = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    StartsAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    EndsAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Revoked = table.Column<bool>(type: "boolean", nullable: false),
                    IndependentGovernance = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_permission_grants", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "receiving_accounts",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerType = table.Column<int>(type: "integer", nullable: false),
                    OwnerUnitId = table.Column<Guid>(type: "uuid", nullable: false),
                    MaskedReference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_receiving_accounts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "renewal_validity_policies",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    DurationMonths = table.Column<int>(type: "integer", nullable: false),
                    EffectiveFrom = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    EffectiveUntil = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    Approved = table.Column<bool>(type: "boolean", nullable: false),
                    StartRule = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_renewal_validity_policies", x => x.Id);
                    table.CheckConstraint("CK_renewal_months", "\"DurationMonths\" > 0");
                });

            migrationBuilder.CreateTable(
                name: "sessions",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Issuer = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    SessionId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Revoked = table.Column<bool>(type: "boolean", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "user_identities",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Issuer = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Subject = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_identities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "verified_finance_bank_records",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Reference = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    IndependentlyVerified = table.Column<bool>(type: "boolean", nullable: false),
                    Beneficiary = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    IngestedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    ApprovedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    Provenance = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    RecordedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Reversed = table.Column<bool>(type: "boolean", nullable: false),
                    AssignedIntakeId = table.Column<Guid>(type: "uuid", nullable: true),
                    BankOriginAuthenticated = table.Column<bool>(type: "boolean", nullable: false),
                    SourceDigest = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_verified_finance_bank_records", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "business_segments",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    SectorId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_business_segments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_business_segments_business_sectors_SectorId",
                        column: x => x.SectorId,
                        principalSchema: "public",
                        principalTable: "business_sectors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "intake_decisions",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    IntakeId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActorId = table.Column<Guid>(type: "uuid", nullable: false),
                    Decision = table.Column<string>(type: "character varying(90)", maxLength: 90, nullable: false),
                    EvidenceReference = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    At = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ApplicationVersion = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_intake_decisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_intake_decisions_member_intakes_IntakeId",
                        column: x => x.IntakeId,
                        principalSchema: "public",
                        principalTable: "member_intakes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "intake_documents",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    IntakeId = table.Column<Guid>(type: "uuid", nullable: false),
                    SecureReference = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Kind = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    SubmittedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    SubmittedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ApplicationVersion = table.Column<long>(type: "bigint", nullable: false),
                    DocumentVersion = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_intake_documents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_intake_documents_member_intakes_IntakeId",
                        column: x => x.IntakeId,
                        principalSchema: "public",
                        principalTable: "member_intakes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "businesses",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SpecialisationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_businesses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_businesses_members_OwnerMemberId",
                        column: x => x.OwnerMemberId,
                        principalSchema: "public",
                        principalTable: "members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "chapter_activity_registrations",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    PaymentId = table.Column<Guid>(type: "uuid", nullable: true),
                    Cancelled = table.Column<bool>(type: "boolean", nullable: false),
                    PaymentVerified = table.Column<bool>(type: "boolean", nullable: false),
                    SeatConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    Waitlisted = table.Column<bool>(type: "boolean", nullable: false),
                    Attended = table.Column<bool>(type: "boolean", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chapter_activity_registrations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_chapter_activity_registrations_chapter_activities_ActivityId",
                        column: x => x.ActivityId,
                        principalSchema: "public",
                        principalTable: "chapter_activities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_chapter_activity_registrations_members_MemberId",
                        column: x => x.MemberId,
                        principalSchema: "public",
                        principalTable: "members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "member_chapter_affiliations",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChapterId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_member_chapter_affiliations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_member_chapter_affiliations_members_MemberId",
                        column: x => x.MemberId,
                        principalSchema: "public",
                        principalTable: "members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "member_connections",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    LowerMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    UpperMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    InitiatorId = table.Column<Guid>(type: "uuid", nullable: false),
                    BlockedByMemberId = table.Column<Guid>(type: "uuid", nullable: true),
                    State = table.Column<int>(type: "integer", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_member_connections", x => x.Id);
                    table.CheckConstraint("CK_member_connection_pair", "\"LowerMemberId\" <> \"UpperMemberId\"");
                    table.ForeignKey(
                        name: "FK_member_connections_members_LowerMemberId",
                        column: x => x.LowerMemberId,
                        principalSchema: "public",
                        principalTable: "members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_member_connections_members_UpperMemberId",
                        column: x => x.UpperMemberId,
                        principalSchema: "public",
                        principalTable: "members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "membership_periods",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    PaymentId = table.Column<Guid>(type: "uuid", nullable: false),
                    StartsOn = table.Column<DateOnly>(type: "date", nullable: false),
                    EndsOn = table.Column<DateOnly>(type: "date", nullable: false),
                    AppliedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_membership_periods", x => x.Id);
                    table.CheckConstraint("CK_period_dates", "\"EndsOn\" >= \"StartsOn\"");
                    table.ForeignKey(
                        name: "FK_membership_periods_members_MemberId",
                        column: x => x.MemberId,
                        principalSchema: "public",
                        principalTable: "members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "network_free_events",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChapterId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganiserMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    StartsAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    EndsAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Capacity = table.Column<int>(type: "integer", nullable: false),
                    Registered = table.Column<int>(type: "integer", nullable: false),
                    IsPaid = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_network_free_events", x => x.Id);
                    table.CheckConstraint("CK_network_free_event_capacity", "\"Capacity\" > 0 AND \"Registered\" >= 0 AND \"Registered\" <= \"Capacity\"");
                    table.CheckConstraint("CK_network_free_event_no_payment", "\"IsPaid\" = false");
                    table.CheckConstraint("CK_network_free_event_time", "\"EndsAt\" > \"StartsAt\"");
                    table.ForeignKey(
                        name: "FK_network_free_events_members_OrganiserMemberId",
                        column: x => x.OrganiserMemberId,
                        principalSchema: "public",
                        principalTable: "members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "network_one_to_one",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    FromMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    ToMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ProposedByMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProposedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ConfirmedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    TimeZoneId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Outcome = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    FollowUpAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_network_one_to_one", x => x.Id);
                    table.ForeignKey(
                        name: "FK_network_one_to_one_members_FromMemberId",
                        column: x => x.FromMemberId,
                        principalSchema: "public",
                        principalTable: "members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_network_one_to_one_members_ToMemberId",
                        column: x => x.ToMemberId,
                        principalSchema: "public",
                        principalTable: "members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "network_private_notes",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContextType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ContextId = table.Column<Guid>(type: "uuid", nullable: false),
                    Text = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    FollowUpAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Archived = table.Column<bool>(type: "boolean", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_network_private_notes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_network_private_notes_members_AuthorMemberId",
                        column: x => x.AuthorMemberId,
                        principalSchema: "public",
                        principalTable: "members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "network_references",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    FromMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    ToMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    IntroducedMemberId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Outcome = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    FollowUpAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ConsentedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_network_references", x => x.Id);
                    table.ForeignKey(
                        name: "FK_network_references_members_FromMemberId",
                        column: x => x.FromMemberId,
                        principalSchema: "public",
                        principalTable: "members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_network_references_members_IntroducedMemberId",
                        column: x => x.IntroducedMemberId,
                        principalSchema: "public",
                        principalTable: "members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_network_references_members_ToMemberId",
                        column: x => x.ToMemberId,
                        principalSchema: "public",
                        principalTable: "members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "governed_payments",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    PayerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChapterId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContextId = table.Column<Guid>(type: "uuid", nullable: false),
                    Purpose = table.Column<int>(type: "integer", nullable: false),
                    OwnerType = table.Column<int>(type: "integer", nullable: false),
                    ReceivingAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    AccountVersion = table.Column<long>(type: "bigint", nullable: false),
                    ExpectedAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    Status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_governed_payments", x => x.Id);
                    table.CheckConstraint("CK_governed_amount", "\"ExpectedAmount\" > 0");
                    table.ForeignKey(
                        name: "FK_governed_payments_receiving_accounts_ReceivingAccountId",
                        column: x => x.ReceivingAccountId,
                        principalSchema: "public",
                        principalTable: "receiving_accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "business_specialisations",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    SegmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_business_specialisations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_business_specialisations_business_segments_SegmentId",
                        column: x => x.SegmentId,
                        principalSchema: "public",
                        principalTable: "business_segments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "network_opportunities",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Scope = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ChapterId = table.Column<Guid>(type: "uuid", nullable: true),
                    SpecialisationId = table.Column<Guid>(type: "uuid", nullable: true),
                    Outcome = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_network_opportunities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_network_opportunities_businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalSchema: "public",
                        principalTable: "businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_network_opportunities_members_OwnerMemberId",
                        column: x => x.OwnerMemberId,
                        principalSchema: "public",
                        principalTable: "members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "network_connection_transitions",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConnectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActorMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    PreviousState = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    NewState = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Action = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    OccurredAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_network_connection_transitions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_network_connection_transitions_member_connections_Connectio~",
                        column: x => x.ConnectionId,
                        principalSchema: "public",
                        principalTable: "member_connections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "network_free_registrations",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    EventId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_network_free_registrations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_network_free_registrations_members_MemberId",
                        column: x => x.MemberId,
                        principalSchema: "public",
                        principalTable: "members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_network_free_registrations_network_free_events_EventId",
                        column: x => x.EventId,
                        principalSchema: "public",
                        principalTable: "network_free_events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "network_reference_history",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReferenceId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActorMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    PreviousStatus = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    NewStatus = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Action = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    OccurredAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_network_reference_history", x => x.Id);
                    table.ForeignKey(
                        name: "FK_network_reference_history_network_references_ReferenceId",
                        column: x => x.ReferenceId,
                        principalSchema: "public",
                        principalTable: "network_references",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "manual_payment_claims",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    PaymentId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubmittedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    Utr = table.Column<string>(type: "character varying(140)", maxLength: 140, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    PaymentDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Mode = table.Column<string>(type: "text", nullable: false),
                    SubmittedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Superseded = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_manual_payment_claims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_manual_payment_claims_governed_payments_PaymentId",
                        column: x => x.PaymentId,
                        principalSchema: "public",
                        principalTable: "governed_payments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "business_taxonomy_terms",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    SpecialisationId = table.Column<Guid>(type: "uuid", nullable: false),
                    NormalizedTerm = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Protected = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_business_taxonomy_terms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_business_taxonomy_terms_business_specialisations_Specialisa~",
                        column: x => x.SpecialisationId,
                        principalSchema: "public",
                        principalTable: "business_specialisations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "network_opportunity_responses",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    OpportunityId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_network_opportunity_responses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_network_opportunity_responses_members_MemberId",
                        column: x => x.MemberId,
                        principalSchema: "public",
                        principalTable: "members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_network_opportunity_responses_network_opportunities_Opportu~",
                        column: x => x.OpportunityId,
                        principalSchema: "public",
                        principalTable: "network_opportunities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "manual_payment_decisions",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    PaymentId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClaimId = table.Column<Guid>(type: "uuid", nullable: false),
                    VerifierId = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerType = table.Column<int>(type: "integer", nullable: false),
                    OwnerUnitId = table.Column<Guid>(type: "uuid", nullable: false),
                    CheckedSource = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    CheckedDate = table.Column<DateOnly>(type: "date", nullable: false),
                    CheckedUtr = table.Column<string>(type: "character varying(140)", maxLength: 140, nullable: false),
                    CheckedAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "text", nullable: false),
                    BeneficiaryMatched = table.Column<bool>(type: "boolean", nullable: false),
                    UtrMatched = table.Column<bool>(type: "boolean", nullable: false),
                    AmountMatched = table.Column<bool>(type: "boolean", nullable: false),
                    DateMatched = table.Column<bool>(type: "boolean", nullable: false),
                    Decision = table.Column<int>(type: "integer", nullable: false),
                    ReasonCode = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    DecidedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_manual_payment_decisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_manual_payment_decisions_manual_payment_claims_ClaimId",
                        column: x => x.ClaimId,
                        principalSchema: "public",
                        principalTable: "manual_payment_claims",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_appointments_TenantId_ChapterId_RoleCode",
                schema: "public",
                table: "appointments",
                columns: new[] { "TenantId", "ChapterId", "RoleCode" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_events_TenantId_ResourceId",
                schema: "public",
                table: "audit_events",
                columns: new[] { "TenantId", "ResourceId" });

            migrationBuilder.CreateIndex(
                name: "IX_business_sectors_TenantId_Name",
                schema: "public",
                table: "business_sectors",
                columns: new[] { "TenantId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_business_segments_SectorId",
                schema: "public",
                table: "business_segments",
                column: "SectorId");

            migrationBuilder.CreateIndex(
                name: "IX_business_segments_TenantId_SectorId_Name",
                schema: "public",
                table: "business_segments",
                columns: new[] { "TenantId", "SectorId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_business_specialisations_SegmentId",
                schema: "public",
                table: "business_specialisations",
                column: "SegmentId");

            migrationBuilder.CreateIndex(
                name: "IX_business_specialisations_TenantId_SegmentId_Name",
                schema: "public",
                table: "business_specialisations",
                columns: new[] { "TenantId", "SegmentId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_business_taxonomy_terms_SpecialisationId",
                schema: "public",
                table: "business_taxonomy_terms",
                column: "SpecialisationId");

            migrationBuilder.CreateIndex(
                name: "IX_business_taxonomy_terms_TenantId_SpecialisationId_Normalize~",
                schema: "public",
                table: "business_taxonomy_terms",
                columns: new[] { "TenantId", "SpecialisationId", "NormalizedTerm" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_businesses_OwnerMemberId",
                schema: "public",
                table: "businesses",
                column: "OwnerMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_businesses_TenantId_OwnerMemberId",
                schema: "public",
                table: "businesses",
                columns: new[] { "TenantId", "OwnerMemberId" },
                unique: true,
                filter: "\"Status\" = 1");

            migrationBuilder.CreateIndex(
                name: "IX_businesses_TenantId_SpecialisationId",
                schema: "public",
                table: "businesses",
                columns: new[] { "TenantId", "SpecialisationId" });

            migrationBuilder.CreateIndex(
                name: "IX_chapter_activities_TenantId_ChapterId_Purpose",
                schema: "public",
                table: "chapter_activities",
                columns: new[] { "TenantId", "ChapterId", "Purpose" });

            migrationBuilder.CreateIndex(
                name: "IX_chapter_activity_registrations_ActivityId",
                schema: "public",
                table: "chapter_activity_registrations",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_chapter_activity_registrations_MemberId",
                schema: "public",
                table: "chapter_activity_registrations",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_chapter_activity_registrations_TenantId_ActivityId_MemberId",
                schema: "public",
                table: "chapter_activity_registrations",
                columns: new[] { "TenantId", "ActivityId", "MemberId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_chapter_activity_registrations_TenantId_PaymentId",
                schema: "public",
                table: "chapter_activity_registrations",
                columns: new[] { "TenantId", "PaymentId" },
                unique: true,
                filter: "\"PaymentId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_chapter_specialisation_claims_TenantId_ChapterId_Specialisa~",
                schema: "public",
                table: "chapter_specialisation_claims",
                columns: new[] { "TenantId", "ChapterId", "SpecialisationId" },
                unique: true,
                filter: "\"Active\"");

            migrationBuilder.CreateIndex(
                name: "IX_chapter_specialisation_claims_TenantId_MemberId",
                schema: "public",
                table: "chapter_specialisation_claims",
                columns: new[] { "TenantId", "MemberId" },
                unique: true,
                filter: "\"Active\"");

            migrationBuilder.CreateIndex(
                name: "IX_delegations_TenantId_DelegatorId_DelegateId",
                schema: "public",
                table: "delegations",
                columns: new[] { "TenantId", "DelegatorId", "DelegateId" });

            migrationBuilder.CreateIndex(
                name: "IX_finance_beneficiary_policies_TenantId",
                schema: "public",
                table: "finance_beneficiary_policies",
                column: "TenantId",
                unique: true,
                filter: "\"Active\"");

            migrationBuilder.CreateIndex(
                name: "IX_finance_processing_policies_TenantId_Purpose_OwnerType_Owne~",
                schema: "public",
                table: "finance_processing_policies",
                columns: new[] { "TenantId", "Purpose", "OwnerType", "OwnerUnitId", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_governed_payments_ReceivingAccountId",
                schema: "public",
                table: "governed_payments",
                column: "ReceivingAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_governed_payments_TenantId_ContextId_Purpose",
                schema: "public",
                table: "governed_payments",
                columns: new[] { "TenantId", "ContextId", "Purpose" });

            migrationBuilder.CreateIndex(
                name: "IX_intake_approval_policies_TenantId_ChapterId",
                schema: "public",
                table: "intake_approval_policies",
                columns: new[] { "TenantId", "ChapterId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_intake_certificates_TenantId_MemberId",
                schema: "public",
                table: "intake_certificates",
                columns: new[] { "TenantId", "MemberId" });

            migrationBuilder.CreateIndex(
                name: "IX_intake_decisions_IntakeId",
                schema: "public",
                table: "intake_decisions",
                column: "IntakeId");

            migrationBuilder.CreateIndex(
                name: "IX_intake_decisions_TenantId_IntakeId_ActorId_Decision",
                schema: "public",
                table: "intake_decisions",
                columns: new[] { "TenantId", "IntakeId", "ActorId", "Decision" },
                unique: true,
                filter: "\"Decision\" = 'ApproveCommittee'");

            migrationBuilder.CreateIndex(
                name: "IX_intake_decisions_TenantId_IntakeId_Decision",
                schema: "public",
                table: "intake_decisions",
                columns: new[] { "TenantId", "IntakeId", "Decision" });

            migrationBuilder.CreateIndex(
                name: "IX_intake_documents_IntakeId",
                schema: "public",
                table: "intake_documents",
                column: "IntakeId");

            migrationBuilder.CreateIndex(
                name: "IX_intake_documents_TenantId_IntakeId_Kind_DocumentVersion",
                schema: "public",
                table: "intake_documents",
                columns: new[] { "TenantId", "IntakeId", "Kind", "DocumentVersion" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_intake_payments_TenantId_IntakeId",
                schema: "public",
                table: "intake_payments",
                columns: new[] { "TenantId", "IntakeId" });

            migrationBuilder.CreateIndex(
                name: "IX_intake_payments_TenantId_Reference",
                schema: "public",
                table: "intake_payments",
                columns: new[] { "TenantId", "Reference" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_intake_required_document_policies_TenantId_ChapterId_Docume~",
                schema: "public",
                table: "intake_required_document_policies",
                columns: new[] { "TenantId", "ChapterId", "DocumentKind", "PolicyVersion" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_manual_payment_claims_PaymentId",
                schema: "public",
                table: "manual_payment_claims",
                column: "PaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_manual_payment_claims_TenantId_PaymentId",
                schema: "public",
                table: "manual_payment_claims",
                columns: new[] { "TenantId", "PaymentId" },
                unique: true,
                filter: "NOT \"Superseded\"");

            migrationBuilder.CreateIndex(
                name: "IX_manual_payment_decisions_ClaimId",
                schema: "public",
                table: "manual_payment_decisions",
                column: "ClaimId");

            migrationBuilder.CreateIndex(
                name: "IX_manual_payment_decisions_TenantId_OwnerUnitId_CheckedUtr",
                schema: "public",
                table: "manual_payment_decisions",
                columns: new[] { "TenantId", "OwnerUnitId", "CheckedUtr" },
                unique: true,
                filter: "\"Decision\" = 2");

            migrationBuilder.CreateIndex(
                name: "IX_manual_payment_decisions_TenantId_PaymentId",
                schema: "public",
                table: "manual_payment_decisions",
                columns: new[] { "TenantId", "PaymentId" });

            migrationBuilder.CreateIndex(
                name: "IX_member_chapter_affiliations_MemberId",
                schema: "public",
                table: "member_chapter_affiliations",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_member_chapter_affiliations_TenantId_MemberId",
                schema: "public",
                table: "member_chapter_affiliations",
                columns: new[] { "TenantId", "MemberId" },
                unique: true,
                filter: "\"Status\" = 1");

            migrationBuilder.CreateIndex(
                name: "IX_member_chapter_affiliations_TenantId_MemberId_ChapterId",
                schema: "public",
                table: "member_chapter_affiliations",
                columns: new[] { "TenantId", "MemberId", "ChapterId" });

            migrationBuilder.CreateIndex(
                name: "IX_member_connections_LowerMemberId",
                schema: "public",
                table: "member_connections",
                column: "LowerMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_member_connections_TenantId_LowerMemberId_UpperMemberId",
                schema: "public",
                table: "member_connections",
                columns: new[] { "TenantId", "LowerMemberId", "UpperMemberId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_member_connections_TenantId_UpperMemberId",
                schema: "public",
                table: "member_connections",
                columns: new[] { "TenantId", "UpperMemberId" });

            migrationBuilder.CreateIndex(
                name: "IX_member_connections_UpperMemberId",
                schema: "public",
                table: "member_connections",
                column: "UpperMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_member_intakes_TenantId_ApplicantUserId",
                schema: "public",
                table: "member_intakes",
                columns: new[] { "TenantId", "ApplicantUserId" },
                unique: true,
                filter: "\"State\" NOT IN (9,10,8)");

            migrationBuilder.CreateIndex(
                name: "IX_member_intakes_TenantId_ChapterId_State",
                schema: "public",
                table: "member_intakes",
                columns: new[] { "TenantId", "ChapterId", "State" });

            migrationBuilder.CreateIndex(
                name: "IX_members_TenantId_UserId",
                schema: "public",
                table: "members",
                columns: new[] { "TenantId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_membership_periods_MemberId",
                schema: "public",
                table: "membership_periods",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_membership_periods_TenantId_MemberId_EndsOn",
                schema: "public",
                table: "membership_periods",
                columns: new[] { "TenantId", "MemberId", "EndsOn" });

            migrationBuilder.CreateIndex(
                name: "IX_membership_periods_TenantId_PaymentId",
                schema: "public",
                table: "membership_periods",
                columns: new[] { "TenantId", "PaymentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_network_connection_transitions_ConnectionId",
                schema: "public",
                table: "network_connection_transitions",
                column: "ConnectionId");

            migrationBuilder.CreateIndex(
                name: "IX_network_connection_transitions_TenantId_ConnectionId_Occurr~",
                schema: "public",
                table: "network_connection_transitions",
                columns: new[] { "TenantId", "ConnectionId", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_network_free_events_OrganiserMemberId",
                schema: "public",
                table: "network_free_events",
                column: "OrganiserMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_network_free_events_TenantId_ChapterId_StartsAt",
                schema: "public",
                table: "network_free_events",
                columns: new[] { "TenantId", "ChapterId", "StartsAt" });

            migrationBuilder.CreateIndex(
                name: "IX_network_free_registrations_EventId",
                schema: "public",
                table: "network_free_registrations",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_network_free_registrations_MemberId",
                schema: "public",
                table: "network_free_registrations",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_network_free_registrations_TenantId_EventId_MemberId",
                schema: "public",
                table: "network_free_registrations",
                columns: new[] { "TenantId", "EventId", "MemberId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_network_one_to_one_FromMemberId",
                schema: "public",
                table: "network_one_to_one",
                column: "FromMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_network_one_to_one_TenantId_FromMemberId_ProposedAt",
                schema: "public",
                table: "network_one_to_one",
                columns: new[] { "TenantId", "FromMemberId", "ProposedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_network_one_to_one_TenantId_ToMemberId_ProposedAt",
                schema: "public",
                table: "network_one_to_one",
                columns: new[] { "TenantId", "ToMemberId", "ProposedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_network_one_to_one_ToMemberId",
                schema: "public",
                table: "network_one_to_one",
                column: "ToMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_network_opportunities_BusinessId",
                schema: "public",
                table: "network_opportunities",
                column: "BusinessId");

            migrationBuilder.CreateIndex(
                name: "IX_network_opportunities_OwnerMemberId",
                schema: "public",
                table: "network_opportunities",
                column: "OwnerMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_network_opportunities_TenantId_OwnerMemberId",
                schema: "public",
                table: "network_opportunities",
                columns: new[] { "TenantId", "OwnerMemberId" });

            migrationBuilder.CreateIndex(
                name: "IX_network_opportunity_responses_MemberId",
                schema: "public",
                table: "network_opportunity_responses",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_network_opportunity_responses_OpportunityId",
                schema: "public",
                table: "network_opportunity_responses",
                column: "OpportunityId");

            migrationBuilder.CreateIndex(
                name: "IX_network_opportunity_responses_TenantId_OpportunityId_Member~",
                schema: "public",
                table: "network_opportunity_responses",
                columns: new[] { "TenantId", "OpportunityId", "MemberId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_network_private_notes_AuthorMemberId",
                schema: "public",
                table: "network_private_notes",
                column: "AuthorMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_network_private_notes_TenantId_AuthorMemberId_UpdatedAt",
                schema: "public",
                table: "network_private_notes",
                columns: new[] { "TenantId", "AuthorMemberId", "UpdatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_network_reference_history_ReferenceId",
                schema: "public",
                table: "network_reference_history",
                column: "ReferenceId");

            migrationBuilder.CreateIndex(
                name: "IX_network_reference_history_TenantId_ReferenceId_OccurredAt",
                schema: "public",
                table: "network_reference_history",
                columns: new[] { "TenantId", "ReferenceId", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_network_references_FromMemberId",
                schema: "public",
                table: "network_references",
                column: "FromMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_network_references_IntroducedMemberId",
                schema: "public",
                table: "network_references",
                column: "IntroducedMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_network_references_TenantId_FromMemberId_CreatedAt",
                schema: "public",
                table: "network_references",
                columns: new[] { "TenantId", "FromMemberId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_network_references_TenantId_ToMemberId_CreatedAt",
                schema: "public",
                table: "network_references",
                columns: new[] { "TenantId", "ToMemberId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_network_references_ToMemberId",
                schema: "public",
                table: "network_references",
                column: "ToMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_organisation_units_ParentId",
                schema: "public",
                table: "organisation_units",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_organisation_units_TenantId_Code",
                schema: "public",
                table: "organisation_units",
                columns: new[] { "TenantId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_organisation_units_TenantId_ParentId",
                schema: "public",
                table: "organisation_units",
                columns: new[] { "TenantId", "ParentId" });

            migrationBuilder.CreateIndex(
                name: "IX_outbox_messages_DispatchedAt",
                schema: "public",
                table: "outbox_messages",
                column: "DispatchedAt");

            migrationBuilder.CreateIndex(
                name: "IX_permission_grants_TenantId_UserId_Permission",
                schema: "public",
                table: "permission_grants",
                columns: new[] { "TenantId", "UserId", "Permission" });

            migrationBuilder.CreateIndex(
                name: "IX_receiving_accounts_TenantId_OwnerType_OwnerUnitId_Currency",
                schema: "public",
                table: "receiving_accounts",
                columns: new[] { "TenantId", "OwnerType", "OwnerUnitId", "Currency" },
                unique: true,
                filter: "\"Active\"");

            migrationBuilder.CreateIndex(
                name: "IX_renewal_validity_policies_TenantId",
                schema: "public",
                table: "renewal_validity_policies",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_sessions_Issuer_SessionId",
                schema: "public",
                table: "sessions",
                columns: new[] { "Issuer", "SessionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sessions_UserId",
                schema: "public",
                table: "sessions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_user_identities_Issuer_Subject",
                schema: "public",
                table: "user_identities",
                columns: new[] { "Issuer", "Subject" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_identities_TenantId_Id",
                schema: "public",
                table: "user_identities",
                columns: new[] { "TenantId", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_verified_finance_bank_records_TenantId_Reference",
                schema: "public",
                table: "verified_finance_bank_records",
                columns: new[] { "TenantId", "Reference" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "appointments",
                schema: "public");

            migrationBuilder.DropTable(
                name: "audit_events",
                schema: "public");

            migrationBuilder.DropTable(
                name: "business_taxonomy_terms",
                schema: "public");

            migrationBuilder.DropTable(
                name: "chapter_activity_registrations",
                schema: "public");

            migrationBuilder.DropTable(
                name: "chapter_specialisation_claims",
                schema: "public");

            migrationBuilder.DropTable(
                name: "committees",
                schema: "public");

            migrationBuilder.DropTable(
                name: "delegations",
                schema: "public");

            migrationBuilder.DropTable(
                name: "finance_beneficiary_policies",
                schema: "public");

            migrationBuilder.DropTable(
                name: "finance_processing_policies",
                schema: "public");

            migrationBuilder.DropTable(
                name: "idempotency",
                schema: "public");

            migrationBuilder.DropTable(
                name: "intake_approval_policies",
                schema: "public");

            migrationBuilder.DropTable(
                name: "intake_certificates",
                schema: "public");

            migrationBuilder.DropTable(
                name: "intake_decisions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "intake_documents",
                schema: "public");

            migrationBuilder.DropTable(
                name: "intake_payments",
                schema: "public");

            migrationBuilder.DropTable(
                name: "intake_required_document_policies",
                schema: "public");

            migrationBuilder.DropTable(
                name: "manual_payment_decisions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "member_chapter_affiliations",
                schema: "public");

            migrationBuilder.DropTable(
                name: "membership_periods",
                schema: "public");

            migrationBuilder.DropTable(
                name: "network_connection_transitions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "network_free_registrations",
                schema: "public");

            migrationBuilder.DropTable(
                name: "network_one_to_one",
                schema: "public");

            migrationBuilder.DropTable(
                name: "network_opportunity_responses",
                schema: "public");

            migrationBuilder.DropTable(
                name: "network_private_notes",
                schema: "public");

            migrationBuilder.DropTable(
                name: "network_reference_history",
                schema: "public");

            migrationBuilder.DropTable(
                name: "organisation_units",
                schema: "public");

            migrationBuilder.DropTable(
                name: "outbox_messages",
                schema: "public");

            migrationBuilder.DropTable(
                name: "permission_grants",
                schema: "public");

            migrationBuilder.DropTable(
                name: "renewal_validity_policies",
                schema: "public");

            migrationBuilder.DropTable(
                name: "sessions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "user_identities",
                schema: "public");

            migrationBuilder.DropTable(
                name: "verified_finance_bank_records",
                schema: "public");

            migrationBuilder.DropTable(
                name: "business_specialisations",
                schema: "public");

            migrationBuilder.DropTable(
                name: "chapter_activities",
                schema: "public");

            migrationBuilder.DropTable(
                name: "member_intakes",
                schema: "public");

            migrationBuilder.DropTable(
                name: "manual_payment_claims",
                schema: "public");

            migrationBuilder.DropTable(
                name: "member_connections",
                schema: "public");

            migrationBuilder.DropTable(
                name: "network_free_events",
                schema: "public");

            migrationBuilder.DropTable(
                name: "network_opportunities",
                schema: "public");

            migrationBuilder.DropTable(
                name: "network_references",
                schema: "public");

            migrationBuilder.DropTable(
                name: "business_segments",
                schema: "public");

            migrationBuilder.DropTable(
                name: "governed_payments",
                schema: "public");

            migrationBuilder.DropTable(
                name: "businesses",
                schema: "public");

            migrationBuilder.DropTable(
                name: "business_sectors",
                schema: "public");

            migrationBuilder.DropTable(
                name: "receiving_accounts",
                schema: "public");

            migrationBuilder.DropTable(
                name: "members",
                schema: "public");
        }
    }
}

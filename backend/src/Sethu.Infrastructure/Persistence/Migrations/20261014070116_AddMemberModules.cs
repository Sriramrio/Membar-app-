using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sethu.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMemberModules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Email",
                schema: "public",
                table: "user_identities",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FailedLoginAttempts",
                schema: "public",
                table: "user_identities",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsContactVerified",
                schema: "public",
                table: "user_identities",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LockoutEnd",
                schema: "public",
                table: "user_identities",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                schema: "public",
                table: "user_identities",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                schema: "public",
                table: "user_identities",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                schema: "public",
                table: "user_identities",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "announcement_acknowledgements",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    AnnouncementId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    AcknowledgedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_announcement_acknowledgements", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "converse_conversations",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Kind = table.Column<string>(type: "text", nullable: false),
                    Subject = table.Column<string>(type: "text", nullable: true),
                    GroupName = table.Column<string>(type: "text", nullable: true),
                    Chapter = table.Column<string>(type: "text", nullable: true),
                    ParticipantIdsJson = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_converse_conversations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "converse_messages",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConversationId = table.Column<Guid>(type: "uuid", nullable: false),
                    SenderMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    Text = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_converse_messages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "member_attendance_records",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    EventId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Finalised = table.Column<bool>(type: "boolean", nullable: false),
                    PriorStatus = table.Column<string>(type: "text", nullable: true),
                    CorrectionReason = table.Column<string>(type: "text", nullable: true),
                    CorrectionStatus = table.Column<string>(type: "text", nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_member_attendance_records", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "member_family_info",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    SpouseName = table.Column<string>(type: "text", nullable: true),
                    AnniversaryDate = table.Column<string>(type: "text", nullable: true),
                    Children = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_member_family_info", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "member_saved_items",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    ItemType = table.Column<string>(type: "text", nullable: false),
                    ItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    SavedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_member_saved_items", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "member_settings",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    PrivacySettingsJson = table.Column<string>(type: "text", nullable: true),
                    NotificationSettingsJson = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_member_settings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "network_announcements",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChapterId = table.Column<Guid>(type: "uuid", nullable: true),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    Priority = table.Column<string>(type: "text", nullable: false),
                    PublishedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_network_announcements", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "network_gallery_items",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    ImageUrl = table.Column<string>(type: "text", nullable: false),
                    ChapterId = table.Column<Guid>(type: "uuid", nullable: true),
                    EventId = table.Column<Guid>(type: "uuid", nullable: true),
                    Published = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_network_gallery_items", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "network_news",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Summary = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    PublishedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_network_news", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "network_notifications",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    ReferenceId = table.Column<string>(type: "text", nullable: true),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    ReadAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_network_notifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "network_partners",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    LogoUrl = table.Column<string>(type: "text", nullable: true),
                    WebsiteUrl = table.Column<string>(type: "text", nullable: true),
                    Tier = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_network_partners", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "network_resources",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    FileUrl = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_network_resources", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "network_transactions",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    BuyerBusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    CounterpartyBusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReferenceId = table.Column<Guid>(type: "uuid", nullable: true),
                    OpportunityId = table.Column<Guid>(type: "uuid", nullable: true),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    Currency = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_network_transactions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "otp_challenges",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetType = table.Column<string>(type: "text", nullable: false),
                    TargetId = table.Column<string>(type: "text", nullable: false),
                    CodeHash = table.Column<string>(type: "text", nullable: false),
                    Purpose = table.Column<string>(type: "text", nullable: false),
                    Destination = table.Column<string>(type: "text", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Attempts = table.Column<int>(type: "integer", nullable: false),
                    Verified = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_otp_challenges", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "support_tickets",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    Subject = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Priority = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_support_tickets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "thank_you_notes",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    RecipientMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    TransactionId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReferenceId = table.Column<Guid>(type: "uuid", nullable: true),
                    Message = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_thank_you_notes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "visitor_registrations",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    FullName = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    Phone = table.Column<string>(type: "text", nullable: false),
                    ChapterId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChapterName = table.Column<string>(type: "text", nullable: false),
                    VisitingDate = table.Column<string>(type: "text", nullable: false),
                    BusinessName = table.Column<string>(type: "text", nullable: true),
                    Verified = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_visitor_registrations", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_announcement_acknowledgements_TenantId_AnnouncementId_Membe~",
                schema: "public",
                table: "announcement_acknowledgements",
                columns: new[] { "TenantId", "AnnouncementId", "MemberId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_converse_conversations_TenantId_Kind",
                schema: "public",
                table: "converse_conversations",
                columns: new[] { "TenantId", "Kind" });

            migrationBuilder.CreateIndex(
                name: "IX_converse_messages_TenantId_ConversationId_CreatedAt",
                schema: "public",
                table: "converse_messages",
                columns: new[] { "TenantId", "ConversationId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_member_attendance_records_TenantId_MemberId_EventId",
                schema: "public",
                table: "member_attendance_records",
                columns: new[] { "TenantId", "MemberId", "EventId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_member_family_info_TenantId_MemberId",
                schema: "public",
                table: "member_family_info",
                columns: new[] { "TenantId", "MemberId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_member_saved_items_TenantId_MemberId_ItemType_ItemId",
                schema: "public",
                table: "member_saved_items",
                columns: new[] { "TenantId", "MemberId", "ItemType", "ItemId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_member_settings_TenantId_MemberId",
                schema: "public",
                table: "member_settings",
                columns: new[] { "TenantId", "MemberId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_network_announcements_TenantId_ChapterId",
                schema: "public",
                table: "network_announcements",
                columns: new[] { "TenantId", "ChapterId" });

            migrationBuilder.CreateIndex(
                name: "IX_network_gallery_items_TenantId_ChapterId",
                schema: "public",
                table: "network_gallery_items",
                columns: new[] { "TenantId", "ChapterId" });

            migrationBuilder.CreateIndex(
                name: "IX_network_news_TenantId_PublishedAt",
                schema: "public",
                table: "network_news",
                columns: new[] { "TenantId", "PublishedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_network_notifications_TenantId_MemberId_IsRead",
                schema: "public",
                table: "network_notifications",
                columns: new[] { "TenantId", "MemberId", "IsRead" });

            migrationBuilder.CreateIndex(
                name: "IX_network_partners_TenantId_Name",
                schema: "public",
                table: "network_partners",
                columns: new[] { "TenantId", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_network_resources_TenantId_Category",
                schema: "public",
                table: "network_resources",
                columns: new[] { "TenantId", "Category" });

            migrationBuilder.CreateIndex(
                name: "IX_network_transactions_TenantId_BuyerBusinessId",
                schema: "public",
                table: "network_transactions",
                columns: new[] { "TenantId", "BuyerBusinessId" });

            migrationBuilder.CreateIndex(
                name: "IX_network_transactions_TenantId_CounterpartyBusinessId",
                schema: "public",
                table: "network_transactions",
                columns: new[] { "TenantId", "CounterpartyBusinessId" });

            migrationBuilder.CreateIndex(
                name: "IX_network_transactions_TenantId_MemberId",
                schema: "public",
                table: "network_transactions",
                columns: new[] { "TenantId", "MemberId" });

            migrationBuilder.CreateIndex(
                name: "IX_otp_challenges_TenantId_TargetType_TargetId",
                schema: "public",
                table: "otp_challenges",
                columns: new[] { "TenantId", "TargetType", "TargetId" });

            migrationBuilder.CreateIndex(
                name: "IX_support_tickets_TenantId_MemberId",
                schema: "public",
                table: "support_tickets",
                columns: new[] { "TenantId", "MemberId" });

            migrationBuilder.CreateIndex(
                name: "IX_thank_you_notes_TenantId_AuthorMemberId",
                schema: "public",
                table: "thank_you_notes",
                columns: new[] { "TenantId", "AuthorMemberId" });

            migrationBuilder.CreateIndex(
                name: "IX_thank_you_notes_TenantId_RecipientMemberId",
                schema: "public",
                table: "thank_you_notes",
                columns: new[] { "TenantId", "RecipientMemberId" });

            migrationBuilder.CreateIndex(
                name: "IX_visitor_registrations_TenantId_Email",
                schema: "public",
                table: "visitor_registrations",
                columns: new[] { "TenantId", "Email" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "announcement_acknowledgements",
                schema: "public");

            migrationBuilder.DropTable(
                name: "converse_conversations",
                schema: "public");

            migrationBuilder.DropTable(
                name: "converse_messages",
                schema: "public");

            migrationBuilder.DropTable(
                name: "member_attendance_records",
                schema: "public");

            migrationBuilder.DropTable(
                name: "member_family_info",
                schema: "public");

            migrationBuilder.DropTable(
                name: "member_saved_items",
                schema: "public");

            migrationBuilder.DropTable(
                name: "member_settings",
                schema: "public");

            migrationBuilder.DropTable(
                name: "network_announcements",
                schema: "public");

            migrationBuilder.DropTable(
                name: "network_gallery_items",
                schema: "public");

            migrationBuilder.DropTable(
                name: "network_news",
                schema: "public");

            migrationBuilder.DropTable(
                name: "network_notifications",
                schema: "public");

            migrationBuilder.DropTable(
                name: "network_partners",
                schema: "public");

            migrationBuilder.DropTable(
                name: "network_resources",
                schema: "public");

            migrationBuilder.DropTable(
                name: "network_transactions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "otp_challenges",
                schema: "public");

            migrationBuilder.DropTable(
                name: "support_tickets",
                schema: "public");

            migrationBuilder.DropTable(
                name: "thank_you_notes",
                schema: "public");

            migrationBuilder.DropTable(
                name: "visitor_registrations",
                schema: "public");

            migrationBuilder.DropColumn(
                name: "Email",
                schema: "public",
                table: "user_identities");

            migrationBuilder.DropColumn(
                name: "FailedLoginAttempts",
                schema: "public",
                table: "user_identities");

            migrationBuilder.DropColumn(
                name: "IsContactVerified",
                schema: "public",
                table: "user_identities");

            migrationBuilder.DropColumn(
                name: "LockoutEnd",
                schema: "public",
                table: "user_identities");

            migrationBuilder.DropColumn(
                name: "Name",
                schema: "public",
                table: "user_identities");

            migrationBuilder.DropColumn(
                name: "PasswordHash",
                schema: "public",
                table: "user_identities");

            migrationBuilder.DropColumn(
                name: "PhoneNumber",
                schema: "public",
                table: "user_identities");
        }
    }
}

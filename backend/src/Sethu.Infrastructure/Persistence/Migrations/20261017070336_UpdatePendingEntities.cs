using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sethu.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePendingEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "KeyDifferentiator",
                schema: "public",
                table: "dbn_member_registrations",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "IdealCustomerProfilesJson",
                schema: "public",
                table: "dbn_member_registrations",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "HobbiesInterests",
                schema: "public",
                table: "dbn_member_registrations",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Gothram",
                schema: "public",
                table: "dbn_member_registrations",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "GeographicMarketsServedJson",
                schema: "public",
                table: "dbn_member_registrations",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "FatherName",
                schema: "public",
                table: "dbn_member_registrations",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "BusinessDescription",
                schema: "public",
                table: "dbn_member_registrations",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "BusinessConnectionsSought",
                schema: "public",
                table: "dbn_member_registrations",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<bool>(
                name: "BirthdayGreetingConsent",
                schema: "public",
                table: "dbn_member_registrations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "BusinessContactEmail",
                schema: "public",
                table: "dbn_member_registrations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConnectionsCanGiveJson",
                schema: "public",
                table: "dbn_member_registrations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "VoluntaryContributionAcknowledged",
                schema: "public",
                table: "dbn_member_registrations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "chapter_approvals",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    registration_id = table.Column<Guid>(type: "uuid", nullable: false),
                    approved_by = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    role_at_approval = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    remarks = table.Column<string>(type: "text", nullable: true),
                    approved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chapter_approvals", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "chapter_group_memberships",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    chapter_id = table.Column<Guid>(type: "uuid", nullable: false),
                    member_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    full_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    phone = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    business_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    role = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    joined_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chapter_group_memberships", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "chapter_leaders",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    chapter_id = table.Column<Guid>(type: "uuid", nullable: true),
                    full_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    phone = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    position = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    role = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    must_change_password = table.Column<bool>(type: "boolean", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    failed_login_attempts = table.Column<int>(type: "integer", nullable: false),
                    lockout_end = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chapter_leaders", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "chapters",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    region_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    state_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chapters", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "document_verifications",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    registration_id = table.Column<Guid>(type: "uuid", nullable: false),
                    document_url = table.Column<string>(type: "text", nullable: false),
                    verified_by = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    verified_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_document_verifications", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "member_registrations",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    full_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    phone = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    business_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    category_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    chapter_id = table.Column<Guid>(type: "uuid", nullable: false),
                    onboarding_status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    registered_by = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    registered_by_position = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_member_registrations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "member_role_assignments",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    member_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    chapter_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    assigned_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    valid_until = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_member_role_assignments", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "payment_records",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    registration_id = table.Column<Guid>(type: "uuid", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    payment_ref = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    payment_status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    verified_by = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    verified_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    remarks = table.Column<string>(type: "text", nullable: true),
                    rejection_reason = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payment_records", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_dbn_member_registrations_TenantId_Email",
                schema: "public",
                table: "dbn_member_registrations",
                columns: new[] { "TenantId", "Email" });

            migrationBuilder.CreateIndex(
                name: "IX_chapter_approvals_registration_id",
                schema: "public",
                table: "chapter_approvals",
                column: "registration_id");

            migrationBuilder.CreateIndex(
                name: "IX_chapter_group_memberships_chapter_id_member_id",
                schema: "public",
                table: "chapter_group_memberships",
                columns: new[] { "chapter_id", "member_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_chapter_leaders_chapter_id_position",
                schema: "public",
                table: "chapter_leaders",
                columns: new[] { "chapter_id", "position" },
                unique: true,
                filter: "\"is_active\" = true AND \"chapter_id\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_chapter_leaders_email",
                schema: "public",
                table: "chapter_leaders",
                column: "email");

            migrationBuilder.CreateIndex(
                name: "IX_chapter_leaders_organization_id_position",
                schema: "public",
                table: "chapter_leaders",
                columns: new[] { "organization_id", "position" },
                unique: true,
                filter: "\"is_active\" = true AND \"position\" = 'Trust'");

            migrationBuilder.CreateIndex(
                name: "IX_document_verifications_registration_id",
                schema: "public",
                table: "document_verifications",
                column: "registration_id");

            migrationBuilder.CreateIndex(
                name: "IX_member_registrations_chapter_id",
                schema: "public",
                table: "member_registrations",
                column: "chapter_id");

            migrationBuilder.CreateIndex(
                name: "IX_member_registrations_onboarding_status",
                schema: "public",
                table: "member_registrations",
                column: "onboarding_status");

            migrationBuilder.CreateIndex(
                name: "IX_member_role_assignments_chapter_id_role_id",
                schema: "public",
                table: "member_role_assignments",
                columns: new[] { "chapter_id", "role_id" });

            migrationBuilder.CreateIndex(
                name: "IX_member_role_assignments_member_id_chapter_id",
                schema: "public",
                table: "member_role_assignments",
                columns: new[] { "member_id", "chapter_id" });

            migrationBuilder.CreateIndex(
                name: "IX_payment_records_registration_id",
                schema: "public",
                table: "payment_records",
                column: "registration_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "chapter_approvals",
                schema: "public");

            migrationBuilder.DropTable(
                name: "chapter_group_memberships",
                schema: "public");

            migrationBuilder.DropTable(
                name: "chapter_leaders",
                schema: "public");

            migrationBuilder.DropTable(
                name: "chapters",
                schema: "public");

            migrationBuilder.DropTable(
                name: "document_verifications",
                schema: "public");

            migrationBuilder.DropTable(
                name: "member_registrations",
                schema: "public");

            migrationBuilder.DropTable(
                name: "member_role_assignments",
                schema: "public");

            migrationBuilder.DropTable(
                name: "payment_records",
                schema: "public");

            migrationBuilder.DropIndex(
                name: "IX_dbn_member_registrations_TenantId_Email",
                schema: "public",
                table: "dbn_member_registrations");

            migrationBuilder.DropColumn(
                name: "BirthdayGreetingConsent",
                schema: "public",
                table: "dbn_member_registrations");

            migrationBuilder.DropColumn(
                name: "BusinessContactEmail",
                schema: "public",
                table: "dbn_member_registrations");

            migrationBuilder.DropColumn(
                name: "ConnectionsCanGiveJson",
                schema: "public",
                table: "dbn_member_registrations");

            migrationBuilder.DropColumn(
                name: "VoluntaryContributionAcknowledged",
                schema: "public",
                table: "dbn_member_registrations");

            migrationBuilder.AlterColumn<string>(
                name: "KeyDifferentiator",
                schema: "public",
                table: "dbn_member_registrations",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "IdealCustomerProfilesJson",
                schema: "public",
                table: "dbn_member_registrations",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "HobbiesInterests",
                schema: "public",
                table: "dbn_member_registrations",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Gothram",
                schema: "public",
                table: "dbn_member_registrations",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "GeographicMarketsServedJson",
                schema: "public",
                table: "dbn_member_registrations",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "FatherName",
                schema: "public",
                table: "dbn_member_registrations",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "BusinessDescription",
                schema: "public",
                table: "dbn_member_registrations",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "BusinessConnectionsSought",
                schema: "public",
                table: "dbn_member_registrations",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }
    }
}

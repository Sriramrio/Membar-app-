using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sethu.Infrastructure.Persistence.Migrations;

/// <summary>Approved legacy-to-governed application mapping. One-to-one per tenant.</summary>
[Microsoft.EntityFrameworkCore.Infrastructure.DbContext(typeof(Sethu.Infrastructure.Persistence.SethuDbContext))]
[Migration("20261028043000_AddMembershipRegistrationLinks")]
public partial class AddMembershipRegistrationLinks : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(name: "membership_registration_links", schema: "public", columns: table => new
        {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            TenantId = table.Column<Guid>(type: "uuid", nullable: false),
            ChapterId = table.Column<Guid>(type: "uuid", nullable: false),
            RegistrationId = table.Column<Guid>(type: "uuid", nullable: false),
            IntakeId = table.Column<Guid>(type: "uuid", nullable: false),
            ApplicantUserId = table.Column<Guid>(type: "uuid", nullable: false),
            ReviewerUserId = table.Column<Guid>(type: "uuid", nullable: false),
            EvidenceReference = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
            ReviewedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
        }, constraints: table =>
        {
            table.PrimaryKey("PK_membership_registration_links", x => x.Id);
            table.ForeignKey(
                name: "FK_membership_registration_links_dbn_member_registrations_RegistrationId",
                column: x => x.RegistrationId,
                principalSchema: "public",
                principalTable: "dbn_member_registrations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
            table.ForeignKey(
                name: "FK_membership_registration_links_member_intakes_IntakeId",
                column: x => x.IntakeId,
                principalSchema: "public",
                principalTable: "member_intakes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        });
        migrationBuilder.CreateIndex(name: "IX_mrl_tenant_registration", schema: "public", table: "membership_registration_links",
            columns: new[] { "TenantId", "RegistrationId" }, unique: true);
        migrationBuilder.CreateIndex(name: "IX_mrl_tenant_intake", schema: "public", table: "membership_registration_links",
            columns: new[] { "TenantId", "IntakeId" }, unique: true);
        migrationBuilder.CreateIndex(name: "IX_mrl_tenant_applicant", schema: "public", table: "membership_registration_links",
            columns: new[] { "TenantId", "ApplicantUserId" });
    }
    protected override void Down(MigrationBuilder migrationBuilder) =>
        migrationBuilder.DropTable(name: "membership_registration_links", schema: "public");
}

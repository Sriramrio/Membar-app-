using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Sethu.Infrastructure.Persistence;

#nullable disable
namespace Sethu.Infrastructure.Persistence.Migrations;

[DbContext(typeof(SethuDbContext))]
[Migration("20261029140000_AddVisitorInvitations")]
public partial class AddVisitorInvitations : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS public.visitor_invitations (
              "Id" uuid PRIMARY KEY,
              "TenantId" uuid NOT NULL,
              "InviterMemberId" uuid NOT NULL,
              "ChapterId" uuid NOT NULL,
              "VisitorRegistrationId" uuid NULL,
              "Reference" varchar(32) NOT NULL,
              "FirstName" varchar(100) NOT NULL,
              "LastName" varchar(100) NOT NULL,
              "CompanyName" varchar(200) NOT NULL,
              "Email" varchar(254) NOT NULL,
              "Mobile" varchar(32) NOT NULL,
              "IdempotencyKey" varchar(120) NOT NULL,
              "Status" varchar(32) NOT NULL,
              "CreatedAt" timestamptz NOT NULL,
              "ExpiresAt" timestamptz NOT NULL,
              CONSTRAINT "FK_visitor_invitations_members_InviterMemberId" FOREIGN KEY ("InviterMemberId") REFERENCES public.members ("Id") ON DELETE RESTRICT,
              CONSTRAINT "FK_visitor_invitations_organisation_units_ChapterId" FOREIGN KEY ("ChapterId") REFERENCES public.organisation_units ("Id") ON DELETE RESTRICT,
              CONSTRAINT "FK_visitor_invitations_visitor_registrations_VisitorRegistrationId"
                FOREIGN KEY ("VisitorRegistrationId") REFERENCES public.visitor_registrations ("Id") ON DELETE RESTRICT
            );
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_visitor_invitations_Reference" ON public.visitor_invitations ("Reference");
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_visitor_invitations_TenantId_InviterMemberId_IdempotencyKey"
              ON public.visitor_invitations ("TenantId", "InviterMemberId", "IdempotencyKey");
            CREATE INDEX IF NOT EXISTS "IX_visitor_invitations_TenantId_ChapterId_CreatedAt"
              ON public.visitor_invitations ("TenantId", "ChapterId", "CreatedAt");
            """);
    }
    protected override void Down(MigrationBuilder migrationBuilder) =>
        migrationBuilder.DropTable(name: "visitor_invitations", schema: "public");
}

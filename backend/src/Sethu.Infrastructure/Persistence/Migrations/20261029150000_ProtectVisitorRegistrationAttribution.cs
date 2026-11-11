using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Sethu.Infrastructure.Persistence;

#nullable disable
namespace Sethu.Infrastructure.Persistence.Migrations;

[DbContext(typeof(SethuDbContext))]
[Migration("20261029150000_ProtectVisitorRegistrationAttribution")]
public partial class ProtectVisitorRegistrationAttribution : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("""
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_visitor_invitations_VisitorRegistrationId"
          ON public.visitor_invitations ("VisitorRegistrationId")
          WHERE "VisitorRegistrationId" IS NOT NULL;
        """);
    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("""
        DROP INDEX IF EXISTS public."IX_visitor_invitations_VisitorRegistrationId";
        """);
}

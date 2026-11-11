using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Sethu.Infrastructure.Persistence;
#nullable disable
namespace Sethu.Infrastructure.Persistence.Migrations;
[DbContext(typeof(SethuDbContext))]
[Migration("20261029170000_LinkVisitorToGovernedIntake")]
public partial class LinkVisitorToGovernedIntake : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("""
        CREATE TABLE public.visitor_intake_links (
          "Id" uuid PRIMARY KEY, "TenantId" uuid NOT NULL, "ChapterId" uuid NOT NULL,
          "RegistrationId" uuid NOT NULL, "IntakeId" uuid NOT NULL,
          "LinkedByUserId" uuid NOT NULL, "LinkedAt" timestamptz NOT NULL,
          CONSTRAINT "FK_visitor_intake_links_registration" FOREIGN KEY ("RegistrationId") REFERENCES public.visitor_registrations ("Id") ON DELETE RESTRICT,
          CONSTRAINT "FK_visitor_intake_links_intake" FOREIGN KEY ("IntakeId") REFERENCES public.member_intakes ("Id") ON DELETE RESTRICT,
          CONSTRAINT "FK_visitor_intake_links_chapter" FOREIGN KEY ("ChapterId") REFERENCES public.organisation_units ("Id") ON DELETE RESTRICT
        );
        CREATE UNIQUE INDEX "IX_visitor_intake_links_registration" ON public.visitor_intake_links ("TenantId", "RegistrationId");
        CREATE UNIQUE INDEX "IX_visitor_intake_links_intake" ON public.visitor_intake_links ("TenantId", "IntakeId");
        CREATE INDEX "IX_visitor_intake_links_chapter" ON public.visitor_intake_links ("TenantId", "ChapterId", "LinkedAt");
        """);
    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("DROP TABLE public.visitor_intake_links;");
}

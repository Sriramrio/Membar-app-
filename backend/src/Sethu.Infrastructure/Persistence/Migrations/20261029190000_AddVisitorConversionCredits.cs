using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Sethu.Infrastructure.Persistence;
#nullable disable
namespace Sethu.Infrastructure.Persistence.Migrations;
[DbContext(typeof(SethuDbContext))]
[Migration("20261029190000_AddVisitorConversionCredits")]
public partial class AddVisitorConversionCredits : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("""
        CREATE TABLE public.visitor_conversion_credits (
          "Id" uuid PRIMARY KEY, "TenantId" uuid NOT NULL, "ChapterId" uuid NOT NULL,
          "RegistrationId" uuid NOT NULL, "IntakeId" uuid NOT NULL, "MemberId" uuid NOT NULL,
          "InvitationId" uuid NOT NULL, "InviterMemberId" uuid NOT NULL,
          "ActivatedAt" timestamptz NOT NULL,
          CONSTRAINT "FK_vcc_registration" FOREIGN KEY ("RegistrationId") REFERENCES public.visitor_registrations ("Id") ON DELETE RESTRICT,
          CONSTRAINT "FK_vcc_intake" FOREIGN KEY ("IntakeId") REFERENCES public.member_intakes ("Id") ON DELETE RESTRICT,
          CONSTRAINT "FK_vcc_member" FOREIGN KEY ("MemberId") REFERENCES public.members ("Id") ON DELETE RESTRICT,
          CONSTRAINT "FK_vcc_invitation" FOREIGN KEY ("InvitationId") REFERENCES public.visitor_invitations ("Id") ON DELETE RESTRICT,
          CONSTRAINT "FK_vcc_inviter" FOREIGN KEY ("InviterMemberId") REFERENCES public.members ("Id") ON DELETE RESTRICT,
          CONSTRAINT "FK_vcc_chapter" FOREIGN KEY ("ChapterId") REFERENCES public.organisation_units ("Id") ON DELETE RESTRICT
        );
        CREATE UNIQUE INDEX "UX_vcc_member" ON public.visitor_conversion_credits ("TenantId", "MemberId");
        CREATE UNIQUE INDEX "UX_vcc_intake" ON public.visitor_conversion_credits ("TenantId", "IntakeId");
        CREATE UNIQUE INDEX "UX_vcc_registration" ON public.visitor_conversion_credits ("TenantId", "RegistrationId");
        CREATE UNIQUE INDEX "UX_vcc_invitation" ON public.visitor_conversion_credits ("TenantId", "InvitationId");
        CREATE INDEX "IX_vcc_inviter_at" ON public.visitor_conversion_credits ("TenantId", "InviterMemberId", "ActivatedAt");
        CREATE INDEX "IX_vcc_chapter_at" ON public.visitor_conversion_credits ("TenantId", "ChapterId", "ActivatedAt");
        """);
    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("DROP TABLE public.visitor_conversion_credits;");
}

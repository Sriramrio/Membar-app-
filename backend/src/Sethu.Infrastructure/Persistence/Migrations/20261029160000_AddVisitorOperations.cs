using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Sethu.Infrastructure.Persistence;

#nullable disable
namespace Sethu.Infrastructure.Persistence.Migrations;

[DbContext(typeof(SethuDbContext))]
[Migration("20261029160000_AddVisitorOperations")]
public partial class AddVisitorOperations : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("""
        CREATE TABLE public.visitor_event_attendance (
          "Id" uuid PRIMARY KEY, "TenantId" uuid NOT NULL, "ChapterId" uuid NOT NULL,
          "RegistrationId" uuid NOT NULL, "EventId" uuid NOT NULL,
          "VerifiedByUserId" uuid NOT NULL, "VerifiedAt" timestamptz NOT NULL,
          CONSTRAINT "FK_visitor_event_attendance_registration" FOREIGN KEY ("RegistrationId") REFERENCES public.visitor_registrations ("Id") ON DELETE RESTRICT,
          CONSTRAINT "FK_visitor_event_attendance_event" FOREIGN KEY ("EventId") REFERENCES public.network_free_events ("Id") ON DELETE RESTRICT,
          CONSTRAINT "FK_visitor_event_attendance_chapter" FOREIGN KEY ("ChapterId") REFERENCES public.organisation_units ("Id") ON DELETE RESTRICT
        );
        CREATE UNIQUE INDEX "IX_visitor_event_attendance_visitor_event" ON public.visitor_event_attendance ("TenantId", "RegistrationId", "EventId");
        CREATE INDEX "IX_visitor_event_attendance_chapter" ON public.visitor_event_attendance ("TenantId", "ChapterId", "VerifiedAt");
        CREATE TABLE public.visitor_follow_ups (
          "Id" uuid PRIMARY KEY, "TenantId" uuid NOT NULL, "ChapterId" uuid NOT NULL,
          "RegistrationId" uuid NOT NULL, "AssignedUserId" uuid NOT NULL,
          "Outcome" varchar(32) NOT NULL, "Notes" varchar(2000) NOT NULL,
          "CreatedAt" timestamptz NOT NULL, "UpdatedAt" timestamptz NOT NULL, "Version" bigint NOT NULL,
          CONSTRAINT "FK_visitor_follow_ups_registration" FOREIGN KEY ("RegistrationId") REFERENCES public.visitor_registrations ("Id") ON DELETE RESTRICT,
          CONSTRAINT "FK_visitor_follow_ups_chapter" FOREIGN KEY ("ChapterId") REFERENCES public.organisation_units ("Id") ON DELETE RESTRICT
        );
        CREATE INDEX "IX_visitor_follow_ups_chapter" ON public.visitor_follow_ups ("TenantId", "ChapterId", "UpdatedAt");
        """);
    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("""
        DROP TABLE IF EXISTS public.visitor_follow_ups;
        DROP TABLE IF EXISTS public.visitor_event_attendance;
        """);
}

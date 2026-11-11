using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Sethu.Infrastructure.Persistence;

#nullable disable

namespace Sethu.Infrastructure.Persistence.Migrations;

[DbContext(typeof(SethuDbContext))]
[Migration("20261029180000_AddEventRsvps")]
public partial class AddEventRsvps : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("""
        CREATE TABLE IF NOT EXISTS public.event_rsvps (
            "Id" uuid NOT NULL PRIMARY KEY,
            "TenantId" uuid NOT NULL,
            "EventId" uuid NOT NULL,
            "MemberId" text NOT NULL,
            "MemberName" text NOT NULL,
            "MemberEmail" text NOT NULL DEFAULT '',
            "MemberPhone" text NOT NULL DEFAULT '',
            "ChapterId" text NULL,
            "ChapterName" text NULL,
            "Status" text NOT NULL,
            "SubstituteName" text NULL,
            "SubstitutePhone" text NULL,
            "Notes" text NULL,
            "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
            "UpdatedAt" timestamp with time zone NOT NULL DEFAULT now()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS ix_event_rsvps_event_member ON public.event_rsvps("EventId", "MemberId");

        CREATE TABLE IF NOT EXISTS public.organisation_handovers (
            "Id" uuid NOT NULL PRIMARY KEY,
            "TenantId" uuid NOT NULL,
            "AssignmentId" text NOT NULL,
            "OutgoingMemberId" text NOT NULL,
            "IncomingMemberId" text NOT NULL,
            "ScopeId" text NOT NULL,
            "Status" text NOT NULL DEFAULT 'Prepared',
            "PreparedAt" text NOT NULL,
            "AcceptedAt" text NULL,
            "CompletedAt" text NULL,
            "OpenTaskIdsJson" text NOT NULL DEFAULT '[]',
            "OpenActionIdsJson" text NOT NULL DEFAULT '[]',
            "OpenCaseIdsJson" text NOT NULL DEFAULT '[]',
            "MeetingIdsJson" text NOT NULL DEFAULT '[]',
            "ProgrammeIdsJson" text NOT NULL DEFAULT '[]',
            "DocumentIdsJson" text NOT NULL DEFAULT '[]',
            "SummaryJson" text NULL,
            "Version" bigint NOT NULL DEFAULT 1,
            "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
            "UpdatedAt" timestamp with time zone NOT NULL DEFAULT now()
        );
        """);

    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("""
        DROP TABLE IF EXISTS public.event_rsvps;
        DROP TABLE IF EXISTS public.organisation_handovers;
        """);
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sethu.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessTaxonomyAndProfileColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Fully idempotent execution using standard PostgreSQL IF NOT EXISTS guards.
            // Avoids 42P07 ("relation already exists") and 42701 ("column already exists") errors.
            migrationBuilder.Sql(@"
                -- 1. Ensure business taxonomy columns on member registrations
                ALTER TABLE IF EXISTS public.dbn_member_registrations ADD COLUMN IF NOT EXISTS ""SectorId"" uuid NULL;
                ALTER TABLE IF EXISTS public.dbn_member_registrations ADD COLUMN IF NOT EXISTS ""SectorName"" text NULL;
                ALTER TABLE IF EXISTS public.dbn_member_registrations ADD COLUMN IF NOT EXISTS ""SegmentId"" uuid NULL;
                ALTER TABLE IF EXISTS public.dbn_member_registrations ADD COLUMN IF NOT EXISTS ""SegmentName"" text NULL;
                ALTER TABLE IF EXISTS public.dbn_member_registrations ADD COLUMN IF NOT EXISTS ""SpecialisationId"" uuid NULL;
                ALTER TABLE IF EXISTS public.dbn_member_registrations ADD COLUMN IF NOT EXISTS ""SpecialisationName"" text NULL;

                -- 2. Ensure image and logo columns on chapters
                ALTER TABLE IF EXISTS public.chapters ADD COLUMN IF NOT EXISTS image text NULL;
                ALTER TABLE IF EXISTS public.chapters ADD COLUMN IF NOT EXISTS logo text NULL;

                -- 3. Ensure chapter leader transition columns
                ALTER TABLE IF EXISTS public.chapter_leaders ADD COLUMN IF NOT EXISTS action_reason text NULL;
                ALTER TABLE IF EXISTS public.chapter_leaders ADD COLUMN IF NOT EXISTS relieved_at timestamptz NULL;
                ALTER TABLE IF EXISTS public.chapter_leaders ADD COLUMN IF NOT EXISTS suspended_at timestamptz NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE IF EXISTS public.dbn_member_registrations DROP COLUMN IF EXISTS ""SectorId"";
                ALTER TABLE IF EXISTS public.dbn_member_registrations DROP COLUMN IF EXISTS ""SectorName"";
                ALTER TABLE IF EXISTS public.dbn_member_registrations DROP COLUMN IF EXISTS ""SegmentId"";
                ALTER TABLE IF EXISTS public.dbn_member_registrations DROP COLUMN IF EXISTS ""SegmentName"";
                ALTER TABLE IF EXISTS public.dbn_member_registrations DROP COLUMN IF EXISTS ""SpecialisationId"";
                ALTER TABLE IF EXISTS public.dbn_member_registrations DROP COLUMN IF EXISTS ""SpecialisationName"";
                ALTER TABLE IF EXISTS public.chapters DROP COLUMN IF EXISTS image;
                ALTER TABLE IF EXISTS public.chapters DROP COLUMN IF EXISTS logo;
            ");
        }
    }
}

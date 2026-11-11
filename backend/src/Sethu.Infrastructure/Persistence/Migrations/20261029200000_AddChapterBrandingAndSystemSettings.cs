using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Sethu.Infrastructure.Persistence;

#nullable disable

namespace Sethu.Infrastructure.Persistence.Migrations;

[DbContext(typeof(SethuDbContext))]
[Migration("20261029200000_AddChapterBrandingAndSystemSettings")]
public partial class AddChapterBrandingAndSystemSettings : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
            ALTER TABLE IF EXISTS public.chapters ADD COLUMN IF NOT EXISTS image text;
            ALTER TABLE IF EXISTS public.chapters ADD COLUMN IF NOT EXISTS logo text;
            CREATE TABLE IF NOT EXISTS public.system_branding (
                id text PRIMARY KEY,
                sidebar_logo text,
                header_logo text,
                updated_at timestamptz
            );
        ");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
            DROP TABLE IF EXISTS public.system_branding;
            ALTER TABLE IF EXISTS public.chapters DROP COLUMN IF EXISTS image;
            ALTER TABLE IF EXISTS public.chapters DROP COLUMN IF EXISTS logo;
        ");
    }
}


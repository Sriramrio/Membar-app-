using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Sethu.Infrastructure.Persistence;

#nullable disable

namespace Sethu.Infrastructure.Persistence.Migrations
{
    /// <summary>
    /// Raw-SQL migration (no model change, so the model snapshot is intentionally untouched).
    /// Prevents overlapping exclusive appointments for the same tenant/chapter/role.
    /// AppointmentStatus: Approved=1, Active=2 consume an exclusive slot.
    /// Requires the btree_gist extension (bundled with PostgreSQL contrib; DB user must be allowed to CREATE EXTENSION).
    /// </summary>
    [DbContext(typeof(SethuDbContext))]
    [Migration("20261013180000_AddAppointmentExclusionConstraint")]
    public partial class AddAppointmentExclusionConstraint : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS btree_gist;");
            migrationBuilder.Sql(@"
ALTER TABLE public.appointments
    ADD CONSTRAINT ex_appt_exclusive_tenure
    EXCLUDE USING gist (
        ""TenantId"" WITH =,
        ""ChapterId"" WITH =,
        ""RoleCode"" WITH =,
        tstzrange(""StartsAt"", ""EndsAt"", '[)') WITH &&
    ) WHERE (""Exclusive"" = TRUE AND ""Status"" IN (1, 2));");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS ex_appt_exclusive_tenure;");
            // btree_gist extension intentionally left installed (may be used elsewhere).
        }
    }
}

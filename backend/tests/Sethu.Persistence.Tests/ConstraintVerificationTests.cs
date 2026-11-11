using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sethu.Domain.Entities;
using Sethu.Domain.MemberBusiness;
using Sethu.Domain.Security;
using Sethu.Infrastructure.Persistence;
using Xunit;

namespace Sethu.Persistence.Tests;

public class ConstraintVerificationTests
{
    private static readonly string ConnectionString = 
        Environment.GetEnvironmentVariable("SETHU_EF_DESIGNTIME_CONNECTION") 
        ?? "Host=localhost;Port=5432;Database=sethudev;Username=postgres;Password=Atribs@123";

    private SethuDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<SethuDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;
        return new SethuDbContext(options);
    }

    [Fact]
    public async Task Appointment_OverlappingTenure_ThrowsExclusionConstraintViolation()
    {
        using var context = CreateContext();
        var tenantId = Guid.NewGuid();
        var chapterId = Guid.NewGuid();
        var roleCode = "PRESIDENT";
        var starts = DateTimeOffset.UtcNow;
        var ends = starts.AddMonths(6);

        var appt1 = new Appointment
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ChapterId = chapterId,
            UserId = Guid.NewGuid(),
            RoleCode = roleCode,
            StartsAt = starts,
            EndsAt = ends,
            Exclusive = true,
            Status = AppointmentStatus.Active
        };

        var appt2 = new Appointment
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ChapterId = chapterId,
            UserId = Guid.NewGuid(),
            RoleCode = roleCode,
            StartsAt = starts.AddMonths(1), // Overlaps with appt1
            EndsAt = ends.AddMonths(1),
            Exclusive = true,
            Status = AppointmentStatus.Active
        };

        context.Appointments.Add(appt1);
        await context.SaveChangesAsync();

        context.Appointments.Add(appt2);
        var ex = await Assert.ThrowsAsync<DbUpdateException>(() => context.SaveChangesAsync());
        var npgsqlEx = ex.InnerException as PostgresException;
        Assert.NotNull(npgsqlEx);
        Assert.Contains("ex_appt_exclusive_tenure", npgsqlEx.ConstraintName ?? npgsqlEx.Message);

        // Cleanup
        context.ChangeTracker.Clear();
        var toDelete = await context.Appointments.FindAsync(appt1.Id);
        if (toDelete != null)
        {
            context.Appointments.Remove(toDelete);
            await context.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task MemberChapterAffiliation_MultipleActiveAffiliations_ThrowsUniqueConstraintViolation()
    {
        using var context = CreateContext();
        var tenantId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        // Create MemberRecord first due to foreign key
        var member = MemberRecord.Create(memberId, tenantId, userId);
        context.Set<MemberRecord>().Add(member);
        await context.SaveChangesAsync();

        var aff1 = MemberChapterAffiliation.Create(Guid.NewGuid(), tenantId, memberId, Guid.NewGuid());
        aff1.Approve(); // Sets Status = Active (1)

        var aff2 = MemberChapterAffiliation.Create(Guid.NewGuid(), tenantId, memberId, Guid.NewGuid());
        aff2.Approve(); // Sets Status = Active (1)

        context.Set<MemberChapterAffiliation>().Add(aff1);
        await context.SaveChangesAsync();

        context.Set<MemberChapterAffiliation>().Add(aff2);
        var ex = await Assert.ThrowsAsync<DbUpdateException>(() => context.SaveChangesAsync());
        var npgsqlEx = ex.InnerException as PostgresException;
        Assert.NotNull(npgsqlEx);
        Assert.True(npgsqlEx.SqlState == "23505", $"Expected unique constraint violation (23505), but was {npgsqlEx.SqlState}");

        // Cleanup in a clean context
        using var cleanupContext = CreateContext();
        var a1 = await cleanupContext.Set<MemberChapterAffiliation>().FindAsync(aff1.Id);
        if (a1 != null) cleanupContext.Set<MemberChapterAffiliation>().Remove(a1);
        var m = await cleanupContext.Set<MemberRecord>().FindAsync(memberId);
        if (m != null) cleanupContext.Set<MemberRecord>().Remove(m);
        await cleanupContext.SaveChangesAsync();
    }
}

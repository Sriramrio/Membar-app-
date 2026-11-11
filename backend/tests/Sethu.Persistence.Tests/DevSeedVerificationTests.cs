using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Infrastructure.Seed;
using Xunit;

namespace Sethu.Persistence.Tests;

public class DevSeedVerificationTests
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
    public async Task DevSeed_PopulatesMembersAcrossTwoChaptersWithAllModules()
    {
        using var context = CreateContext();
        await DevDataSeeder.SeedAsync(context);

        // Verify members
        var members = await context.Set<MemberRecord>().ToListAsync();
        Assert.True(members.Count >= 3, $"Expected >= 3 members, found {members.Count}");

        // Verify affiliations across at least 2 chapters
        var affiliations = await context.Set<MemberChapterAffiliation>().ToListAsync();
        var chapterCount = affiliations.Select(a => a.ChapterId).Distinct().Count();
        Assert.True(chapterCount >= 2, $"Expected affiliations across >= 2 chapters, found {chapterCount}");

        // Verify businesses
        var businesses = await context.Set<BusinessRecord>().ToListAsync();
        Assert.True(businesses.Count >= 3, $"Expected >= 3 businesses, found {businesses.Count}");

        // Verify connections
        var connections = await context.Set<Connection>().ToListAsync();
        Assert.True(connections.Count >= 2, $"Expected >= 2 connections, found {connections.Count}");

        // Verify notes
        var notes = await context.Set<NetworkNote>().ToListAsync();
        Assert.True(notes.Count >= 1, "Expected >= 1 interaction note");

        // Verify opportunities
        var opportunities = await context.Set<NetworkOpportunity>().ToListAsync();
        Assert.True(opportunities.Count >= 2, $"Expected >= 2 opportunities, found {opportunities.Count}");

        // Verify events
        var events = await context.Set<NetworkFreeEvent>().ToListAsync();
        Assert.True(events.Count >= 2, $"Expected >= 2 events, found {events.Count}");

        // Verify notifications
        var notifications = await context.Notifications.ToListAsync();
        Assert.True(notifications.Count >= 2, $"Expected >= 2 notifications, found {notifications.Count}");
    }

    [Fact]
    public async Task DbnMemberRegistrations_Query_Works()
    {
        using var context = CreateContext();
        var list = await context.DbnMemberRegistrations.ToListAsync();
        Assert.NotNull(list);
    }
}


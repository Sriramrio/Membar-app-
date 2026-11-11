using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Sethu.Infrastructure.Persistence;

/// <summary>
/// Used only by dotnet ef; never provisions, seeds, or upgrades a database by itself.
/// Connection resolution order:
///   1. SETHU_EF_DESIGNTIME_CONNECTION env var (optional override)
///   2. ConnectionStrings:SethuPostgres from Sethu.Api appsettings.Development.json, then appsettings.json
/// </summary>
public sealed class SethuDesignTimeDbContextFactory : IDesignTimeDbContextFactory<SethuDbContext>
{
    private const string Key = "SethuPostgres";

    public SethuDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("SETHU_EF_DESIGNTIME_CONNECTION");
        if (string.IsNullOrWhiteSpace(connectionString))
            connectionString = ReadFromAppSettings();
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException(
                $"ConnectionStrings:{Key} not found in Sethu.Api appsettings*.json and SETHU_EF_DESIGNTIME_CONNECTION is not set.");

        var options = new DbContextOptionsBuilder<SethuDbContext>()
            .UseNpgsql(connectionString, npgsql =>
                npgsql.MigrationsAssembly(typeof(SethuDbContext).Assembly.GetName().Name))
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning))
            .Options;
        return new SethuDbContext(options);
    }

    private static string? ReadFromAppSettings()
    {
        var apiDir = FindApiDirectory();
        if (apiDir is null) return null;
        // Development file overrides the base file, same as ASP.NET Core.
        foreach (var file in new[] { "appsettings.Development.json", "appsettings.json" })
        {
            var path = Path.Combine(apiDir, file);
            if (!File.Exists(path)) continue;
            using var doc = JsonDocument.Parse(File.ReadAllText(path),
                new JsonDocumentOptions { CommentHandling = JsonCommentHandling.Skip, AllowTrailingCommas = true });
            if (doc.RootElement.TryGetProperty("ConnectionStrings", out var cs)
                && cs.TryGetProperty(Key, out var v)
                && v.ValueKind == JsonValueKind.String
                && !string.IsNullOrWhiteSpace(v.GetString()))
                return v.GetString();
        }
        return null;
    }

    private static string? FindApiDirectory()
    {
        // Walk up from the current dir (and base dir) looking for src/Sethu.Api.
        foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
        {
            var dir = new DirectoryInfo(start);
            while (dir is not null)
            {
                var candidate = Path.Combine(dir.FullName, "src", "Sethu.Api");
                if (Directory.Exists(candidate)) return candidate;
                var sibling = Path.Combine(dir.FullName, "Sethu.Api");
                if (Directory.Exists(sibling)) return sibling;
                dir = dir.Parent;
            }
        }
        return null;
    }
}

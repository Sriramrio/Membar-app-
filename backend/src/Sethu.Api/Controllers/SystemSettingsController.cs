using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Infrastructure.Persistence;

namespace Sethu.Api.Controllers;

public record BrandingSettingsDto(string? SidebarLogo, string? HeaderLogo, int? SethuSize, int? HeaderLogoSize, DateTimeOffset? UpdatedAt);

[ApiController]
[AllowAnonymous]
[Route("api/system-settings")]
[Route("system-settings")]
public class SystemSettingsController : ControllerBase
{
    private readonly SethuDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<SystemSettingsController> _logger;
    private static readonly object FileLock = new();

    public SystemSettingsController(SethuDbContext db, IWebHostEnvironment env, ILogger<SystemSettingsController> logger)
    {
        _db = db;
        _env = env;
        _logger = logger;
    }

    private string CacheFilePath => Path.Combine(_env.ContentRootPath, "system-branding.json");

    private async Task EnsureSchemaAsync(CancellationToken ct)
    {
        try
        {
            await _db.Database.ExecuteSqlRawAsync(
                "ALTER TABLE IF EXISTS public.system_branding ADD COLUMN IF NOT EXISTS sethu_size integer; ALTER TABLE IF EXISTS public.system_branding ADD COLUMN IF NOT EXISTS header_logo_size integer;", ct);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Schema check for system_branding size columns bypassed");
        }
    }

    [HttpGet("branding")]
    public async Task<IActionResult> GetBranding(CancellationToken ct)
    {
        await EnsureSchemaAsync(ct);

        try
        {
            var record = await _db.SystemBrandings.AsNoTracking().FirstOrDefaultAsync(x => x.Id == "default", ct);
            if (record != null)
            {
                return Ok(new BrandingSettingsDto(record.SidebarLogo, record.HeaderLogo, record.SethuSize, record.HeaderLogoSize, record.UpdatedAt));
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Database system_branding read fallback to disk cache");
        }

        // Fallback to local file cache
        if (System.IO.File.Exists(CacheFilePath))
        {
            try
            {
                lock (FileLock)
                {
                    var json = System.IO.File.ReadAllText(CacheFilePath);
                    var cached = JsonSerializer.Deserialize<BrandingSettingsDto>(json);
                    if (cached != null) return Ok(cached);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to read branding file cache");
            }
        }

        return Ok(new BrandingSettingsDto(null, null, null, null, null));
    }

    [HttpPost("branding")]
    public async Task<IActionResult> SaveBranding([FromBody] BrandingSettingsDto dto, CancellationToken ct)
    {
        await EnsureSchemaAsync(ct);

        var now = DateTimeOffset.UtcNow;
        string? finalSidebar = null;
        string? finalHeader = null;
        int? finalSethuSize = null;
        int? finalHeaderLogoSize = null;

        // 1. Persist to DB table via EF Core
        try
        {
            var record = await _db.SystemBrandings.FirstOrDefaultAsync(x => x.Id == "default", ct);
            if (record == null)
            {
                record = new SystemBranding
                {
                    Id = "default",
                    SidebarLogo = dto.SidebarLogo == "__RESET__" ? null : dto.SidebarLogo,
                    HeaderLogo = dto.HeaderLogo == "__RESET__" ? null : dto.HeaderLogo,
                    SethuSize = dto.SethuSize.HasValue && dto.SethuSize.Value > 0 ? dto.SethuSize.Value : null,
                    HeaderLogoSize = dto.HeaderLogoSize.HasValue && dto.HeaderLogoSize.Value > 0 ? dto.HeaderLogoSize.Value : null,
                    UpdatedAt = now
                };
                _db.SystemBrandings.Add(record);
            }
            else
            {
                if (dto.SidebarLogo != null)
                {
                    record.SidebarLogo = dto.SidebarLogo == "__RESET__" ? null : dto.SidebarLogo;
                }
                if (dto.HeaderLogo != null)
                {
                    record.HeaderLogo = dto.HeaderLogo == "__RESET__" ? null : dto.HeaderLogo;
                }
                if (dto.SethuSize.HasValue)
                {
                    record.SethuSize = dto.SethuSize.Value > 0 ? dto.SethuSize.Value : null;
                }
                if (dto.HeaderLogoSize.HasValue)
                {
                    record.HeaderLogoSize = dto.HeaderLogoSize.Value > 0 ? dto.HeaderLogoSize.Value : null;
                }
                record.UpdatedAt = now;
            }

            await _db.SaveChangesAsync(ct);
            finalSidebar = record.SidebarLogo;
            finalHeader = record.HeaderLogo;
            finalSethuSize = record.SethuSize;
            finalHeaderLogoSize = record.HeaderLogoSize;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not save branding to database; relying on disk cache fallback");
        }

        var result = new BrandingSettingsDto(
            finalSidebar ?? (dto.SidebarLogo == "__RESET__" ? null : dto.SidebarLogo),
            finalHeader ?? (dto.HeaderLogo == "__RESET__" ? null : dto.HeaderLogo),
            finalSethuSize ?? dto.SethuSize,
            finalHeaderLogoSize ?? dto.HeaderLogoSize,
            now
        );

        // 2. Persist to file cache for durability
        try
        {
            lock (FileLock)
            {
                var json = JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true });
                System.IO.File.WriteAllText(CacheFilePath, json);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Could not save branding to disk cache");
        }

        return Ok(result);
    }
}

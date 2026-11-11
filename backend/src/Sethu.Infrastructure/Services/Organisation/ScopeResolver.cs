using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Sethu.Domain.Entities;
using Sethu.Domain.MemberBusiness;
using Sethu.Domain.Organisation;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Abstractions.Organisation;

namespace Sethu.Infrastructure.Services.Organisation;

public sealed class ScopeResolver : IScopeResolver
{
    private readonly SethuDbContext _db;
    private readonly ILogger<ScopeResolver> _logger;

    public ScopeResolver(SethuDbContext db, ILogger<ScopeResolver> logger)
    {
        _db = db;
        _logger = logger;
    }

    public static Guid DeterministicGuid(string input)
    {
        using var md5 = MD5.Create();
        var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(input));
        return new Guid(hash);
    }

    public async Task<ResolvedActorScope> ResolveActorAsync(ClaimsPrincipal user, Guid tenantId, CancellationToken ct = default)
    {
        var sub = user.FindFirst("sub")?.Value
                  ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? "00000000-0000-0000-0000-000000000099";
        var email = user.FindFirst(ClaimTypes.Email)?.Value
                    ?? user.FindFirst("email")?.Value
                    ?? "";
        var name = user.FindFirst(ClaimTypes.Name)?.Value
                   ?? user.FindFirst("name")?.Value
                   ?? "Office Bearer";
        var chapterClaim = user.FindFirst("chapter_id")?.Value;
        var roleClaim = user.FindFirst("leadership_role")?.Value
                        ?? user.FindFirst(ClaimTypes.Role)?.Value
                        ?? user.FindFirst("role")?.Value
                        ?? "chapter_leader";

        // Query database for leader profile if available
        ChapterLeader? leader = null;
        if (!string.IsNullOrEmpty(email))
        {
            leader = await _db.ChapterLeaders
                .AsNoTracking()
                .FirstOrDefaultAsync(l => l.Email.ToLower() == email.ToLower() && l.IsActive, ct);
        }

        if (leader == null && Guid.TryParse(sub, out var subGuid))
        {
            leader = await _db.ChapterLeaders
                .AsNoTracking()
                .FirstOrDefaultAsync(l => l.Id == subGuid && l.IsActive, ct);
        }

        var position = leader?.Position
                       ?? (roleClaim.Contains("Trust", StringComparison.OrdinalIgnoreCase) ? "Trust" : "Chapter President");
        var effectiveRole = leader?.Role ?? roleClaim;
        name = !string.IsNullOrEmpty(leader?.FullName) ? leader.FullName : name;

        // Ensure hierarchy units are initialized/harmonized
        var units = await GetOrCreateHierarchyUnitsAsync(tenantId, ct);

        // Determine base scope
        Unit? baseUnit = null;

        // Check if Trust, Leadership Team or National level
        bool isNational = position.Equals("Trust", StringComparison.OrdinalIgnoreCase)
                          || position.Equals("Trustee", StringComparison.OrdinalIgnoreCase)
                          || position.Equals("Leadership Team", StringComparison.OrdinalIgnoreCase)
                          || position.Contains("Leadership", StringComparison.OrdinalIgnoreCase)
                          || effectiveRole.Equals("trust_leader", StringComparison.OrdinalIgnoreCase)
                          || effectiveRole.Equals("trustee_leader", StringComparison.OrdinalIgnoreCase)
                          || effectiveRole.Equals("leadership_team", StringComparison.OrdinalIgnoreCase)
                          || position.Contains("National", StringComparison.OrdinalIgnoreCase)
                          || effectiveRole.Contains("national", StringComparison.OrdinalIgnoreCase)
                          || effectiveRole.Contains("management", StringComparison.OrdinalIgnoreCase)
                          || position.Contains("Super Admin", StringComparison.OrdinalIgnoreCase);

        bool isState = !isNational && (position.Contains("State", StringComparison.OrdinalIgnoreCase)
                                       || effectiveRole.Contains("state", StringComparison.OrdinalIgnoreCase));

        if (isNational)
        {
            baseUnit = units.FirstOrDefault(u => u.Level == UnitLevel.Country);
        }
        else if (isState)
        {
            // Find assigned state or default state
            baseUnit = units.FirstOrDefault(u => u.Level == UnitLevel.State);
        }
        else
        {
            // Chapter level
            Guid? targetChapterId = null;
            if (leader?.ChapterId.HasValue == true && leader.ChapterId.Value != Guid.Empty)
            {
                targetChapterId = leader.ChapterId.Value;
            }
            else if (!string.IsNullOrEmpty(chapterClaim) && Guid.TryParse(chapterClaim, out var parsedClaimId))
            {
                targetChapterId = parsedClaimId;
            }

            if (!targetChapterId.HasValue && !string.IsNullOrEmpty(email))
            {
                var roleAssign = await _db.MemberRoleAssignments.AsNoTracking()
                    .FirstOrDefaultAsync(a => a.MemberId.ToLower() == email.ToLower() && a.Status == "ACTIVE", ct);
                if (roleAssign != null)
                {
                    targetChapterId = roleAssign.ChapterId;
                }
                else
                {
                    var dbnReg = await _db.DbnMemberRegistrations.AsNoTracking()
                        .FirstOrDefaultAsync(d => d.Email.ToLower() == email.ToLower(), ct);
                    if (dbnReg != null)
                    {
                        if (dbnReg.ChapterId.HasValue && dbnReg.ChapterId.Value != Guid.Empty)
                        {
                            targetChapterId = dbnReg.ChapterId.Value;
                        }
                        else if (!string.IsNullOrWhiteSpace(dbnReg.ChapterName))
                        {
                            var ch = await _db.Chapters.AsNoTracking()
                                .FirstOrDefaultAsync(c => c.Name.ToLower() == dbnReg.ChapterName.ToLower(), ct);
                            if (ch != null) targetChapterId = ch.Id;
                        }
                    }
                }
            }

            if (targetChapterId.HasValue)
            {
                baseUnit = units.FirstOrDefault(u => u.Id == targetChapterId.Value);
                if (baseUnit == null)
                {
                    // Check database chapters table for dynamically created chapters
                    var dbChapter = await _db.Chapters.AsNoTracking().FirstOrDefaultAsync(c => c.Id == targetChapterId.Value, ct);
                    if (dbChapter != null)
                    {
                        baseUnit = units.FirstOrDefault(u => u.Code.Equals(dbChapter.Name, StringComparison.OrdinalIgnoreCase))
                                   ?? new Unit
                                   {
                                       Id = dbChapter.Id,
                                       TenantId = tenantId,
                                       ParentId = units.FirstOrDefault(u => u.Level == UnitLevel.State)?.Id,
                                       Level = UnitLevel.Chapter,
                                       Code = dbChapter.Name,
                                       Active = dbChapter.Status.Equals("ACTIVE", StringComparison.OrdinalIgnoreCase),
                                       Version = 1
                                   };

                        if (!units.Any(u => u.Id == baseUnit.Id))
                        {
                            units.Add(baseUnit);
                        }
                    }
                }
            }

            if (baseUnit == null)
            {
                // Fallback to first chapter unit
                baseUnit = units.FirstOrDefault(u => u.Level == UnitLevel.Chapter) ?? units.FirstOrDefault();
            }
        }

        if (baseUnit == null)
        {
            baseUnit = new Unit
            {
                Id = DeterministicGuid("chapter:Hosur Chapter"),
                TenantId = tenantId,
                Level = UnitLevel.Chapter,
                Code = "Hosur Chapter",
                Active = true
            };
        }

        var levelString = baseUnit.Level switch
        {
            UnitLevel.Country => "NATIONAL",
            UnitLevel.State => "STATE",
            UnitLevel.Region => "REGION",
            UnitLevel.City => "CITY",
            _ => "CHAPTER"
        };

        // Calculate allowed scopes (own unit + all descendants + all ancestors)
        var allowedScopeIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        CollectDescendants(baseUnit.Id, units, allowedScopeIds);

        var curAncestor = baseUnit;
        while (curAncestor != null)
        {
            allowedScopeIds.Add(curAncestor.Id.ToString("D"));
            allowedScopeIds.Add(curAncestor.Id.ToString("N"));
            allowedScopeIds.Add(curAncestor.Code);
            if (curAncestor.ParentId.HasValue && curAncestor.ParentId.Value != Guid.Empty)
            {
                curAncestor = units.FirstOrDefault(u => u.Id == curAncestor.ParentId.Value);
            }
            else
            {
                break;
            }
        }
        allowedScopeIds.Add("00000000-0000-0000-0000-000000000001");
        allowedScopeIds.Add("11111111-1111-1111-1111-111111111111");
        allowedScopeIds.Add("all");

        // If National, also add "all" and all database chapters
        if (baseUnit.Level == UnitLevel.Country)
        {
            allowedScopeIds.Add("all");
            allowedScopeIds.Add("national");

            var allDbChapters = await _db.Chapters.AsNoTracking().ToListAsync(ct);
            foreach (var ch in allDbChapters)
            {
                allowedScopeIds.Add(ch.Id.ToString("D"));
                allowedScopeIds.Add(ch.Id.ToString("N"));
                allowedScopeIds.Add(ch.Name);
            }

            foreach (var u in units)
            {
                allowedScopeIds.Add(u.Id.ToString("D"));
                allowedScopeIds.Add(u.Id.ToString("N"));
                allowedScopeIds.Add(u.Code);
            }
        }

        var permissions = GetPermissionsForRole(position, effectiveRole, levelString);

        return new ResolvedActorScope
        {
            ActorId = sub,
            Name = name,
            Email = email,
            Role = effectiveRole,
            Position = position,
            ScopeId = baseUnit.Id.ToString("D"),
            ScopeName = baseUnit.Code,
            ScopeLevel = levelString,
            AllowedScopeIds = allowedScopeIds,
            Permissions = permissions
        };
    }

    public async Task<ResolvedMemberScope> ResolveMemberAsync(ClaimsPrincipal user, Guid tenantId, CancellationToken ct = default)
    {
        var sub = user.FindFirst("sub")?.Value
                  ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = user.FindFirst(ClaimTypes.Email)?.Value
                    ?? user.FindFirst("email")?.Value;
        var chapterClaim = user.FindFirst("chapter_id")?.Value;

        if (string.IsNullOrEmpty(sub) && string.IsNullOrEmpty(email))
        {
            return new ResolvedMemberScope
            {
                MemberId = Guid.Empty,
                UserId = Guid.Empty,
                TenantId = tenantId,
                ChapterId = null,
                ChapterName = "General Network",
                AncestryScopeIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "all", "national" }
            };
        }

        Guid userId = Guid.Empty;
        Guid memberId = Guid.Empty;

        // 1. Look up UserIdentity
        UserIdentity? userIdentity = null;
        if (!string.IsNullOrEmpty(sub) && Guid.TryParse(sub, out var parsedSub))
        {
            userIdentity = await _db.UserIdentities
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == parsedSub || u.Subject == sub, ct);
        }

        if (userIdentity == null && !string.IsNullOrEmpty(email))
        {
            userIdentity = await _db.UserIdentities
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Email != null && u.Email.ToLower() == email.ToLower(), ct);
        }

        if (userIdentity != null)
        {
            userId = userIdentity.Id;
            memberId = userIdentity.MemberId ?? userIdentity.Id;
        }
        else if (Guid.TryParse(sub, out var parsedId))
        {
            userId = parsedId;
            memberId = parsedId;
        }

        // 2. Resolve Chapter ID
        Guid? chapterId = null;
        if (!string.IsNullOrEmpty(chapterClaim) && Guid.TryParse(chapterClaim, out var parsedChapterClaim))
        {
            chapterId = parsedChapterClaim;
        }

        if (!chapterId.HasValue && memberId != Guid.Empty)
        {
            var affiliation = await _db.Set<MemberChapterAffiliation>()
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.MemberId == memberId && a.Status == AffiliationStatus.Active, ct);
            if (affiliation != null)
            {
                chapterId = affiliation.ChapterId;
            }
        }

        if (!chapterId.HasValue && !string.IsNullOrEmpty(email))
        {
            var leader = await _db.ChapterLeaders
                .AsNoTracking()
                .FirstOrDefaultAsync(l => l.Email.ToLower() == email.ToLower() && l.IsActive, ct);
            if (leader?.ChapterId.HasValue == true)
            {
                chapterId = leader.ChapterId.Value;
            }
        }

        if (!chapterId.HasValue && !string.IsNullOrEmpty(email))
        {
            var dbn = await _db.DbnMemberRegistrations
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Email.ToLower() == email.ToLower(), ct);
            if (dbn != null)
            {
                if (dbn.ChapterId.HasValue && dbn.ChapterId.Value != Guid.Empty)
                {
                    chapterId = dbn.ChapterId.Value;
                }
                else if (!string.IsNullOrWhiteSpace(dbn.ChapterName))
                {
                    var ch = await _db.Chapters
                        .AsNoTracking()
                        .FirstOrDefaultAsync(c => c.Name.ToLower() == dbn.ChapterName.ToLower(), ct);
                    if (ch != null)
                    {
                        chapterId = ch.Id;
                    }
                }
            }
        }

        var units = await GetOrCreateHierarchyUnitsAsync(tenantId, ct);
        var ancestryScopeIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "all",
            "national"
        };

        string chapterName = "General Network";
        if (chapterId.HasValue)
        {
            var currentUnit = units.FirstOrDefault(u => u.Id == chapterId.Value);
            if (currentUnit == null)
            {
                var dbChapter = await _db.Chapters.AsNoTracking().FirstOrDefaultAsync(c => c.Id == chapterId.Value, ct);
                if (dbChapter != null)
                {
                    currentUnit = units.FirstOrDefault(u => u.Code.Equals(dbChapter.Name, StringComparison.OrdinalIgnoreCase))
                                  ?? new Unit
                                  {
                                      Id = dbChapter.Id,
                                      TenantId = tenantId,
                                      ParentId = units.FirstOrDefault(u => u.Level == UnitLevel.State)?.Id,
                                      Level = UnitLevel.Chapter,
                                      Code = dbChapter.Name,
                                      Active = dbChapter.Status.Equals("ACTIVE", StringComparison.OrdinalIgnoreCase),
                                      Version = 1
                                  };
                    if (!units.Any(u => u.Id == currentUnit.Id))
                    {
                        units.Add(currentUnit);
                    }
                }
            }

            if (currentUnit != null)
            {
                chapterName = currentUnit.Code;
                // Traverse upwards to build ancestry chain: Chapter -> Region/City -> State -> National
                var current = currentUnit;
                while (current != null)
                {
                    ancestryScopeIds.Add(current.Id.ToString("D"));
                    ancestryScopeIds.Add(current.Id.ToString("N"));
                    ancestryScopeIds.Add(current.Code);
                    var cleanCode = current.Code.Replace(" Chapter", "", StringComparison.OrdinalIgnoreCase).Trim();
                    ancestryScopeIds.Add(cleanCode);
                    ancestryScopeIds.Add(cleanCode.ToLowerInvariant().Replace(" ", "-"));
                    ancestryScopeIds.Add(cleanCode.ToLowerInvariant().Replace(" ", "_"));
                    ancestryScopeIds.Add(cleanCode.ToLowerInvariant().Replace(" ", ""));

                    if (current.ParentId.HasValue && current.ParentId.Value != Guid.Empty)
                    {
                        current = units.FirstOrDefault(u => u.Id == current.ParentId.Value);
                    }
                    else
                    {
                        break;
                    }
                }
            }
            else
            {
                ancestryScopeIds.Add(chapterId.Value.ToString("D"));
                ancestryScopeIds.Add(chapterId.Value.ToString("N"));
            }

            if (!string.IsNullOrWhiteSpace(chapterName))
            {
                var normName = chapterName.Replace(" Chapter", "", StringComparison.OrdinalIgnoreCase).Trim();
                ancestryScopeIds.Add(normName);
                ancestryScopeIds.Add(normName.ToLowerInvariant().Replace(" ", "-"));
                ancestryScopeIds.Add(normName.ToLowerInvariant().Replace(" ", "_"));
            }
        }

        // Always add country/national unit ID to ancestry
        var nationalUnit = units.FirstOrDefault(u => u.Level == UnitLevel.Country);
        if (nationalUnit != null)
        {
            ancestryScopeIds.Add(nationalUnit.Id.ToString("D"));
            ancestryScopeIds.Add(nationalUnit.Id.ToString("N"));
            ancestryScopeIds.Add(nationalUnit.Code);
        }

        return new ResolvedMemberScope
        {
            MemberId = memberId,
            UserId = userId,
            TenantId = tenantId,
            ChapterId = chapterId,
            ChapterName = chapterName,
            AncestryScopeIds = ancestryScopeIds
        };
    }

    public async Task<IReadOnlyList<Unit>> GetUnitTreeAsync(Guid tenantId, CancellationToken ct = default)
    {
        return await GetOrCreateHierarchyUnitsAsync(tenantId, ct);
    }

    public async Task<HashSet<string>> GetSubtreeScopeIdsAsync(Guid tenantId, string rootUnitId, CancellationToken ct = default)
    {
        var units = await GetOrCreateHierarchyUnitsAsync(tenantId, ct);
        var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        if (Guid.TryParse(rootUnitId, out var rootGuid))
        {
            var rootUnit = units.FirstOrDefault(u => u.Id == rootGuid);
            if (rootUnit != null)
            {
                allowed.Add(rootUnit.Id.ToString("D"));
                allowed.Add(rootUnit.Id.ToString("N"));
                allowed.Add(rootUnit.Code);
                CollectDescendants(rootUnit.Id, units, allowed);
            }
            else
            {
                allowed.Add(rootUnitId);
            }
        }
        else
        {
            var rootUnit = units.FirstOrDefault(u => u.Code.Equals(rootUnitId, StringComparison.OrdinalIgnoreCase));
            if (rootUnit != null)
            {
                allowed.Add(rootUnit.Id.ToString("D"));
                allowed.Add(rootUnit.Id.ToString("N"));
                allowed.Add(rootUnit.Code);
                CollectDescendants(rootUnit.Id, units, allowed);
            }
            else
            {
                allowed.Add(rootUnitId);
            }
        }

        return allowed;
    }

    public async Task<HashSet<string>> GetAncestryScopeIdsAsync(Guid tenantId, string unitId, CancellationToken ct = default)
    {
        var units = await GetOrCreateHierarchyUnitsAsync(tenantId, ct);
        var ancestry = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "all", "national" };

        Unit? current = null;
        if (Guid.TryParse(unitId, out var uGuid))
        {
            current = units.FirstOrDefault(u => u.Id == uGuid);
        }
        else
        {
            current = units.FirstOrDefault(u => u.Code.Equals(unitId, StringComparison.OrdinalIgnoreCase));
        }

        while (current != null)
        {
            ancestry.Add(current.Id.ToString("D"));
            ancestry.Add(current.Id.ToString("N"));
            ancestry.Add(current.Code);

            if (current.ParentId.HasValue && current.ParentId.Value != Guid.Empty)
            {
                current = units.FirstOrDefault(u => u.Id == current.ParentId.Value);
            }
            else
            {
                break;
            }
        }

        return ancestry;
    }

    private void CollectDescendants(Guid parentId, List<Unit> allUnits, HashSet<string> result)
    {
        var children = allUnits.Where(u => u.ParentId == parentId).ToList();
        foreach (var child in children)
        {
            result.Add(child.Id.ToString("D"));
            result.Add(child.Id.ToString("N"));
            result.Add(child.Code);
            CollectDescendants(child.Id, allUnits, result);
        }
    }

    private async Task<List<Unit>> GetOrCreateHierarchyUnitsAsync(Guid tenantId, CancellationToken ct)
    {
        var legacyTenant = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var defaultTenant = Sethu.Infrastructure.Seed.DevDataSeeder.DefaultTenantId;
        var existingUnits = await _db.Units
            .AsNoTracking()
            .Where(u => u.TenantId == tenantId || u.TenantId == defaultTenant || u.TenantId == legacyTenant)
            .ToListAsync(ct);

        // Ensure all chapters registered in Chapters table are harmonized into hierarchy Units
        var dbChapters = await _db.Chapters.AsNoTracking().ToListAsync(ct);
        var stateParentId = existingUnits.FirstOrDefault(u => u.Level == UnitLevel.State)?.Id;
        var missingUnits = new List<Unit>();

        foreach (var ch in dbChapters)
        {
            var exists = existingUnits.FirstOrDefault(u => u.Id == ch.Id || u.Code.Equals(ch.Name, StringComparison.OrdinalIgnoreCase));
            if (exists == null)
            {
                var newChapterUnit = new Unit
                {
                    Id = ch.Id,
                    TenantId = tenantId,
                    ParentId = stateParentId,
                    Level = UnitLevel.Chapter,
                    Code = ch.Name,
                    Active = ch.Status.Equals("ACTIVE", StringComparison.OrdinalIgnoreCase),
                    Version = 1
                };
                existingUnits.Add(newChapterUnit);
                missingUnits.Add(newChapterUnit);
            }
            else if (exists.Id != ch.Id)
            {
                // Also add an alias entry so queries by ch.Id succeed
                var aliasUnit = new Unit
                {
                    Id = ch.Id,
                    TenantId = tenantId,
                    ParentId = exists.ParentId,
                    Level = UnitLevel.Chapter,
                    Code = ch.Name,
                    Active = exists.Active,
                    Version = 1
                };
                existingUnits.Add(aliasUnit);
            }
        }

        // Return existing units with newly discovered chapters in memory without conflicting DB inserts

        // Check if full hierarchy is already present (has Country, State, and Chapter)
        bool hasFullTree = existingUnits.Any(u => u.Level == UnitLevel.Country)
                           && existingUnits.Any(u => u.Level == UnitLevel.State)
                           && existingUnits.Any(u => u.Level == UnitLevel.Chapter);

        if (hasFullTree)
        {
            return existingUnits;
        }

        // Build standard hierarchy tree
        // 1. National Unit
        var natId = DeterministicGuid("national:India");
        var nationalUnit = existingUnits.FirstOrDefault(u => u.Id == natId || u.Level == UnitLevel.Country)
                           ?? new Unit
                           {
                               Id = natId,
                               TenantId = tenantId,
                               ParentId = null,
                               Level = UnitLevel.Country,
                               Code = "India National Office",
                               Active = true,
                               Version = 1
                           };

        // 2. States
        var tnStateId = DeterministicGuid("state:Tamil Nadu");
        var tnState = existingUnits.FirstOrDefault(u => u.Id == tnStateId || (u.Level == UnitLevel.State && u.Code.Contains("Tamil Nadu", StringComparison.OrdinalIgnoreCase)))
                      ?? new Unit
                      {
                          Id = tnStateId,
                          TenantId = tenantId,
                          ParentId = nationalUnit.Id,
                          Level = UnitLevel.State,
                          Code = "Tamil Nadu State",
                          Active = true,
                          Version = 1
                      };

        var kaStateId = DeterministicGuid("state:Karnataka");
        var kaState = existingUnits.FirstOrDefault(u => u.Id == kaStateId || (u.Level == UnitLevel.State && u.Code.Contains("Karnataka", StringComparison.OrdinalIgnoreCase)))
                      ?? new Unit
                      {
                          Id = kaStateId,
                          TenantId = tenantId,
                          ParentId = nationalUnit.Id,
                          Level = UnitLevel.State,
                          Code = "Karnataka State",
                          Active = true,
                          Version = 1
                      };

        // 3. Regions
        var krishnagiriRegionId = DeterministicGuid("region:Krishnagiri Region");
        var krishnagiriRegion = existingUnits.FirstOrDefault(u => u.Id == krishnagiriRegionId)
                                ?? new Unit
                                {
                                    Id = krishnagiriRegionId,
                                    TenantId = tenantId,
                                    ParentId = tnState.Id,
                                    Level = UnitLevel.Region,
                                    Code = "Krishnagiri Region",
                                    Active = true,
                                    Version = 1
                                };

        var chennaiRegionId = DeterministicGuid("region:Chennai Region");
        var chennaiRegion = existingUnits.FirstOrDefault(u => u.Id == chennaiRegionId)
                            ?? new Unit
                            {
                                Id = chennaiRegionId,
                                TenantId = tenantId,
                                ParentId = tnState.Id,
                                Level = UnitLevel.Region,
                                Code = "Chennai Region",
                                Active = true,
                                Version = 1
                            };

        // 4. Chapters
        var chapHosurId = DeterministicGuid("chapter:Hosur Chapter");
        var hosurChapter = existingUnits.FirstOrDefault(u => u.Id == chapHosurId || u.Code.Equals("HOSUR", StringComparison.OrdinalIgnoreCase))
                           ?? new Unit
                           {
                               Id = chapHosurId,
                               TenantId = tenantId,
                               ParentId = krishnagiriRegion.Id,
                               Level = UnitLevel.Chapter,
                               Code = "Hosur Chapter",
                               Active = true,
                               Version = 1
                           };
        hosurChapter.ParentId = krishnagiriRegion.Id;
        hosurChapter.Level = UnitLevel.Chapter;

        var chapChennaiId = DeterministicGuid("chapter:Chennai Chapter");
        var chennaiChapter = existingUnits.FirstOrDefault(u => u.Id == chapChennaiId || u.Code.Equals("CHENNAI", StringComparison.OrdinalIgnoreCase))
                            ?? new Unit
                            {
                                Id = chapChennaiId,
                                TenantId = tenantId,
                                ParentId = chennaiRegion.Id,
                                Level = UnitLevel.Chapter,
                                Code = "Chennai Chapter",
                                Active = true,
                                Version = 1
                            };
        chennaiChapter.ParentId = chennaiRegion.Id;
        chennaiChapter.Level = UnitLevel.Chapter;

        var chapBangaloreId = DeterministicGuid("chapter:Bangalore Chapter");
        var bangaloreChapter = existingUnits.FirstOrDefault(u => u.Id == chapBangaloreId)
                               ?? new Unit
                               {
                                   Id = chapBangaloreId,
                                   TenantId = tenantId,
                                   ParentId = kaState.Id,
                                   Level = UnitLevel.Chapter,
                                   Code = "Bangalore Chapter",
                                   Active = true,
                                   Version = 1
                               };

        var allList = new List<Unit>
        {
            nationalUnit,
            tnState,
            kaState,
            krishnagiriRegion,
            chennaiRegion,
            hosurChapter,
            chennaiChapter,
            bangaloreChapter
        };

        // Ensure any other existing units are also preserved
        foreach (var ex in existingUnits)
        {
            if (!allList.Any(u => u.Id == ex.Id))
            {
                allList.Add(ex);
            }
        }

        return allList;
    }

    private static List<string> GetPermissionsForRole(string position, string role, string level)
    {
        bool isLeadershipFinance = position.Equals("Leadership Finance", StringComparison.OrdinalIgnoreCase) ||
                                   role.Equals("leadership_finance", StringComparison.OrdinalIgnoreCase);

        if (isLeadershipFinance)
        {
            return new List<string>
            {
                "org:read",
                "org.trust:payment",
                "membership.payment.verify",
                "org.dues.manage",
                "org.dues.reconcile",
                "org.members.view",
                "org.today.view",
                "org.chapters.view",
                "org.reports.view",
                "org.audit.view",
                "org.notifications.view"
            };
        }

        bool isTrust = position.Equals("Trust", StringComparison.OrdinalIgnoreCase) ||
                       position.Equals("Trustee", StringComparison.OrdinalIgnoreCase) ||
                       role.Equals("trust_leader", StringComparison.OrdinalIgnoreCase) ||
                       role.Equals("trustee_leader", StringComparison.OrdinalIgnoreCase) ||
                       role.Contains("trust", StringComparison.OrdinalIgnoreCase);

        if (isTrust)
        {
            // Trustee is strictly READ-ONLY across all organisation modules.
            // Only role assignment governance and trust payment verification actions are allowed.
            return new List<string>
            {
                "org:read",
                "org.trust:payment",
                "org.trustee:manage",
                "org.today.view",
                "org.action-centre.view",
                "org.chapters.view",
                "org.members.view",
                "org.growth.view",
                "org.hierarchy.view",
                "org.documents.view",
                "org.reports.view",
                "org.notifications.view",
                "org.roles.view",
                "org.people.view",
                "org.audit.view",
                "org.calendar.view",
                "org.attendance.view",
                "org.kyt.view",
                "org.presentations.view",
                "org.dues.view",
                "org.support.view"
            };
        }

        var standardChapterPermissions = new List<string>
        {
            "org:*", "org:read", "org:write", "org:create", "org:update", "org:approve",
            "org.today.view", "org.action-centre.view", "org.tasks.manage", "org.approvals.manage",
            "org.meetings.manage", "org.chapters.view", "org.members.view", "org.members.manage",
            "org.onboarding.manage", "org.growth.view", "org.committees.manage", "org.plans.manage",
            "org.programmes.manage", "org.events.manage", "org.attendance.manage", "org.kyt.manage",
            "org.presentations.manage", "org.dues.manage", "org.support.manage", "org.hierarchy.view",
            "org.communications.manage", "org.documents.view", "org.reports.view", "org.notifications.view",
            "org.converse.manage"
        };

        if (level == "NATIONAL" || level == "STATE" || level == "MANAGEMENT")
        {
            standardChapterPermissions.AddRange(new[]
            {
                "org:close", "org:escalate", "org:export", "org.super.admin", "org.hierarchy.manage",
                "org.continuity.manage", "org.escalations.manage", "org.exceptions.manage",
                "org.risks.manage", "org.issues.manage", "org.decisions.manage", "org.data-quality.manage",
                "org.jobs.manage", "org.roles.view", "org.people.view", "org.audit.view", "*"
            });
        }

        return standardChapterPermissions.Distinct().ToList();
    }
}

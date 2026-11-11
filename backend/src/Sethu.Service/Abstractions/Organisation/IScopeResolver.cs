using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Sethu.Domain.Entities;

namespace Sethu.Service.Abstractions.Organisation;

public sealed record ResolvedActorScope
{
    public string ActorId { get; init; } = "";
    public string Name { get; init; } = "";
    public string Email { get; init; } = "";
    public string Role { get; init; } = "";
    public string Position { get; init; } = "";
    public string ScopeId { get; init; } = "";
    public string ScopeName { get; init; } = "";
    public string ScopeLevel { get; init; } = "CHAPTER";
    public HashSet<string> AllowedScopeIds { get; init; } = new(StringComparer.OrdinalIgnoreCase);
    public HashSet<string> AncestryScopeIds { get; init; } = new(StringComparer.OrdinalIgnoreCase);
    public List<string> Permissions { get; init; } = new();

    public bool IsScopeAllowed(string? targetScopeId)
    {
        if (string.IsNullOrWhiteSpace(targetScopeId)) return true;
        return AllowedScopeIds.Contains(targetScopeId);
    }
}

public sealed record ResolvedMemberScope
{
    public Guid MemberId { get; init; }
    public Guid UserId { get; init; }
    public Guid TenantId { get; init; }
    public Guid? ChapterId { get; init; }
    public string ChapterName { get; init; } = "";
    public HashSet<string> AncestryScopeIds { get; init; } = new(StringComparer.OrdinalIgnoreCase);

    public bool IsInAudience(string? itemScopeId, string? itemScopeLevel = null, bool includeDescendants = true)
    {
        if (string.IsNullOrWhiteSpace(itemScopeId)) return true;
        if (itemScopeId.Equals("all", StringComparison.OrdinalIgnoreCase) ||
            itemScopeId.Equals("national", StringComparison.OrdinalIgnoreCase))
            return true;

        if (AncestryScopeIds.Contains(itemScopeId)) return true;

        if (ChapterId.HasValue && (
            itemScopeId.Equals(ChapterId.Value.ToString("D"), StringComparison.OrdinalIgnoreCase) ||
            itemScopeId.Equals(ChapterId.Value.ToString("N"), StringComparison.OrdinalIgnoreCase)))
            return true;

        if (!string.IsNullOrWhiteSpace(ChapterName))
        {
            var cleanItem = NormalizeScope(itemScopeId);
            var cleanChapter = NormalizeScope(ChapterName);
            if (!string.IsNullOrEmpty(cleanItem) && !string.IsNullOrEmpty(cleanChapter) &&
                (cleanItem.Equals(cleanChapter, StringComparison.OrdinalIgnoreCase) ||
                 cleanItem.Contains(cleanChapter, StringComparison.OrdinalIgnoreCase) ||
                 cleanChapter.Contains(cleanItem, StringComparison.OrdinalIgnoreCase)))
            {
                return true;
            }
        }

        return false;
    }

    public bool MatchesChapter(string? scopeId, string? scopeName)
    {
        if (string.IsNullOrWhiteSpace(scopeId) && string.IsNullOrWhiteSpace(scopeName)) return true;
        if (!string.IsNullOrWhiteSpace(scopeId) && IsInAudience(scopeId)) return true;
        if (!string.IsNullOrWhiteSpace(scopeName))
        {
            if (IsInAudience(scopeName)) return true;
            if (!string.IsNullOrWhiteSpace(ChapterName))
            {
                var cleanScope = NormalizeScope(scopeName);
                var cleanChapter = NormalizeScope(ChapterName);
                if (!string.IsNullOrEmpty(cleanScope) && !string.IsNullOrEmpty(cleanChapter) &&
                    (cleanScope.Equals(cleanChapter, StringComparison.OrdinalIgnoreCase) ||
                     cleanScope.Contains(cleanChapter, StringComparison.OrdinalIgnoreCase) ||
                     cleanChapter.Contains(cleanScope, StringComparison.OrdinalIgnoreCase)))
                {
                    return true;
                }
            }
        }
        return false;
    }

    private static string NormalizeScope(string s) =>
        s.Replace("chapter", "", StringComparison.OrdinalIgnoreCase)
         .Replace("-", " ")
         .Replace("_", " ")
         .Trim();

    public bool IsInAncestry(string? scopeId) => IsInAudience(scopeId);
    public bool IsInAncestry(Guid? chapterId) => !chapterId.HasValue || IsInAudience(chapterId.Value.ToString("D"));
}

public interface IScopeResolver
{
    Task<ResolvedActorScope> ResolveActorAsync(ClaimsPrincipal user, Guid tenantId, CancellationToken ct = default);
    Task<ResolvedMemberScope> ResolveMemberAsync(ClaimsPrincipal user, Guid tenantId, CancellationToken ct = default);
    Task<IReadOnlyList<Unit>> GetUnitTreeAsync(Guid tenantId, CancellationToken ct = default);
    Task<HashSet<string>> GetSubtreeScopeIdsAsync(Guid tenantId, string rootUnitId, CancellationToken ct = default);
    Task<HashSet<string>> GetAncestryScopeIdsAsync(Guid tenantId, string unitId, CancellationToken ct = default);
}

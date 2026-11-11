namespace Sethu.Domain.Organisation;

public static class OrganisationHierarchy
{
    public static HierarchyDecision Validate(OrganisationUnit candidate, IReadOnlyDictionary<Guid, OrganisationUnit> trustedUnits)
    {
        if (candidate.Id == Guid.Empty || candidate.TenantId == Guid.Empty || string.IsNullOrWhiteSpace(candidate.Code)) return new(false, "invalid_unit");
        if (candidate.Level == UnitLevel.Country) return candidate.ParentId is null ? new(true, "valid") : new(false, "country_parent_forbidden");
        if (candidate.ParentId is null || candidate.ParentId == candidate.Id) return new(false, "invalid_parent");
        var visited = new HashSet<Guid> { candidate.Id };
        var current = candidate.ParentId;
        var childLevel = candidate.Level;
        for (var depth = 0; current is not null && depth < 64; depth++)
        {
            if (!visited.Add(current.Value)) return new(false, "hierarchy_cycle");
            if (!trustedUnits.TryGetValue(current.Value, out var parent)) return new(false, "parent_missing");
            if (!parent.Active || parent.TenantId != candidate.TenantId) return new(false, "parent_scope_inactive");
            if ((int)parent.Level != (int)childLevel - 1) return new(false, "invalid_level_relation");
            childLevel = parent.Level;
            current = parent.ParentId;
        }
        if (current is not null) return new(false, "hierarchy_depth_exceeded");
        return new(true, "valid");
    }
}

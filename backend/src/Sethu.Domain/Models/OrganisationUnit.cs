namespace Sethu.Domain.Organisation;

public sealed record OrganisationUnit(Guid Id, Guid TenantId, UnitLevel Level, Guid? ParentId, string Code, bool Active);

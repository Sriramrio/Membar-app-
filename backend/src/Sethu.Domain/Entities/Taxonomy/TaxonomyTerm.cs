namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class TaxonomyTerm { public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid SpecialisationId {get;set;} public string NormalizedTerm {get;set;}=""; public bool Protected {get;set;} }

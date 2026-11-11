namespace Sethu.Service.DTOs.Opportunities;

/// <summary>
/// DTO representing an opportunity view.
/// </summary>
public sealed record OpportunityDto(
    Guid Id,
    Guid OwnerMemberId,
    Guid BusinessId,
    string Title,
    string Status,
    string Scope,
    Guid? ChapterId,
    Guid? SpecialisationId,
    string? Outcome
);

/// <summary>
/// Request DTO for creating an opportunity.
/// </summary>
public sealed record CreateOpportunityDto(
    Guid BusinessId,
    string Title,
    string Scope,
    Guid? ChapterId,
    Guid? SpecialisationId,
    string IdempotencyKey
);

/// <summary>
/// Request DTO for performing an action on an opportunity.
/// </summary>
public sealed record OpportunityActionDto(
    Guid OpportunityId,
    string Action,
    string IdempotencyKey,
    string? Title = null,
    string? Outcome = null,
    Guid? ResponseId = null
);

/// <summary>
/// Query parameters DTO for listing opportunities.
/// </summary>
public sealed record OpportunityQueryDto(
    int Page = 1,
    int Size = 20
);

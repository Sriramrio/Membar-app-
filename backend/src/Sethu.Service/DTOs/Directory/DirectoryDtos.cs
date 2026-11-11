using Sethu.Service.MemberNetwork;

namespace Sethu.Service.DTOs.Directory;

/// <summary>
/// DTO representing an entry in the member network directory.
/// </summary>
public sealed record DirectoryEntryDto(
    Guid MemberId,
    Guid BusinessId,
    string BusinessName,
    Guid SpecialisationId,
    Guid ChapterId
);

/// <summary>
/// Paginated directory search results DTO.
/// </summary>
public sealed record DirectoryPageDto(
    IReadOnlyList<DirectoryEntryDto> Items,
    int Page,
    int Size,
    bool HasMore
);

/// <summary>
/// Query parameters DTO for directory member search.
/// </summary>
public sealed record DirectorySearchQueryDto(
    NetworkScope Scope = NetworkScope.YourNetwork,
    string? Term = null,
    Guid? SectorId = null,
    Guid? SegmentId = null,
    Guid? SpecialisationId = null,
    int Page = 1,
    int Size = 20
);

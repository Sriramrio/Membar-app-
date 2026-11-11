using Sethu.Service.DTOs.Directory;
using Sethu.Service.MemberNetwork;

namespace Sethu.Service.Layered;

public interface IDirectoryService
{
    // Clean Architecture DTO-based Methods
    Task<DirectoryEntryDto?> FindVisibleAsync(NetworkActor actor, Guid memberId, Guid businessId, CancellationToken ct);
    Task<DirectoryPageDto> SearchMembersAsync(NetworkActor actor, DirectorySearchQueryDto query, CancellationToken ct = default);

    // Core Domain Operations
    Task<DirectoryPage> SearchAsync(NetworkActor actor, NetworkScope scope, string? term, Guid? specialisationId, int page, int size, CancellationToken ct);
    Task<DirectoryPage> SearchAsync(NetworkActor actor, NetworkScope scope, string? term, Guid? sectorId, Guid? segmentId, Guid? specialisationId, int page, int size, CancellationToken ct);
}

using Sethu.Service.Common.Mapping;
using Sethu.Service.DTOs.Directory;
using Sethu.Service.MemberNetwork;

namespace Sethu.Service.Layered;

public sealed class DirectoryService : IDirectoryService
{
    private const int MaxSearchTermLength = 200;
    private readonly IDirectoryRepository _repository;

    public DirectoryService(IDirectoryRepository repository)
    {
        _repository = repository;
    }

    public async Task<DirectoryEntryDto?> FindVisibleAsync(NetworkActor actor, Guid memberId, Guid businessId, CancellationToken ct)
    {
        if (actor.TenantId == Guid.Empty || actor.MemberId == Guid.Empty || memberId == Guid.Empty || businessId == Guid.Empty)
            throw new InvalidRequestException("Invalid directory detail request");
        var item = await _repository.FindVisibleAsync(actor, memberId, businessId, ct);
        return item is null ? null : new DirectoryEntryDto(item.MemberId, item.BusinessId, item.BusinessName, item.SpecialisationId, item.ChapterId);
    }

    // ----- DTO Methods for API Controllers ---------------------------------------

    public async Task<DirectoryPageDto> SearchMembersAsync(NetworkActor actor, DirectorySearchQueryDto query, CancellationToken ct = default)
    {
        var page = await SearchAsync(actor, query.Scope, query.Term, query.SectorId, query.SegmentId, query.SpecialisationId, query.Page, query.Size, ct);
        return page.ToDto();
    }

    // ----- Core Domain & Test-Compatible Methods ----------------------------------

    public Task<DirectoryPage> SearchAsync(NetworkActor actor, NetworkScope scope, string? term, Guid? specialisationId, int page, int size, CancellationToken ct)
        => SearchAsync(actor, scope, term, null, null, specialisationId, page, size, ct);

    public Task<DirectoryPage> SearchAsync(NetworkActor actor, NetworkScope scope, string? term, Guid? sectorId, Guid? segmentId, Guid? specialisationId, int page, int size, CancellationToken ct)
    {
        if (actor.TenantId == Guid.Empty || actor.MemberId == Guid.Empty || term?.Length > MaxSearchTermLength)
            throw new InvalidRequestException("Invalid directory query");
        var safeSize = Math.Clamp(size, 1, 100);
        RequestGuard.Pagination(page, safeSize);

        return _repository.SearchAsync(actor, scope, term?.Trim(), sectorId, segmentId, specialisationId, page, safeSize, ct);
    }
}

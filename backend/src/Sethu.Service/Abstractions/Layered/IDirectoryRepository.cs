using Sethu.Service.MemberNetwork;
namespace Sethu.Service.Layered;

public interface IDirectoryRepository
{
    Task<DirectoryEntry?> FindVisibleAsync(NetworkActor actor, Guid memberId, Guid businessId, CancellationToken ct);
    Task<DirectoryPage> SearchAsync(NetworkActor actor, NetworkScope scope, string? term, Guid? specialisationId, int page, int size, CancellationToken ct);
    Task<DirectoryPage> SearchAsync(NetworkActor actor, NetworkScope scope, string? term, Guid? sectorId, Guid? segmentId, Guid? specialisationId, int page, int size, CancellationToken ct);
}

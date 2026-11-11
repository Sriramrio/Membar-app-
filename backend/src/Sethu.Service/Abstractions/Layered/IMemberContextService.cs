using Sethu.Service.DTOs.Directory;
using Sethu.Service.MemberNetwork;
namespace Sethu.Service.Layered;
public interface IMemberContextService
{
    Task<MemberContextDto?> GetAsync(NetworkActor actor, CancellationToken ct);
}
public interface IMemberContextRepository
{
    Task<MemberContextDto?> GetAsync(NetworkActor actor, CancellationToken ct);
}

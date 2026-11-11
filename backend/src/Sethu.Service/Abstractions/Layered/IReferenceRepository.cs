using System.Security.Claims;
namespace Sethu.Service.Layered;

public interface IReferenceRepository
{
    Task<IReadOnlyList<ReferenceView>> ListAsync(NetworkActor actor,int page,int size,CancellationToken ct);
    Task<ReferenceResult> CreateAsync(NetworkActor actor,ReferenceCreate command,CancellationToken ct);
    Task<ReferenceResult> UpdateAsync(NetworkActor actor,ReferenceUpdate command,CancellationToken ct);
}

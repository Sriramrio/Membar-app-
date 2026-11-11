using Sethu.Service.DTOs.References;

namespace Sethu.Service.Layered;

public interface IReferenceService
{
    // Clean Architecture DTO-based Methods
    Task<List<ReferenceDto>> GetAllAsync(NetworkActor actor, int page, int size, CancellationToken ct = default);
    Task<ReferenceResultDto> CreateReferenceAsync(NetworkActor actor, CreateReferenceDto dto, CancellationToken ct = default);
    Task<ReferenceResultDto> UpdateReferenceAsync(NetworkActor actor, UpdateReferenceDto dto, CancellationToken ct = default);

    // Core Domain Operations
    Task<IReadOnlyList<ReferenceView>> ListAsync(NetworkActor actor, int page, int size, CancellationToken ct);
    Task<ReferenceResult> CreateAsync(NetworkActor actor, ReferenceCreate command, CancellationToken ct);
    Task<ReferenceResult> UpdateAsync(NetworkActor actor, ReferenceUpdate command, CancellationToken ct);
}

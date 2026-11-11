using Sethu.Service.DTOs.Common;
using Sethu.Service.DTOs.Opportunities;

namespace Sethu.Service.Layered;

public interface IOpportunityService
{
    // Clean Architecture DTO-based Methods
    Task<List<OpportunityDto>> GetAllAsync(NetworkActor actor, int page, int size, CancellationToken ct = default);
    Task<OperationResultDto> CreateOpportunityAsync(NetworkActor actor, CreateOpportunityDto dto, CancellationToken ct = default);
    Task<OperationResultDto> ChangeOpportunityAsync(NetworkActor actor, OpportunityActionDto dto, CancellationToken ct = default);

    // Core Domain Operations
    Task<IReadOnlyList<OpportunityView>> ListAsync(NetworkActor actor, int page, int size, CancellationToken ct);
    Task<GovernedResult> CreateAsync(NetworkActor actor, OpportunityCreate request, CancellationToken ct);
    Task<GovernedResult> ChangeAsync(NetworkActor actor, OpportunityAction request, CancellationToken ct);
}

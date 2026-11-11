using Sethu.Service.DTOs.Common;
using Sethu.Service.DTOs.Meetings;

namespace Sethu.Service.Layered;

public interface IMeetingService
{
    // Clean Architecture DTO-based Methods
    Task<List<MeetingDto>> GetAllAsync(NetworkActor actor, int page, int size, CancellationToken ct = default);
    Task<OperationResultDto> CreateMeetingAsync(NetworkActor actor, CreateMeetingDto dto, CancellationToken ct = default);
    Task<OperationResultDto> ChangeMeetingAsync(NetworkActor actor, MeetingActionDto dto, CancellationToken ct = default);

    // Core Domain Operations
    Task<IReadOnlyList<MeetingView>> ListAsync(NetworkActor actor, int page, int size, CancellationToken ct);
    Task<GovernedResult> CreateAsync(NetworkActor actor, MeetingCreate request, CancellationToken ct);
    Task<GovernedResult> ChangeAsync(NetworkActor actor, MeetingAction request, CancellationToken ct);
}

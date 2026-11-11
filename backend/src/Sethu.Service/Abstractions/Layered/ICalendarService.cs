using Sethu.Service.DTOs.Calendar;
using Sethu.Service.DTOs.Common;

namespace Sethu.Service.Layered;

public interface ICalendarService
{
    // Clean Architecture DTO-based Methods
    Task<List<CalendarEventDto>> GetAllAsync(NetworkActor actor, int page, int size, CancellationToken ct = default);
    Task<OperationResultDto> CreateEventAsync(NetworkActor actor, CreateCalendarEventDto dto, CancellationToken ct = default);
    Task<OperationResultDto> RegisterEventAsync(NetworkActor actor, RegisterCalendarEventDto dto, CancellationToken ct = default);

    // Core Domain Operations
    Task<IReadOnlyList<CalendarEventView>> ListAsync(NetworkActor actor, int page, int size, CancellationToken ct);
    Task<GovernedResult> CreateAsync(NetworkActor actor, CalendarEventCreate command, CancellationToken ct);
    Task<GovernedResult> RegisterAsync(NetworkActor actor, FreeRegistrationCommand command, CancellationToken ct);
}

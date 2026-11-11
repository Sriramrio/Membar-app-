namespace Sethu.Service.Layered;

public interface ICalendarRepository
{
    Task<IReadOnlyList<CalendarEventView>> ListAsync(NetworkActor actor,int page,int size,CancellationToken ct);
    Task<GovernedResult> CreateAsync(NetworkActor actor,CalendarEventCreate command,CancellationToken ct);
    Task<GovernedResult> RegisterAsync(NetworkActor actor,FreeRegistrationCommand command,CancellationToken ct);
}

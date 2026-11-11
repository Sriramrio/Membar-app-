using Sethu.Service.Common.Mapping;
using Sethu.Service.DTOs.Calendar;
using Sethu.Service.DTOs.Common;

namespace Sethu.Service.Layered;

public sealed class CalendarService : ICalendarService
{
    private readonly ICalendarRepository _repository;
    private readonly INetworkUnitOfWork _uow;

    public CalendarService(ICalendarRepository repository, INetworkUnitOfWork uow)
    {
        _repository = repository;
        _uow = uow;
    }

    // ----- DTO Methods for API Controllers ---------------------------------------

    public async Task<List<CalendarEventDto>> GetAllAsync(NetworkActor actor, int page, int size, CancellationToken ct = default)
    {
        var items = await ListAsync(actor, page, size, ct);
        return items.Select(x => x.ToDto()).ToList();
    }

    public async Task<OperationResultDto> CreateEventAsync(NetworkActor actor, CreateCalendarEventDto dto, CancellationToken ct = default)
    {
        var command = dto.ToCommand();
        var result = await CreateAsync(actor, command, ct);
        return result.ToDto();
    }

    public async Task<OperationResultDto> RegisterEventAsync(NetworkActor actor, RegisterCalendarEventDto dto, CancellationToken ct = default)
    {
        var command = dto.ToCommand();
        var result = await RegisterAsync(actor, command, ct);
        return result.ToDto();
    }

    // ----- Core Domain & Test-Compatible Methods ----------------------------------

    public Task<IReadOnlyList<CalendarEventView>> ListAsync(NetworkActor actor, int page, int size, CancellationToken ct)
    {
        RequestGuard.Pagination(page, size);
        return _repository.ListAsync(actor, page, size, ct);
    }

    public Task<GovernedResult> CreateAsync(NetworkActor actor, CalendarEventCreate command, CancellationToken ct)
    {
        if (IsInvalid(command))
        {
            var code = command.IsPaid ? "finance_deferred" : "invalid_event";
            return Task.FromResult(new GovernedResult(false, code, null));
        }

        return _uow.ExecuteGovernedAsync(actor, "network.free_event.create", command.IdempotencyKey, command,
            token => _repository.CreateAsync(actor, command, token), ct);
    }

    public Task<GovernedResult> RegisterAsync(NetworkActor actor, FreeRegistrationCommand command, CancellationToken ct)
    {
        if (IsInvalid(command))
            return Task.FromResult(new GovernedResult(false, "invalid_event_registration", null));

        return _uow.ExecuteGovernedAsync(actor, "network.free_event." + command.Action, command.IdempotencyKey, command,
            token => _repository.RegisterAsync(actor, command, token), ct);
    }

    private static bool IsInvalid(CalendarEventCreate c) =>
        c.ChapterId == Guid.Empty
        || string.IsNullOrWhiteSpace(c.Title) || c.Title.Length > 160
        || c.StartsAt <= DateTimeOffset.UtcNow
        || c.EndsAt <= c.StartsAt
        || c.Capacity is < 1 or > 100000
        || c.IsPaid
        || !RequestGuard.IsValidKey(c.IdempotencyKey);

    private static bool IsInvalid(FreeRegistrationCommand c) =>
        c.EventId == Guid.Empty
        || c.Action is not ("Register" or "Withdraw")
        || !RequestGuard.IsValidKey(c.IdempotencyKey);
}

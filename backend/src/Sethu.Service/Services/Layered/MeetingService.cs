using Sethu.Service.Common.Mapping;
using Sethu.Service.DTOs.Common;
using Sethu.Service.DTOs.Meetings;

namespace Sethu.Service.Layered;

public sealed class MeetingService : IMeetingService
{
    private readonly IMeetingRepository _repository;
    private readonly INetworkUnitOfWork _uow;

    public MeetingService(IMeetingRepository repository, INetworkUnitOfWork uow)
    {
        _repository = repository;
        _uow = uow;
    }

    // ----- DTO Methods for API Controllers ---------------------------------------

    public async Task<List<MeetingDto>> GetAllAsync(NetworkActor actor, int page, int size, CancellationToken ct = default)
    {
        var items = await ListAsync(actor, page, size, ct);
        return items.Select(x => x.ToDto()).ToList();
    }

    public async Task<OperationResultDto> CreateMeetingAsync(NetworkActor actor, CreateMeetingDto dto, CancellationToken ct = default)
    {
        var request = dto.ToCommand();
        var result = await CreateAsync(actor, request, ct);
        return result.ToDto();
    }

    public async Task<OperationResultDto> ChangeMeetingAsync(NetworkActor actor, MeetingActionDto dto, CancellationToken ct = default)
    {
        var request = dto.ToCommand();
        var result = await ChangeAsync(actor, request, ct);
        return result.ToDto();
    }

    // ----- Core Domain & Test-Compatible Methods ----------------------------------

    public Task<IReadOnlyList<MeetingView>> ListAsync(NetworkActor actor, int page, int size, CancellationToken ct)
    {
        RequestGuard.Pagination(page, size);
        return _repository.ListAsync(actor, page, size, ct);
    }

    public Task<GovernedResult> CreateAsync(NetworkActor actor, MeetingCreate request, CancellationToken ct)
    {
        if (IsInvalid(actor, request))
            return Task.FromResult(new GovernedResult(false, "invalid_meeting", null));

        return _uow.ExecuteGovernedAsync(actor, "network.meeting.create", request.IdempotencyKey, request,
            token => _repository.CreateAsync(actor, request, token), ct);
    }

    public Task<GovernedResult> ChangeAsync(NetworkActor actor, MeetingAction request, CancellationToken ct)
    {
        if (IsInvalid(request))
            return Task.FromResult(new GovernedResult(false, "invalid_meeting_action", null));

        return _uow.ExecuteGovernedAsync(actor, "network.meeting." + request.Action, request.IdempotencyKey, request,
            token => _repository.ChangeAsync(actor, request, token), ct);
    }

    private static bool IsInvalid(NetworkActor actor, MeetingCreate r) =>
        r.ToMemberId == Guid.Empty
        || r.ToMemberId == actor.MemberId
        || r.ProposedAt <= DateTimeOffset.UtcNow
        || string.IsNullOrWhiteSpace(r.TimeZoneId) || r.TimeZoneId.Length > 100
        || !RequestGuard.IsValidKey(r.IdempotencyKey);

    private static bool IsInvalid(MeetingAction r) =>
        r.MeetingId == Guid.Empty
        || r.Action is not ("Accept" or "Decline" or "ProposeTime" or "Confirm" or "Cancel" or "Complete" or "FollowUp" or "Outcome")
        || !RequestGuard.IsValidKey(r.IdempotencyKey)
        || (r.Action is "ProposeTime" or "FollowUp") && r.Time is null
        || r.Action == "Outcome" && string.IsNullOrWhiteSpace(r.Outcome);
}

using Sethu.Service.Common.Mapping;
using Sethu.Service.DTOs.Common;
using Sethu.Service.DTOs.Opportunities;

namespace Sethu.Service.Layered;

public sealed class OpportunityService : IOpportunityService
{
    private const int MaxTitleLength = 160;
    private readonly IOpportunityRepository _repository;
    private readonly INetworkUnitOfWork _uow;

    public OpportunityService(IOpportunityRepository repository, INetworkUnitOfWork uow)
    {
        _repository = repository;
        _uow = uow;
    }

    // ----- DTO Methods for API Controllers ---------------------------------------

    public async Task<List<OpportunityDto>> GetAllAsync(NetworkActor actor, int page, int size, CancellationToken ct = default)
    {
        var items = await ListAsync(actor, page, size, ct);
        return items.Select(x => x.ToDto()).ToList();
    }

    public async Task<OperationResultDto> CreateOpportunityAsync(NetworkActor actor, CreateOpportunityDto dto, CancellationToken ct = default)
    {
        var request = dto.ToCommand();
        var result = await CreateAsync(actor, request, ct);
        return result.ToDto();
    }

    public async Task<OperationResultDto> ChangeOpportunityAsync(NetworkActor actor, OpportunityActionDto dto, CancellationToken ct = default)
    {
        var request = dto.ToCommand();
        var result = await ChangeAsync(actor, request, ct);
        return result.ToDto();
    }

    // ----- Core Domain & Test-Compatible Methods ----------------------------------

    public Task<IReadOnlyList<OpportunityView>> ListAsync(NetworkActor actor, int page, int size, CancellationToken ct)
    {
        RequestGuard.Pagination(page, size);
        return _repository.ListAsync(actor, page, size, ct);
    }

    public Task<GovernedResult> CreateAsync(NetworkActor actor, OpportunityCreate request, CancellationToken ct)
    {
        if (IsInvalid(request))
            return Task.FromResult(new GovernedResult(false, "invalid_opportunity", null));

        return _uow.ExecuteGovernedAsync(actor, "network.opportunity.create", request.IdempotencyKey, request,
            token => _repository.CreateAsync(actor, request, token), ct);
    }

    public Task<GovernedResult> ChangeAsync(NetworkActor actor, OpportunityAction request, CancellationToken ct)
    {
        if (IsInvalid(request))
            return Task.FromResult(new GovernedResult(false, "invalid_opportunity_action", null));

        return _uow.ExecuteGovernedAsync(actor, "network.opportunity." + request.Action, request.IdempotencyKey, request,
            token => _repository.ChangeAsync(actor, request, token), ct);
    }

    private static bool IsInvalid(OpportunityCreate r) =>
        r.BusinessId == Guid.Empty
        || string.IsNullOrWhiteSpace(r.Title) || r.Title.Length > MaxTitleLength
        || r.Scope is not ("YourChapter" or "YourNetwork")
        || r.Scope == "YourChapter" && r.ChapterId is null
        || !RequestGuard.IsValidKey(r.IdempotencyKey);

    private static bool IsInvalid(OpportunityAction r) =>
        r.OpportunityId == Guid.Empty
        || r.Action is not ("Publish" or "Close" or "Outcome" or "Respond" or "WithdrawResponse" or "Shortlist" or "Reject" or "Edit")
        || r.Action == "Outcome" && string.IsNullOrWhiteSpace(r.Outcome)
        || (r.Action is "Shortlist" or "Reject") && r.ResponseId is null
        || r.Action == "Edit" && (string.IsNullOrWhiteSpace(r.Title) || r.Title.Length > MaxTitleLength)
        || !RequestGuard.IsValidKey(r.IdempotencyKey);
}

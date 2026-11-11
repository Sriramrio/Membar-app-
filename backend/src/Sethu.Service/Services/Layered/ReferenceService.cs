using Sethu.Service.Common.Mapping;
using Sethu.Service.DTOs.References;

namespace Sethu.Service.Layered;

public sealed class ReferenceService : IReferenceService
{
    private readonly IReferenceRepository _repository;
    private readonly INetworkUnitOfWork _unitOfWork;

    public ReferenceService(IReferenceRepository repository, INetworkUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    // ----- DTO Methods for API Controllers ---------------------------------------

    public async Task<List<ReferenceDto>> GetAllAsync(NetworkActor actor, int page, int size, CancellationToken ct = default)
    {
        var items = await ListAsync(actor, page, size, ct);
        return items.Select(x => x.ToDto()).ToList();
    }

    public async Task<ReferenceResultDto> CreateReferenceAsync(NetworkActor actor, CreateReferenceDto dto, CancellationToken ct = default)
    {
        var command = dto.ToCommand();
        var result = await CreateAsync(actor, command, ct);
        return result.ToDto();
    }

    public async Task<ReferenceResultDto> UpdateReferenceAsync(NetworkActor actor, UpdateReferenceDto dto, CancellationToken ct = default)
    {
        var command = dto.ToCommand();
        var result = await UpdateAsync(actor, command, ct);
        return result.ToDto();
    }

    // ----- Core Domain & Test-Compatible Methods ----------------------------------

    public Task<IReadOnlyList<ReferenceView>> ListAsync(NetworkActor actor, int page, int size, CancellationToken ct)
    {
        RequestGuard.Pagination(page, size);
        return _repository.ListAsync(actor, page, size, ct);
    }

    public Task<ReferenceResult> CreateAsync(NetworkActor actor, ReferenceCreate command, CancellationToken ct)
    {
        if (IsInvalid(actor, command))
            return Task.FromResult(new ReferenceResult(false, "invalid_reference", null));

        var fingerprint = new { actor.TenantId, actor.MemberId, command.ToMemberId, command.IntroducedMemberId };
        return _unitOfWork.ExecuteReferenceAsync(actor, "network.reference.create", command.IdempotencyKey, fingerprint,
            token => _repository.CreateAsync(actor, command, token), ct);
    }

    public Task<ReferenceResult> UpdateAsync(NetworkActor actor, ReferenceUpdate command, CancellationToken ct)
    {
        if (IsInvalid(command))
            return Task.FromResult(new ReferenceResult(false, "invalid_reference_action", null));

        var fingerprint = new { actor.TenantId, actor.MemberId, command.ReferenceId, command.Action, command.Outcome, command.FollowUpAt };
        return _unitOfWork.ExecuteReferenceAsync(actor, "network.reference." + command.Action.ToLowerInvariant(), command.IdempotencyKey, fingerprint,
            token => _repository.UpdateAsync(actor, command, token), ct);
    }

    private static bool IsInvalid(NetworkActor actor, ReferenceCreate c) =>
        c.ToMemberId == Guid.Empty
        || c.ToMemberId == actor.MemberId
        || c.IntroducedMemberId == actor.MemberId
        || c.IntroducedMemberId == c.ToMemberId
        || c.IdempotencyKey is null || c.IdempotencyKey.Length is < 1 or > 128;

    private static bool IsInvalid(ReferenceUpdate c) =>
        c.ReferenceId == Guid.Empty
        || c.Action is not ("Accept" or "Decline" or "Withdraw" or "Consent" or "RefuseConsent" or "RevokeConsent" or "FollowUp" or "Outcome")
        || !RequestGuard.IsValidKey(c.IdempotencyKey)
        || c.Action == "Outcome" && string.IsNullOrWhiteSpace(c.Outcome)
        || c.Outcome?.Length > 512;
}

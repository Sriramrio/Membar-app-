namespace Sethu.Service.Layered;

public interface IOpportunityRepository
{
    Task<IReadOnlyList<OpportunityView>> ListAsync(NetworkActor actor,int page,int size,CancellationToken ct);
    Task<GovernedResult> CreateAsync(NetworkActor actor,OpportunityCreate request,CancellationToken ct);
    Task<GovernedResult> ChangeAsync(NetworkActor actor,OpportunityAction request,CancellationToken ct);
}

namespace Sethu.Service.Layered;

public interface INoteRepository
{
    Task<IReadOnlyList<NoteView>> ListAsync(NetworkActor actor,int page,int size,CancellationToken ct);
    Task<GovernedResult> CreateAsync(NetworkActor actor,NoteCreate request,CancellationToken ct);
    Task<GovernedResult> ChangeAsync(NetworkActor actor,NoteAction request,CancellationToken ct);
}

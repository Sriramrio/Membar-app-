using Sethu.Service.MemberNetwork;
namespace Sethu.Service.Layered;

public interface INetworkUnitOfWork
{
    Task<T> ExecuteAsync<T>(Func<CancellationToken,Task<T>> body, CancellationToken ct);
    Task CommitAsync(CancellationToken ct);
    Task<ConnectionOutcome> ExecuteConnectionAsync(ConnectionCommand command,Func<CancellationToken,Task<ConnectionOutcome>> body,CancellationToken ct);
    Task<GovernedResult> ExecuteGovernedAsync(NetworkActor actor,string operation,string key,object fingerprint,Func<CancellationToken,Task<GovernedResult>> body,CancellationToken ct);
    Task<ReferenceResult> ExecuteReferenceAsync(NetworkActor actor,string operation,string key,object fingerprint,Func<CancellationToken,Task<ReferenceResult>> body,CancellationToken ct);
}

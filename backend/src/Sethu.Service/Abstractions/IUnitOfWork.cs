using Sethu.Domain;
namespace Sethu.Service;

public interface IUnitOfWork { Task<int> CommitAsync(CancellationToken token); }

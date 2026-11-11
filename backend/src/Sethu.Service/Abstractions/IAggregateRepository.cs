using Sethu.Domain;
namespace Sethu.Service;

public interface IAggregateRepository<T> where T:AggregateRoot { Task<T?> FindAsync(EntityId id, CancellationToken token); void Add(T aggregate); }

namespace Sethu.Domain;

public abstract class AggregateRoot { private readonly List<IDomainEvent> _events = new(); public IReadOnlyList<IDomainEvent> PendingEvents => _events; protected void Raise(IDomainEvent evt) => _events.Add(evt); public void ClearPendingEvents() => _events.Clear(); public long Version { get; protected set; } }

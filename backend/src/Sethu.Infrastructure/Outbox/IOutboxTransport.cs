using Microsoft.EntityFrameworkCore;
using Sethu.Infrastructure.Persistence;

namespace Sethu.Infrastructure;

public interface IOutboxTransport
{
    // An external provider must be configured explicitly; exceptions must never mean delivered.
    Task<DeliveryOutcome> DeliverAsync(Guid messageId, string eventType, CancellationToken cancellationToken);
}

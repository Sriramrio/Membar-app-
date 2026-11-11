using Microsoft.EntityFrameworkCore;
using Sethu.Infrastructure.Persistence;

namespace Sethu.Infrastructure;

// Claims are conditional updates, not in-process locks. Expired leases may be reclaimed.
// External transport is invoked only after the claim transaction has committed.
public sealed class OutboxLeaseService(IDbContextFactory<SethuDbContext> factory, TimeProvider clock)
{
    public async Task<Guid?> ClaimNextAsync(Guid worker, TimeSpan lease, CancellationToken ct)
    {
        if (worker == Guid.Empty || lease <= TimeSpan.Zero) throw new ArgumentException("Invalid worker/lease");
        await using var db = await factory.CreateDbContextAsync(ct);
        var now=clock.GetUtcNow();
        var ids=await db.Outbox.AsNoTracking()
            // Invitation delivery is reserved for a future dedicated, cancellation-aware
            // transport. The generic transport must not acknowledge it as delivered.
            .Where(x=>x.Event != "visitor.invitation.delivery-requested.v1" &&
                x.DispatchedAt==null && !x.DeadLettered &&
                (x.NextAttemptAt==null || x.NextAttemptAt<=now) &&
                (x.LeaseExpiresAt==null || x.LeaseExpiresAt<=now))
            .OrderBy(x=>x.OccurredAt).Select(x=>x.Id).Take(8).ToListAsync(ct);
        foreach (var id in ids)
        {
            var claimed=await db.Outbox.Where(x=>x.Id==id && x.DispatchedAt==null && !x.DeadLettered &&
                    (x.LeaseExpiresAt==null || x.LeaseExpiresAt<=now))
                .ExecuteUpdateAsync(update=>update.SetProperty(x=>x.LeaseOwner,worker)
                    .SetProperty(x=>x.LeaseExpiresAt,now.Add(lease)),ct);
            if(claimed==1) return id;
        }
        return null;
    }
    public async Task<bool> AcknowledgeAsync(Guid messageId,Guid worker,CancellationToken ct)
    {
        await using var db=await factory.CreateDbContextAsync(ct);
        var now=clock.GetUtcNow();
        return await db.Outbox.Where(x=>x.Id==messageId &&
            x.Event != "visitor.invitation.delivery-requested.v1" && x.LeaseOwner==worker &&
            x.LeaseExpiresAt>now && x.DispatchedAt==null)
            .ExecuteUpdateAsync(u=>u.SetProperty(x=>x.DispatchedAt,now)
                .SetProperty(x=>x.LeaseOwner,(Guid?)null)
                .SetProperty(x=>x.LeaseExpiresAt,(DateTimeOffset?)null),ct)==1;
    }
    public async Task<bool> FailAsync(Guid messageId,Guid worker,bool permanent,string error,CancellationToken ct)
    {
        await using var db=await factory.CreateDbContextAsync(ct);
        var now=clock.GetUtcNow();
        // Lease-owned atomic update avoids the stale tracked-entity overwrite race.
        // A bounded fixed retry interval is deliberately used until provider-specific
        // exponential scheduling is integration-tested.
        var updated=await db.Outbox.Where(x=>x.Id==messageId && x.LeaseOwner==worker &&
            x.LeaseExpiresAt>now && x.DispatchedAt==null)
            .ExecuteUpdateAsync(u=>u.SetProperty(x=>x.Attempts,x=>x.Attempts+1)
                .SetProperty(x=>x.LastErrorCode,error.Length>80 ? error[..80] : error)
                .SetProperty(x=>x.DeadLettered,x=>permanent || x.Attempts+1>=12)
                .SetProperty(x=>x.NextAttemptAt,x=>permanent || x.Attempts+1>=12 ?
                    (DateTimeOffset?)null : now.AddMinutes(1))
                .SetProperty(x=>x.LeaseOwner,(Guid?)null)
                .SetProperty(x=>x.LeaseExpiresAt,(DateTimeOffset?)null),ct);
        return updated==1;
    }
    public async Task<DeliveryOutcome> DispatchClaimedAsync(Guid id,Guid worker,IOutboxTransport transport,CancellationToken ct)
    {
        await using var db=await factory.CreateDbContextAsync(ct);
        var now=clock.GetUtcNow();
        var row=await db.Outbox.AsNoTracking().SingleOrDefaultAsync(x=>x.Id==id &&
            x.Event != "visitor.invitation.delivery-requested.v1" &&
            x.LeaseOwner==worker && x.LeaseExpiresAt>now && x.DispatchedAt==null,ct);
        if(row is null) return new(false,false,"lease_unavailable");
        DeliveryOutcome outcome;
        try { outcome=await transport.DeliverAsync(row.Id,row.Event,ct); }
        catch (OperationCanceledException) when(ct.IsCancellationRequested) { throw; }
        catch (Exception) { outcome=new(false,false,"transport_unavailable"); }
        if(outcome.Delivered)
        {
            if(!await AcknowledgeAsync(id,worker,ct)) return new(false,false,"lease_lost_after_delivery");
        }
        else await FailAsync(id,worker,outcome.PermanentFailure,outcome.ErrorCode,ct);
        return outcome;
    }
}

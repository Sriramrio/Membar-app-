using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Sethu.Infrastructure.Persistence;

namespace Sethu.Infrastructure.FinanceEffects;

// Internal effect worker: never sends these events through the external notification transport.
public sealed class FinanceEffectWorker(IServiceScopeFactory scopes, ILogger<FinanceEffectWorker> log) : BackgroundService
{
    private readonly Guid _workerId=Guid.NewGuid();
    private static readonly string[] Types =
    [
        "finance.effect.membership-activation-requested.v1",
        "finance.effect.membership-renewal-requested.v1",
        "finance.effect.meeting-payment-confirmation-requested.v1",
        "finance.effect.event-payment-confirmation-requested.v1"
    ];
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope=scopes.CreateScope();
                var factory=scope.ServiceProvider.GetRequiredService<IDbContextFactory<SethuDbContext>>();
                var clock=scope.ServiceProvider.GetRequiredService<TimeProvider>();
                await using var db=await factory.CreateDbContextAsync(stoppingToken);
                var now=clock.GetUtcNow();
                // Query only internal effect events, never general notifications.
                var candidates=await db.Outbox.AsNoTracking().Where(x=>Types.Contains(x.Event) && x.DispatchedAt==null && !x.DeadLettered &&
                    (x.NextAttemptAt==null||x.NextAttemptAt<=now) && (x.LeaseExpiresAt==null||x.LeaseExpiresAt<=now))
                    .OrderBy(x=>x.OccurredAt).Select(x=>x.Id).Take(8).ToListAsync(stoppingToken);
                foreach(var id in candidates)
                {
                    var claimed=await db.Outbox.Where(x=>x.Id==id && x.DispatchedAt==null && !x.DeadLettered &&
                        (x.LeaseExpiresAt==null||x.LeaseExpiresAt<=now))
                        .ExecuteUpdateAsync(u=>u.SetProperty(x=>x.LeaseOwner,_workerId)
                            .SetProperty(x=>x.LeaseExpiresAt,now.AddMinutes(3)),stoppingToken);
                    if(claimed!=1)continue;
                    var processor=scope.ServiceProvider.GetRequiredService<FinanceEffectProcessor>();
                    string result;
                    try { result=await processor.ExecuteAsync(id,_workerId,stoppingToken); }
                    catch(OperationCanceledException) when(stoppingToken.IsCancellationRequested){throw;}
                    catch(Exception ex){log.LogError(ex,"Finance effect {EffectId} processing failed",id);result="retryable_exception";}
                    if(result is "activated" or "already_activated" or "renewed" or "already_renewed" or "meeting_payment_confirmed" or "event_payment_confirmed" or "already_confirmed")continue;
                    // Bounded retry, with exception or unresolved-policy outcomes deliberately NOT acknowledged.
                    var permanent=result is "unsupported_finance_purpose" or "event_not_found";
                    await db.Outbox.Where(x=>x.Id==id && x.LeaseOwner==_workerId && x.DispatchedAt==null)
                        .ExecuteUpdateAsync(u=>u.SetProperty(x=>x.Attempts,x=>x.Attempts+1)
                            .SetProperty(x=>x.LastErrorCode,result)
                            .SetProperty(x=>x.DeadLettered,x=>permanent||x.Attempts+1>=12)
                            .SetProperty(x=>x.NextAttemptAt,x=>permanent||x.Attempts+1>=12?(DateTimeOffset?)null:now.AddMinutes(5))
                            .SetProperty(x=>x.LeaseOwner,(Guid?)null)
                            .SetProperty(x=>x.LeaseExpiresAt,(DateTimeOffset?)null),stoppingToken);
                }
            }
            catch(OperationCanceledException) when(stoppingToken.IsCancellationRequested){break;}
            catch(Exception ex){log.LogError(ex,"Finance effect worker cycle failed");}
            try{await Task.Delay(TimeSpan.FromSeconds(20),stoppingToken);}
            catch(OperationCanceledException) when(stoppingToken.IsCancellationRequested){break;}
        }
    }
}

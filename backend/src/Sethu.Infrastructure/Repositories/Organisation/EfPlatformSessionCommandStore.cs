using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Security;

namespace Sethu.Infrastructure.Repositories.Organisation;

/// <summary>Session mutation + immutable audit intent in a single PostgreSQL transaction.</summary>
public sealed class EfPlatformSessionCommandStore(SethuDbContext db) : IPlatformSessionCommandStore
{
    public async Task<PlatformSessionCommandResult> RevokeAsync(Guid tenantId, Guid actorId,
        Guid sessionRecordId, string trustedIssuer, string correlationId, string reason, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var target = await (from s in db.Sessions.AsNoTracking()
            join u in db.UserIdentities.AsNoTracking() on s.UserId equals u.Id
            where s.Id == sessionRecordId && s.Issuer == trustedIssuer && u.TenantId == tenantId
            select new { s.Id, s.Revoked }).SingleOrDefaultAsync(ct);
        if (target is null) return new(PlatformSessionCommandStatus.NotFound, null);
        if (target.Revoked) return new(PlatformSessionCommandStatus.AlreadyRevoked, null);
        // Compare-and-set protects against competing administrative requests.
        var changed = await db.Sessions
            .Where(s => s.Id == sessionRecordId && s.Issuer == trustedIssuer && !s.Revoked)
            .ExecuteUpdateAsync(setters => setters.SetProperty(s => s.Revoked, true), ct);
        if (changed != 1) return new(PlatformSessionCommandStatus.AlreadyRevoked, null);
        var audit = new Audit
        {
            Id = Guid.NewGuid(), TenantId = tenantId, ActorId = actorId,
            ResourceId = sessionRecordId, Operation = "platform.session.revoke",
            CorrelationId = correlationId,
            Event = "SessionRevoked: " + reason, OccurredAt = DateTimeOffset.UtcNow
        };
        db.Audits.Add(audit);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return new(PlatformSessionCommandStatus.Revoked, audit.Id);
    }
}

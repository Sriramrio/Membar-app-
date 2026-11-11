using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sethu.Service.Layered;
using Sethu.Service.MemberNetwork;
using Sethu.Domain.Entities;
using Sethu.Infrastructure.Persistence;
namespace Sethu.Infrastructure.Layered;

/// <summary>
/// One database transaction per business command. For every mutation it writes, in the SAME transaction:
/// the change made by the repository, the idempotency record, the audit event and the outbox message.
/// A repeated request with the same IdempotencyKey replays the stored result instead of running twice.
public sealed class NetworkUnitOfWork(SethuDbContext db, IDbContextFactory<SethuDbContext> contexts) : INetworkUnitOfWork, Sethu.Service.IUnitOfWork
{
    // ----- how to read each kind of result (all three share one transaction pipeline) -----------------

    private static readonly ResultShape<ConnectionOutcome> ConnectionShape = new(
        IsAccepted: r => r.Accepted,
        ResourceIdOf: r => r.ConnectionId,
        CodeOf: r => r.Code,
        Failure: code => new ConnectionOutcome(false, code, null),
        ResourceRequired: true);

    private static readonly ResultShape<GovernedResult> GovernedShape = new(
        IsAccepted: r => r.Accepted,
        ResourceIdOf: r => r.ResourceId,
        CodeOf: r => r.Code,
        Failure: code => new GovernedResult(false, code, null),
        ResourceRequired: false);

    private static readonly ResultShape<ReferenceResult> ReferenceShape = new(
        IsAccepted: r => r.Accepted,
        ResourceIdOf: r => r.ReferenceId,
        CodeOf: r => r.Code,
        Failure: code => new ReferenceResult(false, code, null),
        ResourceRequired: true);

    // ----- public contract ---------------------------------------------------------------------------

    // Generic workflow entry remains intentionally prohibited: callers must use a mutation-specific
    // entry that binds the idempotency fingerprint, audit and outbox to the same transaction.
    public async Task<T> ExecuteAsync<T>(Func<CancellationToken, Task<T>> body, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        var result = await body(ct);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return result;
    }

    public async Task CommitAsync(CancellationToken ct) => await db.SaveChangesAsync(ct);
    Task<int> Sethu.Service.IUnitOfWork.CommitAsync(CancellationToken token) => db.SaveChangesAsync(token);

    public Task<ConnectionOutcome> ExecuteConnectionAsync(
        ConnectionCommand command, Func<CancellationToken, Task<ConnectionOutcome>> body, CancellationToken ct)
    {
        var scope = new IdempotencyScope(command.TenantId, command.ActorMemberId, "member.connection.change", command.IdempotencyKey);
        var fingerprint = new { command.TenantId, command.ActorMemberId, command.OtherMemberId, command.Action };
        return ExecuteIdempotentAsync(scope, fingerprint, body, ConnectionShape, ct);
    }

    public Task<GovernedResult> ExecuteGovernedAsync(
        NetworkActor actor, string operation, string key, object fingerprint,
        Func<CancellationToken, Task<GovernedResult>> body, CancellationToken ct)
    {
        if (actor.TenantId == Guid.Empty || actor.MemberId == Guid.Empty || string.IsNullOrWhiteSpace(key) || key.Length > 128)
            return Task.FromResult(new GovernedResult(false, "invalid_governed_command", null));

        var scope = new IdempotencyScope(actor.TenantId, actor.MemberId, operation, key);
        return ExecuteIdempotentAsync(scope, fingerprint, body, GovernedShape, ct);
    }

    public Task<ReferenceResult> ExecuteReferenceAsync(
        NetworkActor actor, string operation, string key, object fingerprint,
        Func<CancellationToken, Task<ReferenceResult>> body, CancellationToken ct)
    {
        var scope = new IdempotencyScope(actor.TenantId, actor.MemberId, operation, key);
        return ExecuteIdempotentAsync(scope, fingerprint, body, ReferenceShape, ct);
    }

    // ----- the single transaction pipeline -----------------------------------------------------------

    private async Task<TResult> ExecuteIdempotentAsync<TResult>(
        IdempotencyScope scope, object fingerprint,
        Func<CancellationToken, Task<TResult>> body, ResultShape<TResult> shape, CancellationToken ct)
    {
        var digest = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(fingerprint))));
        try
        {
            await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);

            // 1. Same key seen before? Replay the stored result (or report a conflicting payload).
            var prior = await FindPriorAsync(db, scope, ct);
            if (prior is not null) return ReplayOrConflict(prior, digest, shape);

            // 2. Run the repository change.
            var result = await body(ct);
            if (!shape.IsAccepted(result)) return result;

            var resourceId = shape.ResourceIdOf(result);
            if (resourceId is null)
            {
                if (shape.ResourceRequired) throw new InvalidOperationException("Accepted result has no resource id");
                return result;
            }

            // 3. Persist change + idempotency + audit + outbox together.
            RecordSuccess(scope, digest, result, shape, resourceId.Value);
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return result;
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            return await RecoverAsync(scope, digest, shape);
        }
        catch (PostgresException ex) when (ex.SqlState is PostgresErrorCodes.SerializationFailure or PostgresErrorCodes.UniqueViolation)
        {
            return await RecoverAsync(scope, digest, shape);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception)
        {
            return await RecoverAsync(scope, digest, shape);
        }
    }

    /// <summary>After a failed commit, read the outcome with a fresh context: it may have been committed by a concurrent identical request.</summary>
    private async Task<TResult> RecoverAsync<TResult>(IdempotencyScope scope, string digest, ResultShape<TResult> shape)
    {
        try
        {
            await using var fresh = await contexts.CreateDbContextAsync(CancellationToken.None);
            var prior = await FindPriorAsync(fresh, scope, CancellationToken.None);
            return prior is null ? shape.Failure("commit_indeterminate") : ReplayOrConflict(prior, digest, shape);
        }
        catch (Exception)
        {
            return shape.Failure("commit_indeterminate");
        }
    }

    private void RecordSuccess<TResult>(IdempotencyScope scope, string digest, TResult result, ResultShape<TResult> shape, Guid resourceId)
    {
        var now = DateTimeOffset.UtcNow;
        var code = shape.CodeOf(result);

        db.Idempotency.Add(new Idempotency
        {
            TenantId = scope.TenantId, ActorId = scope.ActorId, Operation = scope.Operation, Key = scope.Key,
            PayloadSha256 = digest, ResultJson = JsonSerializer.Serialize(result), CreatedAt = now
        });
        db.Audits.Add(new Audit
        {
            Id = Guid.NewGuid(), TenantId = scope.TenantId, ActorId = scope.ActorId, ResourceId = resourceId,
            Operation = scope.Operation, Event = code, OccurredAt = now
        });
        db.Outbox.Add(new Outbox
        {
            Id = Guid.NewGuid(), TenantId = scope.TenantId, ResourceId = resourceId,
            Event = "network." + code, OccurredAt = now
        });
    }

    private static Task<Idempotency?> FindPriorAsync(SethuDbContext context, IdempotencyScope scope, CancellationToken ct) =>
        context.Idempotency.AsNoTracking().SingleOrDefaultAsync(x =>
            x.TenantId == scope.TenantId && x.ActorId == scope.ActorId && x.Operation == scope.Operation && x.Key == scope.Key, ct);

    private static TResult ReplayOrConflict<TResult>(Idempotency prior, string digest, ResultShape<TResult> shape) =>
        prior.PayloadSha256 == digest
            ? JsonSerializer.Deserialize<TResult>(prior.ResultJson)!
            : shape.Failure("idempotency_conflict");

    // ----- small helper types ------------------------------------------------------------------------

    /// <summary>Who is doing what: the key that identifies one idempotent command.</summary>
    private sealed record IdempotencyScope(Guid TenantId, Guid ActorId, string Operation, string Key);

    /// <summary>Tells the shared pipeline how to read one result type.</summary>
    private sealed record ResultShape<TResult>(
        Func<TResult, bool> IsAccepted,
        Func<TResult, Guid?> ResourceIdOf,
        Func<TResult, string> CodeOf,
        Func<string, TResult> Failure,
        bool ResourceRequired);
}

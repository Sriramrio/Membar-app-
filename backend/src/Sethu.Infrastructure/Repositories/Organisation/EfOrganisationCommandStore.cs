using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Data;
using Sethu.Service.Security;
using Sethu.Domain.Organisation;
using Sethu.Domain.Security;
using System.Text.Json;
using Sethu.Domain.Entities;

namespace Sethu.Infrastructure.Persistence;

// Transactional store: PostgreSQL SERIALIZABLE protects hierarchy snapshot reads from incompatible concurrent writes.
// Actual behavior depends on DB migration and integration certification, which remain open.
public sealed class EfOrganisationCommandStore(SethuDbContext db, IDbContextFactory<SethuDbContext> recoveryFactory) : IOrganisationCommandStore
{
    public async Task<VersionedOrganisationUnit?> LoadUnitAsync(Guid id, CancellationToken ct)
    {
        var r=await db.Units.AsNoTracking().SingleOrDefaultAsync(x=>x.Id==id,ct);
        return r is null ? null : new(new(r.Id,r.TenantId,r.Level,r.ParentId,r.Code,r.Active),r.Version);
    }
    public async Task<IReadOnlyDictionary<Guid,OrganisationUnit>?> LoadTenantHierarchyAsync(Guid tenantId,CancellationToken ct)
    {
        var rows=await db.Units.AsNoTracking().Where(x=>x.TenantId==tenantId).ToListAsync(ct);
        return rows.ToDictionary(x=>x.Id,x=>new OrganisationUnit(x.Id,x.TenantId,x.Level,x.ParentId,x.Code,x.Active));
    }
    public async Task<VersionedCommittee?> LoadCommitteeAsync(Guid tenantId,Guid chapterId,CancellationToken ct)
    {
        var r=await db.Committees.AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==tenantId && x.ChapterId==chapterId,ct);
        return r is null ? null : new(r.TenantId,r.ChapterId,r.Version);
    }
    public async Task<IReadOnlyList<CommitteeAppointment>?> LoadAppointmentsAsync(Guid tenantId,Guid chapterId,CancellationToken ct)
    {
        var rows=await db.Appointments.AsNoTracking().Where(x=>x.TenantId==tenantId && x.ChapterId==chapterId).ToListAsync(ct);
        return rows.Select(x=>new CommitteeAppointment(x.Id,x.TenantId,x.ChapterId,x.UserId,x.RoleCode,x.StartsAt,x.EndsAt,x.Status,x.Exclusive)).ToArray();
    }
    public async Task<DelegationGrant?> LoadDelegationAsync(Guid id, Guid tenantId, CancellationToken ct)
    {
        var row=await db.Delegations.AsNoTracking().SingleOrDefaultAsync(x=>x.Id==id && x.TenantId==tenantId,ct);
        return row is null ? null : new(row.Id,row.DelegatorId,row.DelegateId,row.TenantId,row.ChapterId,
            row.Permission,row.StartsAt,row.EndsAt,row.Revoked);
    }
    public async Task<StoredCommandOutcome?> FindCommittedOutcomeAsync(Guid tenantId,Guid actorId,string operation,string key,CancellationToken ct)
    {
        var r=await db.Idempotency.AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==tenantId && x.ActorId==actorId && x.Operation==operation && x.Key==key,ct);
        return r is null?null:new(r.PayloadSha256,JsonSerializer.Deserialize<OrganisationCommandResult>(r.ResultJson) ?? throw new InvalidOperationException("Stored outcome invalid"));
    }
    // Never blindly re-run a mutation after an uncertain commit. A separate context reads the
    // authoritative idempotency row; an unavailable/absent row is NOT proof of rollback.
    private async Task<OrganisationCommandResult> ReconcileAsync(AtomicChange change,CancellationToken ct)
    {
        try
        {
            await using var fresh = await recoveryFactory.CreateDbContextAsync(ct);
            var committed = await fresh.Idempotency.AsNoTracking().SingleOrDefaultAsync(x =>
                x.TenantId == change.TenantId && x.ActorId == change.ActorId &&
                x.Operation == change.Operation && x.Key == change.IdempotencyKey, ct);
            if (committed is null) return new(false,"commit_outcome_indeterminate",null,null);
            if (committed.PayloadSha256 != change.PayloadSha256)
                return new(false,"idempotency_payload_conflict",null,null);
            return JsonSerializer.Deserialize<OrganisationCommandResult>(committed.ResultJson)
                ?? new(false,"stored_outcome_invalid",null,null);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception) { return new(false,"commit_outcome_indeterminate",null,null); }
    }
    public async Task<OrganisationCommandResult> CommitAsync(AtomicChange change,CancellationToken ct)
    {
        try { return await CommitCoreAsync(change,ct); }
        catch (DbUpdateConcurrencyException) { return new(false,"stale_version",null,null); }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == PostgresErrorCodes.UniqueViolation)
            { return await ReconcileAsync(change,ct); }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UniqueViolation)
            { return await ReconcileAsync(change,ct); }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.ExclusionViolation)
            { return new(false,"exclusive_appointment_overlap",null,null); }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.SerializationFailure || ex.SqlState == PostgresErrorCodes.DeadlockDetected)
            { return await ReconcileAsync(change,ct); }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception) { return await ReconcileAsync(change,ct); }
    }
    private async Task<OrganisationCommandResult> CommitCoreAsync(AtomicChange change,CancellationToken ct)
    {
        if(change.TenantId==Guid.Empty || change.ActorId==Guid.Empty || string.IsNullOrWhiteSpace(change.IdempotencyKey)) return new(false,"invalid_change",null,null);
        await using var tx=await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable,ct);
        var old=await db.Idempotency.SingleOrDefaultAsync(x=>x.TenantId==change.TenantId && x.ActorId==change.ActorId && x.Operation==change.Operation && x.Key==change.IdempotencyKey,ct);
        if(old is not null)
        {
            await tx.RollbackAsync(ct);
            if(old.PayloadSha256!=change.PayloadSha256) return new(false,"idempotency_payload_conflict",null,null);
            return JsonSerializer.Deserialize<OrganisationCommandResult>(old.ResultJson) ?? throw new InvalidOperationException("Stored outcome invalid");
        }
        // Transaction-local authority recheck: fail closed when identity or current direct grants are absent.
        // Serializability detects conflicting concurrent changes to these read rows at commit.
        // This does NOT replace trusted per-session validation (tracked separately).
        var now = DateTimeOffset.UtcNow;
        var identity = await db.UserIdentities.AsNoTracking().SingleOrDefaultAsync(
            x => x.Id == change.ActorId && x.TenantId == change.TenantId && x.Active, ct);
        if (identity is null) return new(false,"authority_changed",null,null);
        Guid? targetChapter = null;
        if (change.UpdatedUnit is { Level: UnitLevel.Chapter } targetUnit)
            targetChapter = targetUnit.Id;
        else if (change.NewAppointment is not null || change.UpdatedAppointment is not null ||
                 change.NewDelegation is not null || change.UpdatedDelegation is not null)
            targetChapter = change.ResourceId;
        // No implicit inheritance across chapters or tenants. Governance is explicitly separate.
        var authorized = await db.PermissionGrants.AsNoTracking().AnyAsync(x =>
            x.UserId == change.ActorId && x.TenantId == change.TenantId &&
            x.Permission == change.Operation && !x.Revoked && !x.IndependentGovernance &&
            x.StartsAt <= now && (x.EndsAt == null || now < x.EndsAt) &&
            (x.ChapterId == null || (targetChapter != null && x.ChapterId == targetChapter)), ct);
        if (!authorized) return new(false,"authority_changed",null,null);
        // Delegated authority cannot be established by this direct-grant-only transaction check;
        // such requests fail closed until a fully transaction-coupled delegation policy exists.
        long next;
        if(change.UpdatedUnit is { } unit)
        {
            var row=await db.Units.SingleOrDefaultAsync(x=>x.Id==change.ResourceId && x.TenantId==change.TenantId,ct);
            if(row is null) return new(false,"resource_not_found",null,null);
            if(row.Version!=change.ExpectedVersion) return new(false,"stale_version",null,row.Version);
            var tenantRows=await db.Units.AsNoTracking().Where(x=>x.TenantId==change.TenantId).ToListAsync(ct);
            var map=tenantRows.ToDictionary(x=>x.Id,x=>new OrganisationUnit(x.Id,x.TenantId,x.Level,x.ParentId,x.Code,x.Active));
            var valid=OrganisationHierarchy.Validate(unit,map);
            if(!valid.Allowed) return new(false,valid.Code,null,null);
            // Full hierarchy revalidated inside the serializable transaction, not only preflight.
            row.ParentId=unit.ParentId; row.Version++; next=row.Version;
        }
        else if(change.NewAppointment is { } appt)
        {
            var row=await db.Committees.SingleOrDefaultAsync(x=>x.TenantId==change.TenantId && x.ChapterId==change.ResourceId,ct);
            if(row is null) return new(false,"committee_not_found",null,null);
            if(row.Version!=change.ExpectedVersion) return new(false,"stale_version",null,row.Version);
            var rows=await db.Appointments.AsNoTracking().Where(x=>x.TenantId==change.TenantId && x.ChapterId==change.ResourceId).ToListAsync(ct);
            var existing=rows.Select(x=>new CommitteeAppointment(x.Id,x.TenantId,x.ChapterId,x.UserId,x.RoleCode,x.StartsAt,x.EndsAt,x.Status,x.Exclusive));
            var check=AppointmentAuthority.CheckExclusiveConflict(appt,existing);
            if(!check.Allowed) return new(false,check.Reason,null,null);
            db.Appointments.Add(new Appointment {Id=appt.Id,TenantId=appt.TenantId,ChapterId=appt.ChapterId,UserId=appt.UserId,RoleCode=appt.RoleCode,StartsAt=appt.StartsAt,EndsAt=appt.EndsAt,Status=appt.Status,Exclusive=appt.Exclusive});
            row.Version++;next=row.Version;
        }
        else if(change.UpdatedAppointment is { } updated)
        {
            var committee=await db.Committees.SingleOrDefaultAsync(x=>x.TenantId==change.TenantId && x.ChapterId==change.ResourceId,ct);
            if(committee is null) return new(false,"committee_not_found",null,null);
            if(committee.Version!=change.ExpectedVersion) return new(false,"stale_version",null,committee.Version);
            var row=await db.Appointments.SingleOrDefaultAsync(x=>x.Id==updated.Id && x.TenantId==change.TenantId && x.ChapterId==change.ResourceId,ct);
            if(row is null) return new(false,"appointment_not_found",null,null);
            var others=await db.Appointments.AsNoTracking().Where(x=>x.TenantId==change.TenantId && x.ChapterId==change.ResourceId && x.Id!=updated.Id).ToListAsync(ct);
            var conflict=AppointmentAuthority.CheckExclusiveConflict(updated,others.Select(x=>new CommitteeAppointment(x.Id,x.TenantId,x.ChapterId,x.UserId,x.RoleCode,x.StartsAt,x.EndsAt,x.Status,x.Exclusive)));
            if(!conflict.Allowed) return new(false,conflict.Reason,null,null);
            row.Status=updated.Status;row.EndsAt=updated.EndsAt;committee.Version++;next=committee.Version;
        }
        else if(change.NewDelegation is not null || change.UpdatedDelegation is not null)
        {
            var grant=change.NewDelegation ?? change.UpdatedDelegation!;
            if(grant.TenantId!=change.TenantId || grant.ChapterId!=change.ResourceId) return new(false,"delegation_scope_denied",null,null);
            if (change.NewDelegation is not null)
            {
                var delegatorActive = await db.Appointments.AsNoTracking().AnyAsync(a =>
                    a.UserId == grant.DelegatorId && a.TenantId == grant.TenantId &&
                    a.ChapterId == grant.ChapterId && a.Status == AppointmentStatus.Active &&
                    a.StartsAt <= now && now < a.EndsAt, ct);
                var delegatorGrant = await db.PermissionGrants.AsNoTracking().AnyAsync(g =>
                    g.UserId == grant.DelegatorId && g.TenantId == grant.TenantId &&
                    g.Permission == grant.Permission && !g.Revoked && !g.IndependentGovernance &&
                    g.StartsAt <= now && (g.EndsAt == null || grant.EndsAt <= g.EndsAt) &&
                    (g.ChapterId == null || g.ChapterId == grant.ChapterId), ct);
                if (!delegatorActive || !delegatorGrant || grant.StartsAt > now ||
                    grant.EndsAt <= now || grant.DelegatorId == grant.DelegateId ||
                    grant.Permission.StartsWith("governance.",StringComparison.Ordinal))
                    return new(false,"delegation_authority_changed",null,null);
            }
            var committee=await db.Committees.SingleOrDefaultAsync(x=>x.TenantId==change.TenantId && x.ChapterId==change.ResourceId,ct);
            if(committee is null) return new(false,"committee_not_found",null,null);
            if(committee.Version!=change.ExpectedVersion) return new(false,"stale_version",null,committee.Version);
            if(change.NewDelegation is not null)
            {
                db.Delegations.Add(new Delegation{Id=grant.Id,TenantId=grant.TenantId,ChapterId=grant.ChapterId,
                    DelegatorId=grant.DelegatorId,DelegateId=grant.DelegateId,Permission=grant.Permission,
                    StartsAt=grant.StartsAt,EndsAt=grant.EndsAt,Revoked=grant.Revoked});
            }
            else
            {
                var row=await db.Delegations.SingleOrDefaultAsync(x=>x.Id==grant.Id && x.TenantId==change.TenantId,ct);
                if(row is null) return new(false,"delegation_not_found",null,null);
                if(row.Revoked) return new(false,"delegation_already_revoked",null,null);
                row.Revoked=true;
            }
            committee.Version++;next=committee.Version;
        }
        else return new(false,"unsupported_mutation",null,null);
        var result=new OrganisationCommandResult(true,"committed",change.ResourceId,next);
        db.Idempotency.Add(new Idempotency { TenantId=change.TenantId, ActorId=change.ActorId,Operation=change.Operation,Key=change.IdempotencyKey,PayloadSha256=change.PayloadSha256,ResultJson=JsonSerializer.Serialize(result),CreatedAt=change.OccurredAt });
        db.Audits.Add(new Audit { Id=Guid.NewGuid(),TenantId=change.TenantId,ActorId=change.ActorId,ResourceId=change.ResourceId,Operation=change.Operation,CorrelationId=change.CorrelationId,Event=change.AuditEvent,OccurredAt=change.OccurredAt });
        db.Outbox.Add(new Outbox { Id=Guid.NewGuid(),TenantId=change.TenantId,ResourceId=change.ResourceId,Event=change.OutboxEvent,OccurredAt=change.OccurredAt });
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return result;
    }
}

using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sethu.Service.MembershipIntake;
using Sethu.Domain.Membership;
using Sethu.Infrastructure.Persistence;
using Sethu.Domain.Entities;
namespace Sethu.Infrastructure.MembershipIntake;

public sealed class EfMemberIntakeStore(SethuDbContext db,IDbContextFactory<SethuDbContext> factory):IIntakeCommandStore
{
    private static string Digest(object value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(value))));
    private async Task<IntakeResult> RecoverAsync(Guid tenantId,Guid actorId,string operation,string key,string hash,CancellationToken ct)
    {
        try
        {
            await using var fresh=await factory.CreateDbContextAsync(ct);
            var entry=await fresh.Idempotency.AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==tenantId&&x.ActorId==actorId&&x.Operation==operation&&x.Key==key,ct);
            if(entry is null)return new(false,"commit_outcome_indeterminate",null,null);
            if(entry.PayloadSha256!=hash)return new(false,"idempotency_conflict",null,null);
            return JsonSerializer.Deserialize<IntakeResult>(entry.ResultJson) ?? new(false,"invalid_stored_result",null,null);
        }
        catch(OperationCanceledException) when(ct.IsCancellationRequested){throw;}
        catch(Exception){return new(false,"commit_outcome_indeterminate",null,null);}
    }
    public Task<IntakeResult> CreateDraftAsync(MemberIntake intake,Guid actorId,string key,CancellationToken ct)
    {
        if(intake.ApplicantUserId!=actorId)return Task.FromResult(new IntakeResult(false,"applicant_mismatch",null,null));
        var hash=Digest(new{intake.Id,intake.TenantId,intake.ChapterId,intake.ApplicantUserId,intake.ProposedSpecialisationId,intake.BusinessName});
        return ExecuteAsync(intake.TenantId,actorId,"membership.intake.draft",key,hash,async()=>
        {
            if(!await db.Units.AnyAsync(x=>x.Id==intake.ChapterId&&x.TenantId==intake.TenantId,ct))return new(false,"chapter_not_found",null,null);
            if(await db.Set<MemberIntake>().AnyAsync(x=>x.Id==intake.Id,ct))return new(false,"duplicate_application_id",null,null);
            if(await db.Set<MemberIntake>().AnyAsync(x=>x.TenantId==intake.TenantId&&x.ApplicantUserId==actorId&&x.State!=IntakeState.Rejected&&x.State!=IntakeState.Withdrawn&&x.State!=IntakeState.Activated,ct))return new(false,"active_application_exists",null,null);
            db.Set<MemberIntake>().Add(intake);
            return new(true,"application_draft_created",intake.Id,intake.Version);
        },ct);
    }
    public Task<IntakeResult> SubmitDraftAsync(Guid tenantId,Guid actorId,Guid applicationId,long expectedVersion,string key,CancellationToken ct)
    {
        var hash=Digest(new{tenantId,actorId,applicationId,expectedVersion});
        return ExecuteAsync(tenantId,actorId,"membership.intake.submit",key,hash,async()=>
        {
            var row=await db.Set<MemberIntake>().SingleOrDefaultAsync(x=>x.Id==applicationId&&x.TenantId==tenantId&&x.ApplicantUserId==actorId,ct);
            if(row is null)return new(false,"application_not_found",null,null);
            if(row.Version!=expectedVersion)return new(false,"stale_version",applicationId,row.Version);
            if(row.State!=IntakeState.Draft)return new(false,"invalid_application_state",applicationId,row.Version);
            row.Submit(expectedVersion);
            return new(true,"application_submitted",applicationId,row.Version);
        },ct);
    }
    private async Task<IntakeResult> ExecuteAsync(Guid tenantId,Guid actorId,string operation,string key,string hash,Func<Task<IntakeResult>> mutate,CancellationToken ct)
    {
        try
        {
            await using var tx=await db.Database.BeginTransactionAsync(IsolationLevel.Serializable,ct);
            var existing=await db.Idempotency.AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==tenantId&&x.ActorId==actorId&&x.Operation==operation&&x.Key==key,ct);
            if(existing is not null)
            {
                if(existing.PayloadSha256!=hash)return new(false,"idempotency_conflict",null,null);
                return JsonSerializer.Deserialize<IntakeResult>(existing.ResultJson) ?? new(false,"invalid_stored_result",null,null);
            }
            // Fail closed when the authoritative user/session state is absent or revoked.
            if(!await db.UserIdentities.AnyAsync(x=>x.Id==actorId&&x.TenantId==tenantId&&x.Active,ct))return new(false,"inactive_identity",null,null);
            var outcome=await mutate();
            if(!outcome.Accepted)return outcome;
            var now=DateTimeOffset.UtcNow;
            db.Idempotency.Add(new Idempotency{TenantId=tenantId,ActorId=actorId,Operation=operation,Key=key,PayloadSha256=hash,ResultJson=JsonSerializer.Serialize(outcome),CreatedAt=now});
            db.Audits.Add(new Audit{Id=Guid.NewGuid(),TenantId=tenantId,ActorId=actorId,ResourceId=outcome.ApplicationId!.Value,Operation=operation,Event=outcome.Code,CorrelationId="",OccurredAt=now});
            db.Outbox.Add(new Outbox{Id=Guid.NewGuid(),TenantId=tenantId,ResourceId=outcome.ApplicationId!.Value,Event=outcome.Code,OccurredAt=now});
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return outcome;
        }
        catch(DbUpdateException e) when(e.InnerException is PostgresException pg && pg.SqlState==PostgresErrorCodes.UniqueViolation){return await RecoverAsync(tenantId,actorId,operation,key,hash,ct);}
        catch(PostgresException e) when(e.SqlState==PostgresErrorCodes.UniqueViolation||e.SqlState==PostgresErrorCodes.SerializationFailure){return await RecoverAsync(tenantId,actorId,operation,key,hash,ct);}
        catch(OperationCanceledException) when(ct.IsCancellationRequested){throw;}
        catch(Exception){return await RecoverAsync(tenantId,actorId,operation,key,hash,ct);}
    }
}

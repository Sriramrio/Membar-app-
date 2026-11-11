using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sethu.Service.MemberBusiness;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Domain.Entities;

namespace Sethu.Infrastructure.MemberBusiness;

public sealed class EfBusinessDraftStore(SethuDbContext db,IDbContextFactory<SethuDbContext> factory) : IBusinessDraftStore
{
    public async Task<VerifiedMember?> FindMemberAsync(Guid tenantId,Guid memberId,CancellationToken ct)
    {
        var row=await db.Set<MemberRecord>().AsNoTracking().SingleOrDefaultAsync(x=>x.Id==memberId && x.TenantId==tenantId,ct);
        return row is null?null:new(row.Id,row.TenantId,row.UserId,row.Status==MemberRecordStatus.Active);
    }
    public async Task<BusinessCommandResult> CreateDraftAtomicallyAsync(BusinessRecord draft,Guid actorId,string idempotencyKey,CancellationToken ct)
    {
        const string operation="business.draft.create";
        var digest=Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new {draft.Id,draft.TenantId,draft.OwnerMemberId,draft.Name,draft.SpecialisationId}))));
        async Task<BusinessCommandResult> RecoverAsync()
        {
            try
            {
                await using var fresh=await factory.CreateDbContextAsync(ct);
                var old=await fresh.Idempotency.AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==draft.TenantId && x.ActorId==actorId && x.Operation==operation && x.Key==idempotencyKey,ct);
                if(old is null)return new(false,"commit_outcome_indeterminate",null,null);
                if(old.PayloadSha256!=digest)return new(false,"idempotency_conflict",null,null);
                return JsonSerializer.Deserialize<BusinessCommandResult>(old.ResultJson) ?? new(false,"stored_outcome_invalid",null,null);
            }
            catch(OperationCanceledException) when(ct.IsCancellationRequested){throw;}
            catch(Exception){return new(false,"commit_outcome_indeterminate",null,null);}
        }
        try
        {
            await using var tx=await db.Database.BeginTransactionAsync(IsolationLevel.Serializable,ct);
            var existing=await db.Idempotency.AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==draft.TenantId && x.ActorId==actorId && x.Operation==operation && x.Key==idempotencyKey,ct);
            if(existing is not null)
            {
                if(existing.PayloadSha256!=digest)return new(false,"idempotency_conflict",null,null);
                return JsonSerializer.Deserialize<BusinessCommandResult>(existing.ResultJson) ?? new(false,"stored_outcome_invalid",null,null);
            }
            // Transaction-local ownership/status check prevents stale preflight authorization.
            var owner=await db.Set<MemberRecord>().AsNoTracking().SingleOrDefaultAsync(x=>x.Id==draft.OwnerMemberId && x.TenantId==draft.TenantId && x.UserId==actorId && x.Status==MemberRecordStatus.Active,ct);
            if(owner is null)return new(false,"business_owner_denied",null,null);
            if(await db.Set<BusinessRecord>().AnyAsync(x=>x.Id==draft.Id,ct))return new(false,"duplicate_business_id",null,null);
            db.Set<BusinessRecord>().Add(draft);
            var result=new BusinessCommandResult(true,"business_draft_created",draft.Id,draft.Version);
            db.Idempotency.Add(new Idempotency{TenantId=draft.TenantId,ActorId=actorId,Operation=operation,Key=idempotencyKey,PayloadSha256=digest,ResultJson=JsonSerializer.Serialize(result),CreatedAt=DateTimeOffset.UtcNow});
            db.Audits.Add(new Audit{Id=Guid.NewGuid(),TenantId=draft.TenantId,ActorId=actorId,ResourceId=draft.Id,Operation=operation,Event="business_draft_created",CorrelationId="",OccurredAt=DateTimeOffset.UtcNow});
            db.Outbox.Add(new Outbox{Id=Guid.NewGuid(),TenantId=draft.TenantId,ResourceId=draft.Id,Event="business.draft.created",OccurredAt=DateTimeOffset.UtcNow});
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return result;
        }
        catch(DbUpdateException e) when(e.InnerException is PostgresException pg && pg.SqlState==PostgresErrorCodes.UniqueViolation){return await RecoverAsync();}
        catch(PostgresException e) when(e.SqlState==PostgresErrorCodes.UniqueViolation || e.SqlState==PostgresErrorCodes.SerializationFailure){return await RecoverAsync();}
        catch(OperationCanceledException) when(ct.IsCancellationRequested){throw;}
        catch(Exception){return await RecoverAsync();}
    }
}

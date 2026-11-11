using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sethu.Service.MemberNetwork;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Domain.Entities;
using ConnectionState = Sethu.Domain.Entities.ConnectionState; // disambiguates from System.Data.ConnectionState

namespace Sethu.Infrastructure.MemberNetwork;

public sealed class EfMemberNetworkStore(SethuDbContext db, IDbContextFactory<SethuDbContext> contexts) : IMemberNetworkStore
{
    public async Task<DirectoryPage> SearchAsync(Guid tenantId,Guid actor,NetworkScope scope,string? term,Guid? specialisation,int page,int size,CancellationToken ct)
    {
        var member=db.Set<MemberRecord>();
        var affiliation=db.Set<MemberChapterAffiliation>();
        var business=db.Set<BusinessRecord>();
        var isActive=await member.AsNoTracking().AnyAsync(x=>x.Id==actor && x.TenantId==tenantId && x.Status==MemberRecordStatus.Active,ct);
        if(!isActive) return new(Array.Empty<DirectoryEntry>(),page,size,false);
        var myChapters=affiliation.AsNoTracking().Where(x=>x.TenantId==tenantId && x.MemberId==actor && x.Status==AffiliationStatus.Active).Select(x=>x.ChapterId);
        var query=from m in member.AsNoTracking()
            join b in business.AsNoTracking() on m.Id equals b.OwnerMemberId
            join a in affiliation.AsNoTracking() on m.Id equals a.MemberId
            where m.TenantId==tenantId && b.TenantId==tenantId && a.TenantId==tenantId &&
                  m.Status==MemberRecordStatus.Active && b.Status==BusinessRecordStatus.Active && a.Status==AffiliationStatus.Active
            select new {m,b,a};
        if(scope==NetworkScope.ForYou) query=query.Where(x=>x.m.Id==actor);
        else if(scope==NetworkScope.YourChapter) query=query.Where(x=>myChapters.Contains(x.a.ChapterId));
        if(specialisation.HasValue) query=query.Where(x=>x.b.SpecialisationId==specialisation.Value);
        if(!string.IsNullOrWhiteSpace(term))
        {
            var escaped=term.Trim().Replace("\\","\\\\").Replace("%","\\%").Replace("_","\\_");
            query=query.Where(x=>EF.Functions.ILike(x.b.Name,"%"+escaped+"%","\\"));
        }
        var rows=await query.OrderBy(x=>x.b.Name).ThenBy(x=>x.m.Id).ThenBy(x=>x.a.ChapterId)
            .Skip((page-1)*size).Take(size+1).ToListAsync(ct);
        return new(rows.Take(size).Select(x=>new DirectoryEntry(x.m.Id,x.b.Id,x.b.Name,x.b.SpecialisationId,x.a.ChapterId)).ToArray(),page,size,rows.Count>size);
    }
    public async Task<ConnectionOutcome> ChangeConnectionAsync(ConnectionCommand cmd,CancellationToken ct)
    {
        const string operation="member.connection.change";
        var digest=Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new{cmd.TenantId,cmd.ActorMemberId,cmd.OtherMemberId,cmd.Action}))));
        async Task<ConnectionOutcome> Recover()
        {
            try
            {
                await using var fresh=await contexts.CreateDbContextAsync(ct);
                var stored=await fresh.Idempotency.AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==cmd.TenantId && x.ActorId==cmd.ActorMemberId && x.Operation==operation && x.Key==cmd.IdempotencyKey,ct);
                if(stored is null)return new(false,"commit_indeterminate",null);
                return stored.PayloadSha256==digest ? JsonSerializer.Deserialize<ConnectionOutcome>(stored.ResultJson)! : new(false,"idempotency_conflict",null);
            }
            catch(OperationCanceledException) when(ct.IsCancellationRequested){throw;}
            catch(Exception){return new(false,"commit_indeterminate",null);}
        }
        var lower=cmd.ActorMemberId.CompareTo(cmd.OtherMemberId)<0?cmd.ActorMemberId:cmd.OtherMemberId;
        var upper=lower==cmd.ActorMemberId?cmd.OtherMemberId:cmd.ActorMemberId;
        try
        {
            await using var tx=await db.Database.BeginTransactionAsync(IsolationLevel.Serializable,ct);
            var prior=await db.Idempotency.AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==cmd.TenantId && x.ActorId==cmd.ActorMemberId && x.Operation==operation && x.Key==cmd.IdempotencyKey,ct);
            if(prior is not null)return prior.PayloadSha256==digest?JsonSerializer.Deserialize<ConnectionOutcome>(prior.ResultJson)!:new(false,"idempotency_conflict",null);
            var members=await db.Set<MemberRecord>().AsNoTracking().Where(x=>x.TenantId==cmd.TenantId && (x.Id==lower || x.Id==upper) && x.Status==MemberRecordStatus.Active).CountAsync(ct);
            if(members!=2)return new(false,"active_member_required",null);
            var row=await db.Set<Connection>().SingleOrDefaultAsync(x=>x.TenantId==cmd.TenantId && x.LowerMemberId==lower && x.UpperMemberId==upper,ct);
            string code;
            if(cmd.Action==ConnectionAction.Request)
            {
                if(row is not null && row.State!=ConnectionState.Removed && row.State!=ConnectionState.Withdrawn && row.State!=ConnectionState.Declined)return new(false,"connection_already_exists",null);
                if(row is null){row=new Connection{Id=Guid.NewGuid(),TenantId=cmd.TenantId,LowerMemberId=lower,UpperMemberId=upper,InitiatorId=cmd.ActorMemberId};db.Set<Connection>().Add(row);}
                row.InitiatorId=cmd.ActorMemberId;row.State=ConnectionState.Pending;code="connection_requested";
            }
            else
            {
                if(row is null)return new(false,"connection_not_found",null);
                if(cmd.Action==ConnectionAction.Accept && row.State==ConnectionState.Pending && row.InitiatorId!=cmd.ActorMemberId){row.State=ConnectionState.Accepted;code="connection_accepted";}
                else if(cmd.Action==ConnectionAction.Decline && row.State==ConnectionState.Pending && row.InitiatorId!=cmd.ActorMemberId){row.State=ConnectionState.Declined;code="connection_declined";}
                else if(cmd.Action==ConnectionAction.Withdraw && row.State==ConnectionState.Pending && row.InitiatorId==cmd.ActorMemberId){row.State=ConnectionState.Withdrawn;code="connection_withdrawn";}
                else if(cmd.Action==ConnectionAction.Block && row.State!=ConnectionState.Blocked){row.State=ConnectionState.Blocked;code="connection_blocked";}
                else if(cmd.Action==ConnectionAction.Remove && row.State==ConnectionState.Accepted){row.State=ConnectionState.Removed;code="connection_removed";}
                else return new(false,"connection_transition_denied",null);
            }
            row.Version++;row.UpdatedAt=DateTimeOffset.UtcNow;
            var result=new ConnectionOutcome(true,code,row.Id);
            db.Idempotency.Add(new Idempotency{TenantId=cmd.TenantId,ActorId=cmd.ActorMemberId,Operation=operation,Key=cmd.IdempotencyKey,PayloadSha256=digest,ResultJson=JsonSerializer.Serialize(result),CreatedAt=DateTimeOffset.UtcNow});
            db.Audits.Add(new Audit{Id=Guid.NewGuid(),TenantId=cmd.TenantId,ActorId=cmd.ActorMemberId,ResourceId=row.Id,Operation=operation,Event=code,OccurredAt=DateTimeOffset.UtcNow});
            db.Outbox.Add(new Outbox{Id=Guid.NewGuid(),TenantId=cmd.TenantId,ResourceId=row.Id,Event="network."+code,OccurredAt=DateTimeOffset.UtcNow});
            await db.SaveChangesAsync(ct);await tx.CommitAsync(ct);
            return result;
        }
        catch(DbUpdateException ex) when(ex.InnerException is PostgresException pg && pg.SqlState==PostgresErrorCodes.UniqueViolation){return await Recover();}
        catch(PostgresException ex) when(ex.SqlState==PostgresErrorCodes.SerializationFailure || ex.SqlState==PostgresErrorCodes.UniqueViolation){return await Recover();}
        catch(OperationCanceledException) when(ct.IsCancellationRequested){throw;}
        catch(Exception){return await Recover();}
    }
}

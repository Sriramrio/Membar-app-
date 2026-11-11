using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sethu.Service.MemberNetwork;
using Sethu.Service.Layered;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.MemberBusiness;
using Sethu.Infrastructure.MemberNetwork;
using Sethu.Infrastructure.Persistence;
using Sethu.Domain.Entities;
using ConnectionState = Sethu.Domain.Entities.ConnectionState; // disambiguates from System.Data.ConnectionState
namespace Sethu.Infrastructure.Layered;

// Persistence only: transaction, business transitions and commit belong to Service + Unit of Work.
public sealed class EfConnectionRepository(SethuDbContext db) : IConnectionRepository
{
    public async Task<IReadOnlyList<ConnectionView>> ListAsync(NetworkActor actor,string? state,int page,int size,CancellationToken ct)
    {
        var query=db.Set<Connection>().AsNoTracking().Where(x=>x.TenantId==actor.TenantId &&
            (x.LowerMemberId==actor.MemberId || x.UpperMemberId==actor.MemberId));
        if(state is not null && Enum.TryParse<ConnectionState>(state,out var parsed))query=query.Where(x=>x.State==parsed);
        var rows=await query.OrderByDescending(x=>x.UpdatedAt).ThenBy(x=>x.Id).Skip((page-1)*size).Take(size).ToArrayAsync(ct);
        return rows.Select(x=>new ConnectionView(x.Id,x.InitiatorId,x.LowerMemberId==actor.MemberId?x.UpperMemberId:x.LowerMemberId,
            x.State.ToString(),x.Version,x.UpdatedAt)).ToArray();
    }
    public async Task<ConnectionView?> GetAsync(NetworkActor actor,Guid id,CancellationToken ct)
    {
        var row=await db.Set<Connection>().AsNoTracking().SingleOrDefaultAsync(x=>x.Id==id && x.TenantId==actor.TenantId &&
            (x.LowerMemberId==actor.MemberId || x.UpperMemberId==actor.MemberId),ct);
        return row is null?null:new ConnectionView(row.Id,row.InitiatorId,row.LowerMemberId==actor.MemberId?row.UpperMemberId:row.LowerMemberId,
            row.State.ToString(),row.Version,row.UpdatedAt);
    }

    public async Task<IReadOnlyList<ConnectionTransitionView>> HistoryAsync(NetworkActor actor,Guid id,int page,int size,CancellationToken ct)
    {
        var allowed=await db.Set<Connection>().AsNoTracking().AnyAsync(x=>x.TenantId==actor.TenantId && x.Id==id &&
            (x.LowerMemberId==actor.MemberId || x.UpperMemberId==actor.MemberId),ct);
        if(!allowed)return Array.Empty<ConnectionTransitionView>();
        var rows=await db.Set<ConnectionTransition>().AsNoTracking().Where(x=>x.TenantId==actor.TenantId && x.ConnectionId==id)
            .OrderBy(x=>x.OccurredAt).ThenBy(x=>x.Id).Skip((page-1)*size).Take(size).ToArrayAsync(ct);
        return rows.Select(x=>new ConnectionTransitionView(x.Id,x.ConnectionId,x.ActorMemberId,x.PreviousState,x.NewState,x.Action,x.OccurredAt)).ToArray();
    }
    public async Task<ConnectionOutcome> ChangeAsync(ConnectionCommand command,CancellationToken ct)
    {
        var lower=command.ActorMemberId.CompareTo(command.OtherMemberId)<0?command.ActorMemberId:command.OtherMemberId;
        var upper=lower==command.ActorMemberId?command.OtherMemberId:command.ActorMemberId;
        var count=await db.Set<MemberRecord>().AsNoTracking().CountAsync(x=>x.TenantId==command.TenantId &&
            (x.Id==lower || x.Id==upper) && x.Status==MemberRecordStatus.Active,ct);
        if(count!=2)return new(false,"active_member_required",null);
        var row=await db.Set<Connection>().SingleOrDefaultAsync(x=>x.TenantId==command.TenantId &&
            x.LowerMemberId==lower && x.UpperMemberId==upper,ct);
        var target=ConnectionRules.Transition(command.Action,row?.State.ToString(),row?.InitiatorId==command.ActorMemberId);
        if(target is null)return new(false,row is null?"connection_not_found":"connection_transition_denied",null);
        if(command.Action==ConnectionAction.Unblock && row?.BlockedByMemberId!=command.ActorMemberId)
            return new(false,"only_blocking_member_may_unblock",null);
        if(row is null)
        {
            row=new Connection {Id=Guid.NewGuid(),TenantId=command.TenantId,LowerMemberId=lower,
                UpperMemberId=upper,InitiatorId=command.ActorMemberId};
            db.Set<Connection>().Add(row);
        }
        var previous=row.Version==0?null:row.State.ToString();
        if(command.Action==ConnectionAction.Request){row.InitiatorId=command.ActorMemberId;row.BlockedByMemberId=null;}
        if(command.Action==ConnectionAction.Block)row.BlockedByMemberId=command.ActorMemberId;
        if(command.Action==ConnectionAction.Unblock)row.BlockedByMemberId=null;
        row.State=Enum.Parse<ConnectionState>(target);
        row.Version++;
        row.UpdatedAt=DateTimeOffset.UtcNow;
        db.Set<ConnectionTransition>().Add(new ConnectionTransition {
            Id=Guid.NewGuid(),TenantId=command.TenantId,ConnectionId=row.Id,ActorMemberId=command.ActorMemberId,
            PreviousState=previous,NewState=target,Action=command.Action.ToString(),OccurredAt=row.UpdatedAt
        });
        return new(true,"connection_"+target.ToLowerInvariant(),row.Id);
    }
}

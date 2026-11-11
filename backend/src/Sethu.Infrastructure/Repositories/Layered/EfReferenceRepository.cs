using Microsoft.EntityFrameworkCore;
using Sethu.Service.Layered;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Domain.Entities;
namespace Sethu.Infrastructure.Layered;

public sealed class EfReferenceRepository(SethuDbContext db):IReferenceRepository
{
    public async Task<IReadOnlyList<ReferenceView>> ListAsync(NetworkActor actor,int page,int size,CancellationToken ct)
    {
        var rows=await db.Set<NetworkReference>().AsNoTracking().Where(x=>x.TenantId==actor.TenantId &&
            (x.FromMemberId==actor.MemberId || x.ToMemberId==actor.MemberId || x.IntroducedMemberId==actor.MemberId))
            .OrderByDescending(x=>x.CreatedAt).ThenBy(x=>x.Id).Skip((page-1)*size).Take(size).ToArrayAsync(ct);
        return rows.Select(r=>View(r,actor)).ToArray();
    }
    private static ReferenceView View(NetworkReference r,NetworkActor actor)=>
        new(r.Id,r.FromMemberId,r.ToMemberId,
            r.IntroducedMemberId==actor.MemberId || r.ConsentedAt.HasValue?r.IntroducedMemberId:null,
            r.Status,r.Outcome,r.FollowUpAt,r.CreatedAt);
    public async Task<ReferenceResult> CreateAsync(NetworkActor actor,ReferenceCreate cmd,CancellationToken token)
    {
                var ids=new[]{actor.MemberId,cmd.ToMemberId};
                if(cmd.IntroducedMemberId.HasValue)ids=ids.Append(cmd.IntroducedMemberId.Value).ToArray();
                var valid=await db.Set<MemberRecord>().AsNoTracking().CountAsync(x=>x.TenantId==actor.TenantId &&
                    ids.Contains(x.Id) && x.Status==MemberRecordStatus.Active,token);
                if(valid!=ids.Length)return new(false,"active_members_required",null);
                var row=new NetworkReference{Id=Guid.NewGuid(),TenantId=actor.TenantId,
                    FromMemberId=actor.MemberId,ToMemberId=cmd.ToMemberId,IntroducedMemberId=cmd.IntroducedMemberId,
                    CreatedAt=DateTimeOffset.UtcNow,Status="Pending",Version=1};
                db.Set<NetworkReference>().Add(row);
                db.Set<NetworkReferenceHistory>().Add(new NetworkReferenceHistory{Id=Guid.NewGuid(),TenantId=actor.TenantId,
                    ReferenceId=row.Id,ActorMemberId=actor.MemberId,PreviousStatus="",NewStatus="Pending",
                    Action="Create",OccurredAt=row.CreatedAt});
                return new(true,"reference_requested",row.Id);
    }
    public async Task<ReferenceResult> UpdateAsync(NetworkActor actor,ReferenceUpdate cmd,CancellationToken token)
    {
                var row=await db.Set<NetworkReference>().SingleOrDefaultAsync(x=>x.Id==cmd.ReferenceId &&
                    x.TenantId==actor.TenantId && (x.FromMemberId==actor.MemberId || x.ToMemberId==actor.MemberId || x.IntroducedMemberId==actor.MemberId),token);
                if(row is null)return new(false,"reference_not_found",null);
                var previousStatus=row.Status;
                if(cmd.Action=="Withdraw" && row.Status=="Pending" && row.FromMemberId==actor.MemberId)row.Status="Withdrawn";
                else if(cmd.Action=="Accept" && row.Status=="Pending" && row.ToMemberId==actor.MemberId)
                    row.Status=row.IntroducedMemberId.HasValue?"PendingConsent":"Accepted";
                else if(cmd.Action=="Consent" && row.Status=="PendingConsent" && row.IntroducedMemberId==actor.MemberId)
                {row.ConsentedAt=DateTimeOffset.UtcNow;row.Status="Accepted";}
                else if(cmd.Action=="RefuseConsent" && row.Status=="PendingConsent" && row.IntroducedMemberId==actor.MemberId)row.Status="Declined";
                else if(cmd.Action=="RevokeConsent" && row.Status=="Accepted" && row.IntroducedMemberId==actor.MemberId)
                {row.Status="ConsentRevoked";row.ConsentedAt=null;}
                else if(cmd.Action=="Decline" && row.Status=="Pending" && row.ToMemberId==actor.MemberId)row.Status="Declined";
                else if(cmd.Action=="FollowUp" && row.Status=="Accepted" && row.FromMemberId==actor.MemberId && cmd.FollowUpAt.HasValue)row.FollowUpAt=cmd.FollowUpAt;
                else if(cmd.Action=="Outcome" && row.Status=="Accepted" && row.FromMemberId==actor.MemberId && !string.IsNullOrWhiteSpace(cmd.Outcome)){row.Outcome=cmd.Outcome;row.Status="Completed";}
                else return new(false,"reference_transition_denied",null);
                row.Version++;
                db.Set<NetworkReferenceHistory>().Add(new NetworkReferenceHistory{Id=Guid.NewGuid(),TenantId=actor.TenantId,
                    ReferenceId=row.Id,ActorMemberId=actor.MemberId,PreviousStatus=previousStatus,NewStatus=row.Status,
                    Action=cmd.Action,OccurredAt=DateTimeOffset.UtcNow});
                return new(true,"reference_"+cmd.Action.ToLowerInvariant(),row.Id);
    }
}

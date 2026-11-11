using Microsoft.EntityFrameworkCore;
using Sethu.Service.Layered;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Domain.Entities;
namespace Sethu.Infrastructure.Layered;

public sealed class EfMeetingRepository(SethuDbContext db):IMeetingRepository
{
    public async Task<IReadOnlyList<MeetingView>> ListAsync(NetworkActor actor,int page,int size,CancellationToken ct)
    {
        var rows=await db.Set<NetworkMeeting>().AsNoTracking().Where(x=>x.TenantId==actor.TenantId &&
            (x.FromMemberId==actor.MemberId || x.ToMemberId==actor.MemberId))
            .OrderByDescending(x=>x.ProposedAt).ThenBy(x=>x.Id).Skip((page-1)*size).Take(size).ToArrayAsync(ct);
        return rows.Select(x=>new MeetingView(x.Id,x.FromMemberId,x.ToMemberId,x.Status,x.ProposedAt,x.ConfirmedAt,x.TimeZoneId,x.Outcome,x.FollowUpAt)).ToArray();
    }
    public async Task<GovernedResult> CreateAsync(NetworkActor actor,MeetingCreate request,CancellationToken ct)
    {
        var members=await db.Set<MemberRecord>().AsNoTracking().CountAsync(x=>x.TenantId==actor.TenantId &&
            (x.Id==actor.MemberId || x.Id==request.ToMemberId) && x.Status==MemberRecordStatus.Active,ct);
        if(members!=2)return new(false,"ineligible_meeting_participant",null);
        var item=new NetworkMeeting{Id=Guid.NewGuid(),TenantId=actor.TenantId,FromMemberId=actor.MemberId,
            ToMemberId=request.ToMemberId,ProposedByMemberId=actor.MemberId,ProposedAt=request.ProposedAt,TimeZoneId=request.TimeZoneId,Version=1};
        db.Set<NetworkMeeting>().Add(item);
        return new(true,"meeting_requested",item.Id);
    }
    public async Task<GovernedResult> ChangeAsync(NetworkActor actor,MeetingAction request,CancellationToken ct)
    {
        var x=await db.Set<NetworkMeeting>().SingleOrDefaultAsync(y=>y.TenantId==actor.TenantId && y.Id==request.MeetingId &&
            (y.FromMemberId==actor.MemberId || y.ToMemberId==actor.MemberId),ct);
        if(x is null)return new(false,"meeting_not_found",null);
        var initiator=x.FromMemberId==actor.MemberId;
        if(request.Action=="Accept" && x.Status=="Requested" && !initiator){x.Status="Scheduled";x.ConfirmedAt=x.ProposedAt;}
        else if(request.Action=="Decline" && x.Status=="Requested" && !initiator)x.Status="Declined";
        else if(request.Action=="ProposeTime" && (x.Status is "Requested" or "Scheduled") && request.Time>DateTimeOffset.UtcNow)
        {x.ProposedAt=request.Time!.Value;x.ProposedByMemberId=actor.MemberId;x.ConfirmedAt=null;x.Status="TimeProposed";}
        else if(request.Action=="Confirm" && x.Status=="TimeProposed" && x.ProposedByMemberId!=actor.MemberId && x.ProposedAt>DateTimeOffset.UtcNow)
        {x.ConfirmedAt=x.ProposedAt;x.Status="Scheduled";}
        else if(request.Action=="Cancel" && (x.Status is "Requested" or "Scheduled" or "TimeProposed"))x.Status="Cancelled";
        else if(request.Action=="Complete" && x.Status=="Scheduled" && x.ConfirmedAt<=DateTimeOffset.UtcNow)x.Status="Completed";
        else if(request.Action=="FollowUp" && x.Status=="Completed" && request.Time.HasValue)x.FollowUpAt=request.Time;
        else if(request.Action=="Outcome" && x.Status=="Completed" && !string.IsNullOrWhiteSpace(request.Outcome) && request.Outcome.Length<=512)x.Outcome=request.Outcome;
        else return new(false,"meeting_transition_denied",null);
        x.Version++;
        return new(true,"meeting_"+request.Action.ToLowerInvariant(),x.Id);
    }
}

using Microsoft.EntityFrameworkCore;
using Sethu.Service.Layered;
using Sethu.Infrastructure.MemberNetwork;
using Sethu.Infrastructure.Persistence;
using Sethu.Domain.Entities;
namespace Sethu.Infrastructure.Layered;

public sealed class EfNetworkAnalyticsRepository(SethuDbContext db):INetworkAnalyticsRepository
{
    public async Task<MemberAnalytics> SnapshotAsync(NetworkActor actor,CancellationToken ct)
    {
        var relationships=db.Set<Connection>().AsNoTracking().Where(x=>x.TenantId==actor.TenantId &&
            (x.LowerMemberId==actor.MemberId || x.UpperMemberId==actor.MemberId));
        var references=db.Set<NetworkReference>().AsNoTracking().Where(x=>x.TenantId==actor.TenantId &&
            (x.FromMemberId==actor.MemberId || x.ToMemberId==actor.MemberId));
        var meetings=db.Set<NetworkMeeting>().AsNoTracking().Where(x=>x.TenantId==actor.TenantId &&
            (x.FromMemberId==actor.MemberId || x.ToMemberId==actor.MemberId));
        var opportunities=db.Set<NetworkOpportunity>().AsNoTracking().Where(x=>x.TenantId==actor.TenantId);
        var notes=db.Set<NetworkNote>().AsNoTracking().Where(x=>x.TenantId==actor.TenantId && x.AuthorMemberId==actor.MemberId);
        return new MemberAnalytics(
            await relationships.CountAsync(x=>x.InitiatorId==actor.MemberId,ct),
            await relationships.CountAsync(x=>x.InitiatorId!=actor.MemberId,ct),
            await relationships.CountAsync(x=>x.State==ConnectionState.Accepted,ct),
            await relationships.CountAsync(x=>x.State==ConnectionState.Pending,ct),
            await references.CountAsync(x=>x.FromMemberId==actor.MemberId,ct),
            await references.CountAsync(x=>x.ToMemberId==actor.MemberId,ct),
            await references.CountAsync(x=>x.Status=="Pending" || x.Status=="PendingConsent",ct),
            await meetings.CountAsync(x=>x.FromMemberId==actor.MemberId,ct),
            await meetings.CountAsync(x=>x.Status=="Scheduled",ct),
            await meetings.CountAsync(x=>x.Status=="Completed",ct),
            await opportunities.CountAsync(x=>x.OwnerMemberId==actor.MemberId,ct),
            await db.Set<NetworkOpportunityResponse>().AsNoTracking().CountAsync(x=>x.TenantId==actor.TenantId && x.MemberId==actor.MemberId,ct),
            await notes.CountAsync(x=>!x.Archived && x.FollowUpAt.HasValue && x.FollowUpAt<=DateTimeOffset.UtcNow,ct),
            await db.Set<NetworkFreeRegistration>().AsNoTracking().CountAsync(x=>x.TenantId==actor.TenantId &&
                x.MemberId==actor.MemberId && x.Status=="Registered",ct));
    }
    public async Task<IReadOnlyList<MemberActionItem>> ActionsAsync(NetworkActor actor,int size,CancellationToken ct)
    {
        var connections=await db.Set<Connection>().AsNoTracking().Where(x=>x.TenantId==actor.TenantId && x.State==ConnectionState.Pending &&
            x.InitiatorId!=actor.MemberId && (x.LowerMemberId==actor.MemberId || x.UpperMemberId==actor.MemberId))
            .OrderBy(x=>x.UpdatedAt).Take(size).Select(x=>new MemberActionItem("connection",x.Id,"Respond to connection request",null)).ToListAsync(ct);
        var meetings=await db.Set<NetworkMeeting>().AsNoTracking().Where(x=>x.TenantId==actor.TenantId && x.ToMemberId==actor.MemberId && x.Status=="Requested")
            .OrderBy(x=>x.ProposedAt).Take(size).Select(x=>new MemberActionItem("meeting",x.Id,"Respond to One-to-One request",x.ProposedAt)).ToListAsync(ct);
        var notes=await db.Set<NetworkNote>().AsNoTracking().Where(x=>x.TenantId==actor.TenantId && x.AuthorMemberId==actor.MemberId &&
            !x.Archived && x.FollowUpAt.HasValue && x.FollowUpAt<=DateTimeOffset.UtcNow)
            .OrderBy(x=>x.FollowUpAt).Take(size).Select(x=>new MemberActionItem("note",x.Id,"Complete note follow-up",x.FollowUpAt)).ToListAsync(ct);
        return connections.Concat(meetings).Concat(notes).Take(size).ToArray();
    }
}

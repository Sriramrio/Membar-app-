using Microsoft.EntityFrameworkCore;
using Sethu.Service.Layered;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Domain.Entities;
namespace Sethu.Infrastructure.Layered;

public sealed class EfCalendarRepository(SethuDbContext db):ICalendarRepository
{
    public async Task<IReadOnlyList<CalendarEventView>> ListAsync(NetworkActor actor,int page,int size,CancellationToken ct)
    {
        var memberChapters=db.Set<MemberChapterAffiliation>().AsNoTracking().Where(a=>a.TenantId==actor.TenantId &&
            a.MemberId==actor.MemberId && a.Status==AffiliationStatus.Active).Select(a=>a.ChapterId);
        var rows=await db.Set<NetworkFreeEvent>().AsNoTracking().Where(x=>x.TenantId==actor.TenantId &&
            memberChapters.Contains(x.ChapterId) && x.Status=="Published" && x.EndsAt>=DateTimeOffset.UtcNow)
            .OrderBy(x=>x.StartsAt).ThenBy(x=>x.Id).Skip((page-1)*size).Take(size).ToArrayAsync(ct);
        return rows.Select(x=>new CalendarEventView(x.Id,x.ChapterId,x.Title,x.StartsAt,x.EndsAt,x.Capacity,x.Registered,x.IsPaid,x.Status)).ToArray();
    }
    public async Task<GovernedResult> CreateAsync(NetworkActor actor,CalendarEventCreate command,CancellationToken ct)
    {
        var affiliated=await db.Set<MemberChapterAffiliation>().AsNoTracking().AnyAsync(x=>x.TenantId==actor.TenantId &&
            x.MemberId==actor.MemberId && x.ChapterId==command.ChapterId && x.Status==AffiliationStatus.Active,ct);
        var now=DateTimeOffset.UtcNow;
        var permission=await db.PermissionGrants.AsNoTracking().AnyAsync(x=>x.TenantId==actor.TenantId && x.UserId==actor.UserId &&
            x.Permission=="chapter.event.manage" && !x.Revoked && x.StartsAt<=now && (!x.EndsAt.HasValue || x.EndsAt>now) &&
            (x.ChapterId==command.ChapterId),ct);
        if(!affiliated || !permission)return new(false,"event_manager_permission_required",null);
        if(command.IsPaid)return new(false,"finance_deferred",null);
        var row=new NetworkFreeEvent{Id=Guid.NewGuid(),TenantId=actor.TenantId,ChapterId=command.ChapterId,
            OrganiserMemberId=actor.MemberId,Title=command.Title.Trim(),StartsAt=command.StartsAt,EndsAt=command.EndsAt,
            Capacity=command.Capacity,IsPaid=false,Registered=0,Status="Published",Version=1};
        db.Set<NetworkFreeEvent>().Add(row);
        return new(true,"free_event_created",row.Id);
    }
    public async Task<GovernedResult> RegisterAsync(NetworkActor actor,FreeRegistrationCommand command,CancellationToken ct)
    {
        var row=await db.Set<NetworkFreeEvent>().SingleOrDefaultAsync(x=>x.TenantId==actor.TenantId && x.Id==command.EventId,ct);
        if(row is null || row.IsPaid || row.Status!="Published")return new(false,"event_unavailable",null);
        var member=await db.Set<MemberRecord>().AsNoTracking().AnyAsync(x=>x.TenantId==actor.TenantId && x.Id==actor.MemberId && x.Status==MemberRecordStatus.Active,ct);
        var affiliated=await db.Set<MemberChapterAffiliation>().AsNoTracking().AnyAsync(x=>x.TenantId==actor.TenantId && x.MemberId==actor.MemberId &&
            x.ChapterId==row.ChapterId && x.Status==AffiliationStatus.Active,ct);
        if(!member || !affiliated)return new(false,"event_eligibility_denied",null);
        var existing=await db.Set<NetworkFreeRegistration>().SingleOrDefaultAsync(x=>x.TenantId==actor.TenantId &&
            x.EventId==row.Id && x.MemberId==actor.MemberId,ct);
        if(command.Action=="Register")
        {
            if(row.StartsAt<=DateTimeOffset.UtcNow || row.Registered>=row.Capacity || existing?.Status=="Registered")
                return new(false,"event_full_started_or_duplicate",null);
            if(existing is null)db.Set<NetworkFreeRegistration>().Add(new NetworkFreeRegistration{Id=Guid.NewGuid(),TenantId=actor.TenantId,
                EventId=row.Id,MemberId=actor.MemberId,Status="Registered",UpdatedAt=DateTimeOffset.UtcNow});
            else {existing.Status="Registered";existing.UpdatedAt=DateTimeOffset.UtcNow;}
            row.Registered++;
        }
        else if(command.Action=="Withdraw" && existing?.Status=="Registered")
        {
            existing.Status="Withdrawn";existing.UpdatedAt=DateTimeOffset.UtcNow;row.Registered--;
        }
        else return new(false,"event_registration_transition_denied",null);
        row.Version++;
        return new(true,"free_event_"+command.Action.ToLowerInvariant(),row.Id);
    }
}

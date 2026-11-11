using Microsoft.EntityFrameworkCore;
using Sethu.Service.Layered;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Domain.Entities;
namespace Sethu.Infrastructure.Layered;

public sealed class EfNoteRepository(SethuDbContext db):INoteRepository
{
    public async Task<IReadOnlyList<NoteView>> ListAsync(NetworkActor actor,int page,int size,CancellationToken ct)
    {
        var rows=await db.Set<NetworkNote>().AsNoTracking().Where(x=>x.TenantId==actor.TenantId && x.AuthorMemberId==actor.MemberId)
            .OrderByDescending(x=>x.UpdatedAt).ThenBy(x=>x.Id).Skip((page-1)*size).Take(size).ToArrayAsync(ct);
        return rows.Select(x=>new NoteView(x.Id,x.ContextType,x.ContextId,x.Text,x.FollowUpAt,x.Archived,x.UpdatedAt)).ToArray();
    }
    public async Task<GovernedResult> CreateAsync(NetworkActor actor,NoteCreate request,CancellationToken ct)
    {
        bool canAccess=request.ContextType switch
        {
            "Member"=>await db.Set<MemberRecord>().AnyAsync(x=>x.TenantId==actor.TenantId && x.Id==request.ContextId && x.Status==MemberRecordStatus.Active,ct)
                && (request.ContextId==actor.MemberId || await db.Set<Connection>().AnyAsync(c=>c.TenantId==actor.TenantId &&
                    c.State==ConnectionState.Accepted &&
                    ((c.LowerMemberId==actor.MemberId && c.UpperMemberId==request.ContextId) ||
                    (c.UpperMemberId==actor.MemberId && c.LowerMemberId==request.ContextId)),ct)),
            "OneToOne"=>await db.Set<NetworkMeeting>().AnyAsync(x=>x.TenantId==actor.TenantId && x.Id==request.ContextId && (x.FromMemberId==actor.MemberId || x.ToMemberId==actor.MemberId),ct),
            "Reference"=>await db.Set<NetworkReference>().AnyAsync(x=>x.TenantId==actor.TenantId && x.Id==request.ContextId &&
                (x.FromMemberId==actor.MemberId || x.ToMemberId==actor.MemberId || x.IntroducedMemberId==actor.MemberId),ct),
            "Business"=>await db.Set<BusinessRecord>().AnyAsync(x=>x.TenantId==actor.TenantId && x.Id==request.ContextId &&
                x.OwnerMemberId==actor.MemberId && x.Status==BusinessRecordStatus.Active,ct),
            "Opportunity"=>await db.Set<NetworkOpportunity>().AnyAsync(x=>x.TenantId==actor.TenantId && x.Id==request.ContextId && x.OwnerMemberId==actor.MemberId,ct),
            _=>false
        };
        if(!canAccess)return new(false,"note_context_forbidden",null);
        var x=new NetworkNote{Id=Guid.NewGuid(),TenantId=actor.TenantId,AuthorMemberId=actor.MemberId,
            ContextType=request.ContextType,ContextId=request.ContextId,Text=request.Text,FollowUpAt=request.FollowUpAt,UpdatedAt=DateTimeOffset.UtcNow,Version=1};
        db.Set<NetworkNote>().Add(x);return new(true,"note_created",x.Id);
    }
    public async Task<GovernedResult> ChangeAsync(NetworkActor actor,NoteAction request,CancellationToken ct)
    {
        var x=await db.Set<NetworkNote>().SingleOrDefaultAsync(y=>y.TenantId==actor.TenantId && y.Id==request.NoteId && y.AuthorMemberId==actor.MemberId,ct);
        if(x is null)return new(false,"note_not_found",null);
        if(x.Archived)return new(false,"note_archived",null);
        if(request.Action=="Edit" && request.Text is not null)x.Text=request.Text;
        else if(request.Action=="Archive")x.Archived=true;
        else if(request.Action=="FollowUp")x.FollowUpAt=request.FollowUpAt;
        else return new(false,"note_transition_denied",null);
        x.UpdatedAt=DateTimeOffset.UtcNow;x.Version++;
        return new(true,"note_"+request.Action.ToLowerInvariant(),x.Id);
    }
}

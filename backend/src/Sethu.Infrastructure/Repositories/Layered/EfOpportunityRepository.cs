using Microsoft.EntityFrameworkCore;
using Sethu.Service.Layered;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Domain.Entities;
namespace Sethu.Infrastructure.Layered;

public sealed class EfOpportunityRepository(SethuDbContext db):IOpportunityRepository
{
    public async Task<IReadOnlyList<OpportunityView>> ListAsync(NetworkActor actor,int page,int size,CancellationToken ct)
    {
        var chapters=db.Set<MemberChapterAffiliation>().AsNoTracking().Where(a=>a.TenantId==actor.TenantId && a.MemberId==actor.MemberId && a.Status==AffiliationStatus.Active).Select(a=>a.ChapterId);
        var rows=await db.Set<NetworkOpportunity>().AsNoTracking().Where(x=>x.TenantId==actor.TenantId &&
            (x.OwnerMemberId==actor.MemberId || ((x.Status=="Published" || x.Status=="Open") &&
                (x.Scope=="YourNetwork" || (x.Scope=="YourChapter" && x.ChapterId.HasValue && chapters.Contains(x.ChapterId.Value))))))
            .OrderBy(x=>x.Title).ThenBy(x=>x.Id).Skip((page-1)*size).Take(size).ToArrayAsync(ct);
        return rows.Select(x=>new OpportunityView(x.Id,x.OwnerMemberId,x.BusinessId,x.Title,x.Status,x.Scope,x.ChapterId,x.SpecialisationId,x.Outcome)).ToArray();
    }
    public async Task<GovernedResult> CreateAsync(NetworkActor actor,OpportunityCreate request,CancellationToken ct)
    {
        var eligible=await db.Set<BusinessRecord>().AsNoTracking().AnyAsync(x=>x.TenantId==actor.TenantId && x.Id==request.BusinessId &&
            x.OwnerMemberId==actor.MemberId && x.Status==BusinessRecordStatus.Active && (!request.SpecialisationId.HasValue || x.SpecialisationId==request.SpecialisationId.Value),ct);
        if(!eligible)return new(false,"business_owner_required",null);
        if(request.ChapterId.HasValue && !await db.Set<MemberChapterAffiliation>().AsNoTracking().AnyAsync(x=>x.TenantId==actor.TenantId && x.MemberId==actor.MemberId && x.ChapterId==request.ChapterId && x.Status==AffiliationStatus.Active,ct))
            return new(false,"chapter_membership_required",null);
        var x=new NetworkOpportunity{Id=Guid.NewGuid(),TenantId=actor.TenantId,OwnerMemberId=actor.MemberId,BusinessId=request.BusinessId,
            Title=request.Title.Trim(),Scope=request.Scope,ChapterId=request.ChapterId,SpecialisationId=request.SpecialisationId,Version=1};
        db.Set<NetworkOpportunity>().Add(x);return new(true,"opportunity_created",x.Id);
    }
    public async Task<GovernedResult> ChangeAsync(NetworkActor actor,OpportunityAction request,CancellationToken ct)
    {
        var x=await db.Set<NetworkOpportunity>().SingleOrDefaultAsync(y=>y.Id==request.OpportunityId && y.TenantId==actor.TenantId,ct);
        if(x is null)return new(false,"opportunity_not_found",null);
        if(x.OwnerMemberId==actor.MemberId)
        {
            if(request.Action=="Publish" && x.Status=="Draft")x.Status="Published";
            else if(request.Action=="Close" && (x.Status=="Published" || x.Status=="Open"))x.Status="Closed";
            else if(request.Action=="Outcome" && (x.Status=="Closed" || x.Status=="Published" || x.Status=="Open") && !string.IsNullOrWhiteSpace(request.Outcome) && request.Outcome.Length<=512)
            {
                x.Outcome=request.Outcome;
                x.Status="Closed";
            }
            else if(request.Action=="Edit" && (x.Status=="Draft" || x.Status=="Published" || x.Status=="Open") && !string.IsNullOrWhiteSpace(request.Title) && request.Title.Length<=160)x.Title=request.Title.Trim();
            else if((request.Action is "Shortlist" or "Reject") && (x.Status=="Published" || x.Status=="Open") && request.ResponseId.HasValue)
            {
                var response=await db.Set<NetworkOpportunityResponse>().SingleOrDefaultAsync(r=>r.Id==request.ResponseId && r.TenantId==actor.TenantId && r.OpportunityId==x.Id,ct);
                if(response?.Status!="Responded" && response?.Status!="Submitted")return new(false,"response_not_actionable",null);
                response.Status=request.Action=="Shortlist"?"Shortlisted":"Rejected";
            }
            else return new(false,"opportunity_transition_denied",null);
        }
        else if((request.Action is "Respond" or "WithdrawResponse") && (x.Status=="Published" || x.Status=="Open"))
        {
            var visible=x.Scope=="YourNetwork" || (x.Scope=="YourChapter" && x.ChapterId.HasValue && await db.Set<MemberChapterAffiliation>().AsNoTracking()
                .AnyAsync(a=>a.TenantId==actor.TenantId && a.MemberId==actor.MemberId && a.ChapterId==x.ChapterId.Value && a.Status==AffiliationStatus.Active,ct));
            if(!visible)return new(false,"opportunity_not_visible",null);
            var response=await db.Set<NetworkOpportunityResponse>().SingleOrDefaultAsync(r=>r.TenantId==actor.TenantId && r.OpportunityId==x.Id && r.MemberId==actor.MemberId,ct);
            if(request.Action=="Respond" && response is null)db.Set<NetworkOpportunityResponse>().Add(new NetworkOpportunityResponse{Id=Guid.NewGuid(),TenantId=actor.TenantId,OpportunityId=x.Id,MemberId=actor.MemberId,Status="Responded"});
            else if(request.Action=="Respond" && response?.Status=="Withdrawn")response.Status="Responded";
            else if(request.Action=="WithdrawResponse" && (response?.Status=="Responded" || response?.Status=="Submitted"))response.Status="Withdrawn";
            else return new(false,"opportunity_response_denied",null);
        }
        else return new(false,"opportunity_permission_denied",null);
        x.Version++;
        return new(true,"opportunity_"+request.Action.ToLowerInvariant(),x.Id);
    }
}

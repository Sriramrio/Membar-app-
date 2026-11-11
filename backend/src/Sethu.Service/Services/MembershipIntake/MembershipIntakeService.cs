using System.Security.Claims;
using Sethu.Service.Security;
using Sethu.Domain.Membership;
namespace Sethu.Service.MembershipIntake;

public sealed class MembershipIntakeService(IAuthenticatedActorResolver resolver,IIntakeCommandStore store,TimeProvider clock)
{
    public async Task<IntakeResult> StartAsync(ClaimsPrincipal principal,StartIntake request,CancellationToken ct)
    {
        if(request.ApplicationId==Guid.Empty||request.ChapterId==Guid.Empty||request.SpecialisationId==Guid.Empty||string.IsNullOrWhiteSpace(request.IdempotencyKey))
            return new(false,"validation_failed",null,null);
        var resolved=await resolver.ResolveAsync(principal,ct);
        if(!resolved.Succeeded||resolved.Actor is null)return new(false,resolved.Reason,null,null);
        MemberIntake draft;
        try{draft=MemberIntake.Draft(request.ApplicationId,resolved.Actor.TenantId,request.ChapterId,resolved.Actor.UserId,request.SpecialisationId,request.BusinessName,clock.GetUtcNow());}
        catch(ArgumentException){return new(false,"validation_failed",null,null);}
        return await store.CreateDraftAsync(draft,resolved.Actor.UserId,request.IdempotencyKey,ct);
    }
    public async Task<IntakeResult> SubmitAsync(ClaimsPrincipal principal,Guid applicationId,long expectedVersion,string key,CancellationToken ct)
    {
        if(applicationId==Guid.Empty||string.IsNullOrWhiteSpace(key))return new(false,"validation_failed",null,null);
        var identity=await resolver.ResolveAsync(principal,ct);
        if(!identity.Succeeded||identity.Actor is null)return new(false,identity.Reason,null,null);
        return await store.SubmitDraftAsync(identity.Actor.TenantId,identity.Actor.UserId,applicationId,expectedVersion,key,ct);
    }
}

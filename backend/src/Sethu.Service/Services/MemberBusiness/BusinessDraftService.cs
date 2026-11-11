using System.Security.Claims;
using Sethu.Service.Security;
using Sethu.Domain.MemberBusiness;

namespace Sethu.Service.MemberBusiness;

public sealed class BusinessDraftService(IAuthenticatedActorResolver actors,IBusinessDraftStore store)
{
    public async Task<BusinessCommandResult> ExecuteAsync(ClaimsPrincipal principal,CreateBusinessDraft request,CancellationToken ct)
    {
        if(request.BusinessId==Guid.Empty || request.MemberId==Guid.Empty || request.SpecialisationId==Guid.Empty ||
           string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.IdempotencyKey))
            return new(false,"validation_failed",null,null);
        IdentityResolution resolved;
        try { resolved=await actors.ResolveAsync(principal,ct); }
        catch(OperationCanceledException) when(ct.IsCancellationRequested){throw;}
        catch(Exception){return new(false,"identity_dependency_unavailable",null,null);}
        if(!resolved.Succeeded || resolved.Actor is null) return new(false,resolved.Reason,null,null);
        var actor=resolved.Actor;
        var member=await store.FindMemberAsync(actor.TenantId,request.MemberId,ct);
        if(member is null || member.TenantId!=actor.TenantId || member.UserId!=actor.UserId || !member.Active)
            return new(false,"business_owner_denied",null,null);
        BusinessRecord draft;
        try { draft=BusinessRecord.Create(request.BusinessId,actor.TenantId,member.MemberId,request.Name,request.SpecialisationId); }
        catch(ArgumentException){return new(false,"validation_failed",null,null);}
        // Store must revalidate member ownership/status and idempotency within the transaction.
        return await store.CreateDraftAtomicallyAsync(draft,actor.UserId,request.IdempotencyKey,ct);
    }
}

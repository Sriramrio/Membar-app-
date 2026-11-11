using System.Security.Claims;
using Sethu.Service.Security;
namespace Sethu.Service.MembershipIntake;

public sealed class TrustedFinanceEvidenceService(IAuthenticatedActorResolver actors,ITrustedFinanceEvidenceStore store)
{
    public async Task<BankEvidenceResult> ApproveAsync(ClaimsPrincipal principal,BankEvidenceApproval command,CancellationToken ct)
    {
        var resolved=await actors.ResolveAsync(principal,ct);
        if(!resolved.Succeeded||resolved.Actor is null||resolved.Actor.TenantId!=command.TenantId)return new(false,"identity_invalid");
        var issuer=principal.FindFirst("iss")?.Value; var session=principal.FindFirst("sid")?.Value;
        if(string.IsNullOrWhiteSpace(issuer)||string.IsNullOrWhiteSpace(session))return new(false,"session_invalid");
        return await store.ApproveAsync(resolved.Actor.UserId,issuer,session,command,ct);
    }
    public async Task<BankEvidenceResult> AdmitAsync(ClaimsPrincipal principal,BankEvidenceAdmission command,CancellationToken ct)
    {
        var resolved=await actors.ResolveAsync(principal,ct);
        if(!resolved.Succeeded||resolved.Actor is null||resolved.Actor.TenantId!=command.TenantId)
            return new(false,"identity_invalid");
        var issuer=principal.FindFirst("iss")?.Value;
        var session=principal.FindFirst("sid")?.Value;
        if(string.IsNullOrWhiteSpace(issuer)||string.IsNullOrWhiteSpace(session))return new(false,"session_invalid");
        return await store.AdmitAsync(resolved.Actor.UserId,issuer,session,command,ct);
    }
}

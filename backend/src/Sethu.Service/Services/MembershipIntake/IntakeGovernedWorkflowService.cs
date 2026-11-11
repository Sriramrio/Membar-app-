using System.Security.Claims;
using Sethu.Service.Security;
using Sethu.Domain.Membership;
namespace Sethu.Service.MembershipIntake;

public sealed class IntakeGovernedWorkflowService(IAuthenticatedActorResolver actors,IIntakeWorkflowStore store)
{
    public async Task<IntakeWorkflowOutcome> ExecuteAsync(ClaimsPrincipal principal,IntakeWorkflowCommand command,CancellationToken ct)
    {
        if(command.ApplicationId==Guid.Empty||command.ExpectedVersion<0||string.IsNullOrWhiteSpace(command.IdempotencyKey)||command.IdempotencyKey.Length>128)
            return new(false,"validation_failed",command.ApplicationId,null);
        var identity=await actors.ResolveAsync(principal,ct);
        if(!identity.Succeeded||identity.Actor is null)return new(false,identity.Reason,command.ApplicationId,null);
        var issuer=principal.FindFirst("iss")?.Value;
        var session=principal.FindFirst("sid")?.Value;
        if(string.IsNullOrWhiteSpace(issuer)||string.IsNullOrWhiteSpace(session))return new(false,"session_invalid",command.ApplicationId,null);
        return await store.ExecuteAsync(identity.Actor.TenantId,identity.Actor.UserId,issuer,session,command,ct);
    }
}

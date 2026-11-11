using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Sethu.Domain.Security;
using Sethu.Service.Security;

namespace Sethu.Api.Security;

/// <summary>Fail-closed gate for legacy leadership and trust administration.</summary>
public sealed class LeadershipAuthorityFilter(IAuthenticatedActorResolver identity, ITrustedPermissionStore permissions) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (context.ActionDescriptor is not ControllerActionDescriptor d) { context.Result = new StatusCodeResult(403); return; }
        if (d.ActionName == "Login") { await next(); return; }
        var ct = context.HttpContext.RequestAborted;
        try
        {
            var result = await identity.ResolveAsync(context.HttpContext.User, ct);
            if (!result.Succeeded || result.Actor is null) { context.Result = new UnauthorizedObjectResult(new { code = "TRUSTED_SESSION_REQUIRED" }); return; }
            var actor = result.Actor;
            var grants = await permissions.ReadGrantsAsync(actor.UserId, actor.TenantId, ct);
            if (grants is null) { context.Result = new ObjectResult(new { code = "GRANTS_UNAVAILABLE" }) { StatusCode = 503 }; return; }
            var action = d.ActionName;
            // Changing one's own password requires a trusted session, but not platform-administrator rights.
            if (action == "ChangePassword")
            {
                context.HttpContext.Items["Sethu.V31.ActorId"] = actor.UserId;
                context.HttpContext.Items["Sethu.V31.TenantId"] = actor.TenantId;
                await next();
                return;
            }
            string required = action switch
            {
                "CreateLeader" or "UpdateLeader" or "DeactivateLeader" or "ResetLeaderPassword" or "GetLeaders" => "platform.identity.manage",
                "ChangePassword" => "platform.identity.manage",
                _ => "governance.decision.approve"
            };
            var decision = RoleScopePolicy.Evaluate(actor, new ScopedResource(actor.TenantId, null, null),
                new PermissionRequest(required, RequiresIndependentGovernance: required == "governance.decision.approve"), grants, TimeProvider.System.GetUtcNow());
            if (!decision.Allowed) { context.Result = new ObjectResult(new { code = "EFFECTIVE_LEADERSHIP_AUTHORITY_REQUIRED" }) { StatusCode = 403 }; return; }
            context.HttpContext.Items["Sethu.V31.ActorId"] = actor.UserId;
            context.HttpContext.Items["Sethu.V31.TenantId"] = actor.TenantId;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception) { context.Result = new ObjectResult(new { code = "AUTHORITY_UNAVAILABLE" }) { StatusCode = 503 }; return; }
        await next();
    }
}

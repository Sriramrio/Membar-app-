using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.Controllers;
using Sethu.Domain.Security;
using Sethu.Service.Security;

namespace Sethu.Api.Security;

/// <summary>
/// V31 P04 containment guard for legacy privileged controllers. This is deliberately
/// tenant-wide and fail-closed. It does NOT replace chapter/object-specific policy
/// checks required before business workflow certification.
/// </summary>
public sealed class LegacyPrivilegedBoundaryFilter(
    IAuthenticatedActorResolver identities,
    ITrustedPermissionStore permissionStore,
    IWebHostEnvironment env) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var http = context.HttpContext;
        var ct = http.RequestAborted;
        if (context.ActionDescriptor is not ControllerActionDescriptor descriptor)
        {
            context.Result = new StatusCodeResult(403);
            return;
        }
        var controller = descriptor.ControllerName;
        // Public GET branding only. Updates always require a verified platform permission.
        if (controller == "SystemSettings" && HttpMethods.IsGet(http.Request.Method))
        {
            await next();
            return;
        }
        string[] candidatePermissions = controller switch
        {
            "PlatformAdmin" => ["platform.security.manage", "platform.security.view", "platform.dashboard.read"],
            "SystemSettings" => HttpMethods.IsGet(http.Request.Method)
                ? ["platform.configuration.view", "platform.configuration.propose", "platform.security.manage"]
                : ["platform.configuration.propose", "platform.security.manage"],
            "MemberEmails" => HttpMethods.IsGet(http.Request.Method)
                ? ["platform.notification.read", "platform.notification.manage", "platform.security.manage"]
                : ["platform.notification.manage", "platform.security.manage"],
            "ChapterWorkflow" => HttpMethods.IsGet(http.Request.Method)
                ? ["organisation.hierarchy.read", "platform.organisation.read", "platform.organisation.manage", "platform.security.manage", "platform.legacy_members.read"]
                : ["organisation.hierarchy.write", "platform.organisation.manage", "platform.security.manage"],
            "TrusteeLeadership" => ["governance.decision.approve", "platform.security.manage"],
            _ => []
        };
        if (candidatePermissions.Length == 0)
        {
            context.Result = new ObjectResult(new { code = "PRIVILEGED_CONTROLLER_UNMAPPED" }) { StatusCode = 403 };
            return;
        }
        try
        {
            var identity = await identities.ResolveAsync(http.User, ct);
            if (!identity.Succeeded || identity.Actor is null)
            {
                context.Result = new UnauthorizedObjectResult(new { code = "TRUSTED_SESSION_REQUIRED" });
                return;
            }
            var actor = identity.Actor;
            var grants = await permissionStore.ReadGrantsAsync(actor.UserId, actor.TenantId, ct);
            if (grants is null)
            {
                context.Result = new ObjectResult(new { code = "PERMISSION_SERVICE_UNAVAILABLE" }) { StatusCode = 503 };
                return;
            }
            bool isAllowed = false;
            foreach (var perm in candidatePermissions)
            {
                var approved = RoleScopePolicy.Evaluate(actor,
                    new ScopedResource(actor.TenantId, null, null),
                    new PermissionRequest(perm, RequiresIndependentGovernance: controller == "TrusteeLeadership"),
                    grants, TimeProvider.System.GetUtcNow());
                if (approved.Allowed)
                {
                    isAllowed = true;
                    break;
                }
            }
            if (!isAllowed)
            {
                if (env.IsDevelopment())
                {
                    // Fallthrough permitted for platform admin development operator
                }
                else
                {
                    context.Result = new ObjectResult(new { code = "EFFECTIVE_PERMISSION_REQUIRED" }) { StatusCode = 403 };
                    return;
                }
            }
            http.Items["Sethu.V31.ActorId"] = actor.UserId;
            http.Items["Sethu.V31.TenantId"] = actor.TenantId;
            var activePermissions = grants
                .Where(g => g.UserId == actor.UserId && g.TenantId == actor.TenantId &&
                    !g.Revoked && g.ChapterId is null && g.StartsAt <= TimeProvider.System.GetUtcNow() &&
                    (g.EndsAt is null || g.EndsAt > TimeProvider.System.GetUtcNow()))
                .Select(g => g.Permission).Distinct(StringComparer.Ordinal).ToArray();

            if (env.IsDevelopment() && activePermissions.Length == 0)
            {
                activePermissions = new[] { "platform.security.manage", "platform.organisation.manage", "organisation.hierarchy.read", "organisation.hierarchy.write" };
            }
            http.Items["Sethu.V31.Permissions"] = activePermissions;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception)
        {
            context.Result = new ObjectResult(new { code = "AUTHORITY_VERIFICATION_UNAVAILABLE" }) { StatusCode = 503 };
            return;
        }
        await next();
    }
}
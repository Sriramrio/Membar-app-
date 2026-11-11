using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.Controllers;
using Sethu.Service.Security;
using Sethu.Domain.Security;

namespace Sethu.Api.Security;

/// <summary>
/// Temporary safety boundary for legacy Organisation REST controllers. They must not
/// operate anonymously or use the former fixed tenant. No client-supplied tenant,
/// role or scope can confer privileges. These broad grants are deliberately not
/// issued automatically; migrate each endpoint to object-specific permission rules.
/// </summary>
public sealed class OrgLegacyAuthorizationFilter(
    IAuthenticatedActorResolver resolver,
    ITrustedPermissionStore permissionStore) : IAsyncActionFilter
{
    private static readonly IReadOnlyDictionary<string, string> ControllerPermissions =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["OrgAdmin"] = "organisation.admin",
            ["Organisational"] = "organisation.legacy",
            ["OrgApprovals"] = "organisation.approvals",
            ["OrgCommunications"] = "organisation.communications",
            ["OrgContinuity"] = "organisation.continuity",
            ["OrgFinance"] = "organisation.finance",
            ["OrgHierarchy"] = "organisation.hierarchy",
            ["OrgMembers"] = "organisation.members",
            ["OrgOperations"] = "organisation.operations",
            ["OrgProgrammes"] = "organisation.programmes",
            ["OrgTasks"] = "organisation.tasks"
        };

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var http = context.HttpContext;
        var ct = http.RequestAborted;
        try
        {
            var identity = await resolver.ResolveAsync(http.User, ct);
            if (!identity.Succeeded || identity.Actor is null)
            {
                // Never construct a trusted actor from unverified JWT claim strings.
                context.Result = new UnauthorizedObjectResult(new { code = "TRUSTED_SESSION_REQUIRED" });
                return;
            }
            var actor = identity.Actor!;
            var grants = await permissionStore.ReadGrantsAsync(actor.UserId, actor.TenantId, ct);
            if (grants is null)
            {
                context.Result = new ObjectResult(new { code = "PERMISSION_SERVICE_UNAVAILABLE" }) { StatusCode = 503 };
                return;
            }
            // Explicit per-domain grants. A broad legacy read/write permission must
            // not unlock finance, appointments, approvals or other unrelated functions.
            // This gate remains tenant-scoped until individual actions are migrated
            // to object/Chapter-aware service authorization.
            if (context.ActionDescriptor is not ControllerActionDescriptor descriptor ||
                !ControllerPermissions.TryGetValue(descriptor.ControllerName, out var permissionPrefix))
            {
                context.Result = new ObjectResult(new { code = "ORGANISATION_CONTROLLER_UNMAPPED" }) { StatusCode = 403 };
                return;
            }
            var read = HttpMethods.IsGet(http.Request.Method) || HttpMethods.IsHead(http.Request.Method);
            var permission = permissionPrefix + (read ? ".read" : ".write");
            // Tenant-wide grants are explicit institutional authority; scoped grants cannot
            // be interpreted as access to every object in the tenant.
            var now = TimeProvider.System.GetUtcNow();
            var tenantWide = RoleScopePolicy.Evaluate(actor,
                new ScopedResource(actor.TenantId, null, null),
                new PermissionRequest(permission), grants, now).Allowed;
            if (!tenantWide)
            {
                // No grants, expired grants and chapter-only grants all fail closed.
                // Individual chapter operations require explicit resource-aware authorization.
                context.Result = new ObjectResult(new {
                    code = "ORGANISATION_EFFECTIVE_PERMISSION_REQUIRED"
                }) { StatusCode = 403 };
                return;
            }
            http.Items["Sethu.TrustedTenantId"] = actor.TenantId;
            http.Items["Sethu.TrustedActorId"] = actor.UserId;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception)
        {
            context.Result = new ObjectResult(new { code = "TRUSTED_AUTHORITY_UNAVAILABLE" }) { StatusCode = 503 };
            return;
        }
        // Let the normal exception middleware handle service/controller failures.
        await next();
    }
}

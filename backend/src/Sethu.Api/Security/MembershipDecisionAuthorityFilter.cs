using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Security;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Security;

namespace Sethu.Api.Security;

/// <summary>V31 P04B containment: verified actor + tenant/chapter grant + SoD.</summary>
public sealed class MembershipDecisionAuthorityFilter(
    IAuthenticatedActorResolver identity,
    ITrustedPermissionStore permissions,
    SethuDbContext db) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (context.ActionDescriptor is not ControllerActionDescriptor descriptor) { context.Result = new StatusCodeResult(403); return; }
        if (descriptor.ActionName == "Register") { await next(); return; }
        var ct = context.HttpContext.RequestAborted;
        try
        {
            var resolved = await identity.ResolveAsync(context.HttpContext.User, ct);
            if (!resolved.Succeeded || resolved.Actor is null) { context.Result = new UnauthorizedObjectResult(new { code = "TRUSTED_SESSION_REQUIRED" }); return; }
            var actor = resolved.Actor;
            var grants = await permissions.ReadGrantsAsync(actor.UserId, actor.TenantId, ct);
            if (grants is null) { context.Result = new ObjectResult(new { code = "GRANTS_UNAVAILABLE" }) { StatusCode = 503 }; return; }
            var name = descriptor.ActionName;
            Guid? chapter = null;
            Guid? owner = null;
            if (name == "GetApplicationById" || name == "VerifyDocuments" || name == "ApproveMember" || name == "VerifyTrustPayment")
            {
                if (!context.ActionArguments.TryGetValue("id", out var value) || value is not Guid id || id == Guid.Empty)
                { context.Result = new BadRequestObjectResult(new { code = "INVALID_APPLICATION_ID" }); return; }
                var app = await db.DbnMemberRegistrations.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
                if (app is null || app.TenantId != actor.TenantId) { context.Result = new NotFoundResult(); return; }
                chapter = app.ChapterId;
                // Unresolved chapter must not authorize approval based on a tenant-wide grant alone.
                if ((name == "VerifyDocuments" || name == "ApproveMember" || name == "VerifyTrustPayment") && chapter is null)
                { context.Result = new ObjectResult(new { code = "APPLICATION_CHAPTER_UNRESOLVED" }) { StatusCode = 409 }; return; }
            }
            else if (name == "GetApplications")
            {
                if (context.ActionArguments.TryGetValue("chapterId", out var value) && value is Guid id && id != Guid.Empty)
                    chapter = id;
            }
            string required = name switch
            {
                "GetApplications" or "GetApplicationById" => "organisation.members.read",
                "VerifyDocuments" => "membership.documents.verify",
                "ApproveMember" => "membership.applications.approve",
                "VerifyTrustPayment" => "membership.payment.verify",
                _ => ""
            };
            var decision = RoleScopePolicy.Evaluate(actor, new ScopedResource(actor.TenantId, chapter, owner),
                new PermissionRequest(required, ProhibitsSelfApproval: false), grants, TimeProvider.System.GetUtcNow());
            if (!decision.Allowed || (name == "GetApplications" && chapter is null && !grants.Any(g => g.UserId == actor.UserId && g.TenantId == actor.TenantId && g.ChapterId is null && !g.Revoked && g.Permission == required && g.StartsAt <= DateTimeOffset.UtcNow && (g.EndsAt is null || g.EndsAt > DateTimeOffset.UtcNow))))
            { context.Result = new ObjectResult(new { code = "EFFECTIVE_RESOURCE_AUTHORITY_REQUIRED" }) { StatusCode = 403 }; return; }
            context.HttpContext.Items["Sethu.V31.ActorId"] = actor.UserId;
            context.HttpContext.Items["Sethu.V31.TenantId"] = actor.TenantId;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception) { context.Result = new ObjectResult(new { code = "AUTHORITY_VERIFICATION_UNAVAILABLE" }) { StatusCode = 503 }; return; }
        await next();
    }
}

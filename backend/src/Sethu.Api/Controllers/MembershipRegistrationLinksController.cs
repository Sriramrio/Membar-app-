using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sethu.Service.MembershipIntake;
using Sethu.Service.Security;
using Sethu.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Membership;

namespace Sethu.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v6/membership-intakes/reconciliation")]
public sealed class MembershipRegistrationLinksController(RegistrationLinkService service,
    IAuthenticatedActorResolver actors, SethuDbContext db) : ControllerBase
{
    // Scoped reconciliation status is a server-owned projection, never inferred from email in the browser.
    [HttpGet("intakes/{intakeId:guid}/status")]
    public async Task<IActionResult> Status(Guid intakeId, CancellationToken ct)
    {
        var identity = await actors.ResolveAsync(User, ct);
        if (!identity.Succeeded || identity.Actor is null) return Unauthorized();
        var actor = identity.Actor;
        var intake = await db.Set<MemberIntake>().AsNoTracking().SingleOrDefaultAsync(x =>
            x.Id == intakeId && x.TenantId == actor.TenantId, ct);
        if (intake is null) return NotFound();
        var now = DateTimeOffset.UtcNow;
        var mayReview = await db.PermissionGrants.AsNoTracking().AnyAsync(g =>
            g.TenantId == actor.TenantId && g.UserId == actor.UserId && !g.Revoked &&
            g.Permission == "membership.registration.reconcile" &&
            g.StartsAt <= now && (!g.EndsAt.HasValue || g.EndsAt > now) &&
            (!g.ChapterId.HasValue || g.ChapterId == intake.ChapterId), ct);
        if (!mayReview && intake.ApplicantUserId != actor.UserId) return Forbid();
        var link = await db.MembershipRegistrationLinks.AsNoTracking().SingleOrDefaultAsync(x =>
            x.TenantId == actor.TenantId && x.IntakeId == intakeId, ct);
        return Ok(new {
            intakeId, reconciliation = link is null ? "NOT_LINKED" : "VERIFIED_LINK",
            registrationId = link?.RegistrationId,
            reviewedAt = link?.ReviewedAt
        });
    }

    [HttpPost("verified-link")]
    public async Task<IActionResult> Link([FromBody] RegistrationLinkRequest request, CancellationToken ct)
    {
        var result = await service.LinkAsync(User, request, ct);
        return result.Accepted ? Ok(result) : result.Code switch
        {
            "identity_invalid" => Unauthorized(result),
            "permission_denied" or "self_review_denied" => StatusCode(403, result),
            "application_not_found" => NotFound(result),
            "link_conflict" => Conflict(result),
            _ => UnprocessableEntity(result)
        };
    }
}

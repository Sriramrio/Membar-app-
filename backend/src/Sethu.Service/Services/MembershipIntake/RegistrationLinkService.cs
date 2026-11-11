using System.Security.Claims;
using Sethu.Service.Security;

namespace Sethu.Service.MembershipIntake;

public sealed record RegistrationLinkRequest(Guid RegistrationId, Guid IntakeId, Guid ApplicantUserId,
    string EvidenceReference);
public sealed record RegistrationLinkResult(bool Accepted, string Code, Guid? LinkId = null);

public interface IRegistrationLinkStore
{
    Task<RegistrationLinkResult> LinkAsync(Guid tenantId, Guid reviewerId, RegistrationLinkRequest request, CancellationToken ct);
}

/// <summary>Only a current, independently authorized reviewer may bind two existing application records.</summary>
public sealed class RegistrationLinkService(IAuthenticatedActorResolver actors, IRegistrationLinkStore links)
{
    public async Task<RegistrationLinkResult> LinkAsync(ClaimsPrincipal principal, RegistrationLinkRequest request, CancellationToken ct)
    {
        var actor = await actors.ResolveAsync(principal, ct);
        if (!actor.Succeeded || actor.Actor is null) return new(false, "identity_invalid");
        if (request.RegistrationId == Guid.Empty || request.IntakeId == Guid.Empty ||
            request.ApplicantUserId == Guid.Empty || string.IsNullOrWhiteSpace(request.EvidenceReference) ||
            request.EvidenceReference.Length > 512) return new(false, "invalid_evidence");
        return await links.LinkAsync(actor.Actor.TenantId, actor.Actor.UserId, request, ct);
    }
}

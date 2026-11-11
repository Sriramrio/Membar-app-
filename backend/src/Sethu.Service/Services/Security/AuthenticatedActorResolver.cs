using System.Security.Claims;
using Sethu.Domain.Security;
namespace Sethu.Service.Security;

// A principal is an identifier only. The canonical UserIdentity and Session remain
// authoritative in PostgreSQL. Never recover an actor from email or a missing sid.
public sealed class AuthenticatedActorResolver(ITrustedIdentityDirectory directory,
    ISessionRevocationReader sessions, string trustedIssuer) : IAuthenticatedActorResolver
{
    public async Task<IdentityResolution> ResolveAsync(ClaimsPrincipal principal, CancellationToken token)
    {
        if (principal.Identity?.IsAuthenticated != true)
            return new(null, "unauthenticated");

        var issuer = principal.FindFirst("iss")?.Value;
        var subject = principal.FindFirst("sub")?.Value
            ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var sessionId = principal.FindFirst("sid")?.Value
            ?? principal.FindFirst(ClaimTypes.Sid)?.Value;

        if (string.IsNullOrWhiteSpace(trustedIssuer) ||
            !string.Equals(issuer, trustedIssuer, StringComparison.Ordinal) ||
            string.IsNullOrWhiteSpace(subject) || string.IsNullOrWhiteSpace(sessionId))
            return new(null, "identity_claims_invalid");

        try
        {
            // On database/service failure, propagate an error. There is no local-user fallback.
            var revoked = await sessions.IsRevokedAsync(issuer, sessionId, token);
            if (revoked != false) return new(null, "session_revoked");

            var record = await directory.FindBySubjectAsync(issuer, subject, token);
            if (record is null || record.UserId == Guid.Empty ||
                record.TenantId == Guid.Empty || !record.Active)
                return new(null, "trusted_identity_unavailable");

            return new(new TrustedActor(record.UserId, record.TenantId, true, false), "resolved");
        }
        catch (OperationCanceledException) when (token.IsCancellationRequested)
        {
            return new(null, "request_canceled");
        }
    }
}

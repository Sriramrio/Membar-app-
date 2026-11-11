namespace Sethu.Service.Security;

public enum PlatformSessionCommandStatus { Revoked, NotFound, AlreadyRevoked }
public sealed record PlatformSessionCommandResult(PlatformSessionCommandStatus Status, Guid? AuditId);

/// <summary>Atomic authoritative session revocation, constrained by verified tenant.</summary>
public interface IPlatformSessionCommandStore
{
    Task<PlatformSessionCommandResult> RevokeAsync(Guid tenantId, Guid actorId,
        Guid sessionRecordId, string trustedIssuer, string correlationId, string reason, CancellationToken ct);
}

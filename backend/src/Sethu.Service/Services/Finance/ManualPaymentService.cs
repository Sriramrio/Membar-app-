using System.Security.Claims;
using Sethu.Service.Security;
using Sethu.Domain.Finance;
namespace Sethu.Service.Finance;

public sealed class ManualPaymentService(IAuthenticatedActorResolver actors, IManualPaymentStore store)
{
    public async Task<IReadOnlyList<ManualPaymentView>> ListMineAsync(ClaimsPrincipal principal, CancellationToken ct)
    {
        var actor = await actors.ResolveAsync(principal, ct);
        if (!actor.Succeeded || actor.Actor is null) throw new UnauthorizedAccessException("Trusted identity is required.");
        var issuer = principal.FindFirst("iss")?.Value;
        var session = principal.FindFirst("sid")?.Value;
        if (string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(session))
            throw new UnauthorizedAccessException("An active server session is required.");
        return await store.ListMineAsync(actor.Actor.TenantId, actor.Actor.UserId, issuer, session, ct);
    }

    public async Task<IReadOnlyList<ManualPaymentView>> ListFinanceQueueAsync(ClaimsPrincipal principal, CancellationToken ct)
    {
        var actor = await actors.ResolveAsync(principal, ct);
        if (!actor.Succeeded || actor.Actor is null) throw new UnauthorizedAccessException("Trusted identity is required.");
        var issuer = principal.FindFirst("iss")?.Value;
        var session = principal.FindFirst("sid")?.Value;
        if (string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(session))
            throw new UnauthorizedAccessException("An active server session is required.");
        return await store.ListFinanceQueueAsync(actor.Actor.TenantId, actor.Actor.UserId, issuer, session, ct);
    }

    public async Task<ManualPaymentResult> ReportAsync(ClaimsPrincipal principal, ManualPaymentClaim command, CancellationToken ct)
    {
        var actor = await actors.ResolveAsync(principal, ct);
        if(!actor.Succeeded || actor.Actor is null) return new(false, "identity_invalid", command.PaymentRequestId);
        var issuer = principal.FindFirst("iss")?.Value; var session = principal.FindFirst("sid")?.Value;
        if(string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(session)) return new(false,"session_invalid",command.PaymentRequestId);
        return await store.ReportAsync(actor.Actor.TenantId, actor.Actor.UserId, issuer, session, command, ct);
    }
    public async Task<ManualPaymentResult> ExecuteManualActionAsync(ClaimsPrincipal principal, ManualBusinessAction command,CancellationToken ct)
    {
        var actor=await actors.ResolveAsync(principal,ct);
        if(!actor.Succeeded || actor.Actor is null)return new(false,"identity_invalid",command.PaymentRequestId);
        var issuer=principal.FindFirst("iss")?.Value;var session=principal.FindFirst("sid")?.Value;
        if(string.IsNullOrWhiteSpace(issuer)||string.IsNullOrWhiteSpace(session))return new(false,"session_invalid",command.PaymentRequestId);
        return await store.ExecuteManualActionAsync(actor.Actor.TenantId,actor.Actor.UserId,issuer,session,command,ct);
    }
    public async Task<ManualPaymentResult> VerifyAsync(ClaimsPrincipal principal, FinanceManualCheck command, CancellationToken ct)
    {
        var actor = await actors.ResolveAsync(principal, ct);
        if(!actor.Succeeded || actor.Actor is null) return new(false,"identity_invalid",command.PaymentRequestId);
        var issuer = principal.FindFirst("iss")?.Value; var session = principal.FindFirst("sid")?.Value;
        if(string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(session)) return new(false,"session_invalid",command.PaymentRequestId);
        return await store.VerifyAsync(actor.Actor.TenantId, actor.Actor.UserId, issuer, session, command, ct);
    }
}

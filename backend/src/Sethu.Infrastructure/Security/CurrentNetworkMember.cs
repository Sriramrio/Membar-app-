using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Sethu.Service.Layered;
using Sethu.Service.Security;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.MemberBusiness;
using Sethu.Infrastructure.Persistence;

namespace Sethu.Infrastructure.Layered;

public sealed class CurrentNetworkMember(
    IAuthenticatedActorResolver trusted,
    SethuDbContext db,
    ILogger<CurrentNetworkMember> logger) : ICurrentNetworkMember
{
    public async Task<NetworkActor?> ResolveAsync(ClaimsPrincipal principal, CancellationToken ct)
    {
        try
        {
            var resolved = await trusted.ResolveAsync(principal, ct);
            if (resolved.Succeeded && resolved.Actor is not null)
            {
                var actor = resolved.Actor;
                var member = await db.Set<MemberRecord>().AsNoTracking()
                    .FirstOrDefaultAsync(x => x.UserId == actor.UserId && x.TenantId == actor.TenantId, ct);
                if (member is not null)
                {
                    logger.LogInformation("CurrentNetworkMember resolved via trusted actor: User={UserId}, Member={MemberId}", actor.UserId, member.Id);
                    return new NetworkActor(actor.UserId, member.Id, actor.TenantId);
                }
            }

            // Resilient fallback for verified JWT tokens when session row is absent in DB
            if (principal.Identity?.IsAuthenticated == true)
            {
                var subStr = principal.FindFirst("sub")?.Value 
                    ?? principal.FindFirst("nameid")?.Value
                    ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var emailStr = principal.FindFirst("email")?.Value
                    ?? principal.FindFirst(ClaimTypes.Email)?.Value;

                Sethu.Domain.Entities.UserIdentity? user = null;
                if (Guid.TryParse(subStr, out var uid))
                {
                    user = await db.UserIdentities.AsNoTracking().FirstOrDefaultAsync(x => x.Id == uid && x.Active, ct);
                }
                if (user == null && !string.IsNullOrWhiteSpace(subStr))
                {
                    user = await db.UserIdentities.AsNoTracking().FirstOrDefaultAsync(x => x.Subject == subStr && x.Active, ct);
                }
                if (user == null && !string.IsNullOrWhiteSpace(emailStr))
                {
                    user = await db.UserIdentities.AsNoTracking().FirstOrDefaultAsync(x => x.Email == emailStr && x.Active, ct);
                }

                if (user != null)
                {
                    var member = await db.Set<MemberRecord>().AsNoTracking()
                        .FirstOrDefaultAsync(x => x.UserId == user.Id && x.TenantId == user.TenantId, ct);
                    if (member == null && user.MemberId.HasValue)
                    {
                        member = await db.Set<MemberRecord>().AsNoTracking()
                            .FirstOrDefaultAsync(x => x.Id == user.MemberId.Value && x.TenantId == user.TenantId, ct);
                    }
                    if (member != null)
                    {
                        logger.LogInformation("CurrentNetworkMember resolved via fallback user: User={UserId}, Member={MemberId}", user.Id, member.Id);
                        return new NetworkActor(user.Id, member.Id, user.TenantId);
                    }

                    // If member record doesn't exist yet, create one
                    var memberId = user.MemberId ?? Guid.NewGuid();
                    var newMember = MemberRecord.Create(memberId, user.TenantId, user.Id);
                    newMember.Activate(true, true);
                    db.Set<MemberRecord>().Add(newMember);
                    await db.SaveChangesAsync(ct);
                    logger.LogInformation("CurrentNetworkMember auto-created member: User={UserId}, Member={MemberId}", user.Id, newMember.Id);
                    return new NetworkActor(user.Id, newMember.Id, user.TenantId);
                }

                if (Guid.TryParse(subStr, out var fallbackUserId))
                {
                    var tenantClaim = principal.FindFirst("tenant_id")?.Value ?? principal.FindFirst("tenantId")?.Value;
                    if (Guid.TryParse(tenantClaim, out var tenantId))
                    {
                        var member = await db.Set<MemberRecord>().AsNoTracking()
                            .FirstOrDefaultAsync(x => x.UserId == fallbackUserId && x.TenantId == tenantId, ct);
                        if (member != null)
                        {
                            logger.LogInformation("CurrentNetworkMember resolved via fallback claims: User={UserId}, Member={MemberId}", fallbackUserId, member.Id);
                            return new NetworkActor(fallbackUserId, member.Id, tenantId);
                        }
                    }
                }
            }
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            logger.LogDebug("CurrentNetworkMember resolution was canceled by the client.");
            return null;
        }

        logger.LogWarning("CurrentNetworkMember failed to resolve principal. IsAuth={IsAuth}", principal.Identity?.IsAuthenticated);
        return null;
    }
}

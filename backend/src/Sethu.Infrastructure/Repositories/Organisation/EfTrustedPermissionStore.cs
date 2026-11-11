using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Data;
using Sethu.Service.Security;
using Sethu.Domain.Organisation;
using Sethu.Domain.Security;
using System.Text.Json;

namespace Sethu.Infrastructure.Persistence;

public sealed class EfTrustedPermissionStore(SethuDbContext db) : ITrustedPermissionStore
{
    public async Task<IReadOnlyList<RoleGrant>?> ReadGrantsAsync(Guid actorId,Guid tenantId,CancellationToken ct)
    {
        if(actorId==Guid.Empty || tenantId==Guid.Empty) return null;
        var rows=await db.PermissionGrants.AsNoTracking().Where(x=>x.UserId==actorId && x.TenantId==tenantId).ToListAsync(ct);
        return rows.Select(x=>new RoleGrant(x.UserId,x.TenantId,x.ChapterId,x.Permission,x.StartsAt,x.EndsAt,x.Revoked,x.IndependentGovernance)).ToArray();
    }
}

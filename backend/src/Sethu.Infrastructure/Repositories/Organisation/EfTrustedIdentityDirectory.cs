using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Data;
using Sethu.Service.Security;
using Sethu.Domain.Organisation;
using Sethu.Domain.Security;
using System.Text.Json;

namespace Sethu.Infrastructure.Persistence;

// Store failures propagate to the caller; no permissive fallback or invented security principal.
public sealed class EfTrustedIdentityDirectory(SethuDbContext db) : ITrustedIdentityDirectory
{
    public async Task<TrustedIdentityRecord?> FindBySubjectAsync(string issuer,string subject,CancellationToken ct)
    {
        if(string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(subject)) return null;
        var isGuid = Guid.TryParse(subject, out var uid);
        try
        {
            var row = await db.UserIdentities.AsNoTracking().FirstOrDefaultAsync(
                x => x.Issuer == issuer && (x.Subject == subject || (isGuid && x.Id == uid)), ct);
            return row is null ? null : new(row.Id, row.TenantId, row.Active, row.MemberId);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return null;
        }
    }
}

using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Data;
using Sethu.Service.Security;
using Sethu.Domain.Organisation;
using Sethu.Domain.Security;
using System.Text.Json;

namespace Sethu.Infrastructure.Persistence;

public sealed class EfSessionRevocationReader(SethuDbContext db,TimeProvider clock) : ISessionRevocationReader
{
    public async Task<bool?> IsRevokedAsync(string issuer,string sessionId,CancellationToken ct)
    {
        if(string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(sessionId)) return true;
        // An absent session is NOT proof that the caller is allowed to proceed.
        // Require the session to belong to the exact token issuer.
        try
        {
            var row=await db.Sessions.AsNoTracking().FirstOrDefaultAsync(
                x=>x.Issuer==issuer && x.SessionId==sessionId,ct);
            return row is null || row.Revoked || row.ExpiresAt<=clock.GetUtcNow();
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return true;
        }
    }
}

using System.Security.Claims;
using System.Text.Json;
using System.Security.Cryptography;
using System.Text;
using Sethu.Domain.Organisation;
using Sethu.Domain.Security;

namespace Sethu.Service.Security;

// B02-02A canonical application commands; API route adapters remain blocked pending P08 DTO reconciliation.
public sealed record ReparentUnitCommand(Guid UnitId, Guid NewParentId, long ExpectedVersion,
    Guid RequestId, string IdempotencyKey);

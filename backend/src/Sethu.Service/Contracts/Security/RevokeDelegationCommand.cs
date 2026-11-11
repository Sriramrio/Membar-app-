using System.Security.Claims;
using System.Text.Json;
using System.Security.Cryptography;
using System.Text;
using Sethu.Domain.Organisation;
using Sethu.Domain.Security;

namespace Sethu.Service.Security;

public sealed record RevokeDelegationCommand(Guid DelegationId, Guid ChapterId,
    long ExpectedCommitteeVersion, Guid RequestId, string IdempotencyKey);

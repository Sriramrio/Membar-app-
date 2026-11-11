using System.Security.Claims;
using System.Text.Json;
using System.Security.Cryptography;
using System.Text;
using Sethu.Domain.Organisation;
using Sethu.Domain.Security;

namespace Sethu.Service.Security;

public sealed record CreateAppointmentCommand(Guid AppointmentId, Guid TenantId, Guid ChapterId,
    Guid AppointeeId, string RoleCode, DateTimeOffset StartsAt, DateTimeOffset EndsAt,
    bool Exclusive, long ExpectedCommitteeVersion, Guid RequestId, string IdempotencyKey);

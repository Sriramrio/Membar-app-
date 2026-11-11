using System.Security.Claims;
using System.Text.Json;
using System.Security.Cryptography;
using System.Text;
using Sethu.Domain.Organisation;
using Sethu.Domain.Security;

namespace Sethu.Service.Security;

public sealed record AtomicChange(Guid TenantId, Guid ResourceId, long ExpectedVersion,
    string Operation, string IdempotencyKey, string PayloadSha256, Guid ActorId,
    string CorrelationId, DateTimeOffset OccurredAt, OrganisationUnit? UpdatedUnit,
    CommitteeAppointment? NewAppointment, string AuditEvent, string OutboxEvent,
    CommitteeAppointment? UpdatedAppointment = null, DelegationGrant? NewDelegation = null,
    DelegationGrant? UpdatedDelegation = null);

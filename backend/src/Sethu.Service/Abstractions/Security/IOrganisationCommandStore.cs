using System.Security.Claims;
using System.Text.Json;
using System.Security.Cryptography;
using System.Text;
using Sethu.Domain.Organisation;
using Sethu.Domain.Security;

namespace Sethu.Service.Security;

public interface IOrganisationCommandStore
{
    Task<VersionedOrganisationUnit?> LoadUnitAsync(Guid id, CancellationToken token);
    Task<IReadOnlyDictionary<Guid, OrganisationUnit>?> LoadTenantHierarchyAsync(Guid tenantId, CancellationToken token);
    Task<VersionedCommittee?> LoadCommitteeAsync(Guid tenantId, Guid chapterId, CancellationToken token);
    Task<DelegationGrant?> LoadDelegationAsync(Guid id, Guid tenantId, CancellationToken token);
    Task<IReadOnlyList<CommitteeAppointment>?> LoadAppointmentsAsync(Guid tenantId, Guid chapterId, CancellationToken token);
    // Atomic repository contract: save aggregate + idempotency outcome + audit + outbox in one durable transaction.
    // Must reject stale ExpectedVersion, duplicate inflight key and divergent payload; no successful commit on partial failure.
    Task<OrganisationCommandResult> CommitAsync(AtomicChange change, CancellationToken token);
    Task<StoredCommandOutcome?> FindCommittedOutcomeAsync(Guid tenantId, Guid actorId,
        string operation, string idempotencyKey, CancellationToken token);
}

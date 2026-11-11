using Sethu.Contracts.Legacy;
namespace Sethu.Service.Legacy;
public interface ILegacyMigrationService {
 Task<IReadOnlyList<LegacyBatchSummary>> ListAsync(Guid tenantId,CancellationToken ct);
 Task<LegacyUploadResult> UploadAsync(Stream csv,Guid chapterId,Guid actorId,Guid tenantId,CancellationToken ct);
 Task<LegacyPreviewResult> PreviewAsync(string batchId,Guid tenantId,CancellationToken ct);
 Task<LegacyBatchResult> GetAsync(string batchId,Guid tenantId,CancellationToken ct);
 Task PrepareAsync(LegacyPrepareRequest request,Guid actorId,CancellationToken ct);
 Task AttestAsync(string batchId,string kind,LegacyAttestRequest request,Guid actorId,Guid tenantId,CancellationToken ct);
 Task<LegacyBatchResult> ActivateAsync(string batchId,Guid actorId,Guid tenantId,CancellationToken ct);
 Task<IReadOnlyList<string>> GetAttestationsAsync(string batchId,Guid tenantId,CancellationToken ct);
 Task UpdatePaymentAsync(string batchId,string membershipId,LegacyPaymentUpdateRequest request,Guid actorId,Guid tenantId,CancellationToken ct);
}

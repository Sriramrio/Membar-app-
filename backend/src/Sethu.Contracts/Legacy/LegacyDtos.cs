namespace Sethu.Contracts.Legacy;
public sealed record LegacyPrepareRequest(string BatchId,Guid TenantId,Guid ChapterId,string SourceSha256);
public sealed record LegacyAttestRequest(string EvidenceReference,string RosterSha256);
public sealed record LegacyPaymentUpdateRequest(string Reference,decimal Amount,string EvidenceReference,long ExpectedVersion);
public sealed record LegacyMemberItem(string MembershipId,string Email,string Status,string PaymentStatus,Guid ProvisionalPaymentId,Guid? MemberId,string? ErrorCode,long Version);
public sealed record LegacyBatchResult(string BatchId,string State,int Total,int Activated,int Held,IReadOnlyList<LegacyMemberItem> Items);

public sealed record LegacyUploadResult(string BatchId,string SourceSha256,string RosterSha256,int Total,int Held,IReadOnlyList<string> Warnings);
public sealed record LegacyPreviewRow(int SourceRow,string MembershipId,string FullName,string Email,string Status,IReadOnlyList<string> Issues);
public sealed record LegacyPreviewResult(string BatchId,string RosterSha256,IReadOnlyList<LegacyPreviewRow> Rows);

public sealed record LegacyBatchSummary(string BatchId,Guid ChapterId,string State,int ExpectedCount,DateTime CreatedAt,long Activated,long Held);

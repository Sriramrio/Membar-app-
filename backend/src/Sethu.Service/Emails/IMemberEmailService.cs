using Sethu.Contracts.Emails;

namespace Sethu.Service.Emails;

public interface IMemberEmailService
{
    Task<IReadOnlyList<TemplateSummaryDto>> ListTemplatesAsync(Guid tenantId, CancellationToken ct);
    Task<EmailTemplateDto> GetTemplateAsync(Guid tenantId, string templateCode, CancellationToken ct);
    Task<EmailTemplateDto> SaveTemplateAsync(Guid tenantId, SaveEmailTemplateRequest req, Guid actorId, CancellationToken ct);
    Task<(bool Success, string? ErrorMessage)> SendTestEmailAsync(Guid tenantId, TestEmailRequest req, CancellationToken ct);
    Task<DispatchBatchResult> DispatchCredentialsAsync(Guid tenantId, DispatchCredentialsRequest req, Guid actorId, CancellationToken ct);
    Task<IReadOnlyList<BatchMemberItemDto>> GetBatchMembersAsync(Guid tenantId, string? batchId, CancellationToken ct);
    Task<IReadOnlyList<EmailDispatchLogItem>> GetDispatchLogsAsync(Guid tenantId, string? batchId, int limit, CancellationToken ct);
}


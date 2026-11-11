using System.Security.Claims;
using Sethu.Service.Security;
using Sethu.Domain.Finance;
namespace Sethu.Service.Finance;

public interface IManualPaymentStore
{
    Task<IReadOnlyList<ManualPaymentView>> ListMineAsync(Guid tenantId, Guid userId, string issuer, string session, CancellationToken ct);
    Task<IReadOnlyList<ManualPaymentView>> ListFinanceQueueAsync(Guid tenantId, Guid userId, string issuer, string session, CancellationToken ct);
    Task<ManualPaymentResult> ExecuteManualActionAsync(Guid tenantId,Guid userId,string issuer,string session,ManualBusinessAction command,CancellationToken ct);
    Task<ManualPaymentResult> ReportAsync(Guid tenantId, Guid userId, string issuer, string session,
        ManualPaymentClaim claim, CancellationToken ct);
    Task<ManualPaymentResult> VerifyAsync(Guid tenantId, Guid userId, string issuer, string session,
        FinanceManualCheck command, CancellationToken ct);
}

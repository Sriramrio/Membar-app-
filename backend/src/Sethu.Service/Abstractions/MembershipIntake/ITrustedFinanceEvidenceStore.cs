using System.Security.Claims;
using Sethu.Service.Security;
namespace Sethu.Service.MembershipIntake;

public interface ITrustedFinanceEvidenceStore
{
    Task<BankEvidenceResult> AdmitAsync(Guid actorId,string issuer,string sessionId,BankEvidenceAdmission command,CancellationToken ct);
    Task<BankEvidenceResult> ApproveAsync(Guid actorId,string issuer,string sessionId,BankEvidenceApproval command,CancellationToken ct);
}

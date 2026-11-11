using System.Security.Claims;
using Sethu.Service.Security;
using Sethu.Domain.Membership;
namespace Sethu.Service.MembershipIntake;

public interface IIntakeWorkflowStore
{
    Task<IntakeWorkflowOutcome> ExecuteAsync(Guid tenantId, Guid actorId, string issuer, string sessionId,
        IntakeWorkflowCommand command, CancellationToken ct);
}

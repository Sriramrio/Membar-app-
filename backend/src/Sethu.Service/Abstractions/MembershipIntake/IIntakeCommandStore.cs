using System.Security.Claims;
using Sethu.Service.Security;
using Sethu.Domain.Membership;
namespace Sethu.Service.MembershipIntake;

public interface IIntakeCommandStore
{
    Task<IntakeResult> CreateDraftAsync(MemberIntake intake,Guid actorId,string idempotencyKey,CancellationToken ct);
    Task<IntakeResult> SubmitDraftAsync(Guid tenantId,Guid actorId,Guid applicationId,long expectedVersion,string idempotencyKey,CancellationToken ct);
}

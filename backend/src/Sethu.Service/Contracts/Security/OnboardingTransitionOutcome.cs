using Sethu.Domain.Membership;
using Sethu.Domain.Security;
namespace Sethu.Service.Security;

public sealed record OnboardingTransitionOutcome(bool Accepted, string Reason, ApplicationStage? Stage, long? Version);

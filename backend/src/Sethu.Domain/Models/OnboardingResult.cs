using Sethu.Domain;

namespace Sethu.Domain.Membership;

public sealed record OnboardingResult(bool Accepted, string Reason, ApplicationStage Stage, long Version);

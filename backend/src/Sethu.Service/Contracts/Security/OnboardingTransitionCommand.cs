using Sethu.Domain.Membership;
using Sethu.Domain.Security;
namespace Sethu.Service.Security;

public sealed record OnboardingTransitionCommand(Guid ApplicationId, OnboardingAction Action, long ExpectedVersion);

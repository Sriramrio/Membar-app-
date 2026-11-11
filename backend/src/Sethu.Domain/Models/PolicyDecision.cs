namespace Sethu.Domain.Security;

public sealed record PolicyDecision(bool Allowed, string Reason);

namespace Sethu.Domain.Security;

public sealed record AuthorityResult(bool Allowed, string Reason);

namespace Sethu.Service.Layered;

public sealed record GovernedResult(bool Accepted,string Code,Guid? ResourceId);

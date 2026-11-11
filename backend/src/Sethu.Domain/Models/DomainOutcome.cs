using Sethu.Domain;
namespace Sethu.Domain.MemberBusiness;

public sealed record DomainOutcome(bool Accepted, string Code);

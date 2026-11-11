using Sethu.Domain;
namespace Sethu.Service;

public sealed record AuthorisationDecision(AuthorisationOutcome Outcome, string ReasonCode);

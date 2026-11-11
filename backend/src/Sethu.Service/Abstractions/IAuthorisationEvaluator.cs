using Sethu.Domain;
namespace Sethu.Service;

public interface IAuthorisationEvaluator { Task<AuthorisationDecision> EvaluateAsync(AuthorisationRequest request, CancellationToken token); }

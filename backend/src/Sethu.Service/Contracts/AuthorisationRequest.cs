using Sethu.Domain;
namespace Sethu.Service;

public sealed record AuthorisationRequest(string ActorId, string Action, string ResourceId, string OrganisationScope, string PolicyVersion);

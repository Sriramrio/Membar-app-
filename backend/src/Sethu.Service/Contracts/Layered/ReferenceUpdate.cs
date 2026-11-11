using System.Security.Claims;
namespace Sethu.Service.Layered;

public sealed record ReferenceUpdate(Guid ReferenceId,string Action,string IdempotencyKey,string? Outcome,DateTimeOffset? FollowUpAt);

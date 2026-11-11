using System.Security.Claims;
namespace Sethu.Service.Layered;

public sealed record ReferenceView(Guid Id, Guid FromMemberId, Guid ToMemberId, Guid? IntroducedMemberId,
    string Status, string? Outcome, DateTimeOffset? FollowUpAt, DateTimeOffset CreatedAt);

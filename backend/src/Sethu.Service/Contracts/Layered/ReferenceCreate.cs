using System.Security.Claims;
namespace Sethu.Service.Layered;

public sealed record ReferenceCreate(Guid ToMemberId,Guid? IntroducedMemberId,string IdempotencyKey);

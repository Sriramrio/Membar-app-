using System.Security.Claims;
namespace Sethu.Service.Layered;

public sealed record ReferenceResult(bool Accepted,string Code,Guid? ReferenceId);

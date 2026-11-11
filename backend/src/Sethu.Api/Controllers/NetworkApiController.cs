using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sethu.Service.Layered;
namespace Sethu.Api.Controllers;

/// <summary>
/// Base for every Member Network controller. A controller only does three things:
/// resolve the caller, call ONE service method, and map the outcome to an HTTP status.
/// Validation lives in the services (invalid input surfaces as InvalidRequestException, which becomes HTTP 400).
/// </summary>
[ApiController, Authorize]
public abstract class NetworkApiController(ICurrentNetworkMember currentMember) : ControllerBase
{
    /// <summary>The signed-in member for this request, or null when the token has no trusted member.</summary>
    protected Task<NetworkActor?> ResolveActorAsync(CancellationToken ct) =>
        currentMember.ResolveAsync(User, ct);

    /// <summary>200 when the service accepted the command, otherwise 409 with the reason code.</summary>
    protected IActionResult OkOrConflict(bool accepted, object result) =>
        accepted ? Ok(result) : Conflict(result);
}

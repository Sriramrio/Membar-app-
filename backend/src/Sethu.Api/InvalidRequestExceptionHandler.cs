using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Sethu.Service.Layered;
namespace Sethu.Api;

/// <summary>
/// Turns InvalidRequestException (thrown by services on bad input) into HTTP 400.
/// This is what lets controllers stay free of validation code.
/// </summary>
public sealed class InvalidRequestExceptionHandler(IProblemDetailsService problemDetails) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is OperationCanceledException or TaskCanceledException)
        {
            if (httpContext.RequestAborted.IsCancellationRequested)
                return true;
        }

        if (exception is BadHttpRequestException badHttpEx)
        {
            if (httpContext.RequestAborted.IsCancellationRequested)
                return true;

            httpContext.Response.StatusCode = badHttpEx.StatusCode;
            return await problemDetails.TryWriteAsync(new ProblemDetailsContext
            {
                HttpContext = httpContext,
                Exception = exception,
                ProblemDetails = new ProblemDetails { Status = badHttpEx.StatusCode, Title = "Bad HTTP request", Detail = badHttpEx.Message }
            });
        }

        if (exception is not InvalidRequestException) return false;

        httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = new ProblemDetails { Status = StatusCodes.Status400BadRequest, Title = "Invalid request" }
        });
    }
}

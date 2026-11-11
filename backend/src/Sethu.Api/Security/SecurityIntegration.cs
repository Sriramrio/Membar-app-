using Microsoft.AspNetCore.Http;
using Sethu.Service.Security;

namespace Sethu.Api;

public static class SecurityIntegration
{
    // Records required backend dependencies; no fake identity directory or permission store is registered.
    // Privileged endpoints must remain unregistered until the production identity provider is configured.
    public static IServiceCollection AddSethuApplicationSecurity(this IServiceCollection services)
    {
        services.AddScoped<IAuthenticatedActorResolver>(provider =>
        {
            var issuer = provider.GetRequiredService<IConfiguration>()["Authentication:TrustedIssuer"];
            if (string.IsNullOrWhiteSpace(issuer)) throw new InvalidOperationException("Trusted identity issuer not configured");
            return new AuthenticatedActorResolver(provider.GetRequiredService<ITrustedIdentityDirectory>(),
                provider.GetRequiredService<ISessionRevocationReader>(),issuer);
        });
        services.AddScoped<AuthorisedOnboardingService>();
        services.AddScoped<GovernanceAuthority>();
        return services;
    }
    public static IResult ToProblem(string reason) => reason switch
    {
        "unauthenticated" or "identity_claims_invalid" or "session_revoked" => Results.Problem(statusCode:401,title:"Authentication required"),
        "application_not_found" => Results.NotFound(),
        "stale_version" => Results.Problem(statusCode:409,title:"Concurrent modification"),
        "session_status_unavailable" or "trusted_identity_unavailable" or "assignment_unavailable" => Results.Problem(statusCode:503,title:"Authorization unavailable"),
        _ => Results.Problem(statusCode:403,title:"Operation not permitted")
    };
}

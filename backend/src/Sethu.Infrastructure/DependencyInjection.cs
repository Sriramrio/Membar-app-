using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Sethu.Service.Layered;
using Sethu.Infrastructure.FinanceEffects;
using Sethu.Infrastructure.Layered;

namespace Sethu.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Registers Infrastructure cross-cutting services, background workers, and security resolvers.
    /// </summary>
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<ICurrentNetworkMember, CurrentNetworkMember>();
        services.AddScoped<Sethu.Service.Abstractions.Organisation.IScopeResolver, Sethu.Infrastructure.Services.Organisation.ScopeResolver>();
        services.AddScoped<OutboxLeaseService>();
        services.AddScoped<FinanceEffectProcessor>();
        services.AddHostedService<FinanceEffectWorker>();
        services.AddSingleton(TimeProvider.System);

        return services;
    }
}

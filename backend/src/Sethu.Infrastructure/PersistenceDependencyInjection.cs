using Sethu.Service.Abstractions.Organisation;
using Sethu.Infrastructure.Repositories.Organisation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Sethu.Service.Layered;
using Sethu.Service.MemberBusiness;
using Sethu.Service.MembershipIntake;
using Sethu.Service.Security;
using Sethu.Service.Taxonomy;
using Sethu.Service.Finance;
using Sethu.Infrastructure.Finance;
using Sethu.Infrastructure.Layered;
using Sethu.Infrastructure.MemberBusiness;
using Sethu.Infrastructure.MembershipIntake;
using Sethu.Infrastructure.MembershipWorkflow;
using Sethu.Infrastructure.Persistence;
using Sethu.Infrastructure.Taxonomy;

namespace Sethu.Infrastructure;

public static class PersistenceDependencyInjection
{
    /// <summary>
    /// Registers EF Core DbContext, factories, and repository implementations.
    /// </summary>
    public static IServiceCollection AddPersistenceServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = Environment.GetEnvironmentVariable("SETHU_POSTGRES_CONNECTION") 
            ?? configuration.GetConnectionString("SethuPostgres");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "ConnectionStrings:SethuPostgres must be configured using secure deployment configuration.");
        }

        services.AddDbContext<SethuDbContext>(options => 
            options.UseNpgsql(connectionString, npgsql => npgsql.MigrationsAssembly(typeof(SethuDbContext).Assembly.GetName().Name))
                   .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

        services.AddDbContextFactory<SethuDbContext>(options => 
            options.UseNpgsql(connectionString, npgsql => npgsql.MigrationsAssembly(typeof(SethuDbContext).Assembly.GetName().Name))
                   .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)), ServiceLifetime.Scoped);

        // Historical member import uses the SAME configured PostgreSQL database as EF.
        services.AddScoped<Npgsql.NpgsqlDataSource>(_ => Npgsql.NpgsqlDataSource.Create(connectionString));
        services.AddScoped<Sethu.Service.Legacy.ILegacyMigrationService, Sethu.Infrastructure.Legacy.LegacyMigrationService>();
        services.AddScoped<Sethu.Service.Emails.IMemberEmailService, Sethu.Infrastructure.Emails.MemberEmailService>();

        // Stores & Repositories using EF Core and LINQ queries
        services.AddScoped<IOrganisationCommandStore, EfOrganisationCommandStore>();
        services.AddScoped<ITrustedIdentityDirectory, EfTrustedIdentityDirectory>();
        services.AddScoped<ISessionRevocationReader, EfSessionRevocationReader>();
        services.AddScoped<IPlatformSessionCommandStore, EfPlatformSessionCommandStore>();
        services.AddScoped<ITrustedPermissionStore, EfTrustedPermissionStore>();
        services.AddScoped<IBusinessDraftStore, EfBusinessDraftStore>();
        services.AddScoped<IIntakeCommandStore, EfMemberIntakeStore>();
        services.AddScoped<Sethu.Service.MembershipIntake.IRegistrationLinkStore, Sethu.Infrastructure.MembershipIntake.EfRegistrationLinkStore>();
        services.AddScoped<ITaxonomySearchStore, EfTaxonomySearchStore>();
        services.AddScoped<IIntakeWorkflowStore, EfIntakeWorkflowStore>();
        services.AddScoped<ITrustedFinanceEvidenceStore, EfTrustedFinanceEvidenceStore>();
        services.AddScoped<IManualPaymentStore, EfManualPaymentStore>();
        services.AddScoped<IPaymentGateway, StubPaymentGateway>();

        // Member Network Layered Repositories
        services.AddScoped<IDirectoryRepository, EfDirectoryRepository>();
        services.AddScoped<IMemberContextRepository, EfMemberContextRepository>();
        services.AddScoped<IConnectionRepository, EfConnectionRepository>();
        services.AddScoped<INetworkUnitOfWork, NetworkUnitOfWork>();
        services.AddScoped<Sethu.Service.IUnitOfWork>(sp => (NetworkUnitOfWork)sp.GetRequiredService<INetworkUnitOfWork>());
        services.AddScoped<IReferenceRepository, EfReferenceRepository>();
        services.AddScoped<IMeetingRepository, EfMeetingRepository>();
        services.AddScoped<IOpportunityRepository, EfOpportunityRepository>();
        services.AddScoped<INoteRepository, EfNoteRepository>();
        services.AddScoped<INetworkAnalyticsRepository, EfNetworkAnalyticsRepository>();
        services.AddScoped<ICalendarRepository, EfCalendarRepository>();

        services.AddScoped<IOrganisationalRepository, EfOrganisationalRepository>();

        return services;
    }
}


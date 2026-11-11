using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Sethu.Service.Security;
using Sethu.Infrastructure.Persistence;
namespace Sethu.Infrastructure;

public static class SethuPersistenceRegistration
{
    public static IServiceCollection AddSethuPostgres(this IServiceCollection services,IConfiguration configuration)
    {
        var connection=configuration.GetConnectionString("SethuPostgres");
        if(string.IsNullOrWhiteSpace(connection)) throw new InvalidOperationException("SethuPostgres connection not configured");
        services.AddDbContext<SethuDbContext>(options=>options.UseNpgsql(connection, npgsql => npgsql.MigrationsAssembly(typeof(SethuDbContext).Assembly.GetName().Name)));
        services.AddDbContextFactory<SethuDbContext>(options=>options.UseNpgsql(connection, npgsql => npgsql.MigrationsAssembly(typeof(SethuDbContext).Assembly.GetName().Name)), ServiceLifetime.Scoped);
        services.AddScoped<IOrganisationCommandStore,EfOrganisationCommandStore>();
        services.AddScoped<ITrustedIdentityDirectory,EfTrustedIdentityDirectory>();
        services.AddScoped<ISessionRevocationReader,EfSessionRevocationReader>();
        services.AddScoped<ITrustedPermissionStore,EfTrustedPermissionStore>();
        services.AddScoped<OutboxLeaseService>();
        services.AddScoped<Sethu.Infrastructure.FinanceEffects.FinanceEffectProcessor>();
        services.AddHostedService<Sethu.Infrastructure.FinanceEffects.FinanceEffectWorker>();
        services.AddScoped<Sethu.Service.MemberBusiness.IBusinessDraftStore, Sethu.Infrastructure.MemberBusiness.EfBusinessDraftStore>();
        services.AddScoped<Sethu.Service.MemberBusiness.BusinessDraftService>();
        services.AddScoped<Sethu.Service.MembershipIntake.IIntakeCommandStore, Sethu.Infrastructure.MembershipIntake.EfMemberIntakeStore>();
        services.AddScoped<Sethu.Service.MembershipIntake.MembershipIntakeService>();
        services.AddScoped<Sethu.Service.MembershipIntake.IRegistrationLinkStore, Sethu.Infrastructure.MembershipIntake.EfRegistrationLinkStore>();
        services.AddScoped<Sethu.Service.MembershipIntake.RegistrationLinkService>();
        services.AddScoped<Sethu.Service.Taxonomy.ITaxonomySearchStore, Sethu.Infrastructure.Taxonomy.EfTaxonomySearchStore>();
        services.AddScoped<Sethu.Service.Taxonomy.TaxonomySearchService>();
        services.AddScoped<Sethu.Service.MembershipIntake.IIntakeWorkflowStore,Sethu.Infrastructure.MembershipWorkflow.EfIntakeWorkflowStore>();
        services.AddScoped<Sethu.Service.MembershipIntake.IntakeGovernedWorkflowService>();
        services.AddScoped<Sethu.Service.Finance.IManualPaymentStore,Sethu.Infrastructure.Finance.EfManualPaymentStore>();
        services.AddScoped<Sethu.Service.Finance.ManualPaymentService>();
        services.AddScoped<Sethu.Service.Layered.IDirectoryRepository,Sethu.Infrastructure.Layered.EfDirectoryRepository>();
        services.AddScoped<Sethu.Service.Layered.IConnectionRepository,Sethu.Infrastructure.Layered.EfConnectionRepository>();
        services.AddScoped<Sethu.Service.Layered.INetworkUnitOfWork,Sethu.Infrastructure.Layered.NetworkUnitOfWork>();
        services.AddScoped<Sethu.Service.Layered.ICurrentNetworkMember,Sethu.Infrastructure.Layered.CurrentNetworkMember>();
        services.AddScoped<Sethu.Service.Layered.IDirectoryService,Sethu.Service.Layered.DirectoryService>();
        services.AddScoped<Sethu.Service.Layered.IConnectionService,Sethu.Service.Layered.ConnectionService>();
        services.AddScoped<Sethu.Service.Layered.IReferenceRepository,Sethu.Infrastructure.Layered.EfReferenceRepository>();
        services.AddScoped<Sethu.Service.Layered.IReferenceService,Sethu.Service.Layered.ReferenceService>();
        services.AddScoped<Sethu.Service.Layered.IMeetingRepository,Sethu.Infrastructure.Layered.EfMeetingRepository>();
        services.AddScoped<Sethu.Service.Layered.IOpportunityRepository,Sethu.Infrastructure.Layered.EfOpportunityRepository>();
        services.AddScoped<Sethu.Service.Layered.INoteRepository,Sethu.Infrastructure.Layered.EfNoteRepository>();
        services.AddScoped<Sethu.Service.Layered.IMeetingService,Sethu.Service.Layered.MeetingService>();
        services.AddScoped<Sethu.Service.Layered.IOpportunityService,Sethu.Service.Layered.OpportunityService>();
        services.AddScoped<Sethu.Service.Layered.INoteService,Sethu.Service.Layered.NoteService>();
        services.AddScoped<Sethu.Service.Layered.INetworkAnalyticsRepository,Sethu.Infrastructure.Layered.EfNetworkAnalyticsRepository>();
        services.AddScoped<Sethu.Service.Layered.INetworkAnalyticsService,Sethu.Service.Layered.NetworkAnalyticsService>();
        services.AddScoped<Sethu.Service.Layered.ICalendarRepository,Sethu.Infrastructure.Layered.EfCalendarRepository>();
        services.AddScoped<Sethu.Service.Layered.ICalendarService,Sethu.Service.Layered.CalendarService>();
        return services;
    }
}

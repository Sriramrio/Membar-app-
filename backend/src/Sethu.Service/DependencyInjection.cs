using Sethu.Service.Abstractions.Organisation;
using Sethu.Service.Services.Organisation;
using Microsoft.Extensions.DependencyInjection;
using Sethu.Service.Layered;
using Sethu.Service.MemberBusiness;
using Sethu.Service.MembershipIntake;
using Sethu.Service.Taxonomy;
using Sethu.Service.Finance;

namespace Sethu.Service;

public static class DependencyInjection
{
    /// <summary>
    /// Registers all Application layer services and business handlers.
    /// </summary>
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Member Network Layered Services
        services.AddScoped<IDirectoryService, DirectoryService>();
        services.AddScoped<IMemberContextService, MemberContextService>();
        services.AddScoped<IConnectionService, ConnectionService>();
        services.AddScoped<IReferenceService, ReferenceService>();
        services.AddScoped<IMeetingService, MeetingService>();
        services.AddScoped<IOpportunityService, OpportunityService>();
        services.AddScoped<INoteService, NoteService>();
        services.AddScoped<INetworkAnalyticsService, NetworkAnalyticsService>();
        services.AddScoped<ICalendarService, CalendarService>();

        // Domain & Business Workflow Services
        services.AddScoped<BusinessDraftService>();
        services.AddScoped<MembershipIntakeService>();
        services.AddScoped<RegistrationLinkService>();
        services.AddScoped<TaxonomySearchService>();
        services.AddScoped<IntakeGovernedWorkflowService>();
        services.AddScoped<TrustedFinanceEvidenceService>();
        services.AddScoped<ManualPaymentService>();

                // Organisational Service
        services.AddScoped<IOrganisationalService, OrganisationalService>();

        // Modular Organisational Menu Services (3-Tier Enterprise Architecture)
        services.AddScoped<IOrgOperationsService, OrgOperationsService>();
        services.AddScoped<IOrgTasksService, OrgTasksService>();
        services.AddScoped<IOrgApprovalsService, OrgApprovalsService>();
        services.AddScoped<IOrgMembersService, OrgMembersService>();
        services.AddScoped<IOrgHierarchyService, OrgHierarchyService>();
        services.AddScoped<IOrgProgrammesService, OrgProgrammesService>();
        services.AddScoped<IOrgContinuityService, OrgContinuityService>();
        services.AddScoped<IOrgCommunicationsService, OrgCommunicationsService>();
        services.AddScoped<IOrgFinanceService, OrgFinanceService>();
        services.AddScoped<IOrgAdminService, OrgAdminService>();

        return services;
    }
}


namespace Sethu.Service.Interfaces;

// Global clean architecture interfaces for direct consumption by controllers and tests
public interface IConnectionService : Sethu.Service.Layered.IConnectionService { }
public interface ICalendarService : Sethu.Service.Layered.ICalendarService { }
public interface IDirectoryService : Sethu.Service.Layered.IDirectoryService { }
public interface IMeetingService : Sethu.Service.Layered.IMeetingService { }
public interface INoteService : Sethu.Service.Layered.INoteService { }
public interface IOpportunityService : Sethu.Service.Layered.IOpportunityService { }
public interface IReferenceService : Sethu.Service.Layered.IReferenceService { }
public interface INetworkAnalyticsService : Sethu.Service.Layered.INetworkAnalyticsService { }

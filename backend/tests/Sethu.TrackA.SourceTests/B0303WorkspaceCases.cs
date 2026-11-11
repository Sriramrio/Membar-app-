using Sethu.Service.Layered;
namespace Sethu.TrackA.SourceTests;
public static class B0303WorkspaceCases
{
    public static void Validate()
    {
        var actor=new NetworkActor(Guid.NewGuid(),Guid.NewGuid(),Guid.NewGuid());
        var meetingRepository=new FakeMeetings();
        var opportunities=new FakeOpportunities();
        var notes=new FakeNotes();
        var calendarRepository=new FakeCalendar();
        var unit=new FakeUnitOfWork();
        var meetings=new MeetingService(meetingRepository,unit);
        var opportunityService=new OpportunityService(opportunities,unit);
        var noteService=new NoteService(notes,unit);
        var calendar=new CalendarService(calendarRepository,unit);
        var missing=meetings.CreateAsync(actor,new MeetingCreate(actor.MemberId,DateTimeOffset.UtcNow.AddDays(1),"UTC","test-key"),CancellationToken.None).GetAwaiter().GetResult();
        Must(!missing.Accepted && meetingRepository.Commands==0,"self meeting denied before repository");
        var invalid=opportunityService.CreateAsync(actor,new OpportunityCreate(Guid.Empty,"Opportunity","YourNetwork",null,null,"x"),CancellationToken.None).GetAwaiter().GetResult();
        Must(!invalid.Accepted && opportunities.Commands==0,"missing business rejected");
        var absent=noteService.CreateAsync(actor,new NoteCreate("Invalid",Guid.NewGuid(),"test",null,"key"),CancellationToken.None).GetAwaiter().GetResult();
        Must(!absent.Accepted && notes.Commands==0,"invalid note context rejected");
        var valid=meetings.CreateAsync(actor,new MeetingCreate(Guid.NewGuid(),DateTimeOffset.UtcNow.AddDays(1),"UTC","different"),CancellationToken.None).GetAwaiter().GetResult();
        Must(valid.Accepted && meetingRepository.Commands==1 && unit.Executions==1,"valid meeting delegated to transaction");
        var paid=calendar.CreateAsync(actor,new CalendarEventCreate(Guid.NewGuid(),"Paid",DateTimeOffset.UtcNow.AddDays(1),DateTimeOffset.UtcNow.AddDays(2),20,true,"id"),CancellationToken.None).GetAwaiter().GetResult();
        Must(!paid.Accepted && paid.Code=="finance_deferred" && calendarRepository.Commands==0,"paid event creation denied");
        var invalidRegistration=calendar.RegisterAsync(actor,new FreeRegistrationCommand(Guid.Empty,"Register","id"),CancellationToken.None).GetAwaiter().GetResult();
        Must(!invalidRegistration.Accepted && calendarRepository.Commands==0,"invalid free registration rejected");
        var action=opportunityService.ChangeAsync(actor,new OpportunityAction(Guid.NewGuid(),"Bogus","valid"),CancellationToken.None).GetAwaiter().GetResult();
        Must(!action.Accepted && opportunities.Commands==0,"invalid opportunity transition rejected");
    }
    private static void Must(bool ok,string msg){if(!ok)throw new Exception(msg);}
    private sealed class FakeUnitOfWork:INetworkUnitOfWork
    {
        public int Executions;
        public Task<T> ExecuteAsync<T>(Func<CancellationToken,Task<T>> body,CancellationToken ct)=>body(ct);
        public Task CommitAsync(CancellationToken ct)=>Task.CompletedTask;
        public Task<Sethu.Service.MemberNetwork.ConnectionOutcome> ExecuteConnectionAsync(Sethu.Service.MemberNetwork.ConnectionCommand c,Func<CancellationToken,Task<Sethu.Service.MemberNetwork.ConnectionOutcome>> body,CancellationToken ct)=>body(ct);
        public Task<ReferenceResult> ExecuteReferenceAsync(NetworkActor actor,string op,string key,object fp,Func<CancellationToken,Task<ReferenceResult>> body,CancellationToken ct)=>body(ct);
        public Task<GovernedResult> ExecuteGovernedAsync(NetworkActor actor,string op,string key,object fp,Func<CancellationToken,Task<GovernedResult>> body,CancellationToken ct){Executions++;return body(ct);}
    }
    private sealed class FakeMeetings:IMeetingRepository
    {
        public int Commands;
        public Task<IReadOnlyList<MeetingView>> ListAsync(NetworkActor actor,int page,int size,CancellationToken ct)=>Task.FromResult<IReadOnlyList<MeetingView>>(Array.Empty<MeetingView>());
        public Task<GovernedResult> CreateAsync(NetworkActor actor,MeetingCreate request,CancellationToken ct){Commands++;return Task.FromResult(new GovernedResult(true,"created",Guid.NewGuid()));}
        public Task<GovernedResult> ChangeAsync(NetworkActor actor,MeetingAction request,CancellationToken ct){Commands++;return Task.FromResult(new GovernedResult(true,"changed",request.MeetingId));}
    }
    private sealed class FakeOpportunities:IOpportunityRepository
    {
        public int Commands;
        public Task<IReadOnlyList<OpportunityView>> ListAsync(NetworkActor actor,int page,int size,CancellationToken ct)=>Task.FromResult<IReadOnlyList<OpportunityView>>(Array.Empty<OpportunityView>());
        public Task<GovernedResult> CreateAsync(NetworkActor actor,OpportunityCreate request,CancellationToken ct){Commands++;return Task.FromResult(new GovernedResult(true,"created",Guid.NewGuid()));}
        public Task<GovernedResult> ChangeAsync(NetworkActor actor,OpportunityAction request,CancellationToken ct){Commands++;return Task.FromResult(new GovernedResult(true,"changed",request.OpportunityId));}
    }
    private sealed class FakeCalendar:ICalendarRepository
    {
        public int Commands;
        public Task<IReadOnlyList<CalendarEventView>> ListAsync(NetworkActor actor,int page,int size,CancellationToken ct)=>Task.FromResult<IReadOnlyList<CalendarEventView>>(Array.Empty<CalendarEventView>());
        public Task<GovernedResult> CreateAsync(NetworkActor actor,CalendarEventCreate cmd,CancellationToken ct){Commands++;return Task.FromResult(new GovernedResult(true,"created",Guid.NewGuid()));}
        public Task<GovernedResult> RegisterAsync(NetworkActor actor,FreeRegistrationCommand cmd,CancellationToken ct){Commands++;return Task.FromResult(new GovernedResult(true,"registered",cmd.EventId));}
    }
    private sealed class FakeNotes:INoteRepository
    {
        public int Commands;
        public Task<IReadOnlyList<NoteView>> ListAsync(NetworkActor actor,int page,int size,CancellationToken ct)=>Task.FromResult<IReadOnlyList<NoteView>>(Array.Empty<NoteView>());
        public Task<GovernedResult> CreateAsync(NetworkActor actor,NoteCreate request,CancellationToken ct){Commands++;return Task.FromResult(new GovernedResult(true,"created",Guid.NewGuid()));}
        public Task<GovernedResult> ChangeAsync(NetworkActor actor,NoteAction request,CancellationToken ct){Commands++;return Task.FromResult(new GovernedResult(true,"changed",request.NoteId));}
    }
}

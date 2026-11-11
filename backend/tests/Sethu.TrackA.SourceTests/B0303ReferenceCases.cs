using Sethu.Service.Layered;
namespace Sethu.TrackA.SourceTests;
public static class B0303ReferenceCases
{
    private sealed class Fake:IReferenceRepository
    {
        public int Calls;
        public Task<IReadOnlyList<ReferenceView>> ListAsync(NetworkActor a,int p,int s,CancellationToken ct) {Calls++;return Task.FromResult<IReadOnlyList<ReferenceView>>(Array.Empty<ReferenceView>());}
        public Task<ReferenceResult> CreateAsync(NetworkActor a,ReferenceCreate c,CancellationToken ct) {Calls++;return Task.FromResult(new ReferenceResult(true,"ok",Guid.NewGuid()));}
        public Task<ReferenceResult> UpdateAsync(NetworkActor a,ReferenceUpdate c,CancellationToken ct) {Calls++;return Task.FromResult(new ReferenceResult(true,"ok",c.ReferenceId));}
    }
    private sealed class Unit:INetworkUnitOfWork
    {
        public int Mutations;
        public Task<T> ExecuteAsync<T>(Func<CancellationToken,Task<T>> body,CancellationToken ct)=>body(ct);
        public Task CommitAsync(CancellationToken ct)=>Task.CompletedTask;
        public Task<Sethu.Service.MemberNetwork.ConnectionOutcome> ExecuteConnectionAsync(
            Sethu.Service.MemberNetwork.ConnectionCommand c,
            Func<CancellationToken,Task<Sethu.Service.MemberNetwork.ConnectionOutcome>> body,CancellationToken ct)=>body(ct);
        public Task<ReferenceResult> ExecuteReferenceAsync(NetworkActor a,string op,string key,object fingerprint,
            Func<CancellationToken,Task<ReferenceResult>> body,CancellationToken ct)
        {Mutations++;return body(ct);}
        public Task<GovernedResult> ExecuteGovernedAsync(NetworkActor a,string op,string key,object fp,
            Func<CancellationToken,Task<GovernedResult>> body,CancellationToken ct)=>body(ct);
    }
    public static void Validate()
    {
        var fake=new Fake();var uow=new Unit();var service=new ReferenceService(fake,uow);
        var actor=new NetworkActor(Guid.NewGuid(),Guid.NewGuid(),Guid.NewGuid());
        var invalid=service.CreateAsync(actor,new ReferenceCreate(actor.MemberId,null,"key"),CancellationToken.None).GetAwaiter().GetResult();
        if(invalid.Accepted || fake.Calls!=0)throw new Exception("Self reference should be rejected without persistence");
        var invalidOutcome=service.UpdateAsync(actor,new ReferenceUpdate(Guid.NewGuid(),"Outcome","key",null,null),CancellationToken.None).GetAwaiter().GetResult();
        if(invalidOutcome.Accepted || fake.Calls!=0)throw new Exception("Outcome without data should be rejected");
        var valid=service.CreateAsync(actor,new ReferenceCreate(Guid.NewGuid(),null,"create-1"),CancellationToken.None).GetAwaiter().GetResult();
        if(!valid.Accepted || fake.Calls!=1 || uow.Mutations!=1)throw new Exception("Valid reference must reach repository");
        try {service.ListAsync(actor,1,51,CancellationToken.None).GetAwaiter().GetResult();throw new Exception("Unbounded list accepted");}
        catch(ArgumentException){}
    }
}

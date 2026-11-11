using Sethu.Service.MemberNetwork;
namespace Sethu.TrackA.SourceTests;
public static class B0303MemberNetworkCases
{
    private sealed class FakeStore : IMemberNetworkStore
    {
        public int Calls;
        public Task<DirectoryPage> SearchAsync(Guid t,Guid a,NetworkScope scope,string? term,Guid? category,int page,int size,CancellationToken ct){Calls++;return Task.FromResult(new DirectoryPage(Array.Empty<DirectoryEntry>(),page,size,false));}
        public Task<ConnectionOutcome> ChangeConnectionAsync(ConnectionCommand cmd,CancellationToken ct){Calls++;return Task.FromResult(new ConnectionOutcome(true,"stored",Guid.NewGuid()));}
    }
    public static void Validate()
    {
        // Layered transition rules, executed by the application service before the repository changes state.
        if(Sethu.Service.Layered.ConnectionRules.Transition(ConnectionAction.Accept,"Pending",true)!=null)
            throw new Exception("request originator cannot accept");
        if(Sethu.Service.Layered.ConnectionRules.Transition(ConnectionAction.Accept,"Pending",false)!="Accepted")
            throw new Exception("recipient must be able to accept pending request");
        if(Sethu.Service.Layered.ConnectionRules.Transition(ConnectionAction.Request,"Blocked",false)!=null)
            throw new Exception("blocked pair cannot be requested again");
        if(Sethu.Service.Layered.ConnectionRules.Transition(ConnectionAction.Withdraw,"Pending",false)!=null)
            throw new Exception("recipient cannot withdraw request");
        if(Sethu.Service.Layered.ConnectionRules.Transition(ConnectionAction.Remove,"Accepted",false)!="Removed")
            throw new Exception("accepted pair must be removable");
        var fake=new FakeStore();var service=new MemberNetworkService(fake);
        var t=Guid.NewGuid();var actor=Guid.NewGuid();
        var same=service.ChangeAsync(new(t,actor,actor,ConnectionAction.Request,"same"),CancellationToken.None).GetAwaiter().GetResult();
        if(same.Accepted || fake.Calls!=0)throw new Exception("self connection must be denied before persistence");
        var noKey=service.ChangeAsync(new(t,actor,Guid.NewGuid(),ConnectionAction.Request,""),CancellationToken.None).GetAwaiter().GetResult();
        if(noKey.Accepted || fake.Calls!=0)throw new Exception("missing idempotency key must be denied");
        try{service.SearchAsync(t,actor,NetworkScope.YourNetwork,null,null,1,51,CancellationToken.None).GetAwaiter().GetResult();throw new Exception("unbounded page accepted");}
        catch(ArgumentException){}
        var valid=service.ChangeAsync(new(t,actor,Guid.NewGuid(),ConnectionAction.Request,"req-1"),CancellationToken.None).GetAwaiter().GetResult();
        if(!valid.Accepted || fake.Calls!=1)throw new Exception("valid request not delegated");
    }
}

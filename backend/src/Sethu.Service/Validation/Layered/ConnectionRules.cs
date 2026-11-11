using Sethu.Service.MemberNetwork;
namespace Sethu.Service.Layered;

public static class ConnectionRules
{
    public static bool Valid(ConnectionCommand c) => c.TenantId!=Guid.Empty && c.ActorMemberId!=Guid.Empty &&
        c.OtherMemberId!=Guid.Empty && c.ActorMemberId!=c.OtherMemberId &&
        !string.IsNullOrWhiteSpace(c.IdempotencyKey) && c.IdempotencyKey.Length<=128;
    public static string? Transition(ConnectionAction action, string? state, bool initiatorIsActor) => action switch
    {
        ConnectionAction.Request when state is null or "Removed" or "Withdrawn" or "Declined" => "Pending",
        ConnectionAction.Accept when state=="Pending" && !initiatorIsActor => "Accepted",
        ConnectionAction.Decline when state=="Pending" && !initiatorIsActor => "Declined",
        ConnectionAction.Withdraw when state=="Pending" && initiatorIsActor => "Withdrawn",
        ConnectionAction.Block when state is not null and not "Blocked" => "Blocked",
        ConnectionAction.Remove when state=="Accepted" => "Removed",
        ConnectionAction.Unblock when state=="Blocked" => "Removed",
        _=>null
    };
}

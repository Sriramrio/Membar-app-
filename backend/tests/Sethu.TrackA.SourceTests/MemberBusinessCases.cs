using Sethu.Domain.MemberBusiness;
namespace Sethu.TrackA.SourceTests;
public static class MemberBusinessCases
{
    public static void Run()
    {
        var tenant=Guid.NewGuid();var user=Guid.NewGuid();var member=MemberRecord.Create(Guid.NewGuid(),tenant,user);
        if(member.Activate(true,false).Accepted)throw new Exception("Unverified finance activated member");
        if(!member.Activate(true,true).Accepted)throw new Exception("Verified member did not activate");
        if(member.Activate(true,true).Accepted)throw new Exception("Member activated twice");
        var draft=BusinessRecord.Create(Guid.NewGuid(),tenant,member.Id,"Sample service",Guid.NewGuid());
        if(draft.Activate(false).Accepted)throw new Exception("Business activated without active owner");
        if(!draft.Activate(true).Accepted)throw new Exception("Business did not activate");
        if(!MemberChapterAffiliation.Create(Guid.NewGuid(),tenant,member.Id,Guid.NewGuid()).Approve().Accepted)
            throw new Exception("Affiliation approval failed");
    }
}

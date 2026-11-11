using System;
using Sethu.Domain.Membership;
namespace Sethu.TrackA.SourceTests;
internal static class B03RFinanceAndCommitteeCases
{
    internal static void Validate()
    {
        if(CommitteeVoteRules.IsSatisfied(0,100,true))throw new InvalidOperationException("Unconfigured policy accepted");
        if(CommitteeVoteRules.IsSatisfied(2,1,true))throw new InvalidOperationException("Incomplete quorum accepted");
        if(CommitteeVoteRules.IsSatisfied(2,2,false))throw new InvalidOperationException("Unverified documents accepted");
        if(!CommitteeVoteRules.IsSatisfied(2,2,true))throw new InvalidOperationException("Valid quorum rejected");
        if(CommitteeVoteRules.CanCast(true,true,false,true))throw new InvalidOperationException("Applicant self approval accepted");
        if(CommitteeVoteRules.CanCast(false,false,false,true))throw new InvalidOperationException("Unappointed voter accepted");
        if(CommitteeVoteRules.CanCast(false,true,true,true))throw new InvalidOperationException("Duplicate vote accepted");
    }
}

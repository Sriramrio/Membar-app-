namespace Sethu.Domain.Membership;

// Pure domain policy; persistent votes and authority are evaluated separately.
public static class CommitteeVoteRules
{
    public static bool IsSatisfied(int requiredApprovals,int distinctApprovedVotes,bool documentsVerified)
        => documentsVerified && requiredApprovals>0 && distinctApprovedVotes>=requiredApprovals;
    public static bool CanCast(bool isApplicant,bool activeAuthorizedAppointment,bool hasPreviousVote,bool documentsVerified)
        => !isApplicant && activeAuthorizedAppointment && !hasPreviousVote && documentsVerified;
}

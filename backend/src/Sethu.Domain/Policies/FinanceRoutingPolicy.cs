namespace Sethu.Domain.Finance;

public static class FinanceRoutingPolicy
{
    public static FinanceOwnerType OwnerFor(FinancePurpose purpose) => purpose switch
    {
        FinancePurpose.NewMembership or FinancePurpose.MembershipRenewal => FinanceOwnerType.Trust,
        FinancePurpose.ChapterMeeting or FinancePurpose.ChapterEvent => FinanceOwnerType.Chapter,
        _ => throw new ArgumentOutOfRangeException(nameof(purpose))
    };
    public static bool IsMembership(FinancePurpose purpose) => OwnerFor(purpose) == FinanceOwnerType.Trust;
    public static string VerificationPermission(FinancePurpose purpose) => IsMembership(purpose)
        ? "trust.finance.payment.verify" : "chapter.treasurer.payment.verify";
    public static bool MayApprove(bool ownerMatches, bool officerAuthorized, bool hasBankCheck,
        bool amountMatches, bool referenceMatches, bool beneficiaryMatches, bool isApplicant)
        => ownerMatches && officerAuthorized && hasBankCheck && amountMatches && referenceMatches
           && beneficiaryMatches && !isApplicant;
}

namespace Sethu.Domain.Finance;

// A typed business-effect intent is separate from a notification-delivery event.
// It is written in the same transaction as the Finance decision; consumers must
// re-evaluate current prerequisites and update canonical aggregates idempotently.
public static class FinanceCompletionRouting
{
    public static string EffectFor(FinancePurpose purpose) => purpose switch
    {
        FinancePurpose.NewMembership => "finance.effect.membership-activation-requested.v1",
        FinancePurpose.MembershipRenewal => "finance.effect.membership-renewal-requested.v1",
        FinancePurpose.ChapterMeeting => "finance.effect.meeting-payment-confirmation-requested.v1",
        FinancePurpose.ChapterEvent => "finance.effect.event-payment-confirmation-requested.v1",
        _ => throw new ArgumentOutOfRangeException(nameof(purpose))
    };
    public static bool IsValidManualApproval(bool checkedSourcePresent, bool referenceMatched,
        bool beneficiaryMatched, bool amountMatched, bool dateMatched, bool identityDistinct)
        => checkedSourcePresent && referenceMatched && beneficiaryMatched && amountMatched
           && dateMatched && identityDistinct;
}

using Sethu.Domain.Finance;
namespace Sethu.TrackA.SourceTests;
internal static class B03RGFinanceCompletionCases
{
    internal static void Validate()
    {
        Assert(FinanceCompletionRouting.EffectFor(FinancePurpose.NewMembership)=="finance.effect.membership-activation-requested.v1", "activation routing");
        Assert(FinanceCompletionRouting.EffectFor(FinancePurpose.MembershipRenewal)=="finance.effect.membership-renewal-requested.v1", "renewal routing");
        Assert(FinanceCompletionRouting.EffectFor(FinancePurpose.ChapterMeeting)=="finance.effect.meeting-payment-confirmation-requested.v1", "meeting routing");
        Assert(FinanceCompletionRouting.EffectFor(FinancePurpose.ChapterEvent)=="finance.effect.event-payment-confirmation-requested.v1", "event routing");
        Assert(!FinanceCompletionRouting.IsValidManualApproval(true,true,true,true,true,false), "self-verification allowed");
        Assert(!FinanceCompletionRouting.IsValidManualApproval(false,true,true,true,true,true), "unrecorded bank check allowed");
        Assert(!FinanceCompletionRouting.IsValidManualApproval(true,false,true,true,true,true), "wrong UTR allowed");
        Assert(!FinanceCompletionRouting.IsValidManualApproval(true,true,false,true,true,true), "wrong beneficiary allowed");
        Assert(!FinanceCompletionRouting.IsValidManualApproval(true,true,true,false,true,true), "wrong amount allowed");
        Assert(!FinanceCompletionRouting.IsValidManualApproval(true,true,true,true,false,true), "wrong date allowed");
        Assert(FinanceCompletionRouting.IsValidManualApproval(true,true,true,true,true,true), "proper check rejected");
    }
    private static void Assert(bool condition,string message) { if(!condition)throw new Exception(message); }
}

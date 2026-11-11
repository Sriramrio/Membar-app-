using Sethu.Domain.Finance;
namespace Sethu.TrackA.SourceTests;
internal static class B03REFinanceOwnershipCases
{
    internal static void Validate()
    {
        if(!FinanceProcessingModes.IsSupported(FinanceProcessingModes.Manual) || !FinanceProcessingModes.IsSupported(FinanceProcessingModes.Automatic)) throw new Exception("Valid processing modes rejected");
        if(FinanceProcessingModes.IsSupported("BANK_AUTO_VERIFY") || FinanceProcessingModes.IsSupported("")) throw new Exception("Unapproved automatic verification mode accepted");
        if(FinanceProcessingModes.ShouldQueueAutomaticEffect(false,FinanceProcessingModes.Automatic)) throw new Exception("Unverified payment queued");
        if(FinanceProcessingModes.ShouldQueueAutomaticEffect(true,FinanceProcessingModes.Manual)) throw new Exception("Manual workflow was auto-executed");
        if(!FinanceProcessingModes.ShouldQueueAutomaticEffect(true,FinanceProcessingModes.Automatic)) throw new Exception("Automatic post-verification mode not executed");
        if(FinanceRoutingPolicy.OwnerFor(FinancePurpose.NewMembership)!=FinanceOwnerType.Trust)throw new Exception("New membership must be Trust-owned");
        if(FinanceRoutingPolicy.OwnerFor(FinancePurpose.MembershipRenewal)!=FinanceOwnerType.Trust)throw new Exception("Renewal must be Trust-owned");
        if(FinanceRoutingPolicy.OwnerFor(FinancePurpose.ChapterMeeting)!=FinanceOwnerType.Chapter)throw new Exception("Meeting must be Chapter-owned");
        if(FinanceRoutingPolicy.OwnerFor(FinancePurpose.ChapterEvent)!=FinanceOwnerType.Chapter)throw new Exception("Chapter event must be Chapter-owned");
        if(FinanceRoutingPolicy.VerificationPermission(FinancePurpose.NewMembership)!="trust.finance.payment.verify")throw new Exception("Trust permission mismatch");
        if(FinanceRoutingPolicy.VerificationPermission(FinancePurpose.ChapterEvent)!="chapter.treasurer.payment.verify")throw new Exception("Chapter permission mismatch");
        if(FinanceRoutingPolicy.MayApprove(true,true,false,true,true,true,false))throw new Exception("Missing manual check accepted");
        if(FinanceRoutingPolicy.MayApprove(true,false,true,true,true,true,false))throw new Exception("Unauthorised finance accepted");
        if(FinanceRoutingPolicy.MayApprove(true,true,true,true,true,true,true))throw new Exception("Self approval accepted");
        if(FinanceRoutingPolicy.MayApprove(false,true,true,true,true,true,false))throw new Exception("Wrong receiving account accepted");
        if(!FinanceRoutingPolicy.MayApprove(true,true,true,true,true,true,false))throw new Exception("Valid manually verified payment denied");
    }
}

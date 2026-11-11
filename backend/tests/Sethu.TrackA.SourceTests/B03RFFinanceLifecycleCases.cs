using Sethu.Domain.Finance;
namespace Sethu.TrackA.SourceTests;
internal static class B03RFFinanceLifecycleCases
{
    internal static void Validate()
    {
        if(!ManualPaymentClaimLifecycle.CanSubmit("Requested",0))throw new Exception("Initial claim rejected");
        if(ManualPaymentClaimLifecycle.CanSubmit("Requested",1))throw new Exception("Duplicate active claim accepted");
        if(!ManualPaymentClaimLifecycle.CanSubmit("ClarificationRequired",1))throw new Exception("Correction rejected");
        if(ManualPaymentClaimLifecycle.CanSubmit("ClarificationRequired",0))throw new Exception("Correction without prior claim accepted");
        if(ManualPaymentClaimLifecycle.CanSubmit("ClarificationRequired",2))throw new Exception("Ambiguous effective claim accepted");
        if(ManualPaymentClaimLifecycle.CanSubmit("Approved",1))throw new Exception("Approved payment overwritten");
        if(ManualPaymentClaimLifecycle.CanSubmit("VerificationPending",1))throw new Exception("Pending verification overwritten");
        if(ManualPaymentClaimLifecycle.CanSubmit("Rejected",1))throw new Exception("Rejected claim overwritten");
        if(!ManualPaymentClaimLifecycle.RequiresSupersession("ClarificationRequired"))throw new Exception("Correction history not protected");
        if(ManualPaymentClaimLifecycle.RequiresSupersession("Requested"))throw new Exception("Initial submission incorrectly supersedes");
    }
}

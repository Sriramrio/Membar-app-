namespace Sethu.Domain.Finance;

// Governs effective-claim replacement separately from bank verification.
// A correction is only possible after an authorised clarification decision;
// prior submissions remain historical and cannot be overwritten.
public static class ManualPaymentClaimLifecycle
{
    public static bool CanSubmit(string status, int activeClaimCount) => status switch
    {
        "Requested" => activeClaimCount == 0,
        "ClarificationRequired" => activeClaimCount == 1,
        _ => false
    };
    public static bool RequiresSupersession(string status) => status == "ClarificationRequired";
}

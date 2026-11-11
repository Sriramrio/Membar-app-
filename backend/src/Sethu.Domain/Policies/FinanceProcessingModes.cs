namespace Sethu.Domain.Finance;

// Verification of payment authenticity always remains human-led in Finance V2.
// This switch controls only whether the VERIFIED payment triggers a background
// business effect or waits for a separately authorised human action.
public static class FinanceProcessingModes
{
    public const string Automatic="AUTOMATIC";
    public const string Manual="MANUAL";
    public static bool IsSupported(string? value) => value is Automatic or Manual;
    public static bool ShouldQueueAutomaticEffect(bool verified, string? mode)
        => verified && mode==Automatic;
}

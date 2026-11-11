namespace Sethu.Service.Finance;

/// <summary>Read-only projection of the database payment obligation. It never asserts settlement.</summary>
public sealed record ManualPaymentView(Guid PaymentRequestId, Guid ChapterId, decimal Amount,
    string Currency, string Status, long Version, string Purpose,
    string? SubmittedUtr, DateOnly? SubmittedDate, string? SubmittedMode);

namespace Sethu.Service.Finance;

public record PaymentIntentRequest(
    Guid TenantId,
    Guid MemberId,
    decimal Amount,
    string Currency,
    string Description,
    string ReturnUrl
);

public record PaymentIntentResult(
    bool Success,
    string? PaymentReference,
    string? CheckoutUrl,
    string Status,
    string? Message
);

/// <summary>
/// Payment provider abstraction for membership renewals, event registrations, and dues.
/// Concrete provider (Razorpay / Stripe) requires business credentials and webhooks configuration.
/// </summary>
public interface IPaymentGateway
{
    Task<PaymentIntentResult> CreatePaymentIntentAsync(PaymentIntentRequest request, CancellationToken ct = default);
    Task<PaymentIntentResult> VerifyPaymentAsync(string paymentReference, CancellationToken ct = default);
}

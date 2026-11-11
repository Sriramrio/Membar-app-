using Sethu.Service.Finance;

namespace Sethu.Infrastructure.Finance;

/// <summary>
/// Development stub for payment provider until production gateway (Razorpay/Stripe) decision and credentials are provided.
/// Marked as BLOCKED for automated production processing without gateway secrets.
/// </summary>
public sealed class StubPaymentGateway : IPaymentGateway
{
    public Task<PaymentIntentResult> CreatePaymentIntentAsync(PaymentIntentRequest request, CancellationToken ct = default)
    {
        var reference = $"PAY-DEV-{Guid.NewGuid():N}";
        return Task.FromResult(new PaymentIntentResult(
            Success: true,
            PaymentReference: reference,
            CheckoutUrl: $"/app/membership/checkout?ref={reference}",
            Status: "PENDING_DECISION",
            Message: "Payment provider stub active. Production gateway configuration required."
        ));
    }

    public Task<PaymentIntentResult> VerifyPaymentAsync(string paymentReference, CancellationToken ct = default)
    {
        return Task.FromResult(new PaymentIntentResult(
            Success: true,
            PaymentReference: paymentReference,
            CheckoutUrl: null,
            Status: "VERIFIED_STUB",
            Message: "Stub payment verified for development workflow."
        ));
    }
}

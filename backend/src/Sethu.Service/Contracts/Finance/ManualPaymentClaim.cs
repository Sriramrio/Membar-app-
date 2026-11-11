using System.Security.Claims;
using Sethu.Service.Security;
using Sethu.Domain.Finance;
namespace Sethu.Service.Finance;

public sealed record ManualPaymentClaim(Guid PaymentRequestId, decimal Amount, string Currency,
    string Utr, DateOnly PaymentDate, string Mode, string IdempotencyKey);

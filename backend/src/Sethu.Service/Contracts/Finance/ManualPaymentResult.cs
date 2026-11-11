using System.Security.Claims;
using Sethu.Service.Security;
using Sethu.Domain.Finance;
namespace Sethu.Service.Finance;

public sealed record ManualPaymentResult(bool Accepted, string Code, Guid PaymentRequestId, long? Version = null);

using System.Security.Claims;
using Sethu.Service.Security;
using Sethu.Domain.Finance;
namespace Sethu.Service.Finance;

public sealed record ManualBusinessAction(Guid PaymentRequestId, long ExpectedVersion, string Reason, string IdempotencyKey);

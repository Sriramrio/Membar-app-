using System.Security.Claims;
using Sethu.Service.Security;
using Sethu.Domain.Finance;
namespace Sethu.Service.Finance;

public sealed record FinanceManualCheck(Guid PaymentRequestId, long ExpectedVersion,
    string CheckedSource, DateOnly CheckedDate, string CheckedUtr, decimal CheckedAmount,
    string Currency, bool BeneficiaryMatched, bool UtrMatched, bool AmountMatched,
    bool DateMatched, ManualFinanceDecision Decision, string ReasonCode, string IdempotencyKey);

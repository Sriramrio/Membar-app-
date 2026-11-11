using Microsoft.EntityFrameworkCore;
using Sethu.Infrastructure.Persistence;

namespace Sethu.Infrastructure;

public sealed record DeliveryOutcome(bool Delivered, bool PermanentFailure, string ErrorCode);

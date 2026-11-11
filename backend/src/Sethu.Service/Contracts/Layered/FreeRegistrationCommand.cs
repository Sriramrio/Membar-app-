namespace Sethu.Service.Layered;

public sealed record FreeRegistrationCommand(Guid EventId,string Action,string IdempotencyKey);

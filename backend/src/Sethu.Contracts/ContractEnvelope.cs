namespace Sethu.Contracts;
public sealed record CorrelationContext(string CorrelationId, string? CausationId);
public sealed record CommandEnvelope<TPayload>(string CommandId, string ResourceId, long? ExpectedVersion, string IdempotencyKey, CorrelationContext Trace, TPayload Payload);
public sealed record QueryPage(int Limit, string? Cursor);
public sealed record ApiError(string Code, string SafeMessage, string CorrelationId, bool Retryable);

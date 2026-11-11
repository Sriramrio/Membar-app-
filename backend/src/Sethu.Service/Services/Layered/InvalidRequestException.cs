namespace Sethu.Service.Layered;

/// <summary>
/// Thrown by a service when the caller's input is invalid. The API layer maps it to HTTP 400,
/// so controllers contain no validation code. It derives from ArgumentException so existing
/// callers that catch ArgumentException keep working.
/// </summary>
public sealed class InvalidRequestException(string message) : ArgumentException(message);

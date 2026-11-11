namespace Sethu.Service.DTOs.Common;

/// <summary>
/// Generic outcome result DTO for command operations.
/// </summary>
public sealed record OperationResultDto(
    bool Accepted,
    string Code,
    Guid? ResourceId
);

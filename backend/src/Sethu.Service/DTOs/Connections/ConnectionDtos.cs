using Sethu.Service.MemberNetwork;

namespace Sethu.Service.DTOs.Connections;

/// <summary>
/// Data transfer object representing a member connection.
/// </summary>
public sealed record ConnectionDto(
    Guid Id,
    Guid InitiatorId,
    Guid OtherMemberId,
    string State,
    long Version,
    DateTimeOffset UpdatedAt
);

/// <summary>
/// DTO representing a historical state transition of a connection.
/// </summary>
public sealed record ConnectionTransitionDto(
    Guid Id,
    Guid ConnectionId,
    Guid ActorMemberId,
    string? PreviousState,
    string NewState,
    string Action,
    DateTimeOffset OccurredAt
);

/// <summary>
/// Request DTO for executing an action on a connection.
/// </summary>
public sealed record ConnectionActionRequestDto(
    Guid OtherMemberId,
    ConnectionAction Action,
    string IdempotencyKey
);

/// <summary>
/// Query parameters DTO for listing connections.
/// </summary>
public sealed record ConnectionQueryDto(
    string? State = null,
    int Page = 1,
    int Size = 20
);

/// <summary>
/// Result DTO for a connection action.
/// </summary>
public sealed record ConnectionOutcomeDto(
    bool Accepted,
    string Code,
    Guid? ConnectionId
);

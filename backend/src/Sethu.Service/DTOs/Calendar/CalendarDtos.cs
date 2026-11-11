namespace Sethu.Service.DTOs.Calendar;

/// <summary>
/// DTO representing a calendar event view.
/// </summary>
public sealed record CalendarEventDto(
    Guid Id,
    Guid ChapterId,
    string Title,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    int Capacity,
    int Registered,
    bool IsPaid,
    string Status,
    string? Chapter = null,
    string? City = null
);

/// <summary>
/// Request DTO for creating a new free chapter event.
/// </summary>
public sealed record CreateCalendarEventDto(
    Guid ChapterId,
    string Title,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    int Capacity,
    bool IsPaid,
    string IdempotencyKey
);

/// <summary>
/// Request DTO for registering or withdrawing from an event.
/// </summary>
public sealed record RegisterCalendarEventDto(
    Guid EventId,
    string Action,
    string IdempotencyKey
);

/// <summary>
/// Query parameters DTO for calendar event listing.
/// </summary>
public sealed record CalendarQueryDto(
    int Page = 1,
    int Size = 20
);

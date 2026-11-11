namespace Sethu.Service.DTOs.Notes;

/// <summary>
/// DTO representing a private member note.
/// </summary>
public sealed record NoteDto(
    Guid Id,
    string ContextType,
    Guid ContextId,
    string Text,
    DateTimeOffset? FollowUpAt,
    bool Archived,
    DateTimeOffset UpdatedAt
);

/// <summary>
/// Request DTO for creating a private note.
/// </summary>
public sealed record CreateNoteDto(
    string ContextType,
    Guid ContextId,
    string Text,
    DateTimeOffset? FollowUpAt,
    string IdempotencyKey
);

/// <summary>
/// Request DTO for mutating or managing a note.
/// </summary>
public sealed record NoteActionDto(
    Guid NoteId,
    string Action,
    string IdempotencyKey,
    string? Text = null,
    DateTimeOffset? FollowUpAt = null
);

/// <summary>
/// Query parameters DTO for listing notes.
/// </summary>
public sealed record NoteQueryDto(
    int Page = 1,
    int Size = 20
);

namespace Sethu.Contracts.Emails;

public sealed record EmailTemplateDto(
    string TemplateCode,
    string Name,
    string Subject,
    string BodyHtml,
    string? BodyText,
    IReadOnlyList<string> Variables,
    DateTimeOffset? UpdatedAt
);

public sealed record TemplateSummaryDto(
    string TemplateCode,
    string Name,
    string Subject,
    string Channel,
    bool IsActive
);

public sealed record SaveEmailTemplateRequest(
    string TemplateCode,
    string Name,
    string Subject,
    string BodyHtml,
    string? BodyText
);

public sealed record TestEmailRequest(
    string RecipientEmail,
    string? TemplateCode,
    string? Subject,
    string? BodyHtml
);

public sealed record DispatchCredentialsRequest(
    string? BatchId,
    string? TemplateCode,
    bool AllUnclaimed = false,
    bool GenerateNewPassword = true,
    IReadOnlyList<string>? MembershipIds = null
);

public sealed record BatchMemberItemDto(
    string MembershipId,
    string Email,
    string FullName,
    string Status,
    DateTimeOffset? LastSentAt,
    string? LastStatus,
    string? TemporaryPassword = null,
    string? PhoneNumber = null,
    bool IsContactVerified = false,
    string? ChapterName = null
);

public sealed record DispatchItemResult(
    string MembershipId,
    string Email,
    string FullName,
    string Status,
    string? ErrorMessage,
    DateTimeOffset? SentAt
);

public sealed record DispatchBatchResult(
    string BatchId,
    int TotalMembers,
    int SentCount,
    int FailedCount,
    IReadOnlyList<DispatchItemResult> Items
);

public sealed record EmailDispatchLogItem(
    Guid Id,
    string? BatchId,
    string MembershipId,
    string Email,
    string FullName,
    string Status,
    string? ErrorMessage,
    DateTimeOffset CreatedAt,
    DateTimeOffset? SentAt
);


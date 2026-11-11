namespace Sethu.Service.MemberNetwork;

public sealed record DirectoryPage(IReadOnlyList<DirectoryEntry> Items, int Page, int PageSize, bool HasMore);

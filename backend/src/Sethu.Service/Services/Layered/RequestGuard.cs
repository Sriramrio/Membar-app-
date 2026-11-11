namespace Sethu.Service.Layered;

/// <summary>Input rules shared by every Layered service, so all services validate the same way.</summary>
internal static class RequestGuard
{
    private const int MaxPage = 100_000;
    private const int MaxPageSize = 100;
    private const int MaxKeyLength = 128;

    public static void Pagination(int page, int size)
    {
        if (page is < 1 or > MaxPage || size is < 1 or > MaxPageSize)
            throw new InvalidRequestException("Invalid pagination");
    }

    public static void PageSize(int size)
    {
        if (size is < 1 or > MaxPageSize)
            throw new InvalidRequestException("Invalid page size");
    }

    public static bool IsValidKey(string? idempotencyKey) =>
        !string.IsNullOrWhiteSpace(idempotencyKey) && idempotencyKey.Length <= MaxKeyLength;
}

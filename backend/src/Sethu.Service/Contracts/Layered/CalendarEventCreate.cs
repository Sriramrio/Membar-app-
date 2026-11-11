namespace Sethu.Service.Layered;

public sealed record CalendarEventCreate(Guid ChapterId,string Title,DateTimeOffset StartsAt,DateTimeOffset EndsAt,int Capacity,bool IsPaid,string IdempotencyKey);

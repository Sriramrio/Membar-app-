namespace Sethu.Service.Layered;

public sealed record CalendarEventView(Guid Id,Guid ChapterId,string Title,DateTimeOffset StartsAt,DateTimeOffset EndsAt,
    int Capacity,int Registered,bool IsPaid,string Status);

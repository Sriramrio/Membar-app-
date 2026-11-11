using Sethu.Domain.Security;

namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class Appointment { public Guid Id {get;set;} public Guid TenantId {get;set;} public Guid ChapterId {get;set;} public Guid UserId {get;set;} public string RoleCode {get;set;}=""; public DateTimeOffset StartsAt {get;set;} public DateTimeOffset EndsAt {get;set;} public AppointmentStatus Status {get;set;} public bool Exclusive {get;set;} }

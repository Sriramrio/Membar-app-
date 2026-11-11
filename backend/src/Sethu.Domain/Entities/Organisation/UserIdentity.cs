namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class UserIdentity 
{ 
    public Guid Id { get; set; } 
    public Guid TenantId { get; set; } 
    public string Issuer { get; set; } = ""; 
    public string Subject { get; set; } = ""; 
    public bool Active { get; set; } 
    public Guid? MemberId { get; set; } 
    public string? Email { get; set; }
    public string? Name { get; set; }
    public string? PasswordHash { get; set; }
    public int FailedLoginAttempts { get; set; }
    public DateTimeOffset? LockoutEnd { get; set; }
    public string? PhoneNumber { get; set; }
    public bool IsContactVerified { get; set; }
}

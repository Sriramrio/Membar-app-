namespace Sethu.Domain.Entities;

// Plain entity: properties only. Business rules live in Services; DB mapping lives in Persistence/Configurations.
public sealed class RenewalValidityPolicy
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public int DurationMonths { get; set; }
    public DateTimeOffset EffectiveFrom { get; set; }
    public DateTimeOffset? EffectiveUntil { get; set; }
    public long Version { get; set; }
    public bool Approved { get; set; }
    public string StartRule { get; set; } = ""; // ExtendFromExpiry or StartToday: explicitly approved policy
}

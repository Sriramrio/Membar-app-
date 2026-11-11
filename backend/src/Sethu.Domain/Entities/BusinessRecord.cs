using Sethu.Domain;
namespace Sethu.Domain.MemberBusiness;

public sealed class BusinessRecord : AggregateRoot
{
    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public Guid OwnerMemberId { get; private set; }
    public string Name { get; private set; } = "";
    public Guid SpecialisationId { get; private set; }
    public BusinessRecordStatus Status { get; private set; }
    private BusinessRecord() { }
    public static BusinessRecord Create(Guid id, Guid tenantId, Guid owner, string name, Guid specialisation)
    {
        if (id == Guid.Empty || tenantId == Guid.Empty || owner == Guid.Empty || specialisation == Guid.Empty || string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Business identity, name and classification required");
        return new BusinessRecord { Id = id, TenantId = tenantId, OwnerMemberId = owner, Name = name.Trim(), SpecialisationId = specialisation, Status = BusinessRecordStatus.Draft };
    }
    public DomainOutcome Activate(bool ownerActive)
    {
        if (Status != BusinessRecordStatus.Draft || !ownerActive) return new(false, "business_activation_denied");
        Status = BusinessRecordStatus.Active; Version++; return new(true, "business_activated");
    }
    public DomainOutcome Rename(string name)
    {
        if (Status == BusinessRecordStatus.Closed || string.IsNullOrWhiteSpace(name)) return new(false, "business_update_denied");
        Name = name.Trim(); Version++; return new(true, "business_updated");
    }
    public DomainOutcome UpdateSpecialisation(Guid specialisationId)
    {
        if (Status == BusinessRecordStatus.Closed || specialisationId == Guid.Empty) return new(false, "business_specialisation_denied");
        SpecialisationId = specialisationId; Version++; return new(true, "business_specialisation_updated");
    }
}

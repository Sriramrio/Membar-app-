namespace Sethu.Domain.Security;

public sealed record PermissionRequest(string Permission, bool RequiresIndependentGovernance = false,
    bool ProhibitsSelfApproval = false);

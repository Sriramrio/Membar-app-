using System;
using System.Collections.Generic;
using System.Linq;

namespace Sethu.Service.MembershipIntake;

/// <summary>Pure, fail-closed assessment. A matching email/name never proves identity or authorizes a merge.</summary>
public static class LegacyRegistrationReconciliation
{
    public static ReconciliationAssessment Assess(RegistrationCandidate legacy, IReadOnlyCollection<IntakeCandidate> intakes)
    {
        if (legacy.TenantId == Guid.Empty || legacy.RegistrationId == Guid.Empty)
            return new(legacy.RegistrationId, "INVALID_SOURCE", null, "Source identity or tenant is missing");
        if (legacy.ChapterId is null || legacy.ChapterId == Guid.Empty)
            return new(legacy.RegistrationId, "NEEDS_CHAPTER_REVIEW", null, "Chapter must be resolved against authoritative chapter identity");
        if (string.IsNullOrWhiteSpace(legacy.BusinessName))
            return new(legacy.RegistrationId, "NEEDS_BUSINESS_REVIEW", null, "A verified business association is required");
        var sameTenant = intakes.Where(i => i.TenantId == legacy.TenantId).ToArray();
        if (sameTenant.Any(i => i.IntakeId == legacy.RegistrationId))
            return new(legacy.RegistrationId, "ID_COLLISION_REVIEW", null, "The identifiers overlap but the aggregates are not interchangeable");
        // Email, contact number, and display names are *not* authoritative join keys.
        // Candidate matching is only for human triage; no write, permission, activation, or account creation.
        var possible = sameTenant.Where(i => i.ChapterId == legacy.ChapterId &&
              string.Equals(i.BusinessName.Trim(), legacy.BusinessName.Trim(), StringComparison.OrdinalIgnoreCase)).ToArray();
        if (possible.Length > 1)
            return new(legacy.RegistrationId, "AMBIGUOUS_REVIEW", null, "Several same-chapter business candidates exist");
        if (possible.Length == 1)
            return new(legacy.RegistrationId, "POSSIBLE_MATCH_REVIEW", possible[0].IntakeId, "Match is non-authoritative; require verified person/business identity and approved mapping");
        return new(legacy.RegistrationId, "UNMATCHED_REVIEW", null, "No supported match; do not create a second active membership automatically");
    }
}
public sealed record RegistrationCandidate(Guid RegistrationId, Guid TenantId, Guid? ChapterId, string BusinessName);
public sealed record IntakeCandidate(Guid IntakeId, Guid TenantId, Guid ChapterId, string BusinessName);
public sealed record ReconciliationAssessment(Guid RegistrationId, string Status, Guid? CandidateIntakeId, string Reason);

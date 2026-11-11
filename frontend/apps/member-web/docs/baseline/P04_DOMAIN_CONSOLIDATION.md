# P04 Domain Consolidation

## Canonical relationship authority

`MemberBusinessAffiliation` is the runtime source of truth for Member↔Business association. `Member.businessId`, `Business.ownerMemberIds` and `Business.primaryRepresentativeId` remain compatibility mirrors for historical contracts but are no longer used as the primary selector/notification authority.

## Migration rules

- Historical Member→Business links with matching owner evidence migrate to a verified `Owner` affiliation.
- Historical primary-representative evidence migrates to a verified `Representative` affiliation.
- A bare `Member.businessId` without corroborating ownership/representative evidence migrates to `Unspecified`, `Pending`, private/view-only affiliation requiring review. No ownership is guessed.
- Legacy business certification strings migrate to structured `CertificationRecord` entries with `Pending` verification; evidence is not fabricated and verification is not falsely asserted.
- Existing IDs are preserved. Migrated records use deterministic IDs.
- Migration is idempotent.

## Runtime changes

- Active business selection resolves verified affiliations first.
- Promotion eligibility resolves the Member's canonical affiliated business.
- Directory member/business linkage uses verified affiliations rather than independent `Member.businessId` authority.
- Business notification participants derive from verified affiliations.
- Member activation domain events resolve business through verified affiliation.

## Compatibility mirrors

Existing legacy fields remain in the TypeScript model during the baseline release because historical routes/tests and external data may still contain them. They are classified as compatibility projections and are candidates for stronger deprecation in a later schema after external persistence is migrated.

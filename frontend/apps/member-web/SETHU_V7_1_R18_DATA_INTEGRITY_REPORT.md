# SETHU V7.1 R18 — Data Integrity, Sanity and Referential Integrity Report

## Result
Dedicated R18 realistic deployment-data validator: **55/55 PASS**.
Existing deployment-seed validator: **1369/1369 PASS**.

## Cardinality and identity
- 13 Chapters, exactly 50 generated Members each.
- 650 unique Member IDs.
- 650 unique Business IDs.
- 650 active Verified MemberBusinessAffiliations.
- One current Business per generated Member.
- 25 valid direct preview Member logins, including exactly five Chennai login accounts.

## Taxonomy
- 20 distinct Business Sectors.
- 48 Business Segments.
- 48 unique Business Specialisations.
- Every generated Business carries a valid governed Sector → Segment → Specialisation triple.
- Manufacturing-oriented profiles are 2/48, preventing manufacturing-heavy sample bias.

## Relationship integrity
- 2,800 Connections: all owner/target Member IDs valid, no self-connections in exported fixtures.
- 325 Opportunities: every owner Member and Business exists; Requirement/Offering/Collaboration and Chapter/Regional/Network scopes are all represented.
- 1,300 One-to-Ones: every requester/recipient, Business and linked Opportunity resolves.
- 442 Transactions: every Member, buyer Business, counterparty Business and linked Opportunity resolves; values are positive and varied.
- 2,776 Notes: every author/target Member and Meeting/Opportunity/Transaction context resolves; Private and Participants visibility both represented.
- 39 Events: exactly three per Chapter with attendance/waitlist density for UI testing.

## Scope coverage
Connections, Meetings and Transactions cover within-Chapter, same-city cross-Chapter, same-state cross-city and cross-state relationships.

## Commercial-value sanity
Synthetic Transaction values range from ₹62,000 to ₹853,000, with aggregate synthetic value ₹202,215,000. Values exist only for QA/analytics validation and do not represent real commercial activity.

## Source/runtime consistency
CSV exports are generated from the same seed rules and deterministic identifiers used by the runtime. A reproducible generator and a dedicated R18 validator are included in `scripts/`.

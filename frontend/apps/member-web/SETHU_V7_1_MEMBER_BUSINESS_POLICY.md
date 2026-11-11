# SETHU V7.1 Member ↔ Business Policy

## SETHU deployment invariant
A member may have **at most one current Business affiliation**. Current includes an active affiliation and a non-ended Pending affiliation. Historical ended affiliations remain.

## Future-capable domain model
The canonical `Member → MemberBusinessAffiliation → Business` model is retained. The deployment policy is centralized in `src/config/memberBusinessPolicy.ts` and can later be configured for another product/deployment without replacing the domain model.

## Enforcement layers
- UI: does not invite a second current affiliation and supports a safe no-business state.
- Reducer/preview domain: `upsertAffiliation` enforces the central policy.
- Production contract: backend must enforce the invariant transactionally and resolve simultaneous requests deterministically (409/platform conflict equivalent).
- History: ended affiliation data is retained and not silently deleted.

## Reconciliation performed
The supplied default-member advisor affiliation was changed from a second active affiliation into an ended historical record. The primary current affiliation remains current.

## Important distinction
This rule limits current Businesses **per member**. It does not force a Business to have only one representative.

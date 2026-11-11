# SETHU V7.1 Frontend / Backend Handshake

V7.1 retains the canonical query/command boundary. Interactive reads should normally target **500–800 ms** for normal service conditions, and production responses should expose **Server-Timing** or equivalent traceable server-duration telemetry.

## Adopted Member query IDs
- `member.directory.businesses`
- `member.directory.people`
- `member.opportunities.marketplace`
- `member.notifications.list`
- `member.converse.inbox`
- `member.converse.messages`
- `member.attendance.list`
- `member.references.list`
- `member.transactions.list`
- `member.meetings.list`

## V7.1 additions
- `member.interaction-note.create` — server derives author identity, validates target/context access and note visibility.
- Single-current-business policy — persistence layer prevents a second active or pending non-ended affiliation for a member in SETHU.

# SETHU V7 Frontend / Backend Handshake

## Authority boundary
Production mutations are server-authoritative. Client preview reducers are not an authorization or integrity boundary. Every command must validate authenticated actor, workspace scope, permission, aggregate version and idempotency key.

## Query ownership
Collection queries use an **opaque keyset cursor**; clients must not construct or decode server cursors.

## Mutation ownership
State-changing commands are committed transactionally. Durable domain/event publication must use a **transactional outbox** where events leave the primary transaction boundary.

## V7.1 business-affiliation invariant
For the SETHU deployment, a member may have at most one current affiliation, where current includes active verified and non-ended pending records. Enforcement must be transactional at the service/persistence boundary. Concurrent second-affiliation requests return a canonical conflict (`409` or the platform-equivalent conflict envelope). Historical ended affiliations are retained. The model remains configurable for future deployments.

## V7.1 interaction-note invariant
`member.interaction-note.create` derives `authorMemberId` from the authenticated actor; a client-supplied author identifier is never trusted as authority. `Private` is visible only to its author plus explicitly authorized audit/administrative controls. `Participants` requires the target/context participation relationship to be validated server-side. Note text must not enter telemetry. Context access must be verified for Opportunity, Meeting, Transaction, Reference and Business contexts.

## Failure semantics
401/403/409/412/429/503 and timeout/indeterminate outcomes must use the common error envelope and stable command/idempotency identifiers.

## Production implementation baseline
- **Database index baseline**: indexes must cover tenant/scope keys, aggregate identifiers, current-affiliation uniqueness support, note author/target/context lookup, and keyset paging sort keys.
- **RACI/SoD**: server authorization must enforce role/scope and separation-of-duties rules independently from client visibility.
- **Specialisation reservation race**: any one-member/one-specialisation-per-chapter reservation is resolved transactionally so concurrent onboarding cannot double-allocate the same governed specialisation.

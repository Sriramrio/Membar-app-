# V6 Production Domain Persistence Contract (REST Contract)

The frontend defines canonical production boundaries connected to `Sethu.Api` and PostgreSQL via resource-based REST service contract. This is not production persistence when `useMocks`/preview-local mode is active.

## Endpoints
- `/api/v1/me/context`
- `/api/directory/members`
- `/api/connections`
- `/api/opportunities`
- `/api/references`
- `/api/one-to-one`
- `/api/notifications`
- `/api/messages/conversations`
- `/api/attendance/my`
- `/api/transactions`
- `/api/membership/me`

## Server authority
For every production command the server must re-evaluate authentication, authorization/scope, record visibility, validation, optimistic concurrency and maker-checker/RACI rules. Client reducers and preview actions are convenience behavior only. Stable command IDs must be used for idempotency, and `expectedVersion`/`If-Match` semantics must prevent stale overwrite. The server derives user, tenant, member, and role from the validated JWT; client-supplied actor is not trusted.

## SETHU V7.1 additions
The backend must transactionally enforce one current (active or pending non-ended) MemberBusinessAffiliation per member for this deployment and derive interaction-note authorship from the authenticated actor.

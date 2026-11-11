# SETHU V6.2 Frontend ↔ Backend Handshake Specification

## 1. Purpose
This document is the authoritative integration contract for connecting the current SETHU V6.2 frontend to the forthcoming production backend without reworking user journeys, role/workspace navigation, domain state machines or frontend error/resilience behavior.

The frontend is already prepared for server-authoritative mutation/query boundaries, cursor paging, cancellation, correlation/request IDs, optimistic concurrency, idempotency, runtime response validation, server clock synchronization, realtime event ingestion, offline policy, cross-tab session consistency and performance telemetry.

The backend must implement the complementary contracts below. Frontend authorization is never authoritative; the backend must re-evaluate actor, role, organisation scope, workflow state, SoD/RACI and record version on every protected request.

## 2. Non-negotiable principles
1. Server is authoritative for persistent business state, identity, authorization, time, versions and audit.
2. Frontend never receives the full nationwide dataset merely to paginate/filter locally.
3. Query endpoints are scope-aware, field-projected and cursor-paged.
4. Mutations are commands, not arbitrary object replacement.
5. All mutation commands support idempotency and optimistic concurrency.
6. Canonical IDs for persisted entities are server-owned UUID/ULID values.
7. UTC is persisted; organisation/user timezone is presentation/reporting metadata.
8. Search is server-indexed; UI search must not depend on downloading all members/businesses.
9. Critical side effects use transactional outbox/event processing.
10. Long-running work is represented as jobs, not synchronous HTTP requests.
11. Sensitive data is projected by use case; do not send fields merely because the UI can hide them.
12. Every response/error carries correlation information usable by support and observability.

## 3. Transport and security baseline
- HTTPS only outside localhost.
- Secure, HttpOnly, SameSite session/auth cookies or approved OAuth/OIDC access token model.
- CSRF/XSRF contract compatible with `XSRF-TOKEN` cookie and `X-XSRF-TOKEN` header if cookie auth is used.
- CORS allow-list; never wildcard credentials.
- Request size limits and decompression limits.
- HSTS, secure headers, TLS policy.
- Server-side rate limits by actor/IP/domain action.
- No secrets returned to browser.

## 4. Correlation and request headers
Frontend may send:
- `X-Correlation-ID`
- `X-Request-ID`
- `Idempotency-Key` for commands
- `If-Match` for versioned updates
- XSRF header where applicable

Backend must echo or return correlation ID and log request ID, actor ID, command ID and aggregate ID.

## 5. Common error envelope
All non-2xx APIs should return a consistent JSON envelope:

```json
{
  "type": "CONFLICT",
  "title": "Version conflict",
  "detail": "The record changed after you opened it.",
  "status": 412,
  "correlationId": "...",
  "retryable": false,
  "fieldErrors": { "field": ["message"] },
  "currentVersion": "12",
  "allowedRecovery": ["reload", "compare"],
  "code": "VERSION_CONFLICT"
}
```

Required mappings:
- 400/422 validation
- 401 authentication
- 403 authorization
- 404 not found
- 409 domain conflict/uniqueness
- 410 gone/superseded
- 412 optimistic concurrency conflict
- 429 rate limited with `Retry-After`
- 502/503/504 dependency/transient failure

## 6. Authentication/session handshake
Backend must provide:
- login/session establishment
- logout and server-side revocation
- current account/profile endpoint
- active assignments/roles with effective dates
- session revision or equivalent for cross-tab/revocation refresh
- MFA/OTP where required
- account suspension/expiry handling

Never trust frontend workspace/role selection as authority. It is context only.

## 7. Organisation and authorization model
Every protected query/command evaluates:
`actor → role/assignment → organisation scope → permission → action → resource → workflow state → SoD/RACI → field projection`.

Organisation hierarchy must support Chapter → City → Region → State → Country → Management/Platform scopes and temporal effective dates.

Required temporal fields for assignments/affiliations/role tenure:
- `effectiveFrom`
- `effectiveTo`
- status
- delegatedBy / delegation reference where applicable

## 8. Domain command contract
Canonical command endpoints already expected by frontend:
- `POST /v6/member/commands`
- `POST /v6/management/commands`
- `POST /v6/governance/commands`
- `POST /v6/platform-admin/commands`

Command body:
```json
{
  "commandId": "UUID/ULID",
  "domain": "member",
  "command": "reference.create",
  "aggregateType": "Reference",
  "aggregateId": "...",
  "payload": {},
  "actor": {"accountId":"...","workspace":"Member","role":"Member","unit":"..."},
  "expectedVersion": "11",
  "reason": "optional"
}
```

Backend rules:
- deduplicate on commandId / Idempotency-Key
- transactionally validate authorization and state transition
- enforce expectedVersion
- return same successful result for retried idempotent command
- append immutable audit record
- write outbox event in same transaction for downstream notifications/integrations/analytics

Command result:
```json
{
  "accepted": true,
  "aggregateId": "...",
  "version": "12",
  "correlationId": "...",
  "auditId": "...",
  "data": {}
}
```

## 9. Query contract
Canonical query endpoints:
- `POST /v6/member/query`
- `POST /v6/management/query`
- `POST /v6/governance/query`
- `POST /v6/platform-admin/query`

Frontend V6.2 query payload supports:
- queryId
- parameters
- search
- filters `{field, operator, value}`
- sort `{field, direction}`
- pagination `{cursor, pageSize}`
- facets
- fields
- includes
- timezone
- consistencyToken

Server must enforce maximum page size (recommended 100; default 25), reject unsupported fields/operators, and prevent arbitrary query injection.

## 10. Cursor page response
```json
{
  "data": {
    "items": [],
    "page": {
      "nextCursor": "opaque",
      "previousCursor": "opaque",
      "pageSize": 25,
      "returned": 25,
      "hasMore": true,
      "totalEstimate": 1200,
      "consistencyToken": "snapshot/revision",
      "generatedAt": "UTC ISO-8601"
    },
    "facets": []
  },
  "version": "optional",
  "correlationId": "..."
}
```

Cursors must be opaque, tamper-resistant and tied to sort/filter context. Do not use unbounded OFFSET for large/high-churn datasets.

## 11. High-volume query IDs to implement first
1. `member.directory.search`
2. `business.directory.search`
3. `opportunity.marketplace.search`
4. `member.notifications.list`
5. `converse.conversations.list`
6. `converse.messages.list`
7. `meeting.list`
8. `attendance.list`
9. `audit.events.search`
10. `workflow.tasks.search`
11. `import.jobs.search`
12. `configuration.history.search`

## 12. Directory/search backend
Search must support natural language plus taxonomy aliases/synonyms for Business Sector → Segment → Specialisation.

Recommended initial path:
- PostgreSQL relational source of truth
- PostgreSQL FTS/trigram for early production if scale permits
- abstraction allowing OpenSearch/Elasticsearch/Typesense/Meilisearch later without frontend contract change

Search result must include match explanation where useful: matched specialisation, keyword/synonym, business capability/service/product, geography and visibility.

## 13. Database indexing guidance
Design from query patterns, not Redux object shape. At minimum evaluate indexes for:
- member(status, chapter_id), member(region/state/country)
- affiliation(member_id, active, verification_status)
- affiliation(business_id, active, verification_status)
- business(chapter_id, visibility), business taxonomy joins
- specialisation/chapter uniqueness reservation
- connection(owner_id, target_id, status) and reverse lookup strategy
- conversation participant membership and updated_at
- message(conversation_id, sequence/id DESC)
- opportunity(status, visibility, closing_date, owner/member/business)
- response(opportunity_id, member_id, status)
- meeting(participant/member mapping, date_time, status)
- notification(member_id, read, available_at, created_at DESC)
- attendance(event_id, member_id)
- workflow task(assignee/scope/status/sla_due)
- audit(entity_type, entity_id, occurred_at DESC), actor, correlationId
- payment(member_id, status, due_date)
- job(type, status, created_at)

Use EXPLAIN/ANALYZE against realistic data before finalizing.

## 14. One-specialisation-per-chapter rule
This must be transactionally enforced in the database/backend, not through a frontend availability check.

Model explicit states such as Available → Temporarily Reserved → Pending Approval/Payment → Allocated → Released/Expired.

Reservation requires:
- reservation ID
- chapter ID
- specialisation ID
- applicant/member ID
- createdAt/expiresAt
- payment grace period where relevant
- unique constraint covering active/reserved states
- cleanup/expiry job
- override/audit workflow

Concurrent applicants must never both become allocated.

## 15. Field-level projections and privacy
Do not return one universal Member DTO. Implement projections such as:
- PublicMemberProfile
- NetworkMemberProfile
- SelfMemberProfile
- ChapterAdminMemberView
- FinanceMemberView

Apply authorization before serialization. Sensitive fields must not be sent merely to be hidden in React.

## 16. Concurrency and reconciliation
All editable authoritative resources should expose a version/ETag.

On conflict return currentVersion and recovery instructions. For high-value administration/configuration consider returning field-level comparison metadata.

Maker-checker approvals must bind to proposal/version. A checker approving v4 must not accidentally approve newly-created v5.

## 17. Server-authoritative time
Backend writes all business timestamps. API should send HTTP `Date` header and UTC timestamps. Frontend serverClock will synchronize from it.

Deadline/SLA/payment/attendance/approval eligibility is decided by backend time, never browser time.

## 18. Realtime events
Use WebSocket/SSE behind one backend gateway. Frontend already has a centralized `RealtimeGateway` seam.

Event envelope:
```json
{
  "id":"event-id",
  "type":"notification.created",
  "occurredAt":"UTC",
  "revision":"optional",
  "aggregateType":"Notification",
  "aggregateId":"...",
  "payload":{}
}
```

Events must be idempotent/deduplicable and scope-authorized. Suggested early event families:
- notification.*
- converse.message.*
- connection.*
- meeting.*
- opportunity.response.*
- workflow.*
- account.assignment.*

## 19. Converse/message scaling
Do not bootstrap all messages.
- conversations query returns summaries + unread count + last-message metadata
- messages query returns latest page using cursor/sequence
- older messages load by cursor
- message create command returns canonical ID/server timestamp
- ordering uses server sequence/timestamp
- support delivery/read state, retention, moderation and attachments separately

## 20. Jobs/background processing
Represent long work as Job resource with status:
Queued → Validating/Running → AwaitingApproval where applicable → Completed/Failed/Cancelled.

Use jobs for:
- bulk imports
- exports/reports
- large notification campaigns
- media processing
- retention
- analytics recomputation
- data-quality scans
- integration retries

Expose query/status endpoint and realtime progress events when useful.

## 21. Import architecture
Upload → quarantine/validate → create batch/job → row-level validation → summary/error file → approval/commit → immutable batch ledger.

Never process 50k rows in one frontend reducer/action.

Reversal must use compensating transactions and detect records modified after import.

## 22. File upload security
Server-side validation only:
- MIME + extension + magic bytes
- size limits
- malware scan/quarantine
- isolated object storage
- signed upload/download URLs
- Content-Disposition
- metadata stripping where required
- access scope/expiry
- audit trail

## 23. Caching
Define for every cacheable query:
- key
- tenant/org scope
- permission revision
- TTL
- invalidation event

Good candidates: taxonomy, public configuration, public events, directory/search short TTL.
Avoid stale caching of payment status, approval queues and permissions without a revision key.

## 24. Rate limiting/abuse controls
Domain-specific policies for login/OTP, search, messages, connection requests, opportunity responses, exports and bulk actions. Return 429 + Retry-After.

## 25. Audit/outbox
Audit must be server-side and immutable for governance/high-value changes, recording actor, command/action, entity, before/after where appropriate, reason, correlationId, commandId, timestamp and organisational context.

Use transactional outbox for email, notifications, analytics, webhooks and integrations so DB commit and downstream side effects cannot diverge silently.

## 26. Analytics/read models
Do not calculate long-history KPIs from raw browser arrays. Provide governed aggregate/read-model endpoints for dashboards while retaining drill-down queryability to source records.

Persist UTC; reporting period uses declared organisation timezone; presentation may use user timezone.

## 27. Bootstrap contract
`GET /v6/bootstrap` should return only bounded session/bootstrap data:
- authenticated account/assignments
- configuration revisions needed immediately
- small current-user context
- feature flags
- server time/revision metadata

Do not return entire member/business/message/opportunity datasets.

## 28. OpenAPI/schema discipline
Maintain OpenAPI 3.1 as source of contract truth. Generate or validate TypeScript/.NET DTOs where practical. Version schemas independently from UI release names. Breaking changes require explicit version/deprecation plan.

## 29. Backend implementation sequence
B01 identity/session + account projection
B02 organisation hierarchy, assignments, RBAC/ABAC scope engine
B03 canonical IDs/version/audit/idempotency infrastructure
B04 query framework + cursor paging/filter/sort/field projection
B05 member/business/affiliation/taxonomy + specialisation reservation/uniqueness
B06 connections/converse/notifications
B07 meetings/references/opportunities/responses/outcomes
B08 events/attendance/payments
B09 management/governance/control-plane commands and maker-checker
B10 search indexing/facets
B11 jobs/import/export/media
B12 realtime gateway/outbox/workers
B13 analytics read models
B14 security/performance/load/DR certification

Each phase must publish OpenAPI changes, migration scripts, indexes, tests, data integrity evidence and frontend contract verification.

## 30. Integration acceptance matrix
For every endpoint/query/command verify:
- authorized success
- unauthorized 401/403
- out-of-scope resource
- validation 422
- duplicate command/idempotency replay
- stale If-Match 412
- uniqueness 409
- missing/deleted 404/410
- cancellation
- 429 Retry-After
- transient dependency retry semantics
- empty result
- high-volume page
- cursor continuity under inserts
- field projection/privacy
- correlation/audit/outbox evidence

## 31. Frontend/backend handshake definition of done
The handshake is complete only when:
1. OpenAPI and frontend TypeScript contracts agree.
2. Runtime response schema validation passes.
3. Role/scope access matrix passes against real backend.
4. Commands satisfy idempotency/concurrency tests.
5. Cursor paging/search works without full dataset hydration.
6. Specialisation uniqueness survives concurrent tests.
7. Converse/messages use paged server loading.
8. Import/job flows are asynchronous and resumable.
9. Realtime events reconcile without duplication.
10. Audit/correlation IDs can trace request → command → DB change → outbox/event.
11. Performance/load targets are measured with realistic datasets.
12. No frontend screen depends on preview-only data for production behavior.

# SETHU V6.2 Backend Implementation & Frontend Handshake — Master Prompt

Act as principal .NET/backend architect, PostgreSQL data architect, security architect, API architect, performance engineer, distributed-systems engineer and QA lead.

Use `SETHU_V6_2_FRONTEND_BACKEND_HANDSHAKE_SPEC.md` and the current frontend source contracts as authoritative inputs. The goal is not to mirror Redux in the database. Build a server-authoritative domain model and API that plugs into the existing SETHU journeys with no semantic drift.

## Execution discipline
Execute B00–B14 sequentially. For every phase: current-state review → design/schema/API delta → implementation → migrations/seed/reference data → unit/integration/contract/security/performance tests → data sanity/referential integrity checks → OpenAPI update → frontend handshake verification → checkpoint → SHA/integrity → status update → Memory checkpoint → next phase.

Never mark a phase complete with unresolved migration failures, broken foreign keys, authorization bypasses, inconsistent OpenAPI schemas, non-idempotent critical commands or untested concurrency rules.

## B00 Baseline/contract freeze
Inventory frontend query IDs, command domains, error envelope, correlation headers, role/workspace hierarchy, canonical state machines, taxonomy model and expected screens. Create traceability matrix from screen/action → query/command → permission → tables/read model → tests.

## B01 Identity/session
OIDC/session design, secure cookie/token rules, login/logout/MFA/OTP, session revision/revocation, current-account projection, temporal assignments, audit. Test suspension/expiry/revocation/multi-tab behavior.

## B02 Organisation/RBAC/RACI/SoD
Chapter/City/Region/State/Country hierarchy with temporal history. Effective-access evaluator for command and query scope. Delegation/tenure conflict rules. Maker-checker and SoD including same human via multiple roles/delegations.

## B03 Persistence foundation
PostgreSQL canonical IDs UUID/ULID, created/updated/version fields, ETag/version strategy, soft delete/archive, audit tables, idempotency ledger, transaction helper, outbox table/worker, correlation propagation.

## B04 Query framework
Whitelisted queryId registry, cursor/keyset paging, bounded page size, filter/sort/facet schema, field projections, includes, consistency token, cancellation, safe timeouts. Do not expose generic SQL-like querying.

## B05 Member/business/taxonomy
Member vs Business vs Affiliation separated. Business Sector → Segment → Specialisation. One-member-per-specialisation-per-chapter transactional reservation/allocation model with expiry/grace/override/waitlist rules. Add indexes and concurrent tests.

## B06 Directory/search
Implement initial PostgreSQL FTS/trigram or approved search engine abstraction. Synonyms/protected keywords/taxonomy aliases, explainable match, geography and visibility. Measure p50/p95/p99 with realistic data.

## B07 Connections/Converse/notifications
Connection state machine, blocking semantics, conversation summaries, cursor-paged messages, server sequence/time, dedupe, read state, notification channel delivery states, rate limits, moderation hooks and realtime events.

## B08 Meetings/references/opportunities/outcomes
Implement canonical transition rules, visibility/scope, responses, award/outcome linkage, idempotent commands, version conflicts and audit/outbox events.

## B09 Events/attendance/payments
Capacity/waitlist, registration, attendance finalization/corrections, payment provider boundary, webhook idempotency, reconciliation and server-authoritative status.

## B10 Management/governance/control plane
Workflow tasks, approvals, maker-checker version binding, configuration versioning, feature flags, forms, notification templates, integrations, retention policies and safe rollout/rollback.

## B11 Jobs/import/export/media
Job resource, batch validation, async imports, error artifacts, approval/commit, compensating reversal, exports/reports, object storage, signed URLs, malware scan/quarantine.

## B12 Realtime/outbox/workers
SSE/WebSocket gateway from outbox/domain events with scope filtering, event IDs/revisions, replay/reconnect strategy, duplicate safety and worker retry/dead-letter policy.

## B13 Analytics/read models
Server-side governed aggregates for networking, opportunity, meeting, reference, transaction, attendance and organisational dashboards. Maintain source drill-down and temporal org attribution. UTC storage + organisation reporting timezone.

## B14 Enterprise certification
Load/concurrency tests; index/EXPLAIN review; chaos/dependency failure tests; rate limits; authorization matrix; privacy/field projection; security scanning; backup/restore/DR; retention; observability dashboards/alerts; OpenAPI/frontend contract suite; production-readiness sign-off.

## API acceptance requirements for every command
Authorized success; unauthenticated; unauthorized/out-of-scope; invalid transition; validation error; duplicate idempotency replay; stale version; uniqueness conflict; deleted/superseded aggregate; provider failure; audit + outbox evidence.

## Query acceptance requirements
Authorized projection; forbidden fields absent; empty results; first/next/final cursor pages; stable ordering; inserts during paging; filters/sorts/facets; page-size cap; search relevance; scope enforcement; totalEstimate optional; cancellation/timeout; performance target.

## Database integrity requirements
Foreign keys, not-null/check constraints, unique/partial unique indexes, temporal overlap constraints where applicable, immutable/audited histories, no orphaned affiliations/messages/responses/attendance, transactional reservation for specialisation allocation, and migration rollback/recovery plan.

## Handshake completion
Backend is not complete until the real frontend can switch `VITE_USE_MOCKS=false`, bootstrap a real account, execute all canonical role journeys, page/search without full dataset hydration, survive conflict/idempotency tests, receive realtime events without duplication, and trace correlationId from browser through API/database/outbox/worker logs.

# SETHU V6.2 Frontend Architecture, Performance & Backend-Readiness — Master Execution Prompt

You are acting as principal frontend architect, React/TypeScript engineer, Redux architect, performance engineer, API integration architect, security reviewer and QA lead for SETHU.

## Authoritative baseline
Use the latest V6.2 checkpoint ZIP supplied by the user. Never restart from an older SETHU archive. Preserve all canonical Member, Management, Governance and Platform Admin journeys, route ownership, state-machine rules, RBAC/RACI semantics, production-vs-preview separation and existing validation evidence.

## Mandatory execution discipline
Work strictly phase-by-phase. Before each phase: inspect current checkpoint, dependencies, affected routes/state/contracts and existing validators. Implement only that phase. Run relevant existing and new validators. Fix every feasible source defect before checkpointing. Create an integrity-tested ZIP. Calculate SHA-256. Update `SETHU_V6_2_CHECKPOINT_STATUS.md` with completed work, files changed, validations, known external blockers and exact next step. Persist the completed phase in Memory before starting the next phase. If interrupted, resume from the last completed checkpoint—never repeat or skip phases.

Do not include `node_modules`, `dist`, build artifacts, caches or generated coverage in source checkpoints. Do not claim build/browser/backend certification when the environment cannot execute it.

## Non-drift rules
- no UX rewrite merely for aesthetic reasons
- no replacement architecture unrelated to current SETHU
- no deletion of working legacy migration code until migration behavior is proven unnecessary
- no direct localStorage/sessionStorage outside storage services
- no silent catch blocks
- no console/debugger/TODO/FIXME in production source
- no frontend-authoritative security decisions
- no full-dataset production hydration for paged domains
- no unsafe automatic retry of mutations
- no business-time decision that assumes browser clock is authoritative

## Phase F00 — baseline and inventory
Record archive SHA, route counts, source module count, existing validators, large slices/pages, broad subscriptions, array scans, query/persistence paths and known external blockers.

## Phase F01 — persistence/runtime foundation
Implement selective debounced persistence, safe flush on pagehide/visibility, Redux serializability guardrail, stable client correlation IDs, server-time abstraction and API Date-header synchronization. Validate trust boundary.

## Phase F02 — backend query seam
Implement typed query request, filters, sorting, facets, field projection, includes, search, cursor pagination, page-size caps, consistency token, Zod response envelope validation, cancellation and stale response protection. Add reusable cursor-query hook. Preview/local path must remain functional.

## Phase F03 — read-path optimization
Introduce memoized createSelector read models/indexes for high-frequency relationships and IDs. Migrate safe high-frequency selectors first. Do not wholesale rewrite reducers or persisted data unless semantic typecheck/runtime validation is available. Measure/recount broad slice subscriptions and array scans after changes.

## Phase F04 — operational scale seams
Implement centralized realtime gateway abstraction, event deduplication, multi-tab sign-out/workspace/assignment sync, explicit offline command policy, performance telemetry and large-list windowing primitive. Keep realtime disconnected until backend transport is configured.

## Phase F05 — production query migration preparation
For each high-volume screen create a migration manifest: current local selector/data source, future queryId, required filters/sorts/facets/projection, page size, empty/error/loading states and realtime invalidation events. Prioritize Directory, Business Directory, Opportunities, Notifications, Conversations, Messages, Meetings, Attendance, Audit, Workflow, Imports, Configuration History.

## Phase F06 — screen-by-screen backend wiring
When backend becomes available, migrate one vertical slice at a time. Use server queries for lists/search and commands for mutations; keep only bounded UI/cache state in Redux. Never mix server page N with stale local full-dataset calculations. Preserve deep links and navigation.

## Phase F07 — concurrency/reconciliation UX
Implement 409/412 conflict UX for editable admin/member records: show stale-record notice, server version, local unsaved values and reload/retry/compare path. Double-submit must be disabled and commandId stable for retries.

## Phase F08 — messaging/realtime migration
Move conversations/messages to summary + cursor-paged message loading. Handle reconnect, duplicate events, server timestamps, unread/read state and optimistic send only when backend contract supports reconciliation.

## Phase F09 — import/job UI migration
Replace any large synchronous client import processing with upload/job/progress/error-report/approval/commit/reversal UI contracts. Keep small preview fixtures only for demo mode.

## Phase F10 — virtualization/performance pass
Use server paging first. Apply windowing only where a page itself can still contain many rendered rows. Audit React subscriptions, memoization, rendering hotspots, route lazy loading, image/media loading and expensive analytics computations.

## Phase F11 — analytics/read-model migration
Move long-history KPI aggregation to backend read models while preserving explainable drill-down links and existing metric semantics. Browser computes only bounded current-page or temporary preview analytics.

## Phase F12 — final source certification
Run all feasible non-release validators, internal-link checks, TypeScript syntax parser, storage/error/security/query/read-model/runtime-scale gates. Produce final source ZIP, SHA, integrity proof, checkpoint status, validation report and explicit external certification list.

## Required backend alignment
Always use `docs/SETHU_V6_2_FRONTEND_BACKEND_HANDSHAKE_SPEC.md` as the authoritative backend handshake reference. Any contract deviation must be documented before code changes.

## Required outputs after every phase
1. source changes
2. new/updated tests/validators
3. validation evidence
4. checkpoint ZIP + SHA-256 + integrity result
5. status file update
6. Memory checkpoint
7. exact next phase

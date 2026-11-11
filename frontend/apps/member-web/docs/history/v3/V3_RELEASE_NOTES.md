# SETHU Enterprise Platform V3 — Release Notes

Release date: 24 September 2026
Baseline: `SETHU_Enterprise_UIUX_Final_Verified_2026-09-23-23 4 pm.zip`
Release label: `SETHU_Enterprise_Platform_V3_FINAL`

## Purpose

V3 reconstructs the post-baseline work and expands the packaged prototype against the later Enterprise Engineering Specification. The original authenticated route contract is retained while public/authentication, governed workflows, effective-role context, privacy, security and lifecycle depth are added.

## Major changes

- Added a first-class public/authentication surface: landing, login, OTP, recovery, visitor registration/verification/success, activation, public events/news, privacy and terms.
- Split authentication from the authenticated Workspace Hub and hardened protected-route behavior for unauthenticated, inactive, suspended, stale-context and unauthorized requests.
- Added `MemberPageBoundary` so Member routes resolve the authenticated member identity without a seed/fallback identity and provide consistent focus/title/status handling.
- Added centralized Member/Business visibility policy and deeper field-level privacy controls.
- Expanded directory filters, grid/list modes, URL persistence, relationship/verification filters and privacy-safe discovery.
- Expanded Profile, My Business, Security/Sessions, Connections, References, Transactions, Attendance, Meetings, Polls, Events, Announcements and Messaging lifecycle behavior.
- Added enterprise state for visitor due diligence, workflow inbox, maker-checker imports, role tenure/handover, governance decisions, device sessions and audit events.
- Added visitor → verification → duplicate review/due diligence → recommendation → independent approval → activation flow.
- Added staged imports: upload/mapping/validation/maker submission/checker approval/post/reconciliation/reversal.
- Added effective-dated role assignment controls and overlap protection for exclusive offices.
- Added governance quorum/conflict/immutable rationale controls.
- Replaced the generic audit surface with an enterprise audit explorer backed by the new audit stream.
- Preserved the baseline stateful Workflow Designer, Form Builder, RACI, hierarchy, integrations, moderation, notifications, promotion policy and settings surfaces while integrating them with the V3 route/access architecture.
- Added V3 source-contract and TypeScript/TSX parser validation scripts.

## Validation boundary

The V3 source package passes the included structural, syntax and source-contract validators. A dependency-backed Vite/Vitest/browser run could not be certified in this execution environment because npm package retrieval was unavailable. Therefore rendered-browser responsive/accessibility certification and `npm run typecheck`, `npm test`, `npm run build` remain environment-dependent certification steps, not claimed as passed here.

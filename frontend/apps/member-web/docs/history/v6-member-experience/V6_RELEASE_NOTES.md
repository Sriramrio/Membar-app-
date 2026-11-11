# SETHU Enterprise Platform V6 — Member Experience Release Notes

**Release:** V6 Member Experience, Dashboard, Chapter Insight, Navigation & Cross-Linkage  
**Package version:** `6.0.0`  
**Baseline:** V5 Platform Administration FINAL 5.0.0  
**Date:** 24 September 2026

## Purpose

V6 keeps the V5 configuration-driven control plane intact and improves the Member workspace without removing Member routes, actions or domain lifecycles. The release concentrates on a simpler Member operating experience: action visibility, measurable personal activity/outcomes, privacy-safe Chapter insight, role-context purity, drill-down navigation, contextual cross-links and reliable return-to-origin behavior.

## Principal changes

- Top-centre Member role context switcher driven by effective V5 role assignments and Role Catalogue; secondary role UI is absent when no other effective role exists.
- Session-scoped NavigationOrigin stack, per-workspace context restoration, safe internal return routes and central unsaved-work navigation guard.
- Central Member metric catalogue and period resolver; KPI calculations live in the dashboard projection layer rather than individual cards.
- Rebuilt Member Dashboard with Action Required, My Activity & Performance, My Businesses, Network/Business outcomes, Upcoming, recommendations and Recent Activity.
- Unified Action Centre is exposed through the existing `/app/activity?view=actions` contract, avoiding a new route and preserving the exact V5 route inventory.
- Privacy-safe ChapterMemberViewProjection powers `My Chapter Performance`; it is aggregated, minimum-threshold aware and does not reuse Management dashboard state.
- Chapter Insights uses the existing `/app/dashboard?view=chapter` route contract and never exposes Management actions in Member context.
- Member/Business/Meeting/Reference/Transaction/Messaging/Attendance cross-links preserve navigation origin and consume query context instead of creating duplicate domain state.
- Member navigation is simplified into My Dashboard, Discover, My Network, Business, Community and My Account while retaining every V5 Member route.
- Connections and Meetings now expose task-oriented filtered views without altering their lifecycle contracts.
- Profile and Business editors publish dirty state to the common navigation guard.
- V5 Platform Administration controls Member dashboard defaults, enabled personal metrics, Chapter Insights enablement, Chapter minimum aggregation, enabled Chapter metrics and recommendations.
- MemberPageBoundary adds V5 control-plane route/module enforcement and explicit inactive/expired Member handling.

## Compatibility

V6 preserves the V5 route surface: 84 authenticated/workspace routes plus 14 public/authentication routes, including 45 Member routes. V3, V4 and V5 source-contract validators continue to pass before the V6 contract gate.

## Certification boundary

Dependency-independent source validation passes. `npm run typecheck` was attempted during P09; the supplied sandbox dependency tree lacks required React/Redux/React Router/Vite type modules. Concrete source defects distinguishable from that dependency fallout were corrected. Dependency-backed TypeScript compilation, Vitest, Vite production build, rendered-browser/device certification and automated accessibility certification are therefore not claimed as passed in this environment.

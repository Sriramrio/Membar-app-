# P05 Route & Navigation Consolidation

- The existing 84 authenticated/workspace routes remain canonical; no established V3/V4/V5/V6 deep link was renamed.
- Workspace-root aliases are registered centrally in `src/routes/routeAliases.ts`.
- `AppRoutes` renders alias redirects from that registry; page components do not own compatibility redirects.
- V6 `useMemberNavigation()` resolves aliases through the same registry and remains the canonical contextual return/origin service.
- Unsafe external/absolute redirect forms remain rejected by the shared internal-path guard.
- Role-context return, dirty navigation guard, query/filter/tab/scroll origin state and control-plane route authorization remain unchanged.

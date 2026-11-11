# Platform Administration Known Limitations

1. **Production backend not connected.** Current runtime behavior is provided by the standalone contract simulator.
2. **Production database persistence not implemented.** Audit, outbox, identity/session, RBAC/RACI/SoD and configuration persistence are simulator-backed.
3. **Dependency-backed React/Vite build is BLOCKED_ENVIRONMENT.** `npm install` timed out and no local dependency tree was installed. `npm run typecheck` and `npm run build` therefore fail first on missing `react`, `react-router-dom`, `react/jsx-runtime`, Vite and related declarations.
4. **Browser-rendered React certification is BLOCKED_ENVIRONMENT.** Headless Chromium could not complete against the source app because the Vite dependency/runtime cannot be started without installed dependencies. Accessibility/responsive certification is source/static, not a browser/assistive-technology certification.
5. **Fourteen route manifest entries remain `IMPLEMENTED_PENDING_RUNTIME_TEST`.** Their source wiring, permissions and simulator/API runtime families are validated, but actual React browser rendering is not certified here.
6. **Production identity provider, MFA, session store, secrets store and external integrations are not present.** The simulator exercises contracts and fail-closed behavior only.
7. **Consumer workspace production integration is not present.** Member, Organisation and Governance are represented only by contract metadata/handoffs, by design.

8. **Official Lucide/Tabulator package installation is BLOCKED_ENVIRONMENT.** npm registry access currently fails with `EAI_AGAIN`, so the source uses an offline-safe Lucide-compatible adapter and progressive Tabulator fallback.
9. **Enterprise table/grid gap closure is source-validated, not browser-rendered.** Local filtering, pagination, CSV export, keyboard row activation, modal focus trapping and responsive rules are implemented, but browser automation awaits a connected React/Vite build.
10. **Canonical backend/database services remain DESIGNED_NOT_IMPLEMENTED.** The simulator validates contracts and failure semantics; it is not production persistence or server authority.

# SETHU V4 — Security & Deployment Boundary

## What V4 hardens in the delivered source

- Public/authentication routes are separated from protected workspace routes.
- ProtectedRoute resolves authenticated identity, account status, effective assignments, workspace entitlement and stale context.
- MemberPageBoundary fails closed when the authenticated account cannot resolve to the exact Member record; it does not fall back to a seeded identity.
- Preview passwords are generated per browser session; V4 contains no universal static preview password.
- Preview OTPs are cryptographically generated, expire after ten minutes, are attempt-limited and are bound to challenge purpose/target.
- Recovery uses a non-enumerating response.
- Password overrides and preview-created accounts are session-scoped.
- Protected Redux runtime data is written to `sessionStorage`; durable `localStorage` is restricted to low-risk preferences/configuration.
- Field-level member privacy is applied to Member Detail disclosure.
- Hidden/suspended/blocked states constrain discovery and actions.
- Effective role assignments participate in live workspace/permission resolution.
- RACI/workflow/maker-checker/conflict rules are enforced in reducers, not only through button visibility.
- Illegal domain lifecycle transitions generate Denied audit events instead of false-success audit entries.
- API error mapping includes validation, authentication, authorization, not-found, gone, conflict, rate-limit, dependency, offline and server classes.
- Mutating request boundaries provide correlation and idempotency headers.
- Native browser `window.prompt`/`window.confirm` business actions were removed in favor of accessible application dialogs.

## What remains a production infrastructure responsibility

The delivered application is still a frontend/reference runtime. Production security requires an authoritative server boundary. Before deployment, the organisation must provide and certify:

1. Server/IdP authentication, SSO where applicable, MFA and real OTP delivery.
2. Secure session/token lifecycle, server revocation and rotation.
3. Server-side permission evaluation for every protected command/query; client RBAC must never be authoritative.
4. Authoritative database constraints, optimistic concurrency/version checks and transactional workflows.
5. Tamper-evident/immutable audit storage with server timestamps and actor identity.
6. Encryption in transit and at rest, secrets/key management and backup/restore controls.
7. Rate limiting, abuse controls, bot protection and account-lock/risk rules.
8. Attachment malware scanning, allowed file types, size limits and secure object-storage URLs.
9. CSRF/CORS/security-header policy appropriate to the final authentication model.
10. Security logging/SIEM integration, alerting and incident-response procedures.
11. Dependency/SBOM/SCA, SAST/DAST and penetration testing in CI/CD.
12. Privacy/retention/export/deletion policies aligned with the organisation's legal obligations.

## Data-storage rule

`sessionStorage` hardening in V4 reduces accidental persistent browser retention for the prototype; it is **not** a substitute for server-side storage. Production business, identity, payment, visitor, governance and audit data should not use browser storage as the source of truth.

## Certification statement

V4 may be described as **source-hardened and architecture-integrated at the frontend prototype boundary**. It must not be represented as production-secure until the deployment responsibilities above are implemented and tested.

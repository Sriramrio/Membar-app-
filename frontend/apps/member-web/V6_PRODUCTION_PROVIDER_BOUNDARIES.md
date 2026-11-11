# V6 Production Provider Boundaries

This document records the client/server/provider trust boundary retained by SETHU V7.1. The browser initiates requests; it is never the authority for provider settlement, audit truth, authorization, or integration health.

## Provider endpoints
- `/v6/payments/sessions` — creates server-authorized provider checkout sessions.
- `/v6/payments/status` — reads server/provider-confirmed payment state.
- `/v6/payments/receipts` — reads server-issued receipt metadata.
- `/v6/notifications/deliveries` — dispatches governed notification delivery.
- `/v6/integrations/health-checks` — performs server-side provider/integration checks.
- `/v6/audit/query` — queries the immutable server audit store.
- `/v6/authorization/evaluate` — obtains a server-authoritative permission/policy decision.

Payment completion is confirmed by the server/provider webhook/status path, **never from browser redirect alone**. Audit history belongs in an **immutable server audit store**, and authorization remains a **server-authoritative permission/policy decision** even when the client hides an action.

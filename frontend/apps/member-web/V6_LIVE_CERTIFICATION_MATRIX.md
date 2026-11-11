# V6 Live Certification Matrix — Execution Requirements

Responsive certification widths: **320**, **360**, **390**, **430**, **768**, **1024**, **1280**, **1440**, **1920** px.

## Accessibility
Keyboard-only navigation, focus visibility/return, Escape behavior, semantic names/status, and manual screen-reader checks.

## PWA/offline
Offline navigation shell, network loss during commands, safe retry/reconciliation, service-worker cache separation from API writes.

## Performance
Lighthouse, Core Web Vitals, route/query/command budgets, long-task monitoring and representative device/network throttling.

## Load/concurrency
Backend races, idempotency, database contention and multi-user throughput **cannot be certified from the browser package alone** and require deployed server/load tooling.

## Security
OWASP ZAP/DAST against deployed endpoints, privilege-escalation attempts, IDOR/scope tests, XSS/input handling and secure-cookie/XSRF verification.

## Acceptance
No indefinite busy state, dead action, broken route, modal lock, privacy leak or unauthorized mutation.

# SETHU V7.1 Runtime Stability Baseline

**Authoritative input:** `Sethu(051026).zip`  
**Input SHA-256:** `859c943f7e116334c31d9afecc79ad7bb40d821bae9d40b75ae75745582d46ed`  
**Package version:** `7.1.0`  
**Root VERSION at receipt:** `6.1.0` (stale metadata; reconciled to 7.1.0 in this checkpoint)

## Architecture retained
React/TypeScript, canonical routing, Redux/domain state, governed commands, query gateway, server-authoritative production boundary, concurrency versions, realtime refresh, telemetry, route error boundaries, Converse, Directory, Opportunities, One-to-One, References, Transactions/Business Outcomes, Notifications and Action Centre.

## Baseline defects/gaps confirmed
1. Shared `Button` lacked a safe default `type=button`, allowing accidental form-submit behavior.
2. Shared `ActionDialog` could close before an asynchronous mutation result, risking lost input on failure.
3. Unsafe canonical navigation could return without user/support-observable evidence.
4. The supplied fixture held two simultaneous current business affiliations for the default member, conflicting with the requested SETHU rule.
5. `My Business` assumed a current Business existed and could dereference a missing record.
6. Several inherited release evidence/inventory files expected by validators were absent from the uploaded source package.
7. Project dependency tree was not supplied; `node_modules` was absent and registry installation is unavailable in this execution environment.

## Non-drift rule
No architecture replacement was performed. Fixes use canonical command/query/navigation seams and retain historical affiliation/domain capability.

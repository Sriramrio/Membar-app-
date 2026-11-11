# SETHU V7 Integration Test Matrix

| Scenario | Expected result |
|---|---|
| Duplicate command ID / retry | Exactly-once logical effect; idempotent result |
| Two concurrent second-business affiliation requests | One succeeds at most; other returns 409/conflict |
| Stale aggregate version | 409/412 conflict, no overwrite |
| Unauthorized note author spoof | Rejected; authenticated actor remains author |
| Private note read by unrelated member | 403/not returned |
| Participants note without context participation | Rejected |
| 429 / Retry-After | Bounded retry for safe operations; deterministic feedback |
| 503 / timeout | No indefinite busy state; reconcile indeterminate mutations before replay |
| Member directory keyset paging | Stable opaque cursor; no duplicates/skips under supported consistency model |
| Transaction and opportunity privacy | Counts/values/content respect distinct visibility policies |

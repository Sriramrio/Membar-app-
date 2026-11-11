# SETHU V7 Backend Implementation Requirements

1. Implement all catalogued workspace query/command endpoints behind authenticated server authority.
2. Validate actor, role, organisation scope, resource visibility, payload, aggregate version and idempotency for every mutation.
3. Use transactional persistence and a transactional outbox for durable domain events.
4. Use opaque keyset cursors for bounded collection queries.
5. Enforce SETHU single-current-business affiliation transactionally and return deterministic conflicts under races.
6. Treat interaction notes as sensitive: authenticated actor is author authority; enforce Private/Participants visibility and context participation.
7. Preserve audit history; never convert an ended affiliation into silent deletion.
8. Provide rate limits, bounded timeouts, telemetry/correlation and structured 401/403/409/412/429/503 envelopes.

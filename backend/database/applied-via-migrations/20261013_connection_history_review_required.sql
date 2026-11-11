-- REVIEW REQUIRED: reconcile with EF Core model snapshot before production use.
-- Append-only by application contract; production DB permissions/triggers must be reviewed.
CREATE TABLE IF NOT EXISTS sethu.network_connection_transitions (
    "Id" uuid PRIMARY KEY,
    "TenantId" uuid NOT NULL,
    "ConnectionId" uuid NOT NULL REFERENCES sethu.member_connections("Id") ON DELETE RESTRICT,
    "ActorMemberId" uuid NOT NULL,
    "PreviousState" varchar(32) NULL,
    "NewState" varchar(32) NOT NULL,
    "Action" varchar(32) NOT NULL,
    "OccurredAt" timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_connection_transition_lookup ON sethu.network_connection_transitions
    ("TenantId","ConnectionId","OccurredAt");

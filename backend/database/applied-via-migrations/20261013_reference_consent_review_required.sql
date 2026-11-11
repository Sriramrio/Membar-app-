-- REVIEW REQUIRED. Do not run against production without schema/migration reconciliation.
-- Makes explicit introduced-member consent timestamp persistent. Existing introductions remain unconsented.
ALTER TABLE sethu.network_references
    ADD COLUMN IF NOT EXISTS "ConsentedAt" timestamp with time zone NULL;

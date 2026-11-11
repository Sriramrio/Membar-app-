-- REVIEW REQUIRED, NOT APPLIED. Requires PostgreSQL 17 + btree_gist.
-- AppointmentStatus enum: Proposed=0 Approved=1 Active=2 Suspended=3 Expired=4 Revoked=5 Vacated=6.
-- Only approved and active exclusive appointments consume an exclusive office slot.
-- Review tenant schema, naming and lifecycle policy before execution.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE sethu.appointments
 ADD CONSTRAINT ex_appt_exclusive_tenure
 EXCLUDE USING gist (
  "TenantId" WITH =,
  "ChapterId" WITH =,
  "RoleCode" WITH =,
  tstzrange("StartsAt", "EndsAt", '[)') WITH &&
 ) WHERE ("Exclusive" = TRUE AND "Status" IN (1, 2));

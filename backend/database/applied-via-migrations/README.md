These three SQL files are now covered by EF migrations (do NOT run them manually):
- connection_history + reference_consent  -> InitialCreate (tables/columns already in the model snapshot)
- appointment_exclusion                   -> 20261013180000_AddAppointmentExclusionConstraint (table is in `public` schema, not `sethu`)
Apply with: dotnet ef database update (see chat instructions)

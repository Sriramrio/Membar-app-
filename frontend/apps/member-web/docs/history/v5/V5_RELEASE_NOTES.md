# SETHU V5 Platform Administration Release Notes

V5 converts Platform Administration from a set of administration features into a versioned configuration-driven enterprise control plane while preserving V4 routes and domain contracts.

## Major enhancements
- versioned configuration release lifecycle with validation, impact analysis, independent approval, activation, concurrency checks and governed rollback
- module, action and permission registries
- configurable organisation-unit types/hierarchy and scope-aware RBAC
- role catalogue plus V4 effective-role compatibility
- executable RACI/workflow/SLA/maker-checker configuration
- dynamic form and taxonomy administration
- configurable directory matching
- notification event/template/routing policy consumed by runtime, including dedupe, delivery-mode and acknowledgement metadata
- promotion policy consumed by runtime
- version-pinned Import Profiles with live Attendance/Payment/Member/Business/Visitor/Taxonomy posting and controlled reversal
- governed integration/webhook configuration with secret references only
- data-quality/settings/feature/retention/numbering controls
- security-event visibility and denied-action recording
- reusable control-plane hooks/selectors and runtime adapters
- richer configuration release UX with validated/impact states and configuration diff

## Compatibility
V4 source gates continue to pass in the V5 tree. Historical V3/V4 evidence is retained for lineage.


## Release certification

- V4 compatibility route/domain source gates remain green.
- 45/45 V5 Platform Administration control-plane contract groups pass.
- 202 TypeScript/TSX files parse with zero syntax diagnostics.
- Candidate archive passed compressed-data integrity, forbidden-artifact scan, 289-file SHA-256 manifest verification and clean-extraction `npm run validate:v5:release`.
- Dependency-backed typecheck/test/build and rendered-browser certification remain explicitly outside the current sandbox certification boundary because the npm dependency tree is incomplete.

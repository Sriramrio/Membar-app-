# V6 Current Navigation / Action Inventory

Regenerated during SETHU V7.1 runtime hardening from the canonical route/action architecture.

## Navigation authorities
- `src/navigation/useAppNavigation.ts` — canonical guarded navigation and origin/back recovery.
- `src/features/member/navigation/useMemberNavigation.ts` — Member navigation wrapper.
- `src/routes` and canonical route registry — route ownership and lazy loading.

## Current runtime rules
- Unsafe canonical paths are rejected observably and safely instead of becoming silent no-ops.
- Internal links are validated by `scripts/validate-v6-internal-link-integrity.mjs`.
- Member route/deep-link continuity is validated by deep-link and cross-resource validators.
- Detailed interactive control scan is `SETHU_V7_1_ACTION_INVENTORY.csv`.

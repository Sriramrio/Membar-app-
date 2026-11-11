# V5 Hardcode Audit

## Classification rule

Remaining literals are classified as:
1. **Technical invariant** — code-level protocol/route/storage/schema mechanics.
2. **Backward-compatibility mapping** — required to interpret V4 records/routes/statuses.
3. **Seed/demo data** — reference data used by the runnable prototype only.
4. **Runtime business configuration** — must live in the V5 control plane.

## Runtime business configuration moved into the control plane

- module availability and approved route roots
- action/permission metadata and risks
- organisation-unit types/hierarchy
- role catalogue and access policies
- RACI/workflow transitions
- SLA and maker/checker policy
- configurable forms
- taxonomy and matching weights
- notification events/templates/routes
- promotion caps/approval policy
- import mappings/required fields/duplicate rules/post targets/reversal
- integration/webhook retry/health/rate policy and secret references
- data-quality rules
- typed settings and overrides
- feature flags
- retention policies
- numbering patterns

## Accepted technical invariants / compatibility literals

- React route component filenames and approved route IDs
- Redux action type strings used as runtime integration identifiers
- V4 status names required to load historic records
- storage namespace keys
- schema/version identifiers
- supported UI field/widget types
- supported delivery channels and integration protocol categories
- safe preview seed identities/data used only in explicit QA mode

## Security-specific result

- no universal static preview OTP
- no universal static preview password
- no native `window.prompt` / `window.confirm` business actions
- integration secret **values** are not accepted/displayed; only secret references are modelled

No known business-rule hardcode identified by the V5 source contract is left unclassified. Production backend policy enforcement remains an external deployment boundary documented in the validation report.

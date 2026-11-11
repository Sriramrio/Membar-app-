# V5 Workflow Inventory

## Native V5 blueprints
- `configuration.change` — governed Platform configuration release lifecycle.
- `membership.onboarding` — membership due-diligence/onboarding decision flow.

## V4-compatible workflows referenced/consumed by modules
- attendance correction
- payment reconciliation
- governance decision
- opportunity moderation
- data-quality remediation
- affiliation/certification and related V4 governed flows where present.

V4 workflows are hydrated as version 4 definitions and continue under the V4 state machine when no V5 blueprint supersedes them. New/active V5 blueprints are authoritative for matching workflow instances.

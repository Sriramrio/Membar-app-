# SETHU V7.1 Interaction Notes Security Model

## Canonical model
`MemberInteractionNote` contains author, target, optional Business, domain context type/ID, note type, text, visibility and timestamps. Contexts include General, Opportunity, Meeting, Transaction, Reference and Business.

## Visibility
Only `Private` and `Participants` are permitted by the canonical note type. Member quick-note experiences default to `Private`. Notes are never network-public.

## Client/preview guards
Preview reducer validates valid non-suspended author/target, rejects self-target Notes and keeps Notes in a separate domain collection.

## Mandatory production-server rules
- Derive author identity from the authenticated actor; never trust a client-supplied author ID as authority.
- Private Notes are readable only by author plus explicitly governed audit/administrative access.
- Participants Notes require real participation/context authorization.
- Validate access to linked Opportunity/Meeting/Transaction/Reference/Business.
- Do not emit Note text to telemetry/logging.
- Enforce tenant/organisation scope and rate/size validation.

The uploaded package does not contain the backend/database implementation; these rules are included in the backend handshake and integration matrix and must be implemented there before production acceptance.

# SETHU V7.1 Relationship Workspace Design

Member and Business detail pages now act as contextual relationship workspaces without replacing canonical domain pages.

## Member context
Connected-member context exposes Converse, One-to-One, relationship Note, Opportunities, References and Business Outcomes with viewer-relative counts/activity.

## Business context
Business detail retains representative and business discovery while adding private relationship-note entry for the primary representative.

## Opportunity context
Opportunity detail can create a private Opportunity-context relationship Note, preserving the Opportunity as the canonical opportunity record.

## One-to-One context
Meeting completion separates: outcome, follow-up, private working Note and shared participant note. The async-safe shared dialog retains input when a mutation fails.

## Business Outcome / Transaction context
Transaction Notes are contextual interaction Notes and remain separate from proof/evidence (`proofNote`) semantics.

## Converse distinction
Converse remains communication. `MemberInteractionNote` is structured relationship memory and is not implemented as a chat message.

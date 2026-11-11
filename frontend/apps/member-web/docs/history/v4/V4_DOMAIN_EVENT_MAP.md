# SETHU V4 — Cross-Domain Event Map

V4 converts the platform from a collection of screens into a set of connected domain outcomes. This map documents the important implemented effects.

| Trigger | Preconditions / governance | Domain mutation | Cross-domain effect | Notification | Audit / failure behavior |
|---|---|---|---|---|---|
| Connection requested | Valid member, target not blocked/duplicate | Connection created | Relationship state available to Member Detail/Connections/Messaging | `connection.requested` | Governed mutation/audit path |
| Affiliation requested | Member + Business + affiliation details | Pending `MemberBusinessAffiliation` + workflow task | Enters `WFD-affiliation` approval | Decision notification | Workflow enforces RACI/action/state |
| Affiliation approved | Workflow approved by eligible actor | Affiliation becomes Verified | Business owners/representatives updated; primary set when appropriate | `business.affiliation.decided` | Decision/action audit |
| Affiliation ended | Active affiliation + required reason | `active=false`, end date/reason retained | Primary/representation recalculated without deleting history | — | Historical record preserved |
| Certification submitted | Business + certification/evidence | Pending `CertificationRecord` | Moderation case automatically opened | — | Pending standard excluded from verified search |
| Certification verified | Moderation reviewer decision | Certification becomes Verified | Business verified certification list + Directory filter become active | `certification.reviewed` | Moderation resolution audited |
| Certification rejected | Moderation reviewer decision | Certification Rejected | Verified business certification removed unless another verified record supports it | `certification.reviewed` | Moderation resolution audited |
| Opportunity question asked | Visible/open opportunity | `OpportunityQuestion` created | Owner receives clarification context on Opportunity Detail | — | Domain state retained |
| Opportunity response moved to discussion | Legal response state | Response status changes | Linked/open conversation created for commercial discussion | — | Illegal transition denied/audited |
| Opportunity awarded | Valid supplier response | Winner accepted, others updated, opportunity closed | Transaction created + Supplier business relationship created | `opportunity.awarded` | Award/action audit |
| Reference status changed | Legal reference state | Reference moves lifecycle state | Both parties see action/follow-up state | `reference.status.changed` | Illegal transition → Denied audit + correlation feedback |
| Meeting completed | Legal meeting transition | Meeting becomes completed | Outcome/follow-up/thank-you journey becomes actionable | `meeting.completed` | Illegal transition denied |
| Transaction status changed | Legal transaction transition | Commercial outcome stage changes | Buyer/counterparty status synchronized in shared domain | `transaction.status.changed` | Illegal transition denied |
| Event registration | Registration window open + form requirements/terms | Registration metadata + answers saved | Attendance context created; capacity may place member on waitlist | — | Form version retained |
| Event cancellation / waitlist promotion | Capacity/waitlist rules | Registration state changes | Next eligible waitlisted registration can be promoted | `event.waitlist.promoted` | Event state/audit context |
| Visitor verified | Correct unexpired challenge | Visitor verified | Record can proceed to duplicate review/due diligence | — | Invalid/expired OTP rejected |
| Visitor due diligence approved | Workflow + independent decision | Visitor approved | Activation creates Member + Business + Payment + Notification while retaining visitor link | Welcome notification | Maker/checker + audit |
| Import posted | Validated batch, maker submit, checker approval | Batch Posted + applied-record ledger | Attendance/Payment/Member/Visitor rows materially created/updated | — | Applied IDs recorded |
| Import reversed | Posted/reconciled batch + authorised reversal | Batch Reversed | Imported rows removed/reverted using ledger | — | Reversal audited |
| Effective role assignment approved | No illegal exclusive-office overlap; governance where required | Assignment activated | Live permission/workspace calculation changes | `role.assignment.changed` | Assignment/governance audit |
| Handover advanced | Legal handover transition | Planned/In Progress/Blocked/Complete | Historical predecessor/successor context retained | — | Illegal transition Denied; completion requires successor |
| Data-quality remediation proposed | Assigned issue | Status `Resolution Proposed` + workflow task | Checker decision required before actual resolution | — | Maker/checker prevents self-approval |
| DQ workflow approved | Eligible independent actor | Issue Resolved | Data Quality Centre updates actual issue | — | Decision audit |
| Governance decision approved | Quorum met, conflicts/recusals handled | Final immutable decision state | Applies configured effect: policy, exception, role assignment or platform setting | Relevant domain notification where configured | Rationale/effect audit |
| Notification template changed | Platform Admin control plane | Template/config version updated | Subsequent supported domain events render configured message | N/A | Configuration audit |
| Promotion policy changed | Platform Admin control plane | Active policy changes | Runtime promotion eligibility/frequency logic consumes new policy | N/A | Policy/lifecycle audit |

## Design rule

A V4 integration is considered meaningful only when the triggering action changes the related domain state or runtime policy; a status-only cosmetic change is not treated as a completed cross-link.

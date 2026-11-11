# V5 Domain Event Catalogue

| Event | Producer | Primary consumers |
|---|---|---|
| `MemberActivated` | Membership onboarding | Notification, audit, directory, analytics |
| `BusinessAffiliationApproved` | Affiliation workflow | Notification, relationship graph, directory, audit |
| `OpportunityAwarded` | Opportunity response/award | Transaction, relationship graph, notification, audit |
| `ConfigurationVersionActivated` | Platform Administration | Runtime sync, notification, audit |

The source model supports producer, payload metadata, consumers, notification-event mapping, workflow trigger, webhook availability, audit action, version and active state. Notification/webhook behavior is configured rather than embedded as user-facing text in functional pages.

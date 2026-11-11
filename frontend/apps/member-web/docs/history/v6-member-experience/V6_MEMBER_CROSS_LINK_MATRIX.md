# V6 Member Cross-Link Matrix

| From | To | Implemented navigation behavior |
|---|---|---|
| Member | Business | Member detail links associated business; origin retained |
| Member | Meeting | Member-filtered meeting destination |
| Member | Reference | Member-filtered reference destination |
| Member | Conversation | Direct messaging context retained |
| Business | Member | Verified representatives are navigable |
| Business | Opportunity | Business-filtered opportunity context |
| Business | Reference | Business-filtered references |
| Business | Transaction / Outcome | Business-filtered outcomes |
| Meeting | Member | Participant identities navigable |
| Meeting | Business | Participant businesses navigable |
| Meeting | Reference | Related reference context exposed when present |
| Reference | Member / Business | Source/target entities navigable |
| Reference | Transaction | Related outcome filter supported |
| Transaction | Business | Participating businesses navigable |
| Transaction | Opportunity | Source opportunity navigable |
| Transaction | Reference | Source reference filter supported |
| Conversation | Business / Opportunity / Meeting / Reference | Context header returns to linked entity |
| Attendance | Event | Personal attendance deep-links to event |

V6 does not create a second relationship database for these links; it navigates existing V5 domain identifiers and query context through the NavigationOrigin service.

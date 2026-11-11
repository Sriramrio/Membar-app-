# V6 Member Dashboard Metric Catalogue

The implemented central registry includes these Member metric codes:

- `member.connections.active`
- `member.connections.new`
- `member.meetings.requested`
- `member.meetings.accepted`
- `member.meetings.completed`
- `member.references.given`
- `member.references.received`
- `member.references.closed`
- `member.opportunities.posted`
- `member.opportunities.responsesReceived`
- `member.opportunities.responsesSubmitted`
- `member.opportunities.responsesShortlisted`
- `member.opportunities.responsesAccepted`
- `member.transactions.active`
- `member.transactions.won`
- `member.events.registered`
- `member.events.attended`
- `member.events.attendanceRate`
- `member.profile.completeness`
- `member.business.completeness`

Each registered metric carries label/description, source/calculation semantics, period behavior, privacy/permission classification and drill-down metadata. Dashboard components consume the projection/catalogue rather than reimplementing KPI arithmetic locally.

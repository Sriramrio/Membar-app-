# V6 Chapter Performance Metric Catalogue

The Member-facing Chapter projection implements these aggregate metric codes:

- `chapter.members.active`
- `chapter.businesses.active`
- `chapter.members.activated`
- `chapter.members.profileCompleteness`
- `chapter.businesses.profileCompleteness`
- `chapter.connections.created`
- `chapter.meetings.completed`
- `chapter.references.exchanged`
- `chapter.references.closed`
- `chapter.opportunities.published`
- `chapter.responses.submitted`
- `chapter.opportunities.awarded`
- `chapter.outcomes.confirmed`
- `chapter.events.held`
- `chapter.events.registrations`
- `chapter.events.attendance`
- `chapter.events.attendanceRate`
- `chapter.visitors.registered`
- `chapter.certifications.verified`
- `chapter.capabilities.active`

Chapter metrics are produced by `ChapterMemberViewProjection`, not the Management dashboard. They are subject to Chapter membership/scope, configured metric availability and minimum aggregation. Member context does not inherit Management actions.

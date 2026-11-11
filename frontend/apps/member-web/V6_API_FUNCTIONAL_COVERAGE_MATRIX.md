# V6 API Functional Coverage Matrix

Regenerated against the current V7.1 frontend contract. Production mutations remain server-authoritative.

## Member queries
- `member.directory.businesses` — frontend query contract present
- `member.directory.people` — frontend query contract present
- `member.opportunities.marketplace` — frontend query contract present
- `member.notifications.list` — frontend query contract present
- `member.converse.inbox` — frontend query contract present
- `member.converse.messages` — frontend query contract present
- `member.attendance.list` — frontend query contract present
- `member.references.list` — frontend query contract present
- `member.transactions.list` — frontend query contract present
- `member.meetings.list` — frontend query contract present

## Governed Member commands
- `member.profile.update` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `family.update` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `business.update` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `business.affiliation.request` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `business.affiliation.end` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `business.affiliation.set-primary` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `business.certification.upsert` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `connection.request` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `connection.respond` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `connection.cancel` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `connection.remove` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `connection.block` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `converse.conversation.create` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `converse.chapter-group.create` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `converse.conversation.join` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `converse.conversation.leave` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `converse.conversation.flag` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `converse.conversation.read` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `converse.message.send` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `meeting.create` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `meeting.update` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `meeting.poll` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `event.rsvp` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `event.rsvp.cancel` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `attendance.correction.request` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `reference.create` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `reference.status.update` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `opportunity.status.update` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `opportunity.response.submit` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `opportunity.response.status` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `opportunity.question.ask` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `opportunity.question.answer` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `opportunity.award` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `transaction.create` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `transaction.status.update` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `notifications.mark-all-read` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `notification.mark-read` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `notification.acknowledge` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `announcement.acknowledge` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `thank-you.create` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `thank-you.acknowledge` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `support.create` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `promotion.event.record` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency
- `member.interaction-note.create` — frontend command contract present; backend must enforce authorization, validation, idempotency and concurrency

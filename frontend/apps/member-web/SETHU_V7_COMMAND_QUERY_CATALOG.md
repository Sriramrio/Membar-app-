# SETHU V7 Command / Query Catalog

## Member server queries
- `member.directory.businesses`
- `member.directory.people`
- `member.opportunities.marketplace`
- `member.notifications.list`
- `member.converse.inbox`
- `member.converse.messages`
- `member.attendance.list`
- `member.references.list`
- `member.transactions.list`
- `member.meetings.list`

## Governed Member commands
- `member.profile.update`
- `family.update`
- `business.update`
- `business.affiliation.request`
- `business.affiliation.end`
- `business.affiliation.set-primary`
- `business.certification.upsert`
- `connection.request`
- `connection.respond`
- `connection.cancel`
- `connection.remove`
- `connection.block`
- `converse.conversation.create`
- `converse.chapter-group.create`
- `converse.conversation.join`
- `converse.conversation.leave`
- `converse.conversation.flag`
- `converse.conversation.read`
- `converse.message.send`
- `meeting.create`
- `meeting.update`
- `meeting.poll`
- `event.rsvp`
- `event.rsvp.cancel`
- `attendance.correction.request`
- `reference.create`
- `reference.status.update`
- `opportunity.status.update`
- `opportunity.response.submit`
- `opportunity.response.status`
- `opportunity.question.ask`
- `opportunity.question.answer`
- `opportunity.award`
- `transaction.create`
- `transaction.status.update`
- `notifications.mark-all-read`
- `notification.mark-read`
- `notification.acknowledge`
- `announcement.acknowledge`
- `thank-you.create`
- `thank-you.acknowledge`
- `support.create`
- `promotion.event.record`
- `member.interaction-note.create`


`member.interaction-note.create` is new in V7.1 runtime hardening. The authenticated server actor is authoritative for note authorship.

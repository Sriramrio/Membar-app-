# V6 Member Navigation Map

## Primary Member information architecture

- **My Dashboard** — `/app/dashboard`
- **Discover** — Home, Directory, Categories, Suggestions and discovery surfaces
- **My Network** — Connections, Meetings, References and related network flows
- **Business** — Opportunities, My Opportunities, My Responses, Business Outcomes and Saved items
- **Community** — Events, Calendar, Announcements, Messages, Gallery, News and Resources
- **My Account** — Profile, Businesses, Membership, Attendance, Payments, Activity, Notifications/Settings, Privacy, Security, Install/Offline and Support

All V5 Member deep links remain valid. V6 changes navigation grouping and contextual entry points, not the underlying route contracts.

## Navigation context

`NavigationOrigin` preserves approved internal route, query/entity context, return label and per-workspace last context. Contextual back navigation rechecks the target against the V5 control plane before restoring it. Dirty Profile/Business editors can block navigation through the shared NavigationGuardDialog.

## Role context

The authenticated header centres the role context. A Member with no effective secondary role sees only **Member**. Effective secondary assignments are sourced from the V5 Role Catalogue/assignment engine. Role changes preserve identity while changing workspace/permission/scope context and allow safe return to the last Member context.

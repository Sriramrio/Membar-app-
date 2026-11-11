import type { ScreenDefinition } from '@/types/screen';

export const screenCatalog = [
  {
    "id": 1,
    "title": "Workspace Hub",
    "route": "/workspace",
    "workspace": "Workspace",
    "purpose": "Branch authenticated users into the correct portal, role, organisational unit and effective period.",
    "requiredData": [
      "Identity.",
      "base chapter.",
      "active role assignments.",
      "unit scope.",
      "tenure.",
      "pending tasks.",
      "last-used workspace"
    ],
    "primaryActions": [
      "Open portal.",
      "switch role/unit.",
      "inspect role details.",
      "sign out"
    ],
    "roles": [
      "Authenticated users with one or more contexts.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Reject expired, future, revoked or conflicting assignments"
    ],
    "audit": [
      "Workspace selection and policy-context creation"
    ],
    "ux": [
      "Skip this screen when only member access exists",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Member, Management, Governance or Platform portal",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "If exactly one valid context remains, skip the hub; if no context remains, show member/support-safe status instead of a blank portal",
      "Permit last-used context only when it is still active, unrevoked and allowed on the current device/session"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Overlapping assignments, future-dated appointment, expired delegation, same role at multiple units, or emergency revocation during selection"
    ],
    "negativeTests": [
      "EX-workspace-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-workspace-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-workspace-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-workspace-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-workspace-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "400/422 validation: show a summary, associate field errors, focus the first invalid field and retain all safe input",
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Discard stale cached context and force a fresh entitlement read before portal entry"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 2,
    "title": "Member Home",
    "route": "/app/home",
    "workspace": "Member",
    "purpose": "Provide the daily command centre for networking, transactions, attendance, interactions and pending actions.",
    "requiredData": [
      "KPIs: references given/received, transactions, one-to-ones, thank-you notes, attendance, opportunities, connections.",
      "next meeting.",
      "announcements.",
      "tasks"
    ],
    "primaryActions": [
      "Drill into metric.",
      "quick add.",
      "respond to poll.",
      "continue draft.",
      "view notifications"
    ],
    "roles": [
      "Active Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Required fields, format, duplicates, lifecycle state and permission",
      "Protect against double submission with idempotency and optimistic concurrency"
    ],
    "audit": [
      "Dashboard reads need not be audited unless privileged; mutations are"
    ],
    "ux": [
      "Show metric definition, period and freshness; do not create an opaque score",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Directory, network, opportunities, calendar or own records",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input"
    ],
    "negativeTests": [
      "EX-app-home-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-home-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-home-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-home-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-home-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "400/422 validation: show a summary, associate field errors, focus the first invalid field and retain all safe input",
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 3,
    "title": "Smart Member & Business Directory",
    "route": "/app/directory",
    "workspace": "Member",
    "purpose": "Search same-chapter members fully and discover privacy-safe previews outside the chapter.",
    "requiredData": [
      "Search.",
      "category.",
      "product/service keywords.",
      "capability.",
      "location.",
      "certification.",
      "chapter.",
      "connection status.",
      "visibility"
    ],
    "primaryActions": [
      "Filter.",
      "sort.",
      "save search.",
      "open profile.",
      "request connection.",
      "report profile"
    ],
    "roles": [
      "Active Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Restricted fields never enter the search index"
    ],
    "audit": [
      "Search export and restricted profile access when applicable"
    ],
    "ux": [
      "Contact actions outside the base chapter remain gated until connection approval",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Member or business detail",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Search by member, business, category, product/service, capability, geography or governed synonym",
      "If no result exists, clear filters, suggest related categories or allow a governed connection/discovery request"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Search index is stale; a profile becomes restricted; category is merged; result belongs to a blocked member; query is too broad or abuse-like",
      "Saved item is no longer visible, has moved to a successor record or is outside current scope"
    ],
    "negativeTests": [
      "EX-app-directory-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-directory-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-directory-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-directory-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-directory-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Search timeout returns partial/clearly marked results only when safe; never silently mix stale and current authorization"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Offer Clear filters, Retry search and Report incorrect result; revalidate visibility on detail open"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 4,
    "title": "Category Index",
    "route": "/app/categories",
    "workspace": "Member",
    "purpose": "Browse governed business categories and see member/business counts by category.",
    "requiredData": [
      "Category hierarchy.",
      "synonyms.",
      "descriptions.",
      "member count.",
      "business count.",
      "related categories"
    ],
    "primaryActions": [
      "Search category.",
      "open category.",
      "view matching businesses"
    ],
    "roles": [
      "Active Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Use active taxonomy version and avoid duplicate/self-created uncontrolled categories"
    ],
    "audit": [
      "Record meaningful create/update/decision/status changes with actor, active role, scope, timestamp and correlation ID"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Filtered directory",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Search by member, business, category, product/service, capability, geography or governed synonym",
      "If no result exists, clear filters, suggest related categories or allow a governed connection/discovery request"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Search index is stale; a profile becomes restricted; category is merged; result belongs to a blocked member; query is too broad or abuse-like",
      "Saved item is no longer visible, has moved to a successor record or is outside current scope"
    ],
    "negativeTests": [
      "EX-app-categories-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-categories-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-categories-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-categories-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-categories-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Search timeout returns partial/clearly marked results only when safe; never silently mix stale and current authorization"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Offer Clear filters, Retry search and Report incorrect result; revalidate visibility on detail open"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 5,
    "title": "Member Detail",
    "route": "/app/members/:id",
    "workspace": "Member",
    "purpose": "Present a member identity, role badges, trusted profile and permitted contact actions.",
    "requiredData": [
      "Photo.",
      "name.",
      "base chapter.",
      "current roles.",
      "headline.",
      "short bio.",
      "business links.",
      "interests.",
      "permitted contact.",
      "connection state"
    ],
    "primaryActions": [
      "Connect.",
      "message when permitted.",
      "schedule one-to-one.",
      "give reference.",
      "block/report"
    ],
    "roles": [
      "Active Member subject to visibility.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Field-level visibility and blocked-user rules"
    ],
    "audit": [
      "Restricted-detail access and relationship actions"
    ],
    "ux": [
      "Differentiate current office from historical roles; display tenure",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Business detail, connection workflow or chat",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Open permitted preview, request connection, request correction or follow a merged-record redirect",
      "For protected identity/legal fields, route edits into a correction/approval workflow rather than direct save"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Duplicate member/business, changed ownership, pending approval, withdrawn consent, deceased/closed status, chapter transfer or historical role badge",
      "A public/search preview exists but contact, family, payment or commercial fields remain restricted"
    ],
    "negativeTests": [
      "EX-app-members-id-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-members-id-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-members-id-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-members-id-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-members-id-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Duplicate detection returns candidates without leaking protected details; user must confirm or escalate merge review"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Preserve original and successor lineage; show approval status and avoid replacing approved data with an unapproved draft"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 6,
    "title": "Business Detail",
    "route": "/app/businesses/:id",
    "workspace": "Member",
    "purpose": "Show a searchable MSME/business profile and enable relevant networking.",
    "requiredData": [
      "Legal/trade name.",
      "short write-up.",
      "products/services.",
      "categories.",
      "capabilities.",
      "capacity.",
      "locations.",
      "certifications.",
      "markets.",
      "media.",
      "member owners"
    ],
    "primaryActions": [
      "Connect.",
      "enquire.",
      "share opportunity.",
      "save.",
      "report correction"
    ],
    "roles": [
      "Active Member subject to visibility.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Only approved business fields and active associations are shown"
    ],
    "audit": [
      "Record meaningful create/update/decision/status changes with actor, active role, scope, timestamp and correlation ID"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Connection request, opportunity or member detail",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Open permitted preview, request connection, request correction or follow a merged-record redirect",
      "For protected identity/legal fields, route edits into a correction/approval workflow rather than direct save"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Duplicate member/business, changed ownership, pending approval, withdrawn consent, deceased/closed status, chapter transfer or historical role badge",
      "A public/search preview exists but contact, family, payment or commercial fields remain restricted"
    ],
    "negativeTests": [
      "EX-app-businesses-id-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-businesses-id-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-businesses-id-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-businesses-id-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-businesses-id-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Duplicate detection returns candidates without leaking protected details; user must confirm or escalate merge review"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Preserve original and successor lineage; show approval status and avoid replacing approved data with an unapproved draft"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 7,
    "title": "Connection Suggestions",
    "route": "/app/suggestions",
    "workspace": "Member",
    "purpose": "Offer explainable, privacy-safe member/business suggestions based on declared needs and categories.",
    "requiredData": [
      "Suggestion reason.",
      "mutual context.",
      "category/need match.",
      "chapter.",
      "visibility.",
      "dismissal history"
    ],
    "primaryActions": [
      "Connect.",
      "save.",
      "dismiss.",
      "tune preferences"
    ],
    "roles": [
      "Active Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Required fields, format, duplicates, lifecycle state and permission",
      "Protect against double submission with idempotency and optimistic concurrency"
    ],
    "audit": [
      "Connection request; preference changes; dismissal optional"
    ],
    "ux": [
      "Always display why suggested; do not infer sensitive attributes",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Member/business detail",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Search by member, business, category, product/service, capability, geography or governed synonym",
      "If no result exists, clear filters, suggest related categories or allow a governed connection/discovery request"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Search index is stale; a profile becomes restricted; category is merged; result belongs to a blocked member; query is too broad or abuse-like",
      "Saved item is no longer visible, has moved to a successor record or is outside current scope"
    ],
    "negativeTests": [
      "EX-app-suggestions-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-suggestions-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-suggestions-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-suggestions-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-suggestions-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Search timeout returns partial/clearly marked results only when safe; never silently mix stale and current authorization"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Offer Clear filters, Retry search and Report incorrect result; revalidate visibility on detail open"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 8,
    "title": "Saved Items",
    "route": "/app/saved",
    "workspace": "Member",
    "purpose": "Collect saved members, businesses, opportunities, events, resources and searches.",
    "requiredData": [
      "Item type.",
      "title.",
      "source.",
      "saved date.",
      "status.",
      "tags/notes.",
      "availability"
    ],
    "primaryActions": [
      "Open.",
      "remove.",
      "tag.",
      "export permitted list.",
      "run saved search"
    ],
    "roles": [
      "Active Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Respect current visibility even if item was previously saved"
    ],
    "audit": [
      "Record meaningful create/update/decision/status changes with actor, active role, scope, timestamp and correlation ID"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Original item detail",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Search by member, business, category, product/service, capability, geography or governed synonym",
      "If no result exists, clear filters, suggest related categories or allow a governed connection/discovery request"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Search index is stale; a profile becomes restricted; category is merged; result belongs to a blocked member; query is too broad or abuse-like",
      "Saved item is no longer visible, has moved to a successor record or is outside current scope"
    ],
    "negativeTests": [
      "EX-app-saved-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-saved-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-saved-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-saved-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-saved-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Search timeout returns partial/clearly marked results only when safe; never silently mix stale and current authorization"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Offer Clear filters, Retry search and Report incorrect result; revalidate visibility on detail open"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 9,
    "title": "Connections",
    "route": "/app/connections",
    "workspace": "Member",
    "purpose": "Manage incoming/outgoing connection requests and active/blocked relationships.",
    "requiredData": [
      "Member.",
      "business.",
      "chapter.",
      "request message.",
      "sent/received date.",
      "status.",
      "expiry.",
      "mutual context"
    ],
    "primaryActions": [
      "Accept.",
      "decline.",
      "withdraw.",
      "disconnect.",
      "block.",
      "message"
    ],
    "roles": [
      "Active Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "No messaging before acceptance outside permitted scope; rate/abuse controls"
    ],
    "audit": [
      "Request, decision, disconnect, block and actor context"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Member detail or chat",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Handle incoming, outgoing, mutual cross-requests, withdrawal, expiry, decline, disconnect, block and unblock through explicit states",
      "A current operational role may contact only for the permitted purpose and scope without creating a personal connection"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Simultaneous requests cross, recipient blocks sender during review, request expires, membership suspends, or user changes base Chapter",
      "Previously connected users lose permission for chat or restricted details after disconnect/revocation"
    ],
    "negativeTests": [
      "EX-app-connections-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-connections-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-connections-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-connections-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-connections-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Duplicate request returns the existing request; rate/abuse limit gives retry guidance without exposing recipient activity"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Recompute contact/chat permission from current relationship state after every decision"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 10,
    "title": "Business References",
    "route": "/app/references",
    "workspace": "Member",
    "purpose": "Track opportunity introductions/references given and received through their lifecycle.",
    "requiredData": [
      "From/to.",
      "business need.",
      "category.",
      "description.",
      "consent.",
      "status.",
      "due date.",
      "attachments.",
      "linked opportunity/transaction"
    ],
    "primaryActions": [
      "Create.",
      "accept.",
      "decline.",
      "update status.",
      "request clarification.",
      "close"
    ],
    "roles": [
      "Active Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Consent to share contact; commercial sensitivity; duplicate warning"
    ],
    "audit": [
      "Every lifecycle change and attachment metadata"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Reference detail, transaction or thank-you",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Save draft, request clarification, accept, decline, withdraw, expire, convert to opportunity/transaction or close without outcome",
      "If recipient is not yet connected, route through connection/consent before sharing restricted contact"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Consent is withdrawn, recipient/business becomes inactive, same lead is referred twice, prospect data is incomplete or disputed",
      "Reference is accepted by one party while the originator edits or withdraws it"
    ],
    "negativeTests": [
      "EX-app-references-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-references-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-references-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-references-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-references-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Duplicate warning must allow authorised comparison without disclosing another member’s confidential reference"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Version material edits; preserve prior consent/evidence and require explicit acknowledgement of updated information"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 11,
    "title": "Create Reference",
    "route": "/app/references/new",
    "workspace": "Member",
    "purpose": "Create a consented business introduction between eligible members.",
    "requiredData": [
      "Recipient.",
      "prospect/contact.",
      "need.",
      "category.",
      "context.",
      "expected follow-up.",
      "visibility.",
      "evidence"
    ],
    "primaryActions": [
      "Validate recipient.",
      "preview.",
      "submit.",
      "save draft"
    ],
    "roles": [
      "Active Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Connection/visibility permission; mandatory consent; no sensitive data in free text"
    ],
    "audit": [
      "Draft submission, final creation and consent source"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Reference confirmation/detail",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Save draft, request clarification, accept, decline, withdraw, expire, convert to opportunity/transaction or close without outcome",
      "If recipient is not yet connected, route through connection/consent before sharing restricted contact"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Consent is withdrawn, recipient/business becomes inactive, same lead is referred twice, prospect data is incomplete or disputed",
      "Reference is accepted by one party while the originator edits or withdraws it"
    ],
    "negativeTests": [
      "EX-app-references-new-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-references-new-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-references-new-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-references-new-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-references-new-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Duplicate warning must allow authorised comparison without disclosing another member’s confidential reference"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Version material edits; preserve prior consent/evidence and require explicit acknowledgement of updated information"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 12,
    "title": "Transactions",
    "route": "/app/transactions",
    "workspace": "Member",
    "purpose": "Record outcomes related to references/opportunities with participant confirmation and restricted value visibility.",
    "requiredData": [
      "Parties.",
      "source reference/opportunity.",
      "stage.",
      "date.",
      "category.",
      "value band/exact value policy.",
      "evidence.",
      "confirmation state"
    ],
    "primaryActions": [
      "Create.",
      "confirm.",
      "dispute.",
      "correct.",
      "close.",
      "add thank-you"
    ],
    "roles": [
      "Active Member participant.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Participant eligibility, duplicate/idempotency and evidence rules"
    ],
    "audit": [
      "Create/confirm/dispute/correction/reversal"
    ],
    "ux": [
      "Never expose commercial value in broad dashboards",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Transaction detail/timeline",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Confirm, partially confirm, dispute, request evidence, correct, reverse, close or recognise without revealing commercial value",
      "Link to a reference/opportunity when available, or record an approved standalone outcome with justification"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Counterparties report different date/value/currency/stage, one party becomes inactive, evidence is withdrawn or a duplicate transaction is suspected",
      "Thank-you note is public/member-visible while the underlying transaction remains confidential"
    ],
    "negativeTests": [
      "EX-app-transactions-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-transactions-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-transactions-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-transactions-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-transactions-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Never resolve participant disagreement through last-write-wins; create a dispute/correction workflow"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Keep original claim immutable and append confirmations, disputes, corrections and reversals"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 13,
    "title": "One-to-One Meetings",
    "route": "/app/one-to-one",
    "workspace": "Member",
    "purpose": "Plan and record structured member-to-member meetings and agreed follow-ups.",
    "requiredData": [
      "Participants.",
      "date/time.",
      "mode/location.",
      "agenda.",
      "notes visibility.",
      "outcomes.",
      "follow-ups.",
      "completion confirmation"
    ],
    "primaryActions": [
      "Schedule.",
      "reschedule.",
      "complete.",
      "confirm.",
      "cancel.",
      "create follow-up"
    ],
    "roles": [
      "Connected Members; authorised same-chapter policy.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Both parties, time conflicts, completion confirmation and private notes separation"
    ],
    "audit": [
      "Schedule/status/outcome changes"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Calendar, member detail or activity",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Schedule, propose another time, reschedule, cancel, mark no-show, complete, request participant confirmation or create follow-up",
      "Support in-person, virtual and phone modes with timezone-aware calendar entry"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Time-zone/DST mismatch, overlapping meetings, participant suspended/blocked, one-sided completion or repeated reschedule",
      "Private notes and shared outcomes must remain separate"
    ],
    "negativeTests": [
      "EX-app-one-to-one-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-one-to-one-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-one-to-one-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-one-to-one-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-one-to-one-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Calendar/integration failure must not duplicate the meeting; show sync-pending separately from the authoritative SETHU record"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Use a stable meeting ID across reschedules and external-calendar retries"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 14,
    "title": "Thank-You Notes",
    "route": "/app/thank-you-notes",
    "workspace": "Member",
    "purpose": "Recognise verified business support without exposing confidential transaction details.",
    "requiredData": [
      "Recipient.",
      "linked reference/transaction.",
      "note.",
      "visibility.",
      "date.",
      "status"
    ],
    "primaryActions": [
      "Create.",
      "preview.",
      "publish.",
      "withdraw"
    ],
    "roles": [
      "Active Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Recipient/relationship and moderation policy; value optional/restricted"
    ],
    "audit": [
      "Publish/withdraw/moderation"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Activity or linked transaction",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Confirm, partially confirm, dispute, request evidence, correct, reverse, close or recognise without revealing commercial value",
      "Link to a reference/opportunity when available, or record an approved standalone outcome with justification"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Counterparties report different date/value/currency/stage, one party becomes inactive, evidence is withdrawn or a duplicate transaction is suspected",
      "Thank-you note is public/member-visible while the underlying transaction remains confidential"
    ],
    "negativeTests": [
      "EX-app-thank-you-notes-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-thank-you-notes-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-thank-you-notes-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-thank-you-notes-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-thank-you-notes-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Never resolve participant disagreement through last-write-wins; create a dispute/correction workflow"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Keep original claim immutable and append confirmations, disputes, corrections and reversals"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 15,
    "title": "Opportunity Marketplace",
    "route": "/app/opportunities",
    "workspace": "Member",
    "purpose": "Discover governed buy/sell/collaborate/tender opportunities relevant to member capabilities.",
    "requiredData": [
      "Type.",
      "title.",
      "category.",
      "summary.",
      "location.",
      "quantity.",
      "deadline.",
      "eligibility.",
      "visibility scope.",
      "owner.",
      "status"
    ],
    "primaryActions": [
      "Search.",
      "filter.",
      "save.",
      "open.",
      "express interest.",
      "report"
    ],
    "roles": [
      "Active Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Respect publication scope, expiry and blocked relationships"
    ],
    "audit": [
      "Record meaningful create/update/decision/status changes with actor, active role, scope, timestamp and correlation ID"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Opportunity detail",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, submit for approval, publish, pause, amend/reapprove, close, expire, withdraw or duplicate as a new version",
      "Respond, update before deadline, withdraw, ask a governed question or progress into reference/meeting/transaction"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Deadline passes during edit, eligibility/scope changes, owner is suspended, attachment fails scan, capacity/quantity is fulfilled or response is duplicated",
      "A published material edit changes audience, deadline or commercial terms and requires reapproval/recipient notice"
    ],
    "negativeTests": [
      "EX-app-opportunities-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-opportunities-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-opportunities-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-opportunities-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-opportunities-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Late/ineligible submissions are blocked consistently at UI and service boundaries; preserve a draft without claiming submission"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Show authoritative server time and version; notify affected respondents of approved material changes"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 16,
    "title": "Create Opportunity",
    "route": "/app/opportunities/new",
    "workspace": "Member",
    "purpose": "Publish a structured business need or offer to an authorised audience.",
    "requiredData": [
      "Type.",
      "title.",
      "category.",
      "description.",
      "quantity/unit.",
      "budget visibility.",
      "geography.",
      "deadline.",
      "eligibility.",
      "attachments.",
      "scope"
    ],
    "primaryActions": [
      "Save draft.",
      "preview audience.",
      "submit for approval/publish"
    ],
    "roles": [
      "Active Member subject to policy.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Required category/deadline; forbidden content; audience and approval rules"
    ],
    "audit": [
      "Draft/submission/approval/publication"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "My opportunities or workflow status",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, submit for approval, publish, pause, amend/reapprove, close, expire, withdraw or duplicate as a new version",
      "Respond, update before deadline, withdraw, ask a governed question or progress into reference/meeting/transaction"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Deadline passes during edit, eligibility/scope changes, owner is suspended, attachment fails scan, capacity/quantity is fulfilled or response is duplicated",
      "A published material edit changes audience, deadline or commercial terms and requires reapproval/recipient notice"
    ],
    "negativeTests": [
      "EX-app-opportunities-new-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-opportunities-new-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-opportunities-new-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-opportunities-new-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-opportunities-new-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Late/ineligible submissions are blocked consistently at UI and service boundaries; preserve a draft without claiming submission"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Show authoritative server time and version; notify affected respondents of approved material changes"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 17,
    "title": "Opportunity Detail",
    "route": "/app/opportunities/:id",
    "workspace": "Member",
    "purpose": "Present complete permitted opportunity details, response workflow and update history.",
    "requiredData": [
      "Owner.",
      "status.",
      "scope.",
      "specifications.",
      "attachments.",
      "response deadline.",
      "Q&A.",
      "related updates"
    ],
    "primaryActions": [
      "Respond.",
      "ask question.",
      "save.",
      "share.",
      "withdraw response.",
      "report"
    ],
    "roles": [
      "Eligible Active Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Deadline, eligibility, connection/contact privacy and attachment scanning"
    ],
    "audit": [
      "Response and owner status changes"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Response form/status",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, submit for approval, publish, pause, amend/reapprove, close, expire, withdraw or duplicate as a new version",
      "Respond, update before deadline, withdraw, ask a governed question or progress into reference/meeting/transaction"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Deadline passes during edit, eligibility/scope changes, owner is suspended, attachment fails scan, capacity/quantity is fulfilled or response is duplicated",
      "A published material edit changes audience, deadline or commercial terms and requires reapproval/recipient notice"
    ],
    "negativeTests": [
      "EX-app-opportunities-id-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-opportunities-id-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-opportunities-id-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-opportunities-id-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-opportunities-id-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Late/ineligible submissions are blocked consistently at UI and service boundaries; preserve a draft without claiming submission"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Show authoritative server time and version; notify affected respondents of approved material changes"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 18,
    "title": "My Opportunities",
    "route": "/app/opportunities/my",
    "workspace": "Member",
    "purpose": "Manage opportunities created by the current member and their response pipeline.",
    "requiredData": [
      "Draft/pending/published/closed counts.",
      "title.",
      "audience.",
      "views policy.",
      "responses.",
      "deadline.",
      "status"
    ],
    "primaryActions": [
      "Edit draft.",
      "submit.",
      "pause.",
      "close.",
      "inspect responses.",
      "duplicate"
    ],
    "roles": [
      "Opportunity Owner.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Published edits may require reapproval and versioning"
    ],
    "audit": [
      "All material edits and status transitions"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Opportunity editor/detail",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, submit for approval, publish, pause, amend/reapprove, close, expire, withdraw or duplicate as a new version",
      "Respond, update before deadline, withdraw, ask a governed question or progress into reference/meeting/transaction"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Deadline passes during edit, eligibility/scope changes, owner is suspended, attachment fails scan, capacity/quantity is fulfilled or response is duplicated",
      "A published material edit changes audience, deadline or commercial terms and requires reapproval/recipient notice"
    ],
    "negativeTests": [
      "EX-app-opportunities-my-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-opportunities-my-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-opportunities-my-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-opportunities-my-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-opportunities-my-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Late/ineligible submissions are blocked consistently at UI and service boundaries; preserve a draft without claiming submission"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Show authoritative server time and version; notify affected respondents of approved material changes"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 19,
    "title": "My Responses",
    "route": "/app/responses/my",
    "workspace": "Member",
    "purpose": "Track expressions of interest and responses submitted to opportunities.",
    "requiredData": [
      "Opportunity.",
      "response summary.",
      "submitted date.",
      "stage.",
      "owner feedback.",
      "next action.",
      "confidentiality"
    ],
    "primaryActions": [
      "Open.",
      "update before deadline.",
      "withdraw.",
      "message when allowed"
    ],
    "roles": [
      "Responding Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Required fields, format, duplicates, lifecycle state and permission",
      "Protect against double submission with idempotency and optimistic concurrency"
    ],
    "audit": [
      "Submit/update/withdraw"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Opportunity detail or permitted conversation",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, submit for approval, publish, pause, amend/reapprove, close, expire, withdraw or duplicate as a new version",
      "Respond, update before deadline, withdraw, ask a governed question or progress into reference/meeting/transaction"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Deadline passes during edit, eligibility/scope changes, owner is suspended, attachment fails scan, capacity/quantity is fulfilled or response is duplicated",
      "A published material edit changes audience, deadline or commercial terms and requires reapproval/recipient notice"
    ],
    "negativeTests": [
      "EX-app-responses-my-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-responses-my-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-responses-my-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-responses-my-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-responses-my-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Late/ineligible submissions are blocked consistently at UI and service boundaries; preserve a draft without claiming submission"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Show authoritative server time and version; notify affected respondents of approved material changes"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 20,
    "title": "Opportunity Response",
    "route": "/app/opportunities/:id/respond",
    "workspace": "Member",
    "purpose": "Submit a structured, private response to an opportunity.",
    "requiredData": [
      "Capability statement.",
      "quantity/capacity.",
      "location.",
      "timeline.",
      "commercial note.",
      "attachment.",
      "consent"
    ],
    "primaryActions": [
      "Save draft.",
      "validate.",
      "submit.",
      "withdraw"
    ],
    "roles": [
      "Eligible Active Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "One active response per member/business unless policy allows; scan files; deadline"
    ],
    "audit": [
      "Submission and content version metadata"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "My responses",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, submit for approval, publish, pause, amend/reapprove, close, expire, withdraw or duplicate as a new version",
      "Respond, update before deadline, withdraw, ask a governed question or progress into reference/meeting/transaction"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Deadline passes during edit, eligibility/scope changes, owner is suspended, attachment fails scan, capacity/quantity is fulfilled or response is duplicated",
      "A published material edit changes audience, deadline or commercial terms and requires reapproval/recipient notice"
    ],
    "negativeTests": [
      "EX-app-opportunities-id-respond-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-opportunities-id-respond-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-opportunities-id-respond-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-opportunities-id-respond-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-opportunities-id-respond-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Late/ineligible submissions are blocked consistently at UI and service boundaries; preserve a draft without claiming submission"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Show authoritative server time and version; notify affected respondents of approved material changes"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 21,
    "title": "Messages Inbox",
    "route": "/app/messages",
    "workspace": "Member",
    "purpose": "List authorised conversations, unread counts and safe message previews.",
    "requiredData": [
      "Participants.",
      "context.",
      "latest message preview.",
      "unread.",
      "muted/blocked.",
      "last activity"
    ],
    "primaryActions": [
      "Search.",
      "open.",
      "mute.",
      "archive.",
      "report"
    ],
    "roles": [
      "Active Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Required fields, format, duplicates, lifecycle state and permission",
      "Protect against double submission with idempotency and optimistic concurrency"
    ],
    "audit": [
      "Conversation creation, block/report and moderation; ordinary reads per policy"
    ],
    "ux": [
      "Do not cache full private messages offline by default",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Conversation",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Start from connection/reference/opportunity context; archive, mute, block, report or resume an authorised conversation",
      "Queue a permitted text draft offline, but require fresh permission before send; do not offline-cache message history by default"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Connection is revoked mid-composer, recipient blocks sender, attachment scan is pending/fails, duplicate send occurs or delivery/read receipt is delayed",
      "Conversation participant or linked business/member record is merged or removed"
    ],
    "negativeTests": [
      "EX-app-messages-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-messages-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-messages-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-messages-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-messages-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Show pending/failed/sent states separately; never display a failed message as delivered"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Retry with the same client message ID and reconcile server acknowledgement to prevent duplicates"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 22,
    "title": "Conversation",
    "route": "/app/messages/:conversationId",
    "workspace": "Member",
    "purpose": "Provide in-app communication only between authorised participants and contexts.",
    "requiredData": [
      "Participants.",
      "messages.",
      "timestamps.",
      "delivery/read state.",
      "attachment metadata.",
      "linked reference/opportunity"
    ],
    "primaryActions": [
      "Send.",
      "attach.",
      "reply.",
      "report.",
      "block.",
      "open linked context"
    ],
    "roles": [
      "Authorised conversation participants.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Permission rechecked on send; file scanning; size/type; rate and abuse rules"
    ],
    "audit": [
      "Message metadata, moderation and participant changes; content access restricted"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Inbox or linked record",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Start from connection/reference/opportunity context; archive, mute, block, report or resume an authorised conversation",
      "Queue a permitted text draft offline, but require fresh permission before send; do not offline-cache message history by default"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Connection is revoked mid-composer, recipient blocks sender, attachment scan is pending/fails, duplicate send occurs or delivery/read receipt is delayed",
      "Conversation participant or linked business/member record is merged or removed"
    ],
    "negativeTests": [
      "EX-app-messages-conversationId-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-messages-conversationId-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-messages-conversationId-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-messages-conversationId-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-messages-conversationId-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Show pending/failed/sent states separately; never display a failed message as delivered"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Retry with the same client message ID and reconcile server acknowledgement to prevent duplicates"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 23,
    "title": "Announcements",
    "route": "/app/announcements",
    "workspace": "Member",
    "purpose": "Show targeted, approved and in-date chapter/organisation communications.",
    "requiredData": [
      "Title.",
      "summary.",
      "publishing unit.",
      "audience.",
      "priority.",
      "publish/expiry.",
      "attachment.",
      "acknowledgement requirement"
    ],
    "primaryActions": [
      "Open.",
      "acknowledge.",
      "save.",
      "share where allowed"
    ],
    "roles": [
      "Active Member within audience.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Audience hierarchy and current membership"
    ],
    "audit": [
      "Publish lifecycle; mandatory acknowledgement"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Announcement detail or related event",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, preview audience, submit, schedule, publish, correct with version, withdraw, expire or archive",
      "Deep-link from notification only after current audience and publication status are validated"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Publish/expiry boundary occurs while open, audience hierarchy changes, attachment is replaced, acknowledgement becomes mandatory or content is retracted",
      "Recipient was eligible at notification time but not at open time"
    ],
    "negativeTests": [
      "EX-app-announcements-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-announcements-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-announcements-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-announcements-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-announcements-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Do not show withdrawn or newly restricted body text from stale cache; present a safe unavailability message"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Purge/revalidate cached content on withdrawal and preserve publication/version history"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 24,
    "title": "Calendar",
    "route": "/app/calendar",
    "workspace": "Member",
    "purpose": "Combine meetings, one-to-ones, events, deadlines and attendance polls in one personal view.",
    "requiredData": [
      "Month/week/agenda.",
      "event type.",
      "time zone.",
      "RSVP/poll status.",
      "unit.",
      "conflicts"
    ],
    "primaryActions": [
      "Filter.",
      "open item.",
      "RSVP.",
      "respond poll.",
      "add external calendar"
    ],
    "roles": [
      "Active Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Time zone, duplicate event and visibility rules"
    ],
    "audit": [
      "Record meaningful create/update/decision/status changes with actor, active role, scope, timestamp and correlation ID"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Meeting/event/one-to-one detail",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "RSVP yes/no/maybe, join waitlist, cancel, reschedule, respond to poll, check in, request correction or consume recording/minutes",
      "Handle event cancellation, venue-to-virtual conversion and session-level registration when configured"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Capacity fills during registration, duplicate registration, payment pending, poll closes during submit, meeting is rescheduled across time zones or QR/check-in is replayed",
      "Member eligibility changes after RSVP but before event/meeting"
    ],
    "negativeTests": [
      "EX-app-calendar-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-calendar-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-calendar-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-calendar-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-calendar-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Registration/check-in must be idempotent; capacity conflicts return waitlist/closed status rather than generic failure"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Notify affected users of approved schedule/venue changes and retain prior attendance/poll history"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 25,
    "title": "Meeting Detail & Attendance Poll",
    "route": "/app/meetings/:id",
    "workspace": "Member",
    "purpose": "Show chapter meeting details, agenda, poll, attendance state and authorised materials.",
    "requiredData": [
      "Title.",
      "unit.",
      "schedule.",
      "venue/link.",
      "agenda.",
      "poll options.",
      "RSVP.",
      "attendance.",
      "minutes publication state"
    ],
    "primaryActions": [
      "Respond poll.",
      "RSVP.",
      "check in.",
      "open materials.",
      "request correction"
    ],
    "roles": [
      "Eligible Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Poll window; one response; attendance correction window; meeting scope"
    ],
    "audit": [
      "Poll response, RSVP, attendance and correction"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Calendar or attendance record",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "RSVP yes/no/maybe, join waitlist, cancel, reschedule, respond to poll, check in, request correction or consume recording/minutes",
      "Handle event cancellation, venue-to-virtual conversion and session-level registration when configured"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Capacity fills during registration, duplicate registration, payment pending, poll closes during submit, meeting is rescheduled across time zones or QR/check-in is replayed",
      "Member eligibility changes after RSVP but before event/meeting"
    ],
    "negativeTests": [
      "EX-app-meetings-id-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-meetings-id-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-meetings-id-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-meetings-id-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-meetings-id-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Registration/check-in must be idempotent; capacity conflicts return waitlist/closed status rather than generic failure"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Notify affected users of approved schedule/venue changes and retain prior attendance/poll history"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 26,
    "title": "Member Event Detail",
    "route": "/app/events/:id",
    "workspace": "Member",
    "purpose": "Show member-only event information, registration and participation status.",
    "requiredData": [
      "Event.",
      "audience.",
      "agenda.",
      "speakers.",
      "capacity.",
      "fee/payment status.",
      "registration.",
      "QR/check-in policy"
    ],
    "primaryActions": [
      "Register.",
      "cancel.",
      "pay if enabled.",
      "add calendar.",
      "download confirmation"
    ],
    "roles": [
      "Eligible Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Capacity, duplicate registration, cancellation/refund and eligibility"
    ],
    "audit": [
      "Registration/payment/check-in"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Calendar, payment or registration confirmation",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "RSVP yes/no/maybe, join waitlist, cancel, reschedule, respond to poll, check in, request correction or consume recording/minutes",
      "Handle event cancellation, venue-to-virtual conversion and session-level registration when configured"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Capacity fills during registration, duplicate registration, payment pending, poll closes during submit, meeting is rescheduled across time zones or QR/check-in is replayed",
      "Member eligibility changes after RSVP but before event/meeting"
    ],
    "negativeTests": [
      "EX-app-events-id-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-events-id-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-events-id-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-events-id-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-events-id-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Registration/check-in must be idempotent; capacity conflicts return waitlist/closed status rather than generic failure"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Notify affected users of approved schedule/venue changes and retain prior attendance/poll history"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 27,
    "title": "Photo Gallery",
    "route": "/app/gallery",
    "workspace": "Member",
    "purpose": "Display approved event/chapter albums with privacy, captions and consent controls.",
    "requiredData": [
      "Album.",
      "event/unit.",
      "date.",
      "approved images.",
      "captions.",
      "photographer/source.",
      "consent status"
    ],
    "primaryActions": [
      "Browse.",
      "download if allowed.",
      "report.",
      "request removal"
    ],
    "roles": [
      "Active Member within audience.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Approval, image consent, retention and download policy"
    ],
    "audit": [
      "Upload/approval/removal/report"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Album/lightbox",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Upload individually or in batch; save draft album; moderate; approve; publish; unpublish; request removal or replace a failed asset",
      "Display accessible captions and consent status; restrict download when policy requires"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Partial upload, duplicate image, unsupported/corrupt media, malware result, consent revoked, subject requests removal or album/event is archived",
      "An image is already cached when it becomes restricted"
    ],
    "negativeTests": [
      "EX-app-gallery-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-gallery-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-gallery-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-gallery-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-gallery-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Failed files remain individually retryable; successful batch items are not re-uploaded"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Use resumable/stable upload IDs and issue cache invalidation on removal/restriction"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 28,
    "title": "News",
    "route": "/app/news",
    "workspace": "Member",
    "purpose": "List current member-visible news across authorised organisational scopes.",
    "requiredData": [
      "Headline.",
      "summary.",
      "unit.",
      "publish/expiry.",
      "category.",
      "media"
    ],
    "primaryActions": [
      "Filter.",
      "open.",
      "save.",
      "share according to classification"
    ],
    "roles": [
      "Active Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Audience and publication state"
    ],
    "audit": [
      "Record meaningful create/update/decision/status changes with actor, active role, scope, timestamp and correlation ID"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "News detail",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, preview audience, submit, schedule, publish, correct with version, withdraw, expire or archive",
      "Deep-link from notification only after current audience and publication status are validated"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Publish/expiry boundary occurs while open, audience hierarchy changes, attachment is replaced, acknowledgement becomes mandatory or content is retracted",
      "Recipient was eligible at notification time but not at open time"
    ],
    "negativeTests": [
      "EX-app-news-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-news-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-news-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-news-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-news-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Do not show withdrawn or newly restricted body text from stale cache; present a safe unavailability message"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Purge/revalidate cached content on withdrawal and preserve publication/version history"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 29,
    "title": "Partners",
    "route": "/app/partners",
    "workspace": "Member",
    "purpose": "Present approved ecosystem partners and the member benefit or engagement path.",
    "requiredData": [
      "Partner name.",
      "logo.",
      "category.",
      "description.",
      "benefit.",
      "contact/link.",
      "validity"
    ],
    "primaryActions": [
      "Open offer.",
      "enquire.",
      "report outdated information"
    ],
    "roles": [
      "Active Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Current agreement and permitted claims"
    ],
    "audit": [
      "Record meaningful create/update/decision/status changes with actor, active role, scope, timestamp and correlation ID"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Partner detail/external link",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, preview audience, submit, schedule, publish, correct with version, withdraw, expire or archive",
      "Deep-link from notification only after current audience and publication status are validated"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Publish/expiry boundary occurs while open, audience hierarchy changes, attachment is replaced, acknowledgement becomes mandatory or content is retracted",
      "Recipient was eligible at notification time but not at open time"
    ],
    "negativeTests": [
      "EX-app-partners-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-partners-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-partners-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-partners-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-partners-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Do not show withdrawn or newly restricted body text from stale cache; present a safe unavailability message"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Purge/revalidate cached content on withdrawal and preserve publication/version history"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 30,
    "title": "Resources",
    "route": "/app/resources",
    "workspace": "Member",
    "purpose": "Provide governed documents, templates, recordings and member guidance.",
    "requiredData": [
      "Title.",
      "type.",
      "owner.",
      "audience.",
      "version.",
      "published date.",
      "expiry.",
      "download policy"
    ],
    "primaryActions": [
      "Search.",
      "preview.",
      "download.",
      "acknowledge.",
      "report"
    ],
    "roles": [
      "Active Member within audience.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Required fields, format, duplicates, lifecycle state and permission",
      "Protect against double submission with idempotency and optimistic concurrency"
    ],
    "audit": [
      "Restricted downloads and acknowledgements"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Resource detail",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, preview audience, submit, schedule, publish, correct with version, withdraw, expire or archive",
      "Deep-link from notification only after current audience and publication status are validated"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Publish/expiry boundary occurs while open, audience hierarchy changes, attachment is replaced, acknowledgement becomes mandatory or content is retracted",
      "Recipient was eligible at notification time but not at open time"
    ],
    "negativeTests": [
      "EX-app-resources-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-resources-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-resources-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-resources-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-resources-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Do not show withdrawn or newly restricted body text from stale cache; present a safe unavailability message"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Purge/revalidate cached content on withdrawal and preserve publication/version history"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 31,
    "title": "Member Support",
    "route": "/app/support",
    "workspace": "Member",
    "purpose": "Give contextual self-help and authenticated case creation linked to relevant records.",
    "requiredData": [
      "Topic.",
      "knowledge results.",
      "affected record.",
      "description.",
      "attachment.",
      "urgency.",
      "status"
    ],
    "primaryActions": [
      "Search help.",
      "raise case.",
      "add evidence.",
      "view case status"
    ],
    "roles": [
      "Active Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Mask sensitive data; attachments scanned; urgency rules"
    ],
    "audit": [
      "Case lifecycle and support access"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Case confirmation/status",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input"
    ],
    "negativeTests": [
      "EX-app-support-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-support-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-support-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-support-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-support-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "400/422 validation: show a summary, associate field errors, focus the first invalid field and retain all safe input",
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 32,
    "title": "My Profile",
    "route": "/app/profile",
    "workspace": "Member",
    "purpose": "Maintain personal/professional profile data with per-field visibility and approval where required.",
    "requiredData": [
      "Name.",
      "photo.",
      "headline.",
      "bio.",
      "contacts.",
      "address.",
      "languages.",
      "interests.",
      "base chapter.",
      "current/historical roles.",
      "visibility"
    ],
    "primaryActions": [
      "Edit.",
      "preview as others.",
      "submit restricted changes.",
      "request correction"
    ],
    "roles": [
      "Current Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Verified contacts; visibility; protected identity fields use correction workflow"
    ],
    "audit": [
      "Profile changes, approvals and visibility changes"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Profile preview/activity",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Open permitted preview, request connection, request correction or follow a merged-record redirect",
      "For protected identity/legal fields, route edits into a correction/approval workflow rather than direct save"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Duplicate member/business, changed ownership, pending approval, withdrawn consent, deceased/closed status, chapter transfer or historical role badge",
      "A public/search preview exists but contact, family, payment or commercial fields remain restricted"
    ],
    "negativeTests": [
      "EX-app-profile-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-profile-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-profile-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-profile-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-profile-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Duplicate detection returns candidates without leaking protected details; user must confirm or escalate merge review"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Preserve original and successor lineage; show approval status and avoid replacing approved data with an unapproved draft"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 33,
    "title": "My Businesses",
    "route": "/app/businesses",
    "workspace": "Member",
    "purpose": "Manage one or more member-associated business profiles and approval status.",
    "requiredData": [
      "Legal/trade name.",
      "identifiers.",
      "write-up.",
      "categories.",
      "products/services.",
      "capacity.",
      "locations.",
      "certifications.",
      "media.",
      "owners.",
      "status"
    ],
    "primaryActions": [
      "Create.",
      "edit.",
      "submit.",
      "add evidence.",
      "preview.",
      "deactivate association"
    ],
    "roles": [
      "Current Member; authorised business editor.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Duplicate/legal identifier; category governance; evidence and approval"
    ],
    "audit": [
      "Business and association changes"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Business detail/workflow",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Open permitted preview, request connection, request correction or follow a merged-record redirect",
      "For protected identity/legal fields, route edits into a correction/approval workflow rather than direct save"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Duplicate member/business, changed ownership, pending approval, withdrawn consent, deceased/closed status, chapter transfer or historical role badge",
      "A public/search preview exists but contact, family, payment or commercial fields remain restricted"
    ],
    "negativeTests": [
      "EX-app-businesses-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-businesses-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-businesses-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-businesses-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-businesses-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Duplicate detection returns candidates without leaking protected details; user must confirm or escalate merge review"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Preserve original and successor lineage; show approval status and avoid replacing approved data with an unapproved draft"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 34,
    "title": "Family Information",
    "route": "/app/family",
    "workspace": "Member",
    "purpose": "Maintain optional family data for explicitly approved organisational purposes.",
    "requiredData": [
      "Relationship.",
      "name.",
      "limited contact.",
      "consent.",
      "purpose.",
      "visibility.",
      "retention"
    ],
    "primaryActions": [
      "Add.",
      "edit.",
      "remove.",
      "manage consent"
    ],
    "roles": [
      "Current Member only; tightly restricted operators.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Optional, purpose-bound, minimal and consented"
    ],
    "audit": [
      "Access and change events; no sensitive values in log"
    ],
    "ux": [
      "Exclude from search, analytics and offline cache",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "My profile",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input"
    ],
    "negativeTests": [
      "EX-app-family-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-family-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-family-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-family-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-family-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "400/422 validation: show a summary, associate field errors, focus the first invalid field and retain all safe input",
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 35,
    "title": "Membership",
    "route": "/app/membership",
    "workspace": "Member",
    "purpose": "Show membership number, base chapter, lifecycle, tenure history and renewal status.",
    "requiredData": [
      "Member ID.",
      "chapter.",
      "joined date.",
      "status.",
      "validity.",
      "plan.",
      "renewal.",
      "transfers.",
      "role history"
    ],
    "primaryActions": [
      "Renew.",
      "download permitted certificate.",
      "request transfer/correction"
    ],
    "roles": [
      "Current Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Required fields, format, duplicates, lifecycle state and permission",
      "Protect against double submission with idempotency and optimistic concurrency"
    ],
    "audit": [
      "Renewal, transfer and status changes"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Payments or workflow status",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input"
    ],
    "negativeTests": [
      "EX-app-membership-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-membership-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-membership-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-membership-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-membership-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "400/422 validation: show a summary, associate field errors, focus the first invalid field and retain all safe input",
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 36,
    "title": "My Attendance",
    "route": "/app/attendance",
    "workspace": "Member",
    "purpose": "Show finalised attendance, meeting eligibility, correction status and period summary.",
    "requiredData": [
      "Meeting.",
      "date.",
      "eligible status.",
      "present/absent/excused.",
      "source.",
      "finalised date.",
      "correction request"
    ],
    "primaryActions": [
      "Filter.",
      "open meeting.",
      "request correction.",
      "export own record"
    ],
    "roles": [
      "Current Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Only finalised attendance enters KPI; correction is append-only"
    ],
    "audit": [
      "Correction and export"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Meeting or correction case",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Manual capture, QR/check-in, API batch, file upload, correction request, excused absence, checker approval, finalise or reverse through linked correction",
      "Permit reconciliation by member ID, verified contact or governed mapping rule-never fuzzy auto-post without review"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Duplicate check-in, wrong meeting, ineligible member, late arrival, API/file mismatch, partial batch, reopened meeting or correction after reporting",
      "Meeting eligibility changes retroactively"
    ],
    "negativeTests": [
      "EX-app-attendance-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-attendance-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-attendance-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-attendance-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-attendance-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Row failures do not post silently; show batch totals for accepted, rejected, duplicate and unresolved rows"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Reprocess only failed/unposted rows with original source keys and preserve the initial batch"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 37,
    "title": "My Payments",
    "route": "/app/payments",
    "workspace": "Member",
    "purpose": "Show membership/event/payment obligations, receipts and reconciliation state.",
    "requiredData": [
      "Reference.",
      "type.",
      "period.",
      "amount.",
      "currency.",
      "due/paid date.",
      "method.",
      "status.",
      "receipt"
    ],
    "primaryActions": [
      "Pay where enabled.",
      "upload proof.",
      "download receipt.",
      "raise discrepancy"
    ],
    "roles": [
      "Current Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Server-calculated amount, duplicate payment and proof scan"
    ],
    "audit": [
      "Payment/proof/receipt/dispute"
    ],
    "ux": [
      "Mask payment identifiers and never cache proofs offline",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Payment detail or support",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "API/file/manual proof intake, auto-match, manual match, split/combined settlement if policy allows, exception, refund/reversal and receipt reissue",
      "Continue onboarding/event registration as payment-pending only when policy explicitly permits"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Duplicate gateway callback, amount/currency/period mismatch, partial payment, bank reversal, chargeback, proof rejected, member merge or payment received after expiry",
      "Receipt generated before downstream notification fails"
    ],
    "negativeTests": [
      "EX-app-payments-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-payments-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-payments-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-payments-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-payments-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Financial post is atomic and idempotent; ambiguous gateway timeout remains Pending verification-not Failed or Paid"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Reconcile from provider/source of truth before retry; correction/reversal is append-only and independently approved"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 38,
    "title": "My Activity",
    "route": "/app/activity",
    "workspace": "Member",
    "purpose": "Provide a member-readable timeline of own meaningful platform and workflow actions.",
    "requiredData": [
      "Time.",
      "action.",
      "object.",
      "status.",
      "portal.",
      "unit.",
      "outcome.",
      "link"
    ],
    "primaryActions": [
      "Filter.",
      "open related record.",
      "export permitted history"
    ],
    "roles": [
      "Current Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Hide internal security logic and other parties’ restricted data"
    ],
    "audit": [
      "Record meaningful create/update/decision/status changes with actor, active role, scope, timestamp and correlation ID"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Related record",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input"
    ],
    "negativeTests": [
      "EX-app-activity-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-activity-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-activity-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-activity-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-activity-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "400/422 validation: show a summary, associate field errors, focus the first invalid field and retain all safe input",
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 39,
    "title": "Privacy Settings",
    "route": "/app/settings/privacy",
    "workspace": "Member",
    "purpose": "Control permitted profile visibility, connection/contact preferences and consent.",
    "requiredData": [
      "Field visibility.",
      "directory discovery.",
      "contact permissions.",
      "consent versions.",
      "blocked members"
    ],
    "primaryActions": [
      "Change setting.",
      "review preview.",
      "withdraw optional consent.",
      "manage blocks"
    ],
    "roles": [
      "Current Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Mandatory processing cannot be presented as optional consent"
    ],
    "audit": [
      "Consent and visibility changes"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Profile preview",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input"
    ],
    "negativeTests": [
      "EX-app-settings-privacy-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-settings-privacy-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-settings-privacy-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-settings-privacy-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-settings-privacy-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "400/422 validation: show a summary, associate field errors, focus the first invalid field and retain all safe input",
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 40,
    "title": "Notification Settings",
    "route": "/app/settings/notifications",
    "workspace": "Member",
    "purpose": "Configure channel and topic preferences within mandatory-service constraints.",
    "requiredData": [
      "Email/SMS/push/in-app.",
      "topic matrix.",
      "quiet hours.",
      "language.",
      "mandatory notices"
    ],
    "primaryActions": [
      "Save.",
      "test notification.",
      "reset"
    ],
    "roles": [
      "Current Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Mandatory security/governance notices cannot be disabled"
    ],
    "audit": [
      "Preference changes"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Settings",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input"
    ],
    "negativeTests": [
      "EX-app-settings-notifications-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-settings-notifications-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-settings-notifications-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-settings-notifications-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-settings-notifications-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "400/422 validation: show a summary, associate field errors, focus the first invalid field and retain all safe input",
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 41,
    "title": "Security Settings",
    "route": "/app/settings/security",
    "workspace": "Member",
    "purpose": "Manage password, MFA, trusted devices and active sessions.",
    "requiredData": [
      "MFA status.",
      "devices.",
      "sessions.",
      "last sign-in.",
      "credential update"
    ],
    "primaryActions": [
      "Change password.",
      "enrol MFA.",
      "revoke session/device.",
      "download recovery codes"
    ],
    "roles": [
      "Current Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Step-up authentication for sensitive actions"
    ],
    "audit": [
      "All security changes and revocations"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Login/settings",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input"
    ],
    "negativeTests": [
      "EX-app-settings-security-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-settings-security-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-settings-security-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-settings-security-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-settings-security-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "400/422 validation: show a summary, associate field errors, focus the first invalid field and retain all safe input",
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 42,
    "title": "Install & Offline",
    "route": "/app/settings/install",
    "workspace": "Member",
    "purpose": "Explain PWA installation, update status and safe offline capability.",
    "requiredData": [
      "Install eligibility.",
      "version.",
      "cache status.",
      "offline limitations.",
      "update available"
    ],
    "primaryActions": [
      "Install.",
      "update.",
      "clear safe cache.",
      "retry sync"
    ],
    "roles": [
      "Authenticated Member.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Required fields, format, duplicates, lifecycle state and permission",
      "Protect against double submission with idempotency and optimistic concurrency"
    ],
    "audit": [
      "Optional installation telemetry only with approved policy"
    ],
    "ux": [
      "Never imply sensitive management/chat/payment data is available offline",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Member home",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input"
    ],
    "negativeTests": [
      "EX-app-settings-install-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-app-settings-install-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-app-settings-install-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-app-settings-install-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-app-settings-install-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "400/422 validation: show a summary, associate field errors, focus the first invalid field and retain all safe input",
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 43,
    "title": "Organisational Dashboard",
    "route": "/manage/dashboard",
    "workspace": "Management",
    "purpose": "Present role-scoped Chapter/City/Region/State/Country roll-ups with freshness and drill-down.",
    "requiredData": [
      "Scope selector.",
      "member/visitor funnel.",
      "attendance.",
      "meetings.",
      "interactions.",
      "opportunities.",
      "payment summary.",
      "workflow SLA.",
      "data quality"
    ],
    "primaryActions": [
      "Change scope/period.",
      "drill down.",
      "open queue.",
      "export permitted aggregate"
    ],
    "roles": [
      "Current scoped office-bearer/committee.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Minimum privacy thresholds and scope enforcement"
    ],
    "audit": [
      "Privileged exports and scope changes where required"
    ],
    "ux": [
      "Every metric shows definition, period, source and freshness",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Operational modules/workflows",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input"
    ],
    "negativeTests": [
      "EX-manage-dashboard-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-manage-dashboard-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-manage-dashboard-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-manage-dashboard-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-manage-dashboard-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "400/422 validation: show a summary, associate field errors, focus the first invalid field and retain all safe input",
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 44,
    "title": "Workflow Inbox",
    "route": "/manage/workflows",
    "workspace": "Management",
    "purpose": "Unify assigned approvals, reviews, corrections, escalations and delegated tasks.",
    "requiredData": [
      "Task.",
      "process.",
      "record.",
      "stage.",
      "priority.",
      "SLA.",
      "assignee.",
      "conflict status.",
      "evidence"
    ],
    "primaryActions": [
      "Claim.",
      "review.",
      "approve.",
      "reject.",
      "return.",
      "delegate.",
      "escalate.",
      "recuse"
    ],
    "roles": [
      "Current responsible role.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "RACI, segregation, tenure, delegation and conflict declaration"
    ],
    "audit": [
      "Every decision, reason, evidence and policy version"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Record review or decision history",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Claim, unclaim, return for information, reassign, delegate, recuse, escalate, approve, reject, cancel or close as no-longer-required",
      "When an assignee expires/revokes, route to configured queue/escalation owner without changing the decision history"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "SLA expires, maker becomes approver through role change, approver has conflict, evidence changes after review or workflow version changes mid-instance",
      "No eligible assignee exists at a required organisational level"
    ],
    "negativeTests": [
      "EX-manage-workflows-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-manage-workflows-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-manage-workflows-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-manage-workflows-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-manage-workflows-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "A transition is rejected when state/version/permission changed; reload available transitions and explain the conflict"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Running instances remain pinned to their workflow version unless an approved migration explicitly maps state and evidence"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 45,
    "title": "Member Management",
    "route": "/manage/members",
    "workspace": "Management",
    "purpose": "Search and manage member lifecycle within organisational scope.",
    "requiredData": [
      "Member.",
      "chapter.",
      "status.",
      "validity.",
      "profile completeness.",
      "business.",
      "onboarding.",
      "roles.",
      "flags"
    ],
    "primaryActions": [
      "Open.",
      "request correction.",
      "approve allowed change.",
      "suspend/escalate.",
      "initiate transfer"
    ],
    "roles": [
      "Authorised membership roles.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "No title-based access; protected changes require maker-checker"
    ],
    "audit": [
      "All lifecycle and data changes"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Member detail/workflow",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input"
    ],
    "negativeTests": [
      "EX-manage-members-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-manage-members-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-manage-members-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-manage-members-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-manage-members-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "400/422 validation: show a summary, associate field errors, focus the first invalid field and retain all safe input",
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 46,
    "title": "Visitor Management",
    "route": "/manage/visitors",
    "workspace": "Management",
    "purpose": "Manage visitor records, deduplication, follow-up, conversion and consent status.",
    "requiredData": [
      "Visitor.",
      "business.",
      "interest.",
      "source.",
      "meeting/event.",
      "verification.",
      "owner.",
      "status.",
      "follow-up.",
      "conversion"
    ],
    "primaryActions": [
      "Add.",
      "edit.",
      "merge candidate.",
      "assign follow-up.",
      "invite onboarding.",
      "archive"
    ],
    "roles": [
      "Chapter/authorised visitor team.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Duplicate control, consent, source and retention"
    ],
    "audit": [
      "Create/update/merge/assign/conversion"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Visitor detail/onboarding",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Self-register, operator-register, resume verified draft, merge duplicate, invite onboarding, request information, withdraw, reject or reactivate through policy",
      "Allow visitor-only completion when membership onboarding is not appropriate"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Shared family/business contact, duplicate mobile/email, incomplete verification, invalid sponsor, category/chapter ambiguity, document expiry or applicant inactivity",
      "Applicant changes Chapter/business or payment state during review"
    ],
    "negativeTests": [
      "EX-manage-visitors-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-manage-visitors-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-manage-visitors-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-manage-visitors-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-manage-visitors-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Duplicate candidates must be resolved before activation; never auto-merge protected records"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Resume using a verified token/reference; keep stage history and route material changes back to the required reviewer"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 47,
    "title": "New Member Onboarding",
    "route": "/manage/onboarding",
    "workspace": "Management",
    "purpose": "Run a simple staged application from invitation through approval and activation.",
    "requiredData": [
      "Applicant.",
      "sponsor/referrer.",
      "identity.",
      "business.",
      "documents.",
      "category.",
      "chapter.",
      "dues.",
      "checks.",
      "stage.",
      "SLA"
    ],
    "primaryActions": [
      "Invite.",
      "review.",
      "request information.",
      "verify.",
      "recommend.",
      "approve/reject.",
      "activate"
    ],
    "roles": [
      "Defined RACI roles.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Maker-checker; duplicate member/business; eligibility; payment reconciliation; reason required"
    ],
    "audit": [
      "Stage, actor, role tenure, evidence and decision"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Member record/workflow history",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Self-register, operator-register, resume verified draft, merge duplicate, invite onboarding, request information, withdraw, reject or reactivate through policy",
      "Allow visitor-only completion when membership onboarding is not appropriate"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Shared family/business contact, duplicate mobile/email, incomplete verification, invalid sponsor, category/chapter ambiguity, document expiry or applicant inactivity",
      "Applicant changes Chapter/business or payment state during review"
    ],
    "negativeTests": [
      "EX-manage-onboarding-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-manage-onboarding-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-manage-onboarding-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-manage-onboarding-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-manage-onboarding-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Duplicate candidates must be resolved before activation; never auto-merge protected records"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Resume using a verified token/reference; keep stage history and route material changes back to the required reviewer"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 48,
    "title": "Meeting Administration",
    "route": "/manage/meetings",
    "workspace": "Management",
    "purpose": "Create chapter/unit meetings, agendas, attendance polls, check-in and minutes workflow.",
    "requiredData": [
      "Unit.",
      "meeting type.",
      "date/time.",
      "venue/link.",
      "agenda.",
      "eligible audience.",
      "poll.",
      "quorum.",
      "materials.",
      "minutes"
    ],
    "primaryActions": [
      "Create.",
      "publish.",
      "poll.",
      "remind.",
      "check in.",
      "close.",
      "submit minutes"
    ],
    "roles": [
      "Secretary/authorised meeting role.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Scope, conflicts, poll window, quorum and publication approval"
    ],
    "audit": [
      "Meeting/poll/minutes lifecycle"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Meeting detail/attendance",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "RSVP yes/no/maybe, join waitlist, cancel, reschedule, respond to poll, check in, request correction or consume recording/minutes",
      "Handle event cancellation, venue-to-virtual conversion and session-level registration when configured"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Capacity fills during registration, duplicate registration, payment pending, poll closes during submit, meeting is rescheduled across time zones or QR/check-in is replayed",
      "Member eligibility changes after RSVP but before event/meeting"
    ],
    "negativeTests": [
      "EX-manage-meetings-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-manage-meetings-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-manage-meetings-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-manage-meetings-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-manage-meetings-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Registration/check-in must be idempotent; capacity conflicts return waitlist/closed status rather than generic failure"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Notify affected users of approved schedule/venue changes and retain prior attendance/poll history"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 49,
    "title": "Attendance Administration",
    "route": "/manage/attendance",
    "workspace": "Management",
    "purpose": "Capture, import, correct, reconcile and finalise meeting attendance.",
    "requiredData": [
      "Meeting.",
      "eligible members.",
      "source.",
      "status.",
      "check-in.",
      "exception.",
      "correction.",
      "finalisation"
    ],
    "primaryActions": [
      "Manual mark.",
      "upload/API import.",
      "reconcile.",
      "approve.",
      "finalise.",
      "reverse by correction"
    ],
    "roles": [
      "Attendance maker/checker.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Immutable batch, duplicate/member/meeting mapping and totals"
    ],
    "audit": [
      "Batch, row exception, approval, finalisation and correction"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Import or member attendance",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Manual capture, QR/check-in, API batch, file upload, correction request, excused absence, checker approval, finalise or reverse through linked correction",
      "Permit reconciliation by member ID, verified contact or governed mapping rule-never fuzzy auto-post without review"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Duplicate check-in, wrong meeting, ineligible member, late arrival, API/file mismatch, partial batch, reopened meeting or correction after reporting",
      "Meeting eligibility changes retroactively"
    ],
    "negativeTests": [
      "EX-manage-attendance-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-manage-attendance-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-manage-attendance-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-manage-attendance-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-manage-attendance-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Row failures do not post silently; show batch totals for accepted, rejected, duplicate and unresolved rows"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Reprocess only failed/unposted rows with original source keys and preserve the initial batch"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 50,
    "title": "Payment Administration",
    "route": "/manage/payments",
    "workspace": "Management",
    "purpose": "Import/reconcile dues and payments, resolve exceptions and issue authorised receipts.",
    "requiredData": [
      "Member.",
      "obligation.",
      "invoice/reference.",
      "amount.",
      "date.",
      "method.",
      "source.",
      "match status.",
      "exception.",
      "receipt"
    ],
    "primaryActions": [
      "Import/API sync.",
      "match.",
      "split/merge according to policy.",
      "approve.",
      "post.",
      "reverse.",
      "issue receipt"
    ],
    "roles": [
      "Treasurer/payment maker-checker.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Totals, currency, period, duplicates, segregation and bank/source reconciliation"
    ],
    "audit": [
      "Every posting, match, reversal and receipt"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Import/reconciliation/member payment",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "API/file/manual proof intake, auto-match, manual match, split/combined settlement if policy allows, exception, refund/reversal and receipt reissue",
      "Continue onboarding/event registration as payment-pending only when policy explicitly permits"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Duplicate gateway callback, amount/currency/period mismatch, partial payment, bank reversal, chargeback, proof rejected, member merge or payment received after expiry",
      "Receipt generated before downstream notification fails"
    ],
    "negativeTests": [
      "EX-manage-payments-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-manage-payments-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-manage-payments-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-manage-payments-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-manage-payments-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Financial post is atomic and idempotent; ambiguous gateway timeout remains Pending verification-not Failed or Paid"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Reconcile from provider/source of truth before retry; correction/reversal is append-only and independently approved"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 51,
    "title": "Announcement Management",
    "route": "/manage/announcements",
    "workspace": "Management",
    "purpose": "Create and approve targeted announcements for Chapter or higher scopes.",
    "requiredData": [
      "Title.",
      "body.",
      "priority.",
      "audience scope.",
      "channels.",
      "schedule.",
      "expiry.",
      "attachments.",
      "acknowledgement"
    ],
    "primaryActions": [
      "Draft.",
      "preview audience.",
      "submit.",
      "approve.",
      "publish.",
      "withdraw"
    ],
    "roles": [
      "Convenor/Secretary/communications RACI.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Scope authorization, approval, expiry and attachment scan"
    ],
    "audit": [
      "Author/reviewer/approver and publication versions"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Member announcement",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, preview audience, submit, schedule, publish, correct with version, withdraw, expire or archive",
      "Deep-link from notification only after current audience and publication status are validated"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Publish/expiry boundary occurs while open, audience hierarchy changes, attachment is replaced, acknowledgement becomes mandatory or content is retracted",
      "Recipient was eligible at notification time but not at open time"
    ],
    "negativeTests": [
      "EX-manage-announcements-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-manage-announcements-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-manage-announcements-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-manage-announcements-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-manage-announcements-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Do not show withdrawn or newly restricted body text from stale cache; present a safe unavailability message"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Purge/revalidate cached content on withdrawal and preserve publication/version history"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 52,
    "title": "Event Management",
    "route": "/manage/events",
    "workspace": "Management",
    "purpose": "Create events, registrations, capacity, payments, attendance and post-event follow-up.",
    "requiredData": [
      "Event.",
      "scope.",
      "audience.",
      "venue.",
      "agenda.",
      "capacity.",
      "fee.",
      "registration window.",
      "attendees.",
      "check-in"
    ],
    "primaryActions": [
      "Draft.",
      "submit.",
      "publish.",
      "manage registrations.",
      "check in.",
      "close.",
      "report"
    ],
    "roles": [
      "Event RACI roles.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Capacity, duplicate registrations, fee and cancellation policy"
    ],
    "audit": [
      "Lifecycle, registration changes and exports"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Event detail/payments/gallery",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "RSVP yes/no/maybe, join waitlist, cancel, reschedule, respond to poll, check in, request correction or consume recording/minutes",
      "Handle event cancellation, venue-to-virtual conversion and session-level registration when configured"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Capacity fills during registration, duplicate registration, payment pending, poll closes during submit, meeting is rescheduled across time zones or QR/check-in is replayed",
      "Member eligibility changes after RSVP but before event/meeting"
    ],
    "negativeTests": [
      "EX-manage-events-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-manage-events-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-manage-events-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-manage-events-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-manage-events-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Registration/check-in must be idempotent; capacity conflicts return waitlist/closed status rather than generic failure"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Notify affected users of approved schedule/venue changes and retain prior attendance/poll history"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 53,
    "title": "Gallery Management",
    "route": "/manage/gallery",
    "workspace": "Management",
    "purpose": "Upload, moderate, approve and publish event/chapter media.",
    "requiredData": [
      "Album.",
      "files.",
      "captions.",
      "consent.",
      "classification.",
      "status.",
      "retention"
    ],
    "primaryActions": [
      "Upload.",
      "tag.",
      "submit.",
      "approve/reject.",
      "publish.",
      "unpublish.",
      "remove"
    ],
    "roles": [
      "Content maker/reviewer/approver.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Consent, malware, file type/size, moderation and scope"
    ],
    "audit": [
      "File metadata and lifecycle"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Member gallery",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Upload individually or in batch; save draft album; moderate; approve; publish; unpublish; request removal or replace a failed asset",
      "Display accessible captions and consent status; restrict download when policy requires"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Partial upload, duplicate image, unsupported/corrupt media, malware result, consent revoked, subject requests removal or album/event is archived",
      "An image is already cached when it becomes restricted"
    ],
    "negativeTests": [
      "EX-manage-gallery-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-manage-gallery-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-manage-gallery-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-manage-gallery-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-manage-gallery-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Failed files remain individually retryable; successful batch items are not re-uploaded"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Use resumable/stable upload IDs and issue cache invalidation on removal/restriction"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 54,
    "title": "Promotion Management",
    "route": "/manage/promotions",
    "workspace": "Management",
    "purpose": "Create and govern paid/approved promotions restricted to Chapter, City, Region, State, Country or permitted audience.",
    "requiredData": [
      "Sponsor/member.",
      "creative.",
      "target scope.",
      "placement.",
      "dates.",
      "frequency.",
      "eligibility.",
      "price/order.",
      "approval.",
      "performance"
    ],
    "primaryActions": [
      "Draft.",
      "quote/order.",
      "submit.",
      "approve.",
      "schedule.",
      "pause.",
      "reject.",
      "report"
    ],
    "roles": [
      "Promotion RACI and finance roles.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Commercial rules, conflict, creative policy, scope and period"
    ],
    "audit": [
      "Order, approval, schedule, billing and delivery"
    ],
    "ux": [
      "Preview exact audience and placement before approval",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Promotion preview/report",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, quote/order, submit, commercial review, creative review, approve, schedule, pause, replace creative, expire, cancel or refund per policy",
      "Target Chapter, City, Region, State, Country or governed audience with exact preview and inventory check"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Inventory collision, hierarchy reorganisation, creative rejected after payment, date overlap, frequency cap, sponsor becomes ineligible or metrics arrive late",
      "Campaign scope accidentally exceeds creator authority"
    ],
    "negativeTests": [
      "EX-manage-promotions-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-manage-promotions-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-manage-promotions-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-manage-promotions-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-manage-promotions-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Booking conflict returns available alternatives; never silently broaden audience or shift dates"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Reserve inventory transactionally with expiry; release on failed approval/payment and preserve commercial history"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 55,
    "title": "Operational Reports",
    "route": "/manage/reports",
    "workspace": "Management",
    "purpose": "Generate governed scoped reports for membership, visitors, meetings, attendance, payments and business activity.",
    "requiredData": [
      "Report catalogue.",
      "scope.",
      "period.",
      "filters.",
      "metric version.",
      "freshness.",
      "privacy threshold"
    ],
    "primaryActions": [
      "Run.",
      "preview.",
      "export.",
      "schedule if authorised"
    ],
    "roles": [
      "Authorised management roles.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Row/field security, threshold, watermark and export reason"
    ],
    "audit": [
      "Report execution/export/schedule"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Drill-down or downloaded report",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input"
    ],
    "negativeTests": [
      "EX-manage-reports-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-manage-reports-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-manage-reports-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-manage-reports-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-manage-reports-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "400/422 validation: show a summary, associate field errors, focus the first invalid field and retain all safe input",
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 56,
    "title": "Management & Board Dashboard",
    "route": "/governance/dashboard",
    "workspace": "Governance",
    "purpose": "Provide strategic roll-ups, decisions, risks, exceptions and governance actions without operational clutter.",
    "requiredData": [
      "Membership/network/business outcome trends.",
      "operational health.",
      "decisions.",
      "risks.",
      "policy exceptions.",
      "role expiry.",
      "data freshness"
    ],
    "primaryActions": [
      "Drill down.",
      "open decision.",
      "view board pack.",
      "request analysis"
    ],
    "roles": [
      "Current Management/Board role.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Aggregated privacy-safe data and effective role"
    ],
    "audit": [
      "Privileged export and decisions"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Decisions, strategy, policies or exceptions",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, defer, refer to committee, request evidence, declare conflict, abstain, vote/consent, conditionally approve, reject, supersede or close",
      "Use emergency/remote decision only through a separately approved policy path with subsequent ratification when required"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Quorum changes, member tenure ends mid-meeting, conflict is declared late, document version changes, tie/no consensus or action owner becomes inactive",
      "Historical viewer has current access but was not a participant; distinguish viewing rights from event-time authority"
    ],
    "negativeTests": [
      "EX-governance-dashboard-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-governance-dashboard-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-governance-dashboard-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-governance-dashboard-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-governance-dashboard-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Block resolution when quorum, eligibility, conflict or current pack version is invalid; never infer a vote"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Recalculate eligible decision participants at decision time and preserve each declaration/vote/version"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 57,
    "title": "Decision Register",
    "route": "/governance/decisions",
    "workspace": "Governance",
    "purpose": "Record proposals, deliberation, conflicts, votes/consent, resolutions and accountable actions.",
    "requiredData": [
      "Decision ID.",
      "subject.",
      "sponsor.",
      "papers.",
      "meeting.",
      "participants.",
      "conflicts.",
      "outcome.",
      "conditions.",
      "actions.",
      "due dates"
    ],
    "primaryActions": [
      "Submit.",
      "declare conflict.",
      "review.",
      "record vote/consent.",
      "resolve.",
      "assign action.",
      "close"
    ],
    "roles": [
      "Board/Management RACI.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Quorum, eligible tenure, conflict and versioned evidence"
    ],
    "audit": [
      "Complete immutable decision trail"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Decision detail/history",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, defer, refer to committee, request evidence, declare conflict, abstain, vote/consent, conditionally approve, reject, supersede or close",
      "Use emergency/remote decision only through a separately approved policy path with subsequent ratification when required"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Quorum changes, member tenure ends mid-meeting, conflict is declared late, document version changes, tie/no consensus or action owner becomes inactive",
      "Historical viewer has current access but was not a participant; distinguish viewing rights from event-time authority"
    ],
    "negativeTests": [
      "EX-governance-decisions-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-governance-decisions-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-governance-decisions-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-governance-decisions-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-governance-decisions-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Block resolution when quorum, eligibility, conflict or current pack version is invalid; never infer a vote"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Recalculate eligible decision participants at decision time and preserve each declaration/vote/version"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 58,
    "title": "Board Packs",
    "route": "/governance/board-packs",
    "workspace": "Governance",
    "purpose": "Assemble controlled, versioned meeting packs and track distribution/acknowledgement.",
    "requiredData": [
      "Meeting.",
      "agenda.",
      "documents.",
      "classification.",
      "versions.",
      "recipients.",
      "release time.",
      "acknowledgement"
    ],
    "primaryActions": [
      "Compile.",
      "review.",
      "approve.",
      "publish.",
      "withdraw.",
      "acknowledge.",
      "download"
    ],
    "roles": [
      "Board secretariat and members.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Recipient entitlement and watermark; no stale pack after replacement"
    ],
    "audit": [
      "Compilation, access, download and acknowledgement"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Decision/meeting",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, defer, refer to committee, request evidence, declare conflict, abstain, vote/consent, conditionally approve, reject, supersede or close",
      "Use emergency/remote decision only through a separately approved policy path with subsequent ratification when required"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Quorum changes, member tenure ends mid-meeting, conflict is declared late, document version changes, tie/no consensus or action owner becomes inactive",
      "Historical viewer has current access but was not a participant; distinguish viewing rights from event-time authority"
    ],
    "negativeTests": [
      "EX-governance-board-packs-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-governance-board-packs-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-governance-board-packs-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-governance-board-packs-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-governance-board-packs-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Block resolution when quorum, eligibility, conflict or current pack version is invalid; never infer a vote"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Recalculate eligible decision participants at decision time and preserve each declaration/vote/version"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 59,
    "title": "Strategy & Outcomes",
    "route": "/governance/strategy",
    "workspace": "Governance",
    "purpose": "Maintain objectives, initiatives, owners, measures and review commentary.",
    "requiredData": [
      "Objective.",
      "outcome.",
      "KPI definition.",
      "baseline/target.",
      "owner.",
      "initiative.",
      "risk.",
      "status.",
      "period"
    ],
    "primaryActions": [
      "Create proposal.",
      "update progress.",
      "review.",
      "approve change.",
      "link decision"
    ],
    "roles": [
      "Management/Board roles.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Metric definition/version and approved target changes"
    ],
    "audit": [
      "Strategy version and review history"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Decision or report",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, defer, refer to committee, request evidence, declare conflict, abstain, vote/consent, conditionally approve, reject, supersede or close",
      "Use emergency/remote decision only through a separately approved policy path with subsequent ratification when required"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Quorum changes, member tenure ends mid-meeting, conflict is declared late, document version changes, tie/no consensus or action owner becomes inactive",
      "Historical viewer has current access but was not a participant; distinguish viewing rights from event-time authority"
    ],
    "negativeTests": [
      "EX-governance-strategy-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-governance-strategy-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-governance-strategy-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-governance-strategy-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-governance-strategy-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Block resolution when quorum, eligibility, conflict or current pack version is invalid; never infer a vote"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Recalculate eligible decision participants at decision time and preserve each declaration/vote/version"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 60,
    "title": "Policy Register",
    "route": "/governance/policies",
    "workspace": "Governance",
    "purpose": "Govern policies, versions, approvals, effective dates, acknowledgements and exceptions.",
    "requiredData": [
      "Policy.",
      "owner.",
      "classification.",
      "version.",
      "approval.",
      "effective/expiry.",
      "audience.",
      "acknowledgement"
    ],
    "primaryActions": [
      "Draft.",
      "review.",
      "approve.",
      "publish.",
      "supersede.",
      "retire.",
      "request exception"
    ],
    "roles": [
      "Policy RACI roles.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "No overlapping effective versions; approval and communication evidence"
    ],
    "audit": [
      "Full policy lifecycle and acknowledgements"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Policy detail/exception",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, defer, refer to committee, request evidence, declare conflict, abstain, vote/consent, conditionally approve, reject, supersede or close",
      "Use emergency/remote decision only through a separately approved policy path with subsequent ratification when required"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Quorum changes, member tenure ends mid-meeting, conflict is declared late, document version changes, tie/no consensus or action owner becomes inactive",
      "Historical viewer has current access but was not a participant; distinguish viewing rights from event-time authority"
    ],
    "negativeTests": [
      "EX-governance-policies-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-governance-policies-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-governance-policies-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-governance-policies-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-governance-policies-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Block resolution when quorum, eligibility, conflict or current pack version is invalid; never infer a vote"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Recalculate eligible decision participants at decision time and preserve each declaration/vote/version"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 61,
    "title": "Policy Exceptions",
    "route": "/governance/exceptions",
    "workspace": "Governance",
    "purpose": "Assess time-bound exceptions with risk, compensating controls and expiry.",
    "requiredData": [
      "Requester.",
      "policy/control.",
      "rationale.",
      "scope.",
      "risk.",
      "compensating control.",
      "owner.",
      "dates.",
      "review.",
      "status"
    ],
    "primaryActions": [
      "Submit.",
      "assess.",
      "approve/reject.",
      "monitor.",
      "renew.",
      "close"
    ],
    "roles": [
      "Risk/policy approvers.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "No self-approval; mandatory expiry and owner"
    ],
    "audit": [
      "All evidence and decisions"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Policy/decision/history",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, defer, refer to committee, request evidence, declare conflict, abstain, vote/consent, conditionally approve, reject, supersede or close",
      "Use emergency/remote decision only through a separately approved policy path with subsequent ratification when required"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Quorum changes, member tenure ends mid-meeting, conflict is declared late, document version changes, tie/no consensus or action owner becomes inactive",
      "Historical viewer has current access but was not a participant; distinguish viewing rights from event-time authority"
    ],
    "negativeTests": [
      "EX-governance-exceptions-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-governance-exceptions-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-governance-exceptions-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-governance-exceptions-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-governance-exceptions-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Block resolution when quorum, eligibility, conflict or current pack version is invalid; never infer a vote"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Recalculate eligible decision participants at decision time and preserve each declaration/vote/version"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 62,
    "title": "Role & Tenure Oversight",
    "route": "/governance/roles",
    "workspace": "Governance",
    "purpose": "Review current/future/expired office assignments, delegations, conflicts and succession/handover.",
    "requiredData": [
      "Member.",
      "base chapter.",
      "role.",
      "unit.",
      "start/end.",
      "appointing decision.",
      "delegation.",
      "conflict.",
      "handover status"
    ],
    "primaryActions": [
      "Propose.",
      "review.",
      "approve.",
      "revoke prospectively.",
      "delegate.",
      "certify.",
      "start handover"
    ],
    "roles": [
      "Board/Management authority roles.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "No invalid overlap; eligibility; appointment evidence; effective dates"
    ],
    "audit": [
      "Assignment/delegation/revocation and certification"
    ],
    "ux": [
      "Past President/Secretary/Treasurer are derived from history, not manually overwritten",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Role history or decision",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, defer, refer to committee, request evidence, declare conflict, abstain, vote/consent, conditionally approve, reject, supersede or close",
      "Use emergency/remote decision only through a separately approved policy path with subsequent ratification when required"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Quorum changes, member tenure ends mid-meeting, conflict is declared late, document version changes, tie/no consensus or action owner becomes inactive",
      "Historical viewer has current access but was not a participant; distinguish viewing rights from event-time authority"
    ],
    "negativeTests": [
      "EX-governance-roles-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-governance-roles-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-governance-roles-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-governance-roles-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-governance-roles-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Block resolution when quorum, eligibility, conflict or current pack version is invalid; never infer a vote"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Recalculate eligible decision participants at decision time and preserve each declaration/vote/version"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 63,
    "title": "Governance History",
    "route": "/governance/history",
    "workspace": "Governance",
    "purpose": "Search historical office periods, decisions, approvals and actions linked to the responsible tenure.",
    "requiredData": [
      "Period.",
      "unit.",
      "office.",
      "office-holder.",
      "decisions.",
      "approvals.",
      "incidents.",
      "handover.",
      "linked audit"
    ],
    "primaryActions": [
      "Filter.",
      "open record.",
      "export authorised history.",
      "compare terms"
    ],
    "roles": [
      "Authorised governance/audit roles.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Historical authorization uses current viewer rights while preserving event-time facts"
    ],
    "audit": [
      "Sensitive history access/export"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Role/decision/audit detail",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, defer, refer to committee, request evidence, declare conflict, abstain, vote/consent, conditionally approve, reject, supersede or close",
      "Use emergency/remote decision only through a separately approved policy path with subsequent ratification when required"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Quorum changes, member tenure ends mid-meeting, conflict is declared late, document version changes, tie/no consensus or action owner becomes inactive",
      "Historical viewer has current access but was not a participant; distinguish viewing rights from event-time authority"
    ],
    "negativeTests": [
      "EX-governance-history-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-governance-history-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-governance-history-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-governance-history-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-governance-history-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Block resolution when quorum, eligibility, conflict or current pack version is invalid; never infer a vote"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Recalculate eligible decision participants at decision time and preserve each declaration/vote/version"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 64,
    "title": "Platform Administration Dashboard",
    "route": "/platform-admin/dashboard",
    "workspace": "Platform Admin",
    "purpose": "Show technical health, security, integration, job, audit and data-quality signals without granting business authority.",
    "requiredData": [
      "Service health.",
      "auth risk.",
      "jobs.",
      "integrations.",
      "imports.",
      "notifications.",
      "audit coverage.",
      "incidents.",
      "data quality"
    ],
    "primaryActions": [
      "Open incident/configuration.",
      "acknowledge alert.",
      "view runbook"
    ],
    "roles": [
      "Platform/security/support roles.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Required fields, format, duplicates, lifecycle state and permission",
      "Protect against double submission with idempotency and optimistic concurrency"
    ],
    "audit": [
      "All privileged actions"
    ],
    "ux": [
      "Platform administrators do not approve membership, payments or governance decisions",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Admin modules",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input"
    ],
    "negativeTests": [
      "EX-platform-admin-dashboard-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-platform-admin-dashboard-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-platform-admin-dashboard-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-platform-admin-dashboard-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-platform-admin-dashboard-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "400/422 validation: show a summary, associate field errors, focus the first invalid field and retain all safe input",
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 65,
    "title": "Identity Administration",
    "route": "/platform-admin/identity",
    "workspace": "Platform Admin",
    "purpose": "Manage accounts, verification, sessions, MFA and access support under purpose-limited controls.",
    "requiredData": [
      "User/member link.",
      "status.",
      "verified contacts.",
      "MFA.",
      "sessions.",
      "lock.",
      "risk.",
      "support grant"
    ],
    "primaryActions": [
      "Unlock.",
      "revoke sessions.",
      "require reset/MFA.",
      "link correction workflow.",
      "issue time-bound support grant"
    ],
    "roles": [
      "Identity/security admin.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Step-up, dual control for high risk, no credential viewing"
    ],
    "audit": [
      "Every action including data view"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Audit or member workflow",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input"
    ],
    "negativeTests": [
      "EX-platform-admin-identity-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-platform-admin-identity-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-platform-admin-identity-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-platform-admin-identity-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-platform-admin-identity-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "400/422 validation: show a summary, associate field errors, focus the first invalid field and retain all safe input",
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 66,
    "title": "Organisation Hierarchy",
    "route": "/platform-admin/hierarchy",
    "workspace": "Platform Admin",
    "purpose": "Configure effective-dated Country, State, Region, City, Chapter and governance-body relationships.",
    "requiredData": [
      "Unit.",
      "type.",
      "parent.",
      "code.",
      "status.",
      "dates.",
      "leadership reference.",
      "successor"
    ],
    "primaryActions": [
      "Create proposal.",
      "edit future version.",
      "merge/close with migration plan.",
      "inspect lineage"
    ],
    "roles": [
      "Organisation configuration role.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "No cycles, overlapping codes/dates or orphaned members"
    ],
    "audit": [
      "Version, lineage and migration"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Role/scoped configuration",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Create future-dated unit, reorganise with successor mapping, close unit, merge duplicate or correct history through governed amendment"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Parent cycle, overlapping effective dates, orphaned Chapters/members, duplicate code/name, active roles/workflows tied to closing unit"
    ],
    "negativeTests": [
      "EX-platform-admin-hierarchy-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-platform-admin-hierarchy-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-platform-admin-hierarchy-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-platform-admin-hierarchy-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-platform-admin-hierarchy-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "400/422 validation: show a summary, associate field errors, focus the first invalid field and retain all safe input",
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Run impact preview and migration plan; block publication until all dependent records have a successor or approved exception"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 67,
    "title": "Role Catalogue & Assignments",
    "route": "/platform-admin/roles",
    "workspace": "Platform Admin",
    "purpose": "Define governed role templates and inspect effective-dated assignments/delegations.",
    "requiredData": [
      "Role.",
      "responsibility set.",
      "eligible unit types.",
      "assignment.",
      "dates.",
      "status.",
      "delegation.",
      "constraints"
    ],
    "primaryActions": [
      "Create/version role.",
      "assign via authorised workflow.",
      "expire.",
      "certify.",
      "inspect history"
    ],
    "roles": [
      "Authority/platform security roles.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Assignment authority, tenure, eligibility and segregation"
    ],
    "audit": [
      "All role/template/assignment changes"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "RBAC/RACI/role oversight",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft/version, simulate, compare, approve, future-publish, certify, delegate narrowly, revoke prospectively, supersede or rollback"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Privilege escalation, self-lockout, orphaned accountable step, conflicting roles, overlapping tenure, retroactive appointment correction or emergency access",
      "A policy version changes while sessions and workflow instances are active"
    ],
    "negativeTests": [
      "EX-platform-admin-roles-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-platform-admin-roles-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-platform-admin-roles-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-platform-admin-roles-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-platform-admin-roles-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Fail closed on evaluation outage; prevent publication when negative tests or segregation rules fail"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Keep previous approved version available for controlled rollback; revoke/refresh affected sessions when privilege materially changes"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 68,
    "title": "RBAC Matrix",
    "route": "/platform-admin/rbac",
    "workspace": "Platform Admin",
    "purpose": "Map roles to resource/action/scope/field permissions and test effective access.",
    "requiredData": [
      "Role.",
      "resource.",
      "action.",
      "scope rule.",
      "field mask.",
      "conditions.",
      "version.",
      "effective date"
    ],
    "primaryActions": [
      "Edit draft.",
      "simulate.",
      "compare.",
      "submit.",
      "approve.",
      "publish.",
      "rollback version"
    ],
    "roles": [
      "Security policy maker-checker.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Default deny; negative tests; no unreviewed privilege expansion"
    ],
    "audit": [
      "Policy change, simulation and publication"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Policy simulator/audit",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft/version, simulate, compare, approve, future-publish, certify, delegate narrowly, revoke prospectively, supersede or rollback"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Privilege escalation, self-lockout, orphaned accountable step, conflicting roles, overlapping tenure, retroactive appointment correction or emergency access",
      "A policy version changes while sessions and workflow instances are active"
    ],
    "negativeTests": [
      "EX-platform-admin-rbac-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-platform-admin-rbac-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-platform-admin-rbac-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-platform-admin-rbac-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-platform-admin-rbac-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Fail closed on evaluation outage; prevent publication when negative tests or segregation rules fail"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Keep previous approved version available for controlled rollback; revoke/refresh affected sessions when privilege materially changes"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 69,
    "title": "RACI Matrix",
    "route": "/platform-admin/raci",
    "workspace": "Platform Admin",
    "purpose": "Map process steps to Responsible, Accountable, Consulted and Informed roles with segregation controls.",
    "requiredData": [
      "Process.",
      "step.",
      "unit level.",
      "R/A/C/I roles.",
      "SLA.",
      "escalation.",
      "evidence.",
      "conflicts"
    ],
    "primaryActions": [
      "Edit.",
      "validate gaps.",
      "simulate assignment.",
      "approve.",
      "publish"
    ],
    "roles": [
      "Process owner/security control roles.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Exactly one accountable owner where required; no forbidden maker-approver combination"
    ],
    "audit": [
      "RACI version and approval"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Workflow configuration",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft/version, simulate, compare, approve, future-publish, certify, delegate narrowly, revoke prospectively, supersede or rollback"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Privilege escalation, self-lockout, orphaned accountable step, conflicting roles, overlapping tenure, retroactive appointment correction or emergency access",
      "A policy version changes while sessions and workflow instances are active"
    ],
    "negativeTests": [
      "EX-platform-admin-raci-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-platform-admin-raci-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-platform-admin-raci-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-platform-admin-raci-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-platform-admin-raci-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Fail closed on evaluation outage; prevent publication when negative tests or segregation rules fail"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Keep previous approved version available for controlled rollback; revoke/refresh affected sessions when privilege materially changes"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 70,
    "title": "Workflow Designer",
    "route": "/platform-admin/workflows",
    "workspace": "Platform Admin",
    "purpose": "Configure versioned states, transitions, forms, RACI, SLAs, escalation and evidence rules.",
    "requiredData": [
      "Workflow.",
      "version.",
      "states.",
      "transitions.",
      "guards.",
      "roles.",
      "SLA.",
      "reminders.",
      "delegation.",
      "form.",
      "audit event"
    ],
    "primaryActions": [
      "Draft.",
      "validate.",
      "simulate.",
      "approve.",
      "publish.",
      "retire"
    ],
    "roles": [
      "Workflow configuration roles.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "No unreachable states, loops without guard or missing terminal/exception paths"
    ],
    "audit": [
      "Definition versions and simulation/publish"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Workflow inbox/form builder",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Claim, unclaim, return for information, reassign, delegate, recuse, escalate, approve, reject, cancel or close as no-longer-required",
      "When an assignee expires/revokes, route to configured queue/escalation owner without changing the decision history"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "SLA expires, maker becomes approver through role change, approver has conflict, evidence changes after review or workflow version changes mid-instance",
      "No eligible assignee exists at a required organisational level"
    ],
    "negativeTests": [
      "EX-platform-admin-workflows-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-platform-admin-workflows-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-platform-admin-workflows-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-platform-admin-workflows-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-platform-admin-workflows-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "A transition is rejected when state/version/permission changed; reload available transitions and explain the conflict"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Running instances remain pinned to their workflow version unless an approved migration explicitly maps state and evidence"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 71,
    "title": "Lookups & Taxonomies",
    "route": "/platform-admin/lookups",
    "workspace": "Platform Admin",
    "purpose": "Govern categories, meeting types, opportunity types, statuses, reasons and synonyms.",
    "requiredData": [
      "Lookup set.",
      "code.",
      "label.",
      "parent.",
      "synonyms.",
      "scope.",
      "dates.",
      "status.",
      "usage"
    ],
    "primaryActions": [
      "Create/version.",
      "merge.",
      "deactivate.",
      "map legacy value.",
      "publish"
    ],
    "roles": [
      "Data steward.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Stable codes, no deletion when referenced, effective dates"
    ],
    "audit": [
      "Every taxonomy change and migration mapping"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Forms/search/imports",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input"
    ],
    "negativeTests": [
      "EX-platform-admin-lookups-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-platform-admin-lookups-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-platform-admin-lookups-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-platform-admin-lookups-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-platform-admin-lookups-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "400/422 validation: show a summary, associate field errors, focus the first invalid field and retain all safe input",
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 72,
    "title": "Form Builder",
    "route": "/platform-admin/forms",
    "workspace": "Platform Admin",
    "purpose": "Configure versioned field definitions, help, validation, consent and workflow binding.",
    "requiredData": [
      "Form.",
      "field.",
      "type.",
      "label.",
      "help.",
      "required rule.",
      "options.",
      "classification.",
      "visibility.",
      "version"
    ],
    "primaryActions": [
      "Draft.",
      "preview responsive.",
      "validate.",
      "approve.",
      "publish.",
      "retire"
    ],
    "roles": [
      "Form owner/data/privacy reviewer.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Accessible labels; data minimisation; no unsafe conditional logic"
    ],
    "audit": [
      "Form/schema and consent version"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Public/member/management form",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input"
    ],
    "negativeTests": [
      "EX-platform-admin-forms-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-platform-admin-forms-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-platform-admin-forms-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-platform-admin-forms-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-platform-admin-forms-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "400/422 validation: show a summary, associate field errors, focus the first invalid field and retain all safe input",
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 73,
    "title": "Import Centre",
    "route": "/platform-admin/imports",
    "workspace": "Platform Admin",
    "purpose": "Stage attendance/payment/member reference files or API batches, map, validate, reconcile, approve and post.",
    "requiredData": [
      "Source.",
      "batch.",
      "checksum.",
      "schema version.",
      "unit/period.",
      "mappings.",
      "row results.",
      "totals.",
      "exceptions.",
      "status"
    ],
    "primaryActions": [
      "Upload/sync.",
      "map.",
      "validate.",
      "correct mapping.",
      "submit.",
      "approve.",
      "post.",
      "reverse batch"
    ],
    "roles": [
      "Import maker/checker by domain.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "File type/size/malware, source key, duplicates, totals, row scope and idempotency"
    ],
    "audit": [
      "Batch, row counts, approvals, post/reversal and source"
    ],
    "ux": [
      "Never post directly from uploaded file into final records",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Reconciliation/audit",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Upload or API intake, remap columns, save mapping, correct source, resubmit failed rows, cancel unposted batch, approve, post, reverse or archive"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Wrong encoding/schema, reordered headers, huge/empty file, formula injection, malware, duplicate source key, partial provider retry or totals mismatch",
      "Checker receives a changed batch after review began"
    ],
    "negativeTests": [
      "EX-platform-admin-imports-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-platform-admin-imports-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-platform-admin-imports-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-platform-admin-imports-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-platform-admin-imports-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Reject unsafe files before parsing; quarantine technical failures; invalidate approval after any batch-content change"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Checkpoint long validation jobs, support safe resume and expose row-level reason plus downloadable exception file"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 74,
    "title": "Integration Administration",
    "route": "/platform-admin/integrations",
    "workspace": "Platform Admin",
    "purpose": "Configure and monitor attendance, payment, notification, calendar and approved external integrations.",
    "requiredData": [
      "Provider.",
      "endpoint alias.",
      "auth type.",
      "scopes.",
      "status.",
      "last sync.",
      "retry/dead letter.",
      "version"
    ],
    "primaryActions": [
      "Test.",
      "enable/disable.",
      "rotate secret via vault.",
      "retry safe job.",
      "inspect contract"
    ],
    "roles": [
      "Integration/platform operations.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Never display secrets; signed requests; rate/retry/idempotency"
    ],
    "audit": [
      "Configuration/test/enable/secret rotation metadata"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Import/job/audit",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Test sandbox, enable gradually, pause, rotate credentials, retry idempotent job, replay dead letter or fall back to governed file/manual process"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Provider outage, rate limit, timeout after provider accepted request, webhook replay/out-of-order delivery, certificate expiry or schema drift"
    ],
    "negativeTests": [
      "EX-platform-admin-integrations-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-platform-admin-integrations-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-platform-admin-integrations-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-platform-admin-integrations-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-platform-admin-integrations-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Circuit-break repeated failures; distinguish unknown outcome from rejected outcome; never expose credentials"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Use signed events, monotonic/source versions, retry policy and reconciliation job before replay"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 75,
    "title": "Moderation Queue",
    "route": "/platform-admin/moderation",
    "workspace": "Platform Admin",
    "purpose": "Review reported profiles, content, messages metadata, gallery and promotions under policy.",
    "requiredData": [
      "Report.",
      "content type.",
      "reason.",
      "reporter.",
      "subject.",
      "risk.",
      "evidence.",
      "status.",
      "SLA"
    ],
    "primaryActions": [
      "Claim.",
      "restrict.",
      "request info.",
      "dismiss.",
      "remove.",
      "escalate.",
      "appeal"
    ],
    "roles": [
      "Moderation roles.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Purpose-limited content access; conflicts and appeal path"
    ],
    "audit": [
      "Every access and decision"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Content/user/audit",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input"
    ],
    "negativeTests": [
      "EX-platform-admin-moderation-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-platform-admin-moderation-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-platform-admin-moderation-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-platform-admin-moderation-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-platform-admin-moderation-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "400/422 validation: show a summary, associate field errors, focus the first invalid field and retain all safe input",
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 76,
    "title": "Notification Administration",
    "route": "/platform-admin/notifications",
    "workspace": "Platform Admin",
    "purpose": "Manage templates, channels, audience rules, mandatory flags, delivery and retries.",
    "requiredData": [
      "Template.",
      "trigger.",
      "audience.",
      "channel.",
      "language.",
      "variables.",
      "version.",
      "status.",
      "delivery metrics"
    ],
    "primaryActions": [
      "Preview.",
      "test.",
      "approve.",
      "publish.",
      "pause.",
      "retry allowed failures"
    ],
    "roles": [
      "Notification maker-checker.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "No unsafe template injection; consent/preferences; mandatory rule"
    ],
    "audit": [
      "Template version, test, publish and bulk send"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Workflow/event/audit",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input"
    ],
    "negativeTests": [
      "EX-platform-admin-notifications-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-platform-admin-notifications-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-platform-admin-notifications-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-platform-admin-notifications-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-platform-admin-notifications-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "400/422 validation: show a summary, associate field errors, focus the first invalid field and retain all safe input",
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 77,
    "title": "Promotion Policy & Inventory",
    "route": "/platform-admin/promotions",
    "workspace": "Platform Admin",
    "purpose": "Configure placements, geographic scopes, eligibility, pricing/order rules, frequency and approvals.",
    "requiredData": [
      "Placement.",
      "portal.",
      "unit scope.",
      "audience.",
      "dates.",
      "inventory.",
      "price rule.",
      "eligibility.",
      "creative policy.",
      "approval"
    ],
    "primaryActions": [
      "Create/version rule.",
      "preview.",
      "approve.",
      "publish.",
      "suspend"
    ],
    "roles": [
      "Commercial policy maker-checker.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "No discriminatory targeting; hierarchy scope; inventory conflict"
    ],
    "audit": [
      "Rule and inventory changes"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Management promotion workflow",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, quote/order, submit, commercial review, creative review, approve, schedule, pause, replace creative, expire, cancel or refund per policy",
      "Target Chapter, City, Region, State, Country or governed audience with exact preview and inventory check"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Inventory collision, hierarchy reorganisation, creative rejected after payment, date overlap, frequency cap, sponsor becomes ineligible or metrics arrive late",
      "Campaign scope accidentally exceeds creator authority"
    ],
    "negativeTests": [
      "EX-platform-admin-promotions-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-platform-admin-promotions-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-platform-admin-promotions-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-platform-admin-promotions-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-platform-admin-promotions-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Booking conflict returns available alternatives; never silently broaden audience or shift dates"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Reserve inventory transactionally with expiry; release on failed approval/payment and preserve commercial history"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 78,
    "title": "Audit Explorer",
    "route": "/platform-admin/audit",
    "workspace": "Platform Admin",
    "purpose": "Search append-only authentication, authorization, workflow, data and administration history.",
    "requiredData": [
      "Occurred/recorded time.",
      "actor.",
      "role assignment.",
      "unit.",
      "portal.",
      "action.",
      "resource.",
      "record.",
      "result.",
      "reason.",
      "policy/workflow version.",
      "correlation"
    ],
    "primaryActions": [
      "Filter.",
      "open event.",
      "follow correlation.",
      "export with reason.",
      "verify chain/status"
    ],
    "roles": [
      "Auditor/security roles.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Field masking, retention and immutable store"
    ],
    "audit": [
      "Self-auditing access/export"
    ],
    "ux": [
      "Search/export of audit data is itself audited",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Related record/history",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Search by actor, role assignment, unit, resource, record, action, result, correlation, workflow/import or time range",
      "Export only through reasoned, authorised and watermarked process; follow event correlation to source records"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Late-arriving event, clock skew, retention boundary, masked field, legal hold, duplicate delivery or temporary audit-store degradation"
    ],
    "negativeTests": [
      "EX-platform-admin-audit-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-platform-admin-audit-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-platform-admin-audit-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-platform-admin-audit-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-platform-admin-audit-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Business mutation must follow the approved audit-failure policy; high-risk actions fail closed if mandatory audit write cannot be assured"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Buffer through durable outbox, reconcile gaps and alert; never permit administrators to edit/delete audit facts"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 79,
    "title": "Data Quality Centre",
    "route": "/platform-admin/data-quality",
    "workspace": "Platform Admin",
    "purpose": "Detect and resolve duplicates, missing data, invalid hierarchy/category, stale records and reconciliation issues.",
    "requiredData": [
      "Rule.",
      "entity.",
      "issue.",
      "severity.",
      "scope.",
      "owner.",
      "detected date.",
      "status.",
      "suggested match.",
      "SLA"
    ],
    "primaryActions": [
      "Assign.",
      "compare.",
      "merge through workflow.",
      "correct.",
      "waive with reason.",
      "rerun rule"
    ],
    "roles": [
      "Data steward and domain owners.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Merge preserves lineage; no silent overwrite; waiver expiry"
    ],
    "audit": [
      "Issue/decision/correction/merge"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Member/business/import/audit",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Assign, correct source, merge with survivor, split erroneous merge through governed process, waive temporarily, rerun or close as false positive"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Two stewards act on same issue, new source update invalidates suggestion, merge spans scopes, historical/audit references depend on both records"
    ],
    "negativeTests": [
      "EX-platform-admin-data-quality-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-platform-admin-data-quality-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-platform-admin-data-quality-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-platform-admin-data-quality-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-platform-admin-data-quality-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Conflict requires refresh and comparison; never auto-merge solely on name/contact similarity"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Preserve aliases, source lineage, moved relationships and a reversible merge plan where feasible"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  },
  {
    "id": 80,
    "title": "Platform Settings",
    "route": "/platform-admin/settings",
    "workspace": "Platform Admin",
    "purpose": "Manage safe global configuration, feature flags, retention, branding references and operational limits.",
    "requiredData": [
      "Setting.",
      "environment.",
      "value classification.",
      "owner.",
      "version.",
      "effective date.",
      "flag rollout.",
      "change request"
    ],
    "primaryActions": [
      "Propose.",
      "validate.",
      "approve.",
      "schedule.",
      "rollback"
    ],
    "roles": [
      "Platform configuration maker-checker.",
      "Apply field-level visibility, current membership and active organisational scope",
      "Re-check authorization before every mutation"
    ],
    "validation": [
      "Secrets remain in vault; environment separation; high-risk dual control"
    ],
    "audit": [
      "All reads/changes for sensitive settings"
    ],
    "ux": [
      "Use clear labels, helpful empty states and a single dominant primary action",
      "Retain filter/form state after recoverable errors",
      "Mobile: stack content and use full-screen filters/forms. Desktop: allow split list/detail where useful",
      "Always implement loading, success, empty, filtered-empty, offline, error, denied, expired and conflict states"
    ],
    "outcomes": [
      "Audit/dashboard",
      "On Back, restore prior filters, tab, scroll and selected context"
    ],
    "alternativePaths": [
      "Open from a direct/deep link: restore session, validate the active workspace and return safely to the intended route",
      "Enter through search, notification, dashboard drill-down or related-record link; preserve the same authorization and record context",
      "Switch role or organisational unit through the Workspace Hub, then re-evaluate visibility and allowed actions",
      "Cancel or use Back without losing an intentional draft; restore list filters, tab, page, selection and scroll position",
      "Draft, validate in lower environment, approve, schedule, canary by feature flag, pause, rollback or supersede"
    ],
    "edgeCases": [
      "Session expires, role tenure ends, delegation is revoked or organisational scope changes while the screen is open",
      "The record is edited, archived, merged, withdrawn or deleted by another authorised user before submission",
      "The user opens the same action in multiple tabs or submits twice because of latency, refresh or device retry",
      "Network changes between online, slow, intermittent and offline states without discarding safe unsaved input",
      "Invalid value, dependent service incompatible, rollout partly applied, administrator attempts own approval or setting would disable access/audit"
    ],
    "negativeTests": [
      "EX-platform-admin-settings-01: complete the normal action and verify the authoritative state plus audit event",
      "EX-platform-admin-settings-02: expire/revoke the role immediately before submit; expect denial and no mutation",
      "EX-platform-admin-settings-03: submit twice with the same idempotency key; expect exactly one business result",
      "EX-platform-admin-settings-04: change the record version in another session; expect conflict and explicit recovery",
      "EX-platform-admin-settings-05: interrupt the network; retain safe input and show truthful pending/failed status"
    ],
    "errors": [
      "401 session expired: save only an allowed local draft, reauthenticate and resume after policy-context validation",
      "403 denied: explain missing permission or scope without revealing protected record data; offer a safe route or access-request path",
      "404/410 unavailable: distinguish never found, archived, merged, withdrawn and expired; link to the correct replacement/list",
      "409/412 conflict: display the latest version and safe diff; allow reload, deliberate merge or abandon-never silently overwrite",
      "429/5xx/network: show retry timing/reference, prevent duplicate writes with idempotency and keep the interface usable",
      "Reject unsafe configuration before publication; secrets are references to vault entries, never readable values"
    ],
    "recovery": [
      "Use a stable idempotency key for each mutation and disable only the submitted action-not the whole screen",
      "Persist permitted drafts with expiry and classification; never store restricted evidence, OTPs, chat or payment proof in unsafe browser storage",
      "After retry, refetch the authoritative record, reconcile optimistic UI and show exactly what succeeded or remains pending",
      "Include a correlation/reference ID in technical failures and support escalation; never show stack traces, secrets or internal policy expressions",
      "Keep last-known-good version and automated rollback trigger with post-change health verification"
    ],
    "security": [
      "Recheck resource, action, organisational scope, field visibility, active role dates and delegation immediately before mutation",
      "Audit failures and denied privileged actions with actor, active assignment, unit, safe reason, policy version and correlation ID",
      "Mask sensitive values in UI, logs, exports, notifications and support views; record access to highly restricted data"
    ]
  }
] satisfies ScreenDefinition[];
export const screenById = new Map(screenCatalog.map((screen) => [screen.id, screen]));
export const screenByRoute = new Map(screenCatalog.map((screen) => [screen.route, screen]));

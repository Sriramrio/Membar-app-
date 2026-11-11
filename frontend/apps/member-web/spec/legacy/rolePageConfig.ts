export interface RolePageMeta { id:number; title:string; purpose:string; primaryActions:string[]; requiredData:string[] }
export const rolePageConfig:RolePageMeta[] = [
  {
    "id": 43,
    "title": "Organisational Dashboard",
    "purpose": "Present role-scoped Chapter/City/Region/State/Country roll-ups with freshness and drill-down.",
    "primaryActions": [
      "Change scope/period.",
      "drill down.",
      "open queue.",
      "export permitted aggregate"
    ],
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
    ]
  },
  {
    "id": 44,
    "title": "Workflow Inbox",
    "purpose": "Unify assigned approvals, reviews, corrections, escalations and delegated tasks.",
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
    ]
  },
  {
    "id": 45,
    "title": "Member Management",
    "purpose": "Search and manage member lifecycle within organisational scope.",
    "primaryActions": [
      "Open.",
      "request correction.",
      "approve allowed change.",
      "suspend/escalate.",
      "initiate transfer"
    ],
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
    ]
  },
  {
    "id": 46,
    "title": "Visitor Management",
    "purpose": "Manage visitor records, deduplication, follow-up, conversion and consent status.",
    "primaryActions": [
      "Add.",
      "edit.",
      "merge candidate.",
      "assign follow-up.",
      "invite onboarding.",
      "archive"
    ],
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
    ]
  },
  {
    "id": 47,
    "title": "New Member Onboarding",
    "purpose": "Run a simple staged application from invitation through approval and activation.",
    "primaryActions": [
      "Invite.",
      "review.",
      "request information.",
      "verify.",
      "recommend.",
      "approve/reject.",
      "activate"
    ],
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
    ]
  },
  {
    "id": 48,
    "title": "Meeting Administration",
    "purpose": "Create chapter/unit meetings, agendas, attendance polls, check-in and minutes workflow.",
    "primaryActions": [
      "Create.",
      "publish.",
      "poll.",
      "remind.",
      "check in.",
      "close.",
      "submit minutes"
    ],
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
    ]
  },
  {
    "id": 49,
    "title": "Attendance Administration",
    "purpose": "Capture, import, correct, reconcile and finalise meeting attendance.",
    "primaryActions": [
      "Manual mark.",
      "upload/API import.",
      "reconcile.",
      "approve.",
      "finalise.",
      "reverse by correction"
    ],
    "requiredData": [
      "Meeting.",
      "eligible members.",
      "source.",
      "status.",
      "check-in.",
      "exception.",
      "correction.",
      "finalisation"
    ]
  },
  {
    "id": 50,
    "title": "Payment Administration",
    "purpose": "Import/reconcile dues and payments, resolve exceptions and issue authorised receipts.",
    "primaryActions": [
      "Import/API sync.",
      "match.",
      "split/merge according to policy.",
      "approve.",
      "post.",
      "reverse.",
      "issue receipt"
    ],
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
    ]
  },
  {
    "id": 51,
    "title": "Announcement Management",
    "purpose": "Create and approve targeted announcements for Chapter or higher scopes.",
    "primaryActions": [
      "Draft.",
      "preview audience.",
      "submit.",
      "approve.",
      "publish.",
      "withdraw"
    ],
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
    ]
  },
  {
    "id": 52,
    "title": "Event Management",
    "purpose": "Create events, registrations, capacity, payments, attendance and post-event follow-up.",
    "primaryActions": [
      "Draft.",
      "submit.",
      "publish.",
      "manage registrations.",
      "check in.",
      "close.",
      "report"
    ],
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
    ]
  },
  {
    "id": 53,
    "title": "Gallery Management",
    "purpose": "Upload, moderate, approve and publish event/chapter media.",
    "primaryActions": [
      "Upload.",
      "tag.",
      "submit.",
      "approve/reject.",
      "publish.",
      "unpublish.",
      "remove"
    ],
    "requiredData": [
      "Album.",
      "files.",
      "captions.",
      "consent.",
      "classification.",
      "status.",
      "retention"
    ]
  },
  {
    "id": 54,
    "title": "Promotion Management",
    "purpose": "Create and govern paid/approved promotions restricted to Chapter, City, Region, State, Country or permitted audience.",
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
    ]
  },
  {
    "id": 55,
    "title": "Operational Reports",
    "purpose": "Generate governed scoped reports for membership, visitors, meetings, attendance, payments and business activity.",
    "primaryActions": [
      "Run.",
      "preview.",
      "export.",
      "schedule if authorised"
    ],
    "requiredData": [
      "Report catalogue.",
      "scope.",
      "period.",
      "filters.",
      "metric version.",
      "freshness.",
      "privacy threshold"
    ]
  },
  {
    "id": 56,
    "title": "Management & Board Dashboard",
    "purpose": "Provide strategic roll-ups, decisions, risks, exceptions and governance actions without operational clutter.",
    "primaryActions": [
      "Drill down.",
      "open decision.",
      "view board pack.",
      "request analysis"
    ],
    "requiredData": [
      "Membership/network/business outcome trends.",
      "operational health.",
      "decisions.",
      "risks.",
      "policy exceptions.",
      "role expiry.",
      "data freshness"
    ]
  },
  {
    "id": 57,
    "title": "Decision Register",
    "purpose": "Record proposals, deliberation, conflicts, votes/consent, resolutions and accountable actions.",
    "primaryActions": [
      "Submit.",
      "declare conflict.",
      "review.",
      "record vote/consent.",
      "resolve.",
      "assign action.",
      "close"
    ],
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
    ]
  },
  {
    "id": 58,
    "title": "Board Packs",
    "purpose": "Assemble controlled, versioned meeting packs and track distribution/acknowledgement.",
    "primaryActions": [
      "Compile.",
      "review.",
      "approve.",
      "publish.",
      "withdraw.",
      "acknowledge.",
      "download"
    ],
    "requiredData": [
      "Meeting.",
      "agenda.",
      "documents.",
      "classification.",
      "versions.",
      "recipients.",
      "release time.",
      "acknowledgement"
    ]
  },
  {
    "id": 59,
    "title": "Strategy & Outcomes",
    "purpose": "Maintain objectives, initiatives, owners, measures and review commentary.",
    "primaryActions": [
      "Create proposal.",
      "update progress.",
      "review.",
      "approve change.",
      "link decision"
    ],
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
    ]
  },
  {
    "id": 60,
    "title": "Policy Register",
    "purpose": "Govern policies, versions, approvals, effective dates, acknowledgements and exceptions.",
    "primaryActions": [
      "Draft.",
      "review.",
      "approve.",
      "publish.",
      "supersede.",
      "retire.",
      "request exception"
    ],
    "requiredData": [
      "Policy.",
      "owner.",
      "classification.",
      "version.",
      "approval.",
      "effective/expiry.",
      "audience.",
      "acknowledgement"
    ]
  },
  {
    "id": 61,
    "title": "Policy Exceptions",
    "purpose": "Assess time-bound exceptions with risk, compensating controls and expiry.",
    "primaryActions": [
      "Submit.",
      "assess.",
      "approve/reject.",
      "monitor.",
      "renew.",
      "close"
    ],
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
    ]
  },
  {
    "id": 62,
    "title": "Role & Tenure Oversight",
    "purpose": "Review current/future/expired office assignments, delegations, conflicts and succession/handover.",
    "primaryActions": [
      "Propose.",
      "review.",
      "approve.",
      "revoke prospectively.",
      "delegate.",
      "certify.",
      "start handover"
    ],
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
    ]
  },
  {
    "id": 63,
    "title": "Governance History",
    "purpose": "Search historical office periods, decisions, approvals and actions linked to the responsible tenure.",
    "primaryActions": [
      "Filter.",
      "open record.",
      "export authorised history.",
      "compare terms"
    ],
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
    ]
  },
  {
    "id": 64,
    "title": "Platform Administration Dashboard",
    "purpose": "Show technical health, security, integration, job, audit and data-quality signals without granting business authority.",
    "primaryActions": [
      "Open incident/configuration.",
      "acknowledge alert.",
      "view runbook"
    ],
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
    ]
  },
  {
    "id": 65,
    "title": "Identity Administration",
    "purpose": "Manage accounts, verification, sessions, MFA and access support under purpose-limited controls.",
    "primaryActions": [
      "Unlock.",
      "revoke sessions.",
      "require reset/MFA.",
      "link correction workflow.",
      "issue time-bound support grant"
    ],
    "requiredData": [
      "User/member link.",
      "status.",
      "verified contacts.",
      "MFA.",
      "sessions.",
      "lock.",
      "risk.",
      "support grant"
    ]
  },
  {
    "id": 66,
    "title": "Organisation Hierarchy",
    "purpose": "Configure effective-dated Country, State, Region, City, Chapter and governance-body relationships.",
    "primaryActions": [
      "Create proposal.",
      "edit future version.",
      "merge/close with migration plan.",
      "inspect lineage"
    ],
    "requiredData": [
      "Unit.",
      "type.",
      "parent.",
      "code.",
      "status.",
      "dates.",
      "leadership reference.",
      "successor"
    ]
  },
  {
    "id": 67,
    "title": "Role Catalogue & Assignments",
    "purpose": "Define governed role templates and inspect effective-dated assignments/delegations.",
    "primaryActions": [
      "Create/version role.",
      "assign via authorised workflow.",
      "expire.",
      "certify.",
      "inspect history"
    ],
    "requiredData": [
      "Role.",
      "responsibility set.",
      "eligible unit types.",
      "assignment.",
      "dates.",
      "status.",
      "delegation.",
      "constraints"
    ]
  },
  {
    "id": 68,
    "title": "RBAC Matrix",
    "purpose": "Map roles to resource/action/scope/field permissions and test effective access.",
    "primaryActions": [
      "Edit draft.",
      "simulate.",
      "compare.",
      "submit.",
      "approve.",
      "publish.",
      "rollback version"
    ],
    "requiredData": [
      "Role.",
      "resource.",
      "action.",
      "scope rule.",
      "field mask.",
      "conditions.",
      "version.",
      "effective date"
    ]
  },
  {
    "id": 69,
    "title": "RACI Matrix",
    "purpose": "Map process steps to Responsible, Accountable, Consulted and Informed roles with segregation controls.",
    "primaryActions": [
      "Edit.",
      "validate gaps.",
      "simulate assignment.",
      "approve.",
      "publish"
    ],
    "requiredData": [
      "Process.",
      "step.",
      "unit level.",
      "R/A/C/I roles.",
      "SLA.",
      "escalation.",
      "evidence.",
      "conflicts"
    ]
  },
  {
    "id": 70,
    "title": "Workflow Designer",
    "purpose": "Configure versioned states, transitions, forms, RACI, SLAs, escalation and evidence rules.",
    "primaryActions": [
      "Draft.",
      "validate.",
      "simulate.",
      "approve.",
      "publish.",
      "retire"
    ],
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
    ]
  },
  {
    "id": 71,
    "title": "Lookups & Taxonomies",
    "purpose": "Govern categories, meeting types, opportunity types, statuses, reasons and synonyms.",
    "primaryActions": [
      "Create/version.",
      "merge.",
      "deactivate.",
      "map legacy value.",
      "publish"
    ],
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
    ]
  },
  {
    "id": 72,
    "title": "Form Builder",
    "purpose": "Configure versioned field definitions, help, validation, consent and workflow binding.",
    "primaryActions": [
      "Draft.",
      "preview responsive.",
      "validate.",
      "approve.",
      "publish.",
      "retire"
    ],
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
    ]
  },
  {
    "id": 73,
    "title": "Import Centre",
    "purpose": "Stage attendance/payment/member reference files or API batches, map, validate, reconcile, approve and post.",
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
    ]
  },
  {
    "id": 74,
    "title": "Integration Administration",
    "purpose": "Configure and monitor attendance, payment, notification, calendar and approved external integrations.",
    "primaryActions": [
      "Test.",
      "enable/disable.",
      "rotate secret via vault.",
      "retry safe job.",
      "inspect contract"
    ],
    "requiredData": [
      "Provider.",
      "endpoint alias.",
      "auth type.",
      "scopes.",
      "status.",
      "last sync.",
      "retry/dead letter.",
      "version"
    ]
  },
  {
    "id": 75,
    "title": "Moderation Queue",
    "purpose": "Review reported profiles, content, messages metadata, gallery and promotions under policy.",
    "primaryActions": [
      "Claim.",
      "restrict.",
      "request info.",
      "dismiss.",
      "remove.",
      "escalate.",
      "appeal"
    ],
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
    ]
  },
  {
    "id": 76,
    "title": "Notification Administration",
    "purpose": "Manage templates, channels, audience rules, mandatory flags, delivery and retries.",
    "primaryActions": [
      "Preview.",
      "test.",
      "approve.",
      "publish.",
      "pause.",
      "retry allowed failures"
    ],
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
    ]
  },
  {
    "id": 77,
    "title": "Promotion Policy & Inventory",
    "purpose": "Configure placements, geographic scopes, eligibility, pricing/order rules, frequency and approvals.",
    "primaryActions": [
      "Create/version rule.",
      "preview.",
      "approve.",
      "publish.",
      "suspend"
    ],
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
    ]
  },
  {
    "id": 78,
    "title": "Audit Explorer",
    "purpose": "Search append-only authentication, authorization, workflow, data and administration history.",
    "primaryActions": [
      "Filter.",
      "open event.",
      "follow correlation.",
      "export with reason.",
      "verify chain/status"
    ],
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
    ]
  },
  {
    "id": 79,
    "title": "Data Quality Centre",
    "purpose": "Detect and resolve duplicates, missing data, invalid hierarchy/category, stale records and reconciliation issues.",
    "primaryActions": [
      "Assign.",
      "compare.",
      "merge through workflow.",
      "correct.",
      "waive with reason.",
      "rerun rule"
    ],
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
    ]
  },
  {
    "id": 80,
    "title": "Platform Settings",
    "purpose": "Manage safe global configuration, feature flags, retention, branding references and operational limits.",
    "primaryActions": [
      "Propose.",
      "validate.",
      "approve.",
      "schedule.",
      "rollback"
    ],
    "requiredData": [
      "Setting.",
      "environment.",
      "value classification.",
      "owner.",
      "version.",
      "effective date.",
      "flag rollout.",
      "change request"
    ]
  }
];
export const rolePageById=new Map(rolePageConfig.map(x=>[x.id,x]));

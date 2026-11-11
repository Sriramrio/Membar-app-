-- ==============================================================================
-- MIGRATION 13: BUSINESS DEFINITIONS PLATFORM ARCHITECTURE
-- Tables: Master Data, Reference Data, Forms, Workflows, SLA Policies, Calendars
-- ==============================================================================

-- 1. Master Data Table
CREATE TABLE IF NOT EXISTS public.sethu_platform_master_data (
    id text NOT NULL PRIMARY KEY,
    domain text NOT NULL,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text NULL,
    status text NOT NULL DEFAULT 'Active',
    version int NOT NULL DEFAULT 1,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    consumer_workspaces jsonb NOT NULL DEFAULT '["MEMBER", "ORGANISATION"]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed Master Data
INSERT INTO public.sethu_platform_master_data (id, domain, code, name, description, status, version, metadata, consumer_workspaces)
VALUES
    ('md-mem-std', 'membership', 'MEMBER_STANDARD', 'Standard Chapter Member', 'Standard annual chartered chapter networking member', 'Active', 1, '{"tier": "STANDARD", "renewalIntervalMonths": 12}'::jsonb, '["MEMBER", "ORGANISATION"]'::jsonb),
    ('md-mem-life', 'membership', 'MEMBER_LIFETIME', 'Patron / Lifetime Member', 'Chartered lifetime membership with executive trustee review privileges', 'Active', 1, '{"tier": "LIFETIME", "renewalIntervalMonths": 0}'::jsonb, '["MEMBER", "ORGANISATION", "GOVERNANCE"]'::jsonb),
    ('md-ou-nat', 'organisation', 'OU_NATIONAL', 'National Executive Board', 'Apex national leadership authority for SETHU network', 'Active', 1, '{"level": 1, "delegatable": false}'::jsonb, '["ORGANISATION", "GOVERNANCE"]'::jsonb),
    ('md-ou-reg', 'organisation', 'OU_REGIONAL', 'Regional Coordination Hub', 'Cluster governance authority overseeing municipal chapters', 'Active', 1, '{"level": 2, "delegatable": true}'::jsonb, '["ORGANISATION"]'::jsonb),
    ('md-ou-chap', 'organisation', 'OU_CHAPTER', 'Local Chartered Chapter', 'Ground-level chartered chapter executing weekly networking meetings', 'Active', 1, '{"level": 3, "delegatable": true}'::jsonb, '["ORGANISATION", "MEMBER"]'::jsonb),
    ('md-meet-reg', 'meeting', 'MEETING_REGULAR', 'Weekly Chapter Breakfast', 'Standard weekly chapter business referral breakfast meeting', 'Active', 1, '{"cadence": "WEEKLY", "quorumPercent": 65}'::jsonb, '["ORGANISATION", "MEMBER"]'::jsonb),
    ('md-meet-con', 'meeting', 'MEETING_CONCLAVE', 'Annual Regional Conclave', 'Quarterly multi-chapter business confluence and awards summit', 'Active', 1, '{"cadence": "QUARTERLY", "quorumPercent": 50}'::jsonb, '["ORGANISATION", "MEMBER", "GOVERNANCE"]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- 2. Reference Data Table
CREATE TABLE IF NOT EXISTS public.sethu_platform_reference_data (
    id text NOT NULL PRIMARY KEY,
    domain text NOT NULL,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text NULL,
    source text NOT NULL,
    source_version text NOT NULL DEFAULT '2026.1',
    source_uri text NULL,
    status text NOT NULL DEFAULT 'Active',
    version int NOT NULL DEFAULT 1,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    consumer_workspaces jsonb NOT NULL DEFAULT '["MEMBER", "ORGANISATION", "GOVERNANCE"]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed Reference Data
INSERT INTO public.sethu_platform_reference_data (id, domain, code, name, description, source, source_version, source_uri, status, version, metadata)
VALUES
    ('rd-gst-tn', 'statutory', 'GST-33-TN', 'Tamil Nadu (33)', 'Indian State GST code for Tamil Nadu', 'GST Council of India', '2026.1', 'https://cbic-gst.gov.in', 'Active', 1, '{"stateCode": "33", "zone": "South"}'::jsonb),
    ('rd-gst-ka', 'statutory', 'GST-29-KA', 'Karnataka (29)', 'Indian State GST code for Karnataka', 'GST Council of India', '2026.1', 'https://cbic-gst.gov.in', 'Active', 1, '{"stateCode": "29", "zone": "South"}'::jsonb),
    ('rd-gst-mh', 'statutory', 'GST-27-MH', 'Maharashtra (27)', 'Indian State GST code for Maharashtra', 'GST Council of India', '2026.1', 'https://cbic-gst.gov.in', 'Active', 1, '{"stateCode": "27", "zone": "West"}'::jsonb),
    ('rd-gst-dl', 'statutory', 'GST-07-DL', 'Delhi NCR (07)', 'Indian State GST code for Delhi Union Territory', 'GST Council of India', '2026.1', 'https://cbic-gst.gov.in', 'Active', 1, '{"stateCode": "07", "zone": "North"}'::jsonb),
    ('rd-iso-in', 'geography', 'ISO-3166-IN', 'India (IND)', 'ISO 3166-1 alpha-2 standard country code for Republic of India', 'International Organization for Standardization', '2026-REV', 'https://iso.org', 'Active', 1, '{"alpha3": "IND", "dialCode": "+91"}'::jsonb),
    ('rd-iso-us', 'geography', 'ISO-3166-US', 'United States (USA)', 'ISO 3166-1 alpha-2 standard country code for USA', 'International Organization for Standardization', '2026-REV', 'https://iso.org', 'Active', 1, '{"alpha3": "USA", "dialCode": "+1"}'::jsonb),
    ('rd-cur-inr', 'currency', 'CUR-INR', 'Indian Rupee (INR)', 'Canonical sovereign currency code for domestic chapter operations', 'Reserve Bank of India', '2026.1', 'https://rbi.org.in', 'Active', 1, '{"symbol": "₹", "minorUnit": 2}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- 3. Forms Table
CREATE TABLE IF NOT EXISTS public.sethu_platform_forms (
    id text NOT NULL PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text NULL,
    status text NOT NULL DEFAULT 'Published',
    current_version int NOT NULL DEFAULT 1,
    consumer_workspaces jsonb NOT NULL DEFAULT '["MEMBER", "ORGANISATION"]'::jsonb,
    fields jsonb NOT NULL DEFAULT '[]'::jsonb,
    validation_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed Forms
INSERT INTO public.sethu_platform_forms (id, code, name, description, status, current_version, consumer_workspaces, fields, validation_rules)
VALUES
    ('frm-mem-onboard', 'MEMBER_PROFILE_INDUCTION', 'Member Profile & Chapter Induction Form', 'Governed intake schema for business background, taxonomy sector claim and KYC identity verification', 'Published', 1, '["MEMBER", "ORGANISATION"]'::jsonb,
    '[
        {"key": "businessName", "label": "Enterprise Legal Trade Name", "type": "TEXT", "privacyClassification": "INTERNAL", "required": true},
        {"key": "primarySpecialisationId", "label": "Taxonomy Category Claim", "type": "SELECT", "privacyClassification": "INTERNAL", "required": true},
        {"key": "gstNumber", "label": "Goods & Services Tax Identification (GSTIN)", "type": "TEXT", "privacyClassification": "CONFIDENTIAL", "required": false},
        {"key": "panNumber", "label": "Permanent Account Number (PAN)", "type": "TEXT", "privacyClassification": "CONFIDENTIAL", "required": true},
        {"key": "annualTurnoverRange", "label": "Annual Revenue Band", "type": "SELECT", "privacyClassification": "CONFIDENTIAL", "required": true},
        {"key": "sponsorMemberId", "label": "Proposing / Sponsoring Member ID", "type": "TEXT", "privacyClassification": "INTERNAL", "required": false}
    ]'::jsonb,
    '[
        {"rule": "PAN_REGEX", "expression": "^[A-Z]{5}[0-9]{4}[A-Z]{1}$", "errorMessage": "Invalid Indian PAN format"}
    ]'::jsonb),
    ('frm-kyc-verify', 'KYC_ATTESTATION', 'Chapter Leader Identity & Governance Attestation', 'Mandatory compliance questionnaire verifying chapter trustee leadership without conflict of interest', 'Published', 1, '["ORGANISATION", "GOVERNANCE"]'::jsonb,
    '[
        {"key": "governmentIdDoc", "label": "Government Issued Identity Document", "type": "DOCUMENT", "privacyClassification": "CONFIDENTIAL", "required": true},
        {"key": "noConflictDeclaration", "label": "Declaration of No Commercial Conflict", "type": "BOOLEAN", "privacyClassification": "INTERNAL", "required": true},
        {"key": "independentGovernanceAgree", "label": "Acceptance of National Governance Charter", "type": "BOOLEAN", "privacyClassification": "PUBLIC", "required": true}
    ]'::jsonb,
    '[]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- 4. Workflows Table
CREATE TABLE IF NOT EXISTS public.sethu_platform_workflows (
    id text NOT NULL PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text NULL,
    status text NOT NULL DEFAULT 'Published',
    current_version int NOT NULL DEFAULT 1,
    consumer_workspaces jsonb NOT NULL DEFAULT '["ORGANISATION", "GOVERNANCE"]'::jsonb,
    states jsonb NOT NULL DEFAULT '[]'::jsonb,
    transitions jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed Workflows
INSERT INTO public.sethu_platform_workflows (id, code, name, description, status, current_version, consumer_workspaces, states, transitions)
VALUES
    ('wf-chap-onboard', 'WF_CHAPTER_ONBOARDING', 'Charter Chapter Induction Workflow', 'End-to-end governed state machine for new chapter formation, sponsor review, and national charter activation', 'Published', 1, '["ORGANISATION", "GOVERNANCE"]'::jsonb,
    '[
        {"code": "DRAFT", "name": "Draft Formation Proposal", "initial": true},
        {"code": "UNDER_SPONSOR_REVIEW", "name": "Regional Sponsor Review", "initial": false},
        {"code": "MEMBERSHIP_QUORUM_VERIFIED", "name": "Launch Quorum Attested", "initial": false},
        {"code": "GOVERNANCE_APPROVED", "name": "National Board Approved", "initial": false},
        {"code": "ACTIVE", "name": "Chartered & Active", "terminal": true},
        {"code": "REJECTED", "name": "Proposal Rejected", "terminal": true}
    ]'::jsonb,
    '[
        {"code": "SUBMIT_FOR_REVIEW", "from": "DRAFT", "to": "UNDER_SPONSOR_REVIEW", "permission": "organisation.chapter.propose", "reasonRequired": true},
        {"code": "CONFIRM_QUORUM", "from": "UNDER_SPONSOR_REVIEW", "to": "MEMBERSHIP_QUORUM_VERIFIED", "permission": "organisation.hierarchy.write", "reasonRequired": false},
        {"code": "BOARD_APPROVAL", "from": "MEMBERSHIP_QUORUM_VERIFIED", "to": "GOVERNANCE_APPROVED", "permission": "governance.decision.approve", "reasonRequired": true},
        {"code": "ACTIVATE_CHARTER", "from": "GOVERNANCE_APPROVED", "to": "ACTIVE", "permission": "platform.security.manage", "reasonRequired": true},
        {"code": "REJECT", "from": "UNDER_SPONSOR_REVIEW", "to": "REJECTED", "permission": "governance.decision.approve", "reasonRequired": true}
    ]'::jsonb),
    ('wf-mem-induction', 'WF_MEMBER_INDUCTION', 'Member Application & Induction Lifecycle', 'Application vetting, category conflict verification, membership fee receipt and chapter swearing-in', 'Published', 1, '["ORGANISATION", "MEMBER"]'::jsonb,
    '[
        {"code": "APPLICATION_SUBMITTED", "name": "Application Submitted", "initial": true},
        {"code": "TAXONOMY_VETTED", "name": "Category Conflict Cleared", "initial": false},
        {"code": "PAYMENT_CLEARED", "name": "Charter Fee Reconciled", "initial": false},
        {"code": "INDUCTED", "name": "Active Inducted Member", "terminal": true},
        {"code": "WITHDRAWN", "name": "Application Withdrawn", "terminal": true}
    ]'::jsonb,
    '[
        {"code": "CLEAR_TAXONOMY", "from": "APPLICATION_SUBMITTED", "to": "TAXONOMY_VETTED", "permission": "organisation.member.review", "reasonRequired": true},
        {"code": "CONFIRM_PAYMENT", "from": "TAXONOMY_VETTED", "to": "PAYMENT_CLEARED", "permission": "platform.legacy_members.finance_attest", "reasonRequired": false},
        {"code": "FINALIZE_INDUCTION", "from": "PAYMENT_CLEARED", "to": "INDUCTED", "permission": "organisation.member.activate", "reasonRequired": true}
    ]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- 5. SLA Policies Table
CREATE TABLE IF NOT EXISTS public.sethu_platform_sla_policies (
    id text NOT NULL PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    duration_minutes int NOT NULL DEFAULT 2880,
    warning_minutes int NOT NULL DEFAULT 1440,
    breach_minutes int NOT NULL DEFAULT 2880,
    pause_states jsonb NOT NULL DEFAULT '["PENDING_DOCS", "ON_HOLD"]'::jsonb,
    calendar_id text NOT NULL DEFAULT 'CAL_IST_STANDARD',
    status text NOT NULL DEFAULT 'Active',
    version int NOT NULL DEFAULT 1,
    escalation_levels jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed SLA Policies
INSERT INTO public.sethu_platform_sla_policies (id, code, name, duration_minutes, warning_minutes, breach_minutes, pause_states, calendar_id, status, version, escalation_levels)
VALUES
    ('sla-mem-app-48h', 'SLA_MEMBER_APPLICATION_48H', 'Standard Member Application Vetting SLA', 2880, 1440, 2880, '["PENDING_APPLICANT_DOCUMENTS", "CATEGORY_CHALLENGE"]'::jsonb, 'CAL_IST_STANDARD', 'Active', 1,
    '[
        {"afterMinutes": 1440, "resolver": "CHAPTER_PRESIDENT", "notificationEventId": "evt-sla-warn"},
        {"afterMinutes": 2880, "resolver": "REGIONAL_COORDINATOR", "notificationEventId": "evt-sla-breach"}
    ]'::jsonb),
    ('sla-kyc-verify-24h', 'SLA_KYC_VERIFICATION_24H', 'Leadership KYC Document Clearance SLA', 1440, 720, 1440, '["PENDING_RE_UPLOAD"]'::jsonb, 'CAL_IST_STANDARD', 'Active', 1,
    '[
        {"afterMinutes": 720, "resolver": "CHAPTER_SECRETARY", "notificationEventId": "evt-kyc-warn"},
        {"afterMinutes": 1440, "resolver": "GOVERNANCE_REVIEWER", "notificationEventId": "evt-kyc-breach"}
    ]'::jsonb),
    ('sla-payment-recon-72h', 'SLA_FINANCE_RECONCILIATION_72H', 'Charter Fee Banking Reconciliation SLA', 4320, 2880, 4320, '["BANK_HOLIDAY_WINDOW"]'::jsonb, 'CAL_IST_STANDARD', 'Active', 1,
    '[
        {"afterMinutes": 2880, "resolver": "CHAPTER_TREASURER", "notificationEventId": "evt-fin-warn"},
        {"afterMinutes": 4320, "resolver": "NATIONAL_FINANCE_HEAD", "notificationEventId": "evt-fin-breach"}
    ]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- 6. Business Calendars Table
CREATE TABLE IF NOT EXISTS public.sethu_platform_business_calendars (
    id text NOT NULL PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    timezone text NOT NULL DEFAULT 'Asia/Kolkata',
    working_days jsonb NOT NULL DEFAULT '[1, 2, 3, 4, 5, 6]'::jsonb,
    working_hours jsonb NOT NULL DEFAULT '{"start": "09:30", "end": "18:00"}'::jsonb,
    holidays jsonb NOT NULL DEFAULT '[]'::jsonb,
    status text NOT NULL DEFAULT 'Active',
    version int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed Business Calendars
INSERT INTO public.sethu_platform_business_calendars (id, code, name, timezone, working_days, working_hours, holidays, status, version)
VALUES
    ('cal-ist-std', 'CAL_IST_STANDARD', 'National Standard Business Calendar (IST)', 'Asia/Kolkata', '[1, 2, 3, 4, 5, 6]'::jsonb, '{"start": "09:30", "end": "18:00"}'::jsonb,
    '[
        {"date": "2026-01-26", "name": "Republic Day"},
        {"date": "2026-04-14", "name": "Tamil New Year / Dr. Ambedkar Jayanti"},
        {"date": "2026-05-01", "name": "May Day"},
        {"date": "2026-08-15", "name": "Independence Day"},
        {"date": "2026-10-02", "name": "Mahatma Gandhi Jayanti"},
        {"date": "2026-10-20", "name": "Vijayadashami"},
        {"date": "2026-11-08", "name": "Deepavali"}
    ]'::jsonb, 'Active', 1),
    ('cal-tn-state', 'CAL_TN_STATE', 'Tamil Nadu Regional Calendar', 'Asia/Kolkata', '[1, 2, 3, 4, 5, 6]'::jsonb, '{"start": "09:00", "end": "17:30"}'::jsonb,
    '[
        {"date": "2026-01-14", "name": "Pongal Festival"},
        {"date": "2026-01-15", "name": "Thiruvalluvar Day"},
        {"date": "2026-01-16", "name": "Uzhavar Thirunal"}
    ]'::jsonb, 'Active', 1)
ON CONFLICT (code) DO NOTHING;


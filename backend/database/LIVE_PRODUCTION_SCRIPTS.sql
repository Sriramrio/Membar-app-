-- ==============================================================================
-- SETHU PLATFORM - LIVE PRODUCTION DATABASE MIGRATION SCRIPT
-- Environment: Live Production PostgreSQL
-- Created: 2026-11-04
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- MIGRATION 01: Platform Configuration Registry Table & Baseline Parameters
-- Target Table: public.sethu_platform_configurations
-- Purpose: Dynamic runtime parameter governance (SLA, thresholds, grace periods, etc.)
-- ------------------------------------------------------------------------------

-- 1. Create Configurations Table (Safe IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.sethu_platform_configurations (
    key text NOT NULL,
    scope_id text NOT NULL,
    domain text NOT NULL,
    scope_type text NOT NULL,
    value text NOT NULL,
    version int NOT NULL DEFAULT 1,
    status text NOT NULL DEFAULT 'Active',
    inheritance_mode text NOT NULL DEFAULT 'INHERITED',
    updated_by text NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (key, scope_id)
);

-- 2. Create Indexes for High Performance Lookup
CREATE INDEX IF NOT EXISTS ix_sethu_platform_configurations_domain 
    ON public.sethu_platform_configurations (domain);

CREATE INDEX IF NOT EXISTS ix_sethu_platform_configurations_scope 
    ON public.sethu_platform_configurations (scope_id);

-- 3. Seed Governed Baseline Rules (Safe ON CONFLICT DO NOTHING)
INSERT INTO public.sethu_platform_configurations 
    (key, scope_id, domain, scope_type, value, version, status, inheritance_mode, updated_at)
VALUES
    ('membership.review.slaHours', 'OU-CH-CENTRAL', 'membership', 'Central', '48', 1, 'Active', 'INHERITED', now()),
    ('chapter.induction.approvalThreshold', 'OU-CH-CENTRAL', 'chapter', 'Central', '2', 1, 'Active', 'INHERITED', now()),
    ('finance.payment.gracePeriodDays', 'OU-CH-CENTRAL', 'finance', 'Central', '7', 1, 'Active', 'INHERITED', now()),
    ('attendance.minimumAttendancePercent', 'OU-CH-CENTRAL', 'operations', 'Central', '70', 1, 'Active', 'INHERITED', now()),
    ('security.session.maxHours', 'OU-CH-CENTRAL', 'security', 'Central', '12', 1, 'Active', 'INHERITED', now()),
    ('onboarding.kyc.mandatoryDocumentsCount', 'OU-CH-CENTRAL', 'membership', 'Central', '2', 1, 'Active', 'INHERITED', now()),
    ('notifications.email.dispatchBatchSize', 'OU-CH-CENTRAL', 'communication', 'Central', '50', 1, 'Active', 'INHERITED', now())
ON CONFLICT (key, scope_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- MIGRATION 02: Platform Configuration Profiles Table
-- Target Table: public.sethu_platform_configuration_profiles
-- Purpose: Reusable, versioned configuration bundles assigned to unit scopes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sethu_platform_configuration_profiles (
    id text NOT NULL PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text NULL,
    applicable_unit_types jsonb NOT NULL DEFAULT '["CHAPTER"]'::jsonb,
    status text NOT NULL DEFAULT 'Active',
    effective_from timestamptz NOT NULL DEFAULT now(),
    version int NOT NULL DEFAULT 1,
    values_json jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_sethu_platform_configuration_profiles_status 
    ON public.sethu_platform_configuration_profiles (status);

INSERT INTO public.sethu_platform_configuration_profiles 
    (id, code, name, description, applicable_unit_types, status, effective_from, version, values_json)
VALUES
    ('prof-std-chapter', 'PROF-STD-CHAPTER', 'Standard Chapter Operations Profile', 
     'Baseline operational governance applied to all active chapters.', 
     '["CHAPTER"]'::jsonb, 'Active', '2026-01-01 00:00:00+00', 1, 
     '[
        {"key": "membership.review.slaHours", "value": "48", "locked": false},
        {"key": "chapter.induction.approvalThreshold", "value": "2", "locked": false},
        {"key": "finance.payment.gracePeriodDays", "value": "7", "locked": false},
        {"key": "attendance.minimumAttendancePercent", "value": "70", "locked": false}
      ]'::jsonb),
    ('prof-regional-hub', 'PROF-REGIONAL-HUB', 'Regional Cluster Operations Profile', 
     'Operational baseline for multi-chapter regional clusters and states.', 
     '["REGION", "STATE"]'::jsonb, 'Active', '2026-01-01 00:00:00+00', 1, 
     '[
        {"key": "chapter.cluster.crossReferralQuorum", "value": "5", "locked": false},
        {"key": "reporting.cluster.rollupIntervalDays", "value": "14", "locked": false}
      ]'::jsonb),
    ('prof-enterprise-gov', 'PROF-ENTERPRISE-GOV', 'National Governance Baseline', 
     'Strict security, audit and compliance baseline enforced at the national enterprise level.', 
     '["NATIONAL"]'::jsonb, 'Active', '2026-01-01 00:00:00+00', 1, 
     '[
        {"key": "security.session.maxHours", "value": "12", "locked": true},
        {"key": "audit.retention.years", "value": "7", "locked": true}
      ]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------------------------
-- MIGRATION 03: Governed Configuration Releases Table
-- Target Table: public.sethu_platform_releases
-- Purpose: Maker/checker release lifecycle for platform configurations
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sethu_platform_releases (
    id text NOT NULL PRIMARY KEY,
    artifact_type text NOT NULL,
    artifact_id text NOT NULL,
    change_summary text NOT NULL,
    reason text NULL,
    status text NOT NULL DEFAULT 'Draft',
    maker text NOT NULL,
    checker text NULL,
    version int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    validated_at timestamptz NULL,
    impact_analysed_at timestamptz NULL,
    effective_from timestamptz NULL,
    activated_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS ix_sethu_platform_releases_status 
    ON public.sethu_platform_releases (status);

INSERT INTO public.sethu_platform_releases 
    (id, artifact_type, artifact_id, change_summary, reason, status, maker, checker, version, validated_at, impact_analysed_at, activated_at, created_at)
VALUES
    ('REL-2026-001', 'ConfigurationProfile', 'PROF-ENTERPRISE-GOV', 
     'FY26 National Governance Baseline Activation', 
     'Mandatory baseline rollout for all national chapters under DBN charter.', 
     'Active', 'platformadmin@dbn.network', 'lead-architect@dbn.network', 1, 
     now() - interval '30 days', now() - interval '29 days', now() - interval '28 days', now() - interval '30 days'),
    ('REL-2026-002', 'ConfigurationProfile', 'PROF-STD-CHAPTER', 
     'Standard Chapter SLA & Grace Period Alignment', 
     'Updated default membership SLA from 72h to 48h to improve onboarding velocity.', 
     'Approved', 'platformadmin@dbn.network', 'gov-board@dbn.network', 1, 
     now() - interval '3 days', now() - interval '2 days', null, now() - interval '5 days'),
    ('REL-2026-003', 'ConfigurationItem', 'attendance.minimumAttendancePercent', 
     'Induction & Attendance Quorum Tightening Draft', 
     'Proposed increasing chapter minimum attendance percentage from 65% to 70%.', 
     'Draft', 'platformadmin@dbn.network', null, 1, 
     now() - interval '1 hour', null, null, now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- MIGRATION 04: Governed Change Sets Table
-- Target Table: public.sethu_platform_change_sets
-- Purpose: Atomic grouping of related technical changes before activation
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sethu_platform_change_sets (
    id text NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text NULL,
    status text NOT NULL DEFAULT 'Draft',
    maker text NOT NULL,
    checker text NULL,
    version int NOT NULL DEFAULT 1,
    items_json jsonb NOT NULL DEFAULT '[]'::jsonb,
    validated_at timestamptz NULL,
    impact_analysed_at timestamptz NULL,
    effective_from timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_sethu_platform_change_sets_status 
    ON public.sethu_platform_change_sets (status);

INSERT INTO public.sethu_platform_change_sets 
    (id, name, description, status, maker, checker, version, items_json, validated_at, impact_analysed_at, created_at)
VALUES
    ('CS-2026-001', 'FY26 Chapter Governance & Membership Alignment', 
     'Atomic roll-out of updated SLA, role assignments and chapter induction rules.', 
     'Active', 'platformadmin@dbn.network', 'governance-head@dbn.network', 1, 
     '[
        {"id": "cs-item-1", "artifactType": "Configuration", "artifactId": "membership.review.slaHours", "changeType": "UPDATE", "expectedVersion": 1, "summary": "Set review SLA to 48h"},
        {"id": "cs-item-2", "artifactType": "Profile", "artifactId": "PROF-STD-CHAPTER", "changeType": "UPDATE", "expectedVersion": 1, "summary": "Bind standard profile to Chapter tier"},
        {"id": "cs-item-3", "artifactType": "Security", "artifactId": "security.session.maxHours", "changeType": "UPDATE", "expectedVersion": 1, "summary": "Enforce 12h session ceiling"}
      ]'::jsonb, 
     now() - interval '20 days', now() - interval '19 days', now() - interval '20 days'),
    ('CS-2026-002', 'Q2 Regional Hub Quorum & Financial Delegation', 
     'Cluster-level changes for multi-chapter coordination and cross-referrals.', 
     'Pending Review', 'platformadmin@dbn.network', null, 1, 
     '[
        {"id": "cs-item-4", "artifactType": "Configuration", "artifactId": "finance.payment.gracePeriodDays", "changeType": "UPDATE", "expectedVersion": 1, "summary": "Standardize grace period to 7 business days"},
        {"id": "cs-item-5", "artifactType": "Profile", "artifactId": "PROF-REGIONAL-HUB", "changeType": "ASSIGN", "expectedVersion": 1, "summary": "Assign regional profile to TN Cluster"}
      ]'::jsonb, 
     now() - interval '2 days', now() - interval '1 day', now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- MIGRATION 05: Platform Features & Capabilities Registry Table
-- Target Table: public.sethu_platform_features
-- Purpose: Dynamic feature flag control plane across tenants, chapters and global scope
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sethu_platform_features (
    code text NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text NULL,
    scope_policy text NOT NULL DEFAULT 'GLOBAL',
    status text NOT NULL DEFAULT 'Active',
    capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
    dependencies jsonb NOT NULL DEFAULT '[]'::jsonb,
    version int NOT NULL DEFAULT 1,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_sethu_platform_features_status 
    ON public.sethu_platform_features (status);

INSERT INTO public.sethu_platform_features 
    (code, name, description, scope_policy, status, capabilities, dependencies, version, updated_at)
VALUES
    ('FEATURE-MEMBER-SELF-SERVICE', 'Member Self-Service Onboarding', 
     'Enables prospective members to initiate self-registration and upload KYC verification documents directly.', 
     'GLOBAL', 'Active', '["self-registration", "kyc-upload", "profile-edit"]'::jsonb, '[]'::jsonb, 1, now()),
    ('FEATURE-OFFLINE-ATTENDANCE', 'Offline Meeting Attendance Capture', 
     'Allows Chapter Coordinators to record meeting attendance in offline mobile view with auto-sync on reconnect.', 
     'HIERARCHICAL', 'Active', '["offline-storage", "qr-attendance", "batch-sync"]'::jsonb, '[]'::jsonb, 1, now()),
    ('FEATURE-ENHANCED-MFA', 'High-Integrity Treasurer MFA', 
     'Enforces mandatory time-based OTP (TOTP) verification for all treasury disbursement and ledger reconciliation actions.', 
     'GLOBAL', 'Active', '["totp-auth", "step-up-challenge"]'::jsonb, '[]'::jsonb, 1, now()),
    ('FEATURE-INTER-CHAPTER-REFERRAL', 'Cross-Chapter Business Referral Exchange', 
     'Empowers members to route business leads and testimonial acknowledgements across neighbouring regional chapters.', 
     'HIERARCHICAL', 'Active', '["cross-chapter-lead", "trust-rating"]'::jsonb, '[]'::jsonb, 1, now()),
    ('FEATURE-AUTOMATED-SLA-ESCALATION', 'Automated SLA Escalation Matrix', 
     'Automatically triggers alert notifications to Chapter President when member applications exceed 48h SLA.', 
     'GLOBAL', 'Active', '["sla-watchdog", "escalation-dispatcher"]'::jsonb, '[]'::jsonb, 1, now()),
    ('FEATURE-PAYMENT-GATEWAY-V2', 'Automated Direct UPI Dues Clearing', 
     'Direct UPI QR and NetBanking payment verification for chapter annual renewal fees with instant receipts.', 
     'GLOBAL', 'Active', '["upi-qr", "instant-receipt", "ledger-posting"]'::jsonb, '[]'::jsonb, 1, now())
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------------------------
-- MIGRATION 06: Platform Roles Catalogue Table
-- Target Table: public.sethu_platform_roles
-- Purpose: Authoritative role taxonomy across organisational & platform tiers
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sethu_platform_roles (
    id text NOT NULL PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    workspace text NOT NULL DEFAULT 'ORGANISATIONAL',
    delegatable boolean NOT NULL DEFAULT false,
    status text NOT NULL DEFAULT 'Active',
    version int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_sethu_platform_roles_code 
    ON public.sethu_platform_roles (code);

INSERT INTO public.sethu_platform_roles (id, code, name, workspace, delegatable, status, version)
VALUES
    ('role-pres', 'CHAPTER_PRESIDENT', 'Chapter President', 'ORGANISATIONAL', false, 'Active', 1),
    ('role-vp', 'CHAPTER_VICE_PRESIDENT', 'Chapter Vice President', 'ORGANISATIONAL', false, 'Active', 1),
    ('role-sec', 'CHAPTER_SECRETARY', 'Chapter Secretary', 'ORGANISATIONAL', false, 'Active', 1),
    ('role-tres', 'CHAPTER_TREASURER', 'Chapter Treasurer', 'ORGANISATIONAL', false, 'Active', 1),
    ('role-coord', 'CHAPTER_COORDINATOR', 'Chapter Member Coordinator', 'ORGANISATIONAL', true, 'Active', 1),
    ('role-rev', 'ROLE_REVIEWER', 'Platform Reviewer', 'PLATFORM_ADMIN', true, 'Active', 1),
    ('role-pa', 'ROLE_PA', 'Platform Administrator', 'PLATFORM_ADMIN', false, 'Active', 1),
    ('role-lead', 'LEADERSHIP_TEAM', 'National Master Head', 'ORGANISATIONAL', false, 'Active', 1)
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------------------------
-- MIGRATION 07: Platform Assignments and Delegations Table
-- Target Table: public.sethu_platform_assignments
-- Purpose: Chapter leadership role appointments and time-bound delegated authority
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sethu_platform_assignments (
    id text NOT NULL PRIMARY KEY,
    account_id text NOT NULL,
    role_id text NOT NULL,
    scope_id text NOT NULL,
    status text NOT NULL DEFAULT 'ACTIVE',
    delegated_by text NULL,
    delegated_to text NULL,
    acting_authority text NULL,
    effective_from text NOT NULL,
    effective_to text NULL,
    version int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_sethu_platform_assignments_scope 
    ON public.sethu_platform_assignments (scope_id);

INSERT INTO public.sethu_platform_assignments 
    (id, account_id, role_id, scope_id, status, delegated_by, delegated_to, acting_authority, effective_from, effective_to, version)
VALUES
    ('asg-001', 'Hari Krishnan', 'CHAPTER_PRESIDENT', 'ch-chennai-central', 'ACTIVE', null, null, null, '2026-04-01', '2027-03-31', 1),
    ('asg-002', 'Karthik N', 'CHAPTER_VICE_PRESIDENT', 'ch-chennai-central', 'ACTIVE', null, null, null, '2026-04-01', '2027-03-31', 1),
    ('asg-003', 'Meera S', 'CHAPTER_SECRETARY', 'ch-chennai-central', 'ACTIVE', null, null, null, '2026-04-01', '2027-03-31', 1),
    ('asg-004', 'Ravi P', 'CHAPTER_TREASURER', 'ch-chennai-central', 'ACTIVE', null, null, null, '2026-04-01', '2027-03-31', 1),
    ('asg-005', 'Vijay R', 'CHAPTER_COORDINATOR', 'ch-chennai-central', 'ACTIVE', null, null, null, '2026-04-01', '2027-03-31', 1),
    ('del-001', 'pa-reviewer-001', 'ROLE_REVIEWER', 'OU-TN', 'ACTIVE', 'platformadmin@dbn.network', 'pa-reviewer-001', 'Time-Bound Regional Audit Reviewer', '2026-01-01', '2026-12-31', 1)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- MIGRATION 08: RBAC Role-Permission Grants Table
-- Target Table: public.sethu_platform_rbac_grants
-- Purpose: Role-permission authorization matrix mappings
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sethu_platform_rbac_grants (
    id text NOT NULL PRIMARY KEY,
    role_id text NOT NULL,
    permission text NOT NULL,
    active boolean NOT NULL DEFAULT true,
    version int NOT NULL DEFAULT 1,
    granted_by text NOT NULL DEFAULT 'platformadmin@dbn.network',
    granted_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(role_id, permission)
);

CREATE INDEX IF NOT EXISTS ix_sethu_platform_rbac_role 
    ON public.sethu_platform_rbac_grants (role_id);

INSERT INTO public.sethu_platform_rbac_grants (id, role_id, permission, active, version)
VALUES
    ('rb-001', 'ROLE_PA', 'platform.dashboard.read', true, 1),
    ('rb-002', 'ROLE_PA', 'platform.identity.read', true, 1),
    ('rb-003', 'ROLE_PA', 'platform.identity.manage', true, 1),
    ('rb-004', 'ROLE_PA', 'platform.configuration.propose', true, 1),
    ('rb-005', 'ROLE_PA', 'platform.configuration.publish', true, 1),
    ('rb-006', 'ROLE_REVIEWER', 'platform.configuration.review', true, 1),
    ('rb-007', 'ROLE_REVIEWER', 'platform.audit.read', true, 1),
    ('rb-008', 'CHAPTER_PRESIDENT', 'chapter.induction.approve', true, 1),
    ('rb-009', 'CHAPTER_TREASURER', 'chapter.finance.reconcile', true, 1),
    ('rb-010', 'CHAPTER_COORDINATOR', 'chapter.attendance.record', true, 1)
ON CONFLICT (role_id, permission) DO NOTHING;

-- ------------------------------------------------------------------------------
-- MIGRATION 09: RACI Governance Matrix Table
-- Target Table: public.sethu_platform_raci_definitions
-- Purpose: Responsibility assignment matrix (Responsible, Accountable, Consulted, Informed)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sethu_platform_raci_definitions (
    id text NOT NULL PRIMARY KEY,
    domain text NOT NULL,
    action text NOT NULL,
    responsible text NOT NULL,
    accountable text NOT NULL,
    resolver text NOT NULL DEFAULT 'ROLE',
    scope text NOT NULL DEFAULT 'PLATFORM',
    status text NOT NULL DEFAULT 'Active',
    version int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.sethu_platform_raci_definitions 
    (id, domain, action, responsible, accountable, resolver, scope, status, version)
VALUES
    ('raci-001', 'Configuration', 'Review & Publish release', 'ROLE_REVIEWER', 'ROLE_PA', 'ROLE', 'PLATFORM', 'Active', 1),
    ('raci-002', 'Membership', 'Member KYC & Document Verification', 'CHAPTER_COORDINATOR', 'CHAPTER_PRESIDENT', 'ROLE', 'CHAPTER', 'Active', 1),
    ('raci-003', 'Governance', 'Leadership Team Induction & Appointment', 'CHAPTER_PRESIDENT', 'LEADERSHIP_TEAM', 'ROLE', 'ORGANISATIONAL', 'Active', 1),
    ('raci-004', 'Finance', 'Annual Chapter Dues Collection & Receipts', 'CHAPTER_TREASURER', 'CHAPTER_PRESIDENT', 'ROLE', 'CHAPTER', 'Active', 1)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- MIGRATION 10: Separation of Duties (SoD) Policies Table
-- Target Table: public.sethu_platform_sod_policies
-- Purpose: Conflict-of-interest and dual-authorization policy enforcement
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sethu_platform_sod_policies (
    id text NOT NULL PRIMARY KEY,
    name text NOT NULL,
    rule text NOT NULL,
    scope text NOT NULL DEFAULT 'PLATFORM',
    status text NOT NULL DEFAULT 'Active',
    version int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.sethu_platform_sod_policies (id, name, rule, scope, status, version)
VALUES
    ('sod-001', 'Configuration Maker/Checker Isolation', 'MAKER_NE_CHECKER', 'PLATFORM', 'Active', 1),
    ('sod-002', 'Financial Payment Requester/Approver Isolation', 'REQUESTER_NE_APPROVER', 'PLATFORM', 'Active', 1),
    ('sod-003', 'Member Induction Proposer/Approver Separation', 'CORRECTION_PROPOSER_NE_VERIFIER', 'PLATFORM', 'Active', 1),
    ('sod-004', 'Batch Member Import Stager/Poster Separation', 'IMPORT_CREATOR_NE_APPROVER', 'PLATFORM', 'Active', 1)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================


-- ==============================================================================
-- MIGRATION 11: PLATFORM ADMIN AUTHENTICATION & ROLE PROVISIONING
-- Purpose: Ensures platformadmin@dbn.network has active password hash and platform.security.manage grant
-- Applied Date: 2026-11-04
-- ==============================================================================

-- 1. Reset password hash and ensure active status for platform administrator
UPDATE public.user_identities
SET "PasswordHash" = 'fdm7RPph0TDEL+rTAyRXKg==:O3WkQbl4R+kEVaiDaJGt0MrGSZCPQ3QQFpTXBs+vBfY=',
    "FailedLoginAttempts" = 0,
    "LockoutEnd" = NULL,
    "Active" = true
WHERE "Email" = 'platformadmin@dbn.network';

-- 2. Grant platform.security.manage permission so the user acquires the 'Platform Admin' workspace
INSERT INTO public.permission_grants (
    "Id", "UserId", "TenantId", "ChapterId", "Permission", "StartsAt", "EndsAt", "Revoked", "IndependentGovernance"
)
SELECT 
    gen_random_uuid(),
    u."Id",
    u."TenantId",
    NULL,
    'platform.security.manage',
    now() - interval '1 day',
    now() + interval '10 years',
    false,
    true
FROM public.user_identities u
WHERE u."Email" = 'platformadmin@dbn.network'
  AND NOT EXISTS (
      SELECT 1 FROM public.permission_grants pg 
      WHERE pg."UserId" = u."Id" AND pg."Permission" = 'platform.security.manage' AND NOT pg."Revoked"
  );

-- ==============================================================================
-- MIGRATION 12: PLATFORM ADMIN CONSOLE PERMISSION GRANTS
-- Purpose: Grants all platform administrative permissions to platformadmin@dbn.network
-- Applied Date: 2026-11-04
-- ==============================================================================

INSERT INTO public.permission_grants ("Id", "UserId", "TenantId", "ChapterId", "Permission", "StartsAt", "EndsAt", "Revoked", "IndependentGovernance")
SELECT 
    gen_random_uuid(),
    u."Id",
    u."TenantId",
    NULL,
    p,
    now() - interval '1 day',
    now() + interval '10 years',
    false,
    true
FROM public.user_identities u
CROSS JOIN unnest(ARRAY[
    'platform.dashboard.read',
    'platform.identity.read',
    'platform.identity.manage',
    'platform.session.read',
    'platform.session.manage',
    'platform.organisation.read',
    'platform.organisation.manage',
    'platform.roles.read',
    'platform.roles.manage',
    'platform.permissions.read',
    'platform.permissions.manage',
    'platform.assignment.view',
    'platform.assignment.manage',
    'platform.rbac.read',
    'platform.rbac.manage',
    'platform.raci.read',
    'platform.raci.manage',
    'platform.sod.read',
    'platform.sod.manage',
    'platform.configuration.view',
    'platform.configuration.propose',
    'platform.configuration-profile.read',
    'platform.configuration-profile.manage',
    'platform.change-set.read',
    'platform.change-set.manage',
    'platform.change-set.review',
    'platform.change-set.publish',
    'platform.access.explain',
    'platform.configuration.explain',
    'platform.taxonomy.read',
    'platform.taxonomy.manage',
    'platform.taxonomy.review',
    'platform.taxonomy.publish',
    'platform.master-data.read',
    'platform.master-data.manage',
    'platform.reference-data.read',
    'platform.reference-data.manage',
    'platform.forms.read',
    'platform.form.manage',
    'platform.form.review',
    'platform.form.publish',
    'platform.workflow.read',
    'platform.workflow.manage',
    'platform.workflow.review',
    'platform.workflow.publish',
    'platform.sla.read',
    'platform.sla.manage',
    'platform.calendar.read',
    'platform.calendar.manage',
    'platform.features.read',
    'platform.features.manage',
    'platform.notification.read',
    'platform.notification.manage',
    'platform.template.read',
    'platform.template.manage',
    'platform.integration.read',
    'platform.integration.manage',
    'platform.integration.test',
    'platform.import.read',
    'platform.import.manage',
    'platform.import.review',
    'platform.export.read',
    'platform.export.manage',
    'platform.jobs.read',
    'platform.jobs.manage',
    'platform.data-quality.read',
    'platform.data-quality.manage',
    'platform.data-quality.remediate',
    'platform.data-quality.review',
    'platform.correction.read',
    'platform.correction.manage',
    'platform.correction.review',
    'platform.moderation.read',
    'platform.moderation.manage',
    'platform.moderation.review',
    'platform.audit.read',
    'platform.impact.read',
    'platform.diagnostics.read',
    'platform.security.view',
    'platform.security.manage',
    'platform.privacy.read',
    'platform.privacy.manage',
    'platform.handoff.read',
    'platform.handoff.manage',
    'platform.handoff.review',
    'platform.reports.read',
    'platform.consumer-capability.read',
    'platform.legacy_members.read',
    'platform.legacy_members.prepare',
    'platform.legacy_members.chapter_attest',
    'platform.legacy_members.finance_attest',
    'platform.legacy_members.activate',
    'platform.legacy_members.finance_reconcile'
]) AS p
WHERE u."Email" = 'platformadmin@dbn.network'
  AND NOT EXISTS (
    SELECT 1 FROM public.permission_grants pg
    WHERE pg."UserId" = u."Id" 
      AND pg."Permission" = p 
      AND NOT pg."Revoked"
);


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


-- ============================================================================
-- MIGRATION 14: COMMUNICATION - NOTIFICATIONS, TEMPLATES & MEMBER EMAIL DISPATCH
-- ============================================================================

-- 1. Create Platform Notifications Definition Table
CREATE TABLE IF NOT EXISTS public.sethu_platform_notifications (
    id text NOT NULL PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    event text NOT NULL,
    recipient_resolver text NOT NULL,
    template_id text NOT NULL,
    channels jsonb NOT NULL DEFAULT '["IN_APP"]'::jsonb,
    delivery_policy text NOT NULL DEFAULT 'IMMEDIATE',
    status text NOT NULL DEFAULT 'Active',
    version int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed Notifications
INSERT INTO public.sethu_platform_notifications (id, code, name, event, recipient_resolver, template_id, channels, delivery_policy, status, version)
VALUES
    ('ntf-member-onboarded', 'NTF_MEMBER_ONBOARDED', 'Member Activation & Onboarding Welcome', 'member.profile.activated', 'MEMBER_DIRECT', 'TMP_WELCOME_CREDENTIALS', '["EMAIL", "IN_APP"]'::jsonb, 'IMMEDIATE', 'Active', 1),
    ('ntf-kyc-review', 'NTF_KYC_ACTION_REQUIRED', 'Leadership KYC Attestation Clearance Alert', 'kyc.attestation.submitted', 'CHAPTER_SECRETARY', 'TMP_KYC_REVIEW_ALERT', '["IN_APP", "EMAIL"]'::jsonb, 'IMMEDIATE', 'Active', 1),
    ('ntf-sla-warning', 'NTF_SLA_BREACH_WARNING', 'SLA Policy Resolution Warning Escalation', 'sla.policy.warning_reached', 'REGIONAL_COORDINATOR', 'TMP_SLA_ESCALATION', '["IN_APP", "SMS"]'::jsonb, 'IMMEDIATE', 'Active', 1),
    ('ntf-chapter-charter', 'NTF_CHAPTER_CHARTER_APPROVED', 'Official Chapter Charter Commissioning Notice', 'chapter.charter.published', 'CHAPTER_CORE_TEAM', 'TMP_CHAPTER_LAUNCH', '["EMAIL", "IN_APP"]'::jsonb, 'IMMEDIATE', 'Active', 1)
ON CONFLICT (code) DO NOTHING;

-- 2. Create Platform Templates Definition Table
CREATE TABLE IF NOT EXISTS public.sethu_platform_templates (
    id text NOT NULL PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    channel text NOT NULL DEFAULT 'EMAIL',
    subject text,
    body text NOT NULL,
    variables jsonb NOT NULL DEFAULT '[]'::jsonb,
    status text NOT NULL DEFAULT 'Published',
    version int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed Templates
INSERT INTO public.sethu_platform_templates (id, code, name, channel, subject, body, variables, status, version)
VALUES
    ('tmp-welcome-cred', 'TMP_WELCOME_CREDENTIALS', 'Member Welcome & Portal Access', 'EMAIL', 'Welcome to SETHU — Your Account Credentials & Portal Access',
     '<p>Welcome {{FullName}} to {{ChapterName}}!</p><p>Username: {{Email}}<br/>Temporary Password: {{TemporaryPassword}}</p>',
     '["FullName", "Email", "MembershipId", "TemporaryPassword", "LoginUrl", "ChapterName"]'::jsonb, 'Published', 1),
    ('tmp-kyc-alert', 'TMP_KYC_REVIEW_ALERT', 'KYC Attestation Pending Review', 'IN_APP', 'Action Required: New KYC Submission',
     'Member {{FullName}} has submitted verification documents for {{ChapterName}}.',
     '["FullName", "ChapterName", "DocumentType", "ReviewUrl"]'::jsonb, 'Published', 1),
    ('tmp-sla-warn', 'TMP_SLA_ESCALATION', 'SLA Resolution Threshold Warning', 'SMS', NULL,
     'Urgent: SLA threshold warning triggered for {{WorkflowCode}} - {{EntityId}}. Immediate review required.',
     '["WorkflowCode", "EntityId", "RemainingMinutes"]'::jsonb, 'Published', 1),
    ('tmp-chapter-launch', 'TMP_CHAPTER_LAUNCH', 'Official Chapter Charter Notification', 'EMAIL', 'Congratulations! Chapter Charter Approved for {{ChapterName}}',
     '<p>Dear Leaders, Chapter {{ChapterName}} in Region {{RegionName}} has been granted official network status.</p>',
     '["ChapterName", "RegionName", "CharterDate"]'::jsonb, 'Published', 1)
ON CONFLICT (code) DO NOTHING;

-- 3. Ensure email_templates and member_email_dispatches tables exist
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    template_code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    variables JSONB NOT NULL DEFAULT '["FullName","Email","MembershipId","TemporaryPassword","LoginUrl","ChapterName"]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_email_templates_tenant_code UNIQUE (tenant_id, template_code)
);

CREATE TABLE IF NOT EXISTS public.member_email_dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    batch_id VARCHAR(128),
    membership_id VARCHAR(128) NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_member_email_dispatches_lookup 
    ON public.member_email_dispatches(tenant_id, batch_id, status);

-- 4. Seed email_templates for Member Credential Dispatch if not present
INSERT INTO public.email_templates (id, tenant_id, template_code, name, subject, body_html, body_text, variables, is_active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    'MEMBER_WELCOME_CREDENTIALS',
    'Member Welcome & Credentials',
    'Welcome to SETHU — Your Account Credentials & Portal Access',
    '<div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #0f172a; margin-top: 0;">Welcome to SETHU Network, {{FullName}}!</h2>
  <p>Your membership profile for <strong>{{ChapterName}}</strong> has been successfully verified and activated.</p>
  <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px;">
    <p style="margin: 0 0 8px 0; font-weight: bold; color: #1e293b;">Your Login Credentials:</p>
    <p style="margin: 4px 0;"><strong>Username / Email:</strong> {{Email}}</p>
    <p style="margin: 4px 0;"><strong>Membership ID:</strong> {{MembershipId}}</p>
    <p style="margin: 4px 0;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-weight: bold; color: #0f172a;">{{TemporaryPassword}}</code></p>
  </div>
  <p>Please log in using the button below and reset your temporary password upon first login:</p>
  <div style="text-align: center; margin: 28px 0;">
    <a href="{{LoginUrl}}" style="background: #1e3a8a; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
      Login to Member Portal
    </a>
  </div>
</div>',
    'Welcome to SETHU {{FullName}}! Your credentials: Email: {{Email}}, Temporary Password: {{TemporaryPassword}}',
    '["FullName", "Email", "MembershipId", "TemporaryPassword", "LoginUrl", "ChapterName"]'::jsonb,
    true,
    now(),
    now()
)
ON CONFLICT (tenant_id, template_code) DO NOTHING;


-- ============================================================================
-- MIGRATION 15: INTEGRATIONS - REGISTRY & HEALTH MONITORING
-- ============================================================================

-- 1. Create Platform Integrations Table
CREATE TABLE IF NOT EXISTS public.sethu_platform_integrations (
    id text NOT NULL PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    type text NOT NULL,
    status text NOT NULL DEFAULT 'Configured',
    endpoint_label text,
    secret_configured boolean NOT NULL DEFAULT true,
    health_check_enabled boolean NOT NULL DEFAULT true,
    last_success_at timestamptz,
    last_failure_at timestamptz,
    last_test_at timestamptz,
    failure_summary text,
    version int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed Integrations
INSERT INTO public.sethu_platform_integrations 
(id, code, name, type, status, endpoint_label, secret_configured, health_check_enabled, last_success_at, last_failure_at, last_test_at, failure_summary, version)
VALUES
    ('intg-razorpay-pg', 'INTG_RAZORPAY_PAYMENT', 'Razorpay Payment Gateway (UPI / Cards / NetBanking)', 'PAYMENT_GATEWAY', 'Healthy', 'https://api.razorpay.com/v1', true, true, now() - interval '10 minutes', NULL, now() - interval '10 minutes', NULL, 1),
    ('intg-msg91-sms', 'INTG_MSG91_SMS_DLT', 'MSG91 DLT Indian SMS Gateway', 'SMS_GATEWAY', 'Healthy', 'https://control.msg91.com/api/v5', true, true, now() - interval '1 hour', NULL, now() - interval '1 hour', NULL, 1),
    ('intg-smtp-relay', 'INTG_ENTERPRISE_SMTP', 'Enterprise SMTP Transactional Relay (Amazon SES / SendGrid)', 'EMAIL_SMTP', 'Healthy', 'smtp.relay.dbn.network:587', true, true, now() - interval '5 minutes', NULL, now() - interval '5 minutes', NULL, 1),
    ('intg-digilocker-kyc', 'INTG_DIGILOCKER_KYC', 'DigiLocker / Aadhaar XML Official Verification Bridge', 'KYC_DIGILOCKER', 'Configured', 'https://digilocker.gov.in/public/oauth2/1/authorize', true, true, now() - interval '1 day', NULL, now() - interval '1 day', NULL, 1),
    ('intg-zoho-books', 'INTG_ZOHO_BOOKS_ACCOUNTING', 'Zoho Books / Tally Prime GST Invoicing & Ledger Sync', 'ACCOUNTING_ERP', 'Degraded', 'https://books.zoho.in/api/v3', true, true, now() - interval '2 days', now() - interval '3 hours', now() - interval '3 hours', 'Rate limit quota (429) hit during end-of-month batch sync', 1),
    ('intg-s3-blob', 'INTG_AWS_S3_STORAGE', 'Encrypted KYC Document Vault (AWS S3 Mumbai / MinIO)', 'CLOUD_STORAGE', 'Healthy', 's3.ap-south-1.amazonaws.com', true, true, now() - interval '20 minutes', NULL, now() - interval '20 minutes', NULL, 1)
ON CONFLICT (code) DO NOTHING;


-- ============================================================================
-- MIGRATION 16: PLATFORM OPERATIONS - IMPORTS, EXPORTS, JOBS, DATA QUALITY,
-- CORRECTIONS, MODERATION & TECHNICAL HANDOFFS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sethu_platform_imports (
    id text NOT NULL PRIMARY KEY,
    domain text NOT NULL,
    source text NOT NULL,
    file_name text,
    status text NOT NULL DEFAULT 'Uploaded',
    rows int NOT NULL DEFAULT 0,
    valid int NOT NULL DEFAULT 0,
    invalid int NOT NULL DEFAULT 0,
    warnings int NOT NULL DEFAULT 0,
    owner text NOT NULL DEFAULT 'platformadmin',
    started_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    version int NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.sethu_platform_exports (
    id text NOT NULL PRIMARY KEY,
    report_type text NOT NULL,
    scope_id text NOT NULL,
    status text NOT NULL DEFAULT 'Requested',
    requested_by text NOT NULL,
    requested_at timestamptz NOT NULL DEFAULT now(),
    sensitive boolean NOT NULL DEFAULT false,
    expires_at timestamptz,
    downloaded_at timestamptz,
    version int NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.sethu_platform_jobs (
    id text NOT NULL PRIMARY KEY,
    type text NOT NULL,
    owner text NOT NULL,
    scope text NOT NULL,
    status text NOT NULL DEFAULT 'Queued',
    progress int NOT NULL DEFAULT 0,
    started_at timestamptz,
    completed_at timestamptz,
    failure text,
    version int NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.sethu_platform_data_quality_findings (
    id text NOT NULL PRIMARY KEY,
    type text NOT NULL,
    severity text NOT NULL,
    status text NOT NULL DEFAULT 'Detected',
    source_workspace text NOT NULL,
    source_type text NOT NULL,
    source_id text NOT NULL,
    scope_id text NOT NULL,
    owner text,
    version int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sethu_platform_corrections (
    id text NOT NULL PRIMARY KEY,
    finding_id text,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    current_value jsonb NOT NULL,
    proposed_value jsonb NOT NULL,
    reason text NOT NULL,
    status text NOT NULL DEFAULT 'Draft',
    proposed_by text NOT NULL,
    approved_by text,
    version int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sethu_platform_moderation_policies (
    id text NOT NULL PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    applies_to jsonb NOT NULL DEFAULT '[]'::jsonb,
    severity_threshold text NOT NULL DEFAULT 'Medium',
    review_required boolean NOT NULL DEFAULT true,
    allowed_decisions jsonb NOT NULL DEFAULT '["APPROVE", "REJECT"]'::jsonb,
    status text NOT NULL DEFAULT 'Active',
    version int NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.sethu_platform_moderation_queue (
    id text NOT NULL PRIMARY KEY,
    source_type text NOT NULL,
    source_id text NOT NULL,
    status text NOT NULL DEFAULT 'PENDING',
    severity text NOT NULL DEFAULT 'Medium',
    reason text NOT NULL,
    policy_id text,
    version int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sethu_platform_handoffs (
    id text NOT NULL PRIMARY KEY,
    source_workspace text NOT NULL,
    source_type text NOT NULL,
    requested_capability text NOT NULL,
    status text NOT NULL DEFAULT 'Requested',
    summary text NOT NULL,
    version int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed Platform Operations
INSERT INTO public.sethu_platform_imports (id, domain, source, file_name, status, rows, valid, invalid, warnings, owner, started_at, version)
VALUES
    ('imp-legacy-batch-01', 'HISTORICAL_MEMBERSHIP', 'LEGACY_MIGRATION_V5', 'historical_members_batch_01.csv', 'Posted', 20, 20, 0, 0, 'platformadmin', now() - interval '2 days', 1),
    ('imp-master-tax-2026', 'MASTER_DATA', 'FINANCE_IMPORT', 'tax_slabs_fy2026.csv', 'Staged', 14, 14, 0, 0, 'platformadmin', now() - interval '4 hours', 1),
    ('imp-chapter-launch', 'ORGANISATION', 'CHAPTER_INDUCTION', 'madurai_chapter_roster.csv', 'Validation', 35, 33, 2, 1, 'platformadmin', now() - interval '1 hour', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sethu_platform_exports (id, report_type, scope_id, status, requested_by, requested_at, sensitive, expires_at, downloaded_at, version)
VALUES
    ('exp-audit-q1-2026', 'STATUTORY_COMPLIANCE_AUDIT', 'GLOBAL_NETWORK', 'Ready', 'platformadmin', now() - interval '2 days', true, now() + interval '5 days', NULL, 1),
    ('exp-members-tn', 'ACTIVE_MEMBERSHIP_ROLL', 'REGION_TAMILNADU', 'Ready', 'platformadmin', now() - interval '1 day', false, now() + interval '6 days', now() - interval '12 hours', 1),
    ('exp-finance-recon', 'BANKING_SETTLEMENT_RECON', 'CHAPTER_MADURAI', 'Requested', 'platformadmin', now() - interval '2 hours', true, now() + interval '7 days', NULL, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sethu_platform_jobs (id, type, owner, scope, status, progress, started_at, completed_at, failure, version)
VALUES
    ('job-sync-nightly', 'CHAPTER_MEETING_ATTENDANCE_AGGREGATION', 'SYSTEM_SCHEDULER', 'GLOBAL', 'Completed', 100, now() - interval '6 hours', now() - interval '5 hours', NULL, 1),
    ('job-email-digest', 'WEEKLY_LEADERSHIP_EXECUTIVE_SUMMARY', 'COMMUNICATION_ENGINE', 'GLOBAL', 'Running', 65, now() - interval '30 minutes', NULL, NULL, 1),
    ('job-gst-recon', 'STATUTORY_GSTR1_CROSS_RECONCILIATION', 'FINANCE_ENGINE', 'REGION_TAMILNADU', 'Failed', 42, now() - interval '2 hours', NULL, 'Timeout connecting to GSTN Sandbox Gateway (504 Gateway Timeout)', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sethu_platform_data_quality_findings (id, type, severity, status, source_workspace, source_type, source_id, scope_id, owner, version)
VALUES
    ('dqf-pan-mismatch', 'PAN_GSTIN_ENTITY_MISMATCH', 'High', 'Detected', 'ORGANISATION', 'ChapterBusinessProfile', 'cbp-9012', 'TN-REGION', NULL, 1),
    ('dqf-dup-mobile', 'DUPLICATE_PRIMARY_CONTACT_PHONE', 'Medium', 'Assigned', 'MEMBER', 'MemberProfile', 'mem-3451', 'CHAPTER_CHENNAI', 'pa-admin-001', 1),
    ('dqf-missing-pincode', 'POSTAL_CODE_GEO_UNRESOLVED', 'Low', 'Revalidated', 'ORGANISATION', 'MeetingVenue', 'ven-0082', 'CHAPTER_COIMBATORE', NULL, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sethu_platform_corrections (id, finding_id, entity_type, entity_id, current_value, proposed_value, reason, status, proposed_by, approved_by, version)
VALUES
    ('corr-001', 'dqf-pan-mismatch', 'BusinessTaxProfile', 'tax-chennai-01', '{"gstin": "33AAACB1234A1Z5", "status": "FLAGGED"}'::jsonb, '{"gstin": "33AAACB1234A1Z5", "status": "VERIFIED"}'::jsonb, 'Corrected trade name mapping verified against official GST portal', 'Pending Review', 'pa-admin-001', NULL, 1),
    ('corr-002', 'dqf-dup-mobile', 'MemberContactRecord', 'cnt-3312', '{"mobile": "+919876543210"}'::jsonb, '{"mobile": "+919876543299"}'::jsonb, 'Member updated alternate business mobile number', 'Applied', 'pa-admin-001', 'governance-officer-01', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sethu_platform_moderation_policies (id, code, name, description, applies_to, severity_threshold, review_required, allowed_decisions, status, version)
VALUES
    ('pol-business-ethics', 'POL_BUSINESS_PROMOTION_ETHICS', 'Business Promotion & Testimonial Ethics Standard', 'Enforces truth-in-advertising and non-predatory referral guidelines across consumer workspaces.', '["MEMBER_TESTIMONIAL", "REFERRAL_POST"]'::jsonb, 'Medium', true, '["APPROVE", "REJECT", "ESCALATE"]'::jsonb, 'Active', 1),
    ('pol-anti-compete', 'POL_ANTI_COMPETE_CROSS_CHAPTER', 'Cross-Chapter Conflict & Specialisation Category Protection', 'Prevents overlapping exclusivity disputes during inter-chapter member transfers.', '["CHAPTER_TRANSFER_REQUEST"]'::jsonb, 'High', true, '["APPROVE", "QUARANTINE", "REJECT"]'::jsonb, 'Active', 1)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.sethu_platform_moderation_queue (id, source_type, source_id, status, severity, reason, policy_id, version)
VALUES
    ('mod-001', 'MemberTestimonial', 'tst-7712', 'PENDING', 'Medium', 'Non-standard pricing claim in public referral posting', 'POL_BUSINESS_PROMOTION_ETHICS', 1),
    ('mod-002', 'ChapterTransfer', 'xfer-1109', 'IN_REVIEW', 'High', 'Specialisation category conflict within target chapter radius', 'POL_ANTI_COMPETE_CROSS_CHAPTER', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sethu_platform_handoffs (id, source_workspace, source_type, requested_capability, status, summary, version)
VALUES
    ('hnd-801', 'MEMBER', 'SupportTicket', 'AUDIT_LOGIN_DISCREPANCY', 'Requested', 'Member reports session termination during induction payment checkout on Edge iOS', 1),
    ('hnd-802', 'ORGANISATION', 'ChapterCharter', 'CUSTOM_POSTAL_DISPATCH_RULE', 'Accepted', 'Chapter requesting customized multi-state postal jurisdiction for industrial hub', 1),
    ('hnd-803', 'GOVERNANCE', 'DisciplinaryCase', 'EVIDENCE_LEDGER_EXPORT', 'Implemented', 'Trustee leadership requested tamper-evident ledger snapshot for dispute review', 1)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- MIGRATION 17: ASSURANCE - AUDIT, VERSION HISTORY, IMPACT & DIAGNOSTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sethu_platform_version_history (
    id text NOT NULL PRIMARY KEY,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    version int NOT NULL DEFAULT 1,
    changed_at timestamptz NOT NULL DEFAULT now(),
    changed_by text NOT NULL,
    reason text,
    release_id text,
    command_id text,
    correlation_id text,
    before_state jsonb,
    after_state jsonb
);

CREATE TABLE IF NOT EXISTS public.sethu_platform_diagnostic_traces (
    id text NOT NULL PRIMARY KEY,
    correlation_id text NOT NULL,
    step_name text NOT NULL,
    status text NOT NULL DEFAULT 'PASS',
    occurred_at timestamptz NOT NULL DEFAULT now(),
    detail text NOT NULL
);

INSERT INTO public.sethu_platform_version_history 
(id, entity_type, entity_id, version, changed_at, changed_by, reason, release_id, command_id, correlation_id, before_state, after_state)
VALUES
    ('vh-rel-01', 'ConfigurationRelease', 'REL-2026.04.1', 1, now() - interval '3 days', 'platformadmin@dbn.network', 'Scheduled national release baseline rollout', 'REL-2026.04.1', 'cmd-rel-001', 'corr-rel-2026', '{"status": "Draft"}'::jsonb, '{"status": "Active"}'::jsonb),
    ('vh-prof-01', 'ConfigurationProfile', 'PROF-NATIONAL-DEFAULT', 2, now() - interval '2 days', 'platformadmin@dbn.network', 'Updated meeting cadence and default regional timezone', 'REL-2026.04.1', 'cmd-prof-002', 'corr-prof-002', '{"version": 1}'::jsonb, '{"version": 2}'::jsonb),
    ('vh-form-01', 'FormDefinition', 'MEMBER_PROFILE_INDUCTION', 1, now() - interval '1 day', 'platformadmin@dbn.network', 'Canonical published version for member onboarding', 'REL-2026.04.1', 'cmd-frm-001', 'corr-frm-001', '{"status": "Draft"}'::jsonb, '{"status": "Published"}'::jsonb),
    ('vh-wf-01', 'WorkflowDefinition', 'WF_CHAPTER_ONBOARDING', 1, now() - interval '1 day', 'platformadmin@dbn.network', 'State machine publication for chapter governance lifecycle', 'REL-2026.04.1', 'cmd-wf-001', 'corr-wf-001', '{"status": "Draft"}'::jsonb, '{"status": "Published"}'::jsonb),
    ('vh-sla-01', 'SlaPolicy', 'SLA_MEMBER_ONBOARDING_48H', 1, now() - interval '18 hours', 'platformadmin@dbn.network', 'Activation of mandatory 48-hour onboarding resolution policy', 'REL-2026.04.1', 'cmd-sla-001', 'corr-sla-001', '{"status": "Draft"}'::jsonb, '{"status": "Active"}'::jsonb),
    ('vh-intg-01', 'IntegrationDefinition', 'INTG_RAZORPAY_PAYMENT', 1, now() - interval '12 hours', 'platformadmin@dbn.network', 'Payment gateway certificate rotation and webhook binding', 'REL-2026.04.1', 'cmd-intg-001', 'corr-intg-001', '{"status": "Configured"}'::jsonb, '{"status": "Healthy"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sethu_platform_diagnostic_traces 
(id, correlation_id, step_name, status, occurred_at, detail)
VALUES
    ('trc-01', 'corr-ho-001', 'Ingress Boundary Validation', 'PASS', now() - interval '10 minutes', 'Request payload verified against JSON schema. Zero forbidden headers detected.'),
    ('trc-02', 'corr-ho-001', 'Trusted Identity Token Resolution', 'PASS', now() - interval '9 minutes', 'Actor c0ffee00-0000-4000-a000-000000000001 resolved to platformadmin@dbn.network.'),
    ('trc-03', 'corr-ho-001', 'RBAC Authority Verification', 'PASS', now() - interval '8 minutes', 'Verified active grant platform.diagnostics.read in PostgreSQL permission_grants.'),
    ('trc-04', 'corr-ho-001', 'Read Model Execution', 'PASS', now() - interval '7 minutes', 'PostgreSQL database query completed in 4.2ms with zero deadlocks.'),
    ('trc-05', 'corr-ho-001', 'Egress Privacy & Masking', 'PASS', now() - interval '6 minutes', 'Safe telemetry projection: credentials, private keys and raw connection strings suppressed.')
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- MIGRATION 18: SYSTEM (SECURITY, PRIVACY) & INTELLIGENCE (CAPABILITIES, REPORTS)
-- ============================================================================

-- 1. Security Policies
CREATE TABLE IF NOT EXISTS public.sethu_platform_security_policies (
    id text NOT NULL PRIMARY KEY,
    code text UNIQUE NOT NULL,
    name text NOT NULL,
    mfa_required boolean NOT NULL DEFAULT true,
    session_max_hours int NOT NULL DEFAULT 12,
    reauth_minutes int NOT NULL DEFAULT 15,
    lockout_attempts int NOT NULL DEFAULT 5,
    privileged_elevation_max_minutes int NOT NULL DEFAULT 30,
    status text NOT NULL DEFAULT 'Active',
    version int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Security Events
CREATE TABLE IF NOT EXISTS public.sethu_platform_security_events (
    id text NOT NULL PRIMARY KEY,
    type text NOT NULL,
    severity text NOT NULL DEFAULT 'Low',
    status text NOT NULL DEFAULT 'Closed',
    account_id text,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    correlation_id text,
    version int NOT NULL DEFAULT 1
);

-- 3. Privileged Elevations (Break-glass)
CREATE TABLE IF NOT EXISTS public.sethu_platform_privileged_elevations (
    id text NOT NULL PRIMARY KEY,
    requested_by text NOT NULL,
    scope_id text NOT NULL DEFAULT 'PLATFORM',
    reason text NOT NULL,
    duration_minutes int NOT NULL DEFAULT 30,
    status text NOT NULL DEFAULT 'Pending Independent Approval',
    requested_at timestamptz NOT NULL DEFAULT now(),
    approved_by text,
    approved_at timestamptz,
    version int NOT NULL DEFAULT 1
);

-- 4. Retention Policies
CREATE TABLE IF NOT EXISTS public.sethu_platform_retention_policies (
    id text NOT NULL PRIMARY KEY,
    code text UNIQUE NOT NULL,
    name text NOT NULL,
    resource_type text NOT NULL,
    retention_days int NOT NULL,
    expiry_action text NOT NULL DEFAULT 'ARCHIVE',
    legal_hold_supported boolean NOT NULL DEFAULT true,
    status text NOT NULL DEFAULT 'Active',
    effective_from timestamptz NOT NULL DEFAULT now(),
    version int NOT NULL DEFAULT 1
);

-- 5. Consumer Capabilities
CREATE TABLE IF NOT EXISTS public.sethu_platform_consumer_capabilities (
    id text NOT NULL PRIMARY KEY,
    workspace text NOT NULL,
    function_code text UNIQUE NOT NULL,
    function_name text NOT NULL,
    description text NOT NULL,
    dependencies jsonb NOT NULL DEFAULT '[]'::jsonb,
    handoff_capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
    events jsonb NOT NULL DEFAULT '[]'::jsonb,
    status text NOT NULL DEFAULT 'Active',
    evidence text NOT NULL DEFAULT 'VERIFIED_FROM_SOURCE',
    version int NOT NULL DEFAULT 1
);

-- 6. Platform Reports
CREATE TABLE IF NOT EXISTS public.sethu_platform_reports (
    id text NOT NULL PRIMARY KEY,
    code text UNIQUE NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    status text NOT NULL DEFAULT 'Available',
    source text NOT NULL DEFAULT 'PLATFORM_READ_MODEL',
    sensitive boolean NOT NULL DEFAULT false,
    required_permission text NOT NULL DEFAULT 'platform.reports.read',
    dimensions jsonb NOT NULL DEFAULT '[]'::jsonb,
    metrics jsonb NOT NULL DEFAULT '[]'::jsonb,
    version int NOT NULL DEFAULT 1
);

-- Seed Security Policies
INSERT INTO public.sethu_platform_security_policies 
(id, code, name, mfa_required, session_max_hours, reauth_minutes, lockout_attempts, privileged_elevation_max_minutes, status, version)
VALUES
    ('sec-pol-platform-admin', 'POL_PLATFORM_ADMIN_MFA_STRICT', 'Platform Administration Strict MFA & Elevation Control', true, 12, 15, 5, 30, 'Active', 1),
    ('sec-pol-regional-operator', 'POL_REGIONAL_GOVERNANCE_OPERATOR', 'Regional Governance Operations Session Boundary', true, 8, 30, 5, 60, 'Active', 1)
ON CONFLICT (code) DO NOTHING;

-- Seed Security Events
INSERT INTO public.sethu_platform_security_events
(id, type, severity, status, account_id, occurred_at, correlation_id, version)
VALUES
    ('sec-ev-001', 'MFA_CHALLENGE_VERIFIED', 'Low', 'Closed', 'platformadmin@dbn.network', now() - interval '45 minutes', 'corr-mfa-4412', 1),
    ('sec-ev-002', 'POLICY_REAUTH_ENFORCED', 'Low', 'Closed', 'platformadmin@dbn.network', now() - interval '30 minutes', 'corr-sec-9011', 1),
    ('sec-ev-003', 'PRIVILEGED_ELEVATION_REQUESTED', 'Medium', 'Acknowledged', 'c0ffee00-0000-4000-a000-000000000001', now() - interval '15 minutes', 'corr-brk-001', 1),
    ('sec-ev-004', 'SUSPICIOUS_LOGIN_ATTEMPT_GEO_MISMATCH', 'High', 'Closed', 'unknown-operator-09', now() - interval '2 hours', 'corr-sec-alert-04', 1)
ON CONFLICT (id) DO NOTHING;

-- Seed Privileged Elevations
INSERT INTO public.sethu_platform_privileged_elevations
(id, requested_by, scope_id, reason, duration_minutes, status, requested_at, version)
VALUES
    ('elev-001', 'platformadmin@dbn.network', 'PLATFORM', 'Emergency rotation of external SMS dispatch gateway credentials', 30, 'Pending Independent Approval', now() - interval '10 minutes', 1)
ON CONFLICT (id) DO NOTHING;

-- Seed Retention Policies
INSERT INTO public.sethu_platform_retention_policies
(id, code, name, resource_type, retention_days, expiry_action, legal_hold_supported, status, effective_from, version)
VALUES
    ('ret-pol-audit-log', 'RET_GOVERNANCE_AUDIT_7YR', 'Statutory 7-Year Forensic Audit Log Archive', 'AuditEvent', 2555, 'ARCHIVE', true, 'Active', now() - interval '6 months', 1),
    ('ret-pol-diag-traces', 'RET_DIAGNOSTIC_TRACES_90D', 'Operational Diagnostic Telemetry Purge', 'DiagnosticTrace', 90, 'RETIRE', false, 'Active', now() - interval '3 months', 1),
    ('ret-pol-member-kyc', 'RET_INDUCTION_KYC_ANONYMISE', 'Exited Member KYC Redaction & Anonymisation', 'MemberProfileKYC', 1825, 'ANONYMISE', true, 'Active', now() - interval '1 year', 1)
ON CONFLICT (code) DO NOTHING;

-- Seed Consumer Capabilities
INSERT INTO public.sethu_platform_consumer_capabilities
(id, workspace, function_code, function_name, description, dependencies, handoff_capabilities, events, status, evidence, version)
VALUES
    ('cap-mem-induction', 'MEMBER', 'FN_MEMBER_INDUCTION', 'Member Induction & Workspace Onboarding', 'Enables new verified business members to complete profile verification and induction payment checkout.',
     '[{"type": "FORM", "contract": "MEMBER_PROFILE_INDUCTION", "versioned": true, "owner": "PLATFORM_ADMIN"}, {"type": "WORKFLOW", "contract": "WF_CHAPTER_ONBOARDING", "versioned": true, "owner": "PLATFORM_ADMIN"}, {"type": "SLA", "contract": "SLA_MEMBER_ONBOARDING_48H", "versioned": true, "owner": "PLATFORM_ADMIN"}]'::jsonb,
     '["AUDIT_LOGIN_DISCREPANCY", "PROFILE_FIELD_EXCEPTION"]'::jsonb,
     '["member.profile.submitted", "member.induction.completed"]'::jsonb,
     'Active', 'VERIFIED_FROM_SOURCE', 1),
    ('cap-org-charter', 'ORGANISATION', 'FN_CHAPTER_CHARTER', 'Chapter Chartering & Venue Governance', 'Governs chapter formation, venue selection compliance, and leadership team appointment.',
     '[{"type": "TAXONOMY", "contract": "TAX-SPEC-TAX", "versioned": true, "owner": "PLATFORM_ADMIN"}, {"type": "CALENDAR", "contract": "CAL_TN_STATE_HOLIDAYS", "versioned": true, "owner": "PLATFORM_ADMIN"}, {"type": "RACI", "contract": "RACI-CHAPTER-OPERATIONS", "versioned": true, "owner": "PLATFORM_ADMIN"}]'::jsonb,
     '["CUSTOM_POSTAL_DISPATCH_RULE"]'::jsonb,
     '["chapter.created", "chapter.leadership.assigned"]'::jsonb,
     'Active', 'VERIFIED_FROM_SOURCE', 1),
    ('cap-gov-disciplinary', 'GOVERNANCE', 'FN_DISCIPLINARY_LEDGER', 'Ethical Grievance & Disciplinary Adjudication', 'Trustee council ledger for code-of-conduct violations, dispute escalation and sanctions.',
     '[{"type": "SOD", "contract": "SOD-RULE-FIN-IND", "versioned": true, "owner": "PLATFORM_ADMIN"}, {"type": "CONFIGURATION", "contract": "security.session.maxHours", "versioned": true, "owner": "PLATFORM_ADMIN"}]'::jsonb,
     '["EVIDENCE_LEDGER_EXPORT"]'::jsonb,
     '["grievance.lodged", "sanction.enforced"]'::jsonb,
     'Active', 'VERIFIED_FROM_SOURCE', 1)
ON CONFLICT (function_code) DO NOTHING;

-- Seed Platform Reports
INSERT INTO public.sethu_platform_reports
(id, code, name, description, category, status, source, sensitive, required_permission, dimensions, metrics, version)
VALUES
    ('rep-001', 'REP_GOV_COMPLIANCE_STATUS', 'Governance Compliance & Chapter Status', 'Live control-plane audit of registered chapters, organisations, active governance rules, and statutory SLA health.', 'ASSURANCE', 'Available', 'PLATFORM_READ_MODEL', false, 'platform.reports.read',
     '["State", "District", "Status"]'::jsonb,
     '["Total Chapters", "Registered Organisations", "SLA Policies Active", "Governed Audit Events"]'::jsonb, 1),
    ('rep-002', 'REP_SECURITY_ACCESS_AUDIT', 'Platform Access & Identity Authority Audit', 'Authoritative analysis of provisioned operator accounts, active RBAC permission grants, and security events.', 'SECURITY', 'Available', 'PLATFORM_READ_MODEL', true, 'platform.reports.read',
     '["Actor", "Scope", "Severity"]'::jsonb,
     '["Provisioned Identities", "Active Permission Grants", "Logged Security Events", "Security Policies Enforced"]'::jsonb, 1),
    ('rep-003', 'REP_CONFIG_INTEGRATION_HEALTH', 'Control Plane Configuration & Integration Matrix', 'State verification across configuration profiles, runtime key inheritance, and active external API adapters.', 'CONFIGURATION', 'Available', 'PLATFORM_READ_MODEL', false, 'platform.reports.read',
     '["Domain", "ScopeType", "Provider"]'::jsonb,
     '["Configuration Keys", "Active Configuration Profiles", "Active Integrations", "Registered Handoffs"]'::jsonb, 1)
ON CONFLICT (code) DO NOTHING;


-- ============================================================================
-- MIGRATION 19: SYSTEM BRANDING STORAGE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.system_branding (
    id text NOT NULL PRIMARY KEY,
    sidebar_logo text NULL,
    header_logo text NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.system_branding (id, sidebar_logo, header_logo, updated_at)
VALUES ('default', NULL, NULL, now())
ON CONFLICT (id) DO NOTHING;

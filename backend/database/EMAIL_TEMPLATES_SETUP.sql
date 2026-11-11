-- ==============================================================================
-- SETHU NETWORK — EMAIL & NOTIFICATION TEMPLATES DATABASE SETUP
-- File: backend/database/EMAIL_TEMPLATES_SETUP.sql
-- Description: Creates template tables and seeds official database-driven email templates.
-- All templates are loaded dynamically from this database (no hardcoding in backend code).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLE: public.email_templates
-- Purpose: Stores tenant-specific custom email templates with subject, HTML body,
--          and dynamic variable placeholders for dispatching member credentials.
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 2. TABLE: public.sethu_platform_templates
-- Purpose: System-wide platform channel catalog for EMAIL, SMS, and IN_APP templates
--          displayed under "Communication -> Templates" in Platform Admin Console.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sethu_platform_templates (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'EMAIL',
    subject TEXT,
    body TEXT NOT NULL,
    variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'Published',
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. TABLE: public.member_email_dispatches
-- Purpose: Audit log of every dispatched email, recipient email, member ID,
--          delivery status (SENT / FAILED), error details, and timestamp.
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 4. COLUMN: temporary_password in public.sethu_legacy_members
-- Purpose: Holds pre-generated temporary password generated upon member activation,
--          allowing members to log in immediately and ensuring emails dispatch the exact DB password.
-- ------------------------------------------------------------------------------
ALTER TABLE public.sethu_legacy_members ADD COLUMN IF NOT EXISTS temporary_password text;

-- ==============================================================================
-- 4. SEED TEMPLATE 1: Member Welcome & Account Credentials (EMAIL)
-- Purpose: Official email sent to verified members containing their Username,
--          Temporary Password, Membership ID, Chapter Name, and Login URL.
-- ==============================================================================

-- 4A. Seed into public.email_templates (Default Tenant: 11111111-1111-1111-1111-111111111111)
INSERT INTO public.email_templates (
    id, tenant_id, template_code, name, subject, body_html, variables, is_active, updated_at
)
VALUES (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    'MEMBER_WELCOME_CREDENTIALS',
    'Member Welcome & Credentials',
    'Welcome to SETHU — Your Account Credentials & Portal Access',
    '<div style="background-color: #f1f5f9; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 32px 28px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">SETHU</h1>
      <p style="color: #93c5fd; margin: 6px 0 0 0; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 1.5px;">Dharmic Business Network</p>
    </div>

    <!-- Body Content -->
    <div style="padding: 32px 28px;">
      <div style="display: inline-block; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid #a7f3d0;">
        ✓ Account Verified &amp; Activated
      </div>
      
      <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 20px; font-weight: 700;">Welcome to SETHU Network, {{FullName}}!</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Your membership profile for <strong>{{ChapterName}}</strong> has been successfully verified. You now have full access to the member portal, chapter meetings, business referrals, and member directory.
      </p>

      <!-- Credentials Card -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: #1e293b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 14px 0; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
          🔑 Member Sign-in Credentials
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 40%;">Username / Email:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{{Email}}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Membership ID:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{{MembershipId}}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Chapter:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{{ChapterName}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0 0 0; color: #64748b; vertical-align: middle;">Temporary Password:</td>
            <td style="padding: 8px 0 0 0;">
              <span style="display: inline-block; background: #e0e7ff; color: #3730a3; padding: 6px 14px; border-radius: 6px; font-family: monospace; font-size: 16px; font-weight: 700; letter-spacing: 1px; border: 1px solid #c7d2fe;">
                {{TemporaryPassword}}
              </span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{LoginUrl}}" style="background: #1e3a8a; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 2px 4px rgba(30, 58, 138, 0.2);">
          Sign In to Member Portal →
        </a>
      </div>

      <!-- Security Notice -->
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin-top: 24px;">
        <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
          <strong>Security Notice:</strong> Please reset this temporary password upon your first sign in to keep your account secure.
        </p>
      </div>

      <!-- Direct Link fallback -->
      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        If the button above does not work, copy and paste this URL into your browser:<br/>
        <a href="{{LoginUrl}}" style="color: #2563eb; text-decoration: underline; word-break: break-all;">{{LoginUrl}}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 20px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 12px; margin: 0 0 4px 0;">© 2026 SETHU — Dharmic Business Network. All rights reserved.</p>
      <p style="color: #94a3b8; font-size: 11px; margin: 0;">This email was dispatched to {{Email}} regarding your membership account.</p>
    </div>

  </div>
</div>',
    '["FullName","Email","MembershipId","TemporaryPassword","LoginUrl","ChapterName"]'::jsonb,
    true,
    now()
)
ON CONFLICT (tenant_id, template_code) DO UPDATE
SET name = EXCLUDED.name,
    subject = EXCLUDED.subject,
    body_html = EXCLUDED.body_html,
    variables = EXCLUDED.variables,
    updated_at = now();


-- 4B. Seed into public.sethu_platform_templates (Platform Catalog)
INSERT INTO public.sethu_platform_templates (
    id, code, name, channel, subject, body, variables, status, version, updated_at
)
VALUES (
    'tmp-welcome-cred',
    'TMP_WELCOME_CREDENTIALS',
    'Member Welcome & Portal Access',
    'EMAIL',
    'Welcome to SETHU — Your Account Credentials & Portal Access',
    '<div style="background-color: #f1f5f9; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 32px 28px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">SETHU</h1>
      <p style="color: #93c5fd; margin: 6px 0 0 0; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 1.5px;">Dharmic Business Network</p>
    </div>
    <div style="padding: 32px 28px;">
      <div style="display: inline-block; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid #a7f3d0;">
        ✓ Account Verified &amp; Activated
      </div>
      <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 20px; font-weight: 700;">Welcome to SETHU Network, {{FullName}}!</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Your membership profile for <strong>{{ChapterName}}</strong> has been successfully verified. You now have full access to the member portal, chapter meetings, business referrals, and member directory.
      </p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: #1e293b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 14px 0; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
          🔑 Member Sign-in Credentials
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #64748b; width: 40%;">Username / Email:</td><td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{{Email}}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Membership ID:</td><td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{{MembershipId}}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Chapter:</td><td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{{ChapterName}}</td></tr>
          <tr><td style="padding: 8px 0 0 0; color: #64748b; vertical-align: middle;">Temporary Password:</td><td style="padding: 8px 0 0 0;"><span style="display: inline-block; background: #e0e7ff; color: #3730a3; padding: 6px 14px; border-radius: 6px; font-family: monospace; font-size: 16px; font-weight: 700; letter-spacing: 1px; border: 1px solid #c7d2fe;">{{TemporaryPassword}}</span></td></tr>
        </table>
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{LoginUrl}}" style="background: #1e3a8a; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">Sign In to Member Portal →</a>
      </div>
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin-top: 24px;">
        <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;"><strong>Security Notice:</strong> Please reset this temporary password upon your first sign in.</p>
      </div>
    </div>
  </div>
</div>',
    '["FullName", "Email", "MembershipId", "TemporaryPassword", "LoginUrl", "ChapterName"]'::jsonb,
    'Published',
    1,
    now()
)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    variables = EXCLUDED.variables,
    updated_at = now();

-- ==============================================================================
-- 5. SEED TEMPLATE 2: Official Chapter Charter Notification (EMAIL)
-- Purpose: Notifies chapter core committee and regional director when a new
--          chapter charter is approved and officially launched.
-- ==============================================================================
INSERT INTO public.sethu_platform_templates (
    id, code, name, channel, subject, body, variables, status, version, updated_at
)
VALUES (
    'tmp-chapter-launch',
    'TMP_CHAPTER_LAUNCH',
    'Official Chapter Charter Notification',
    'EMAIL',
    'Congratulations! Chapter Charter Approved for {{ChapterName}}',
    '<div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #1e3a8a; margin-top: 0;">Chapter Charter Official Notice</h2>
  <p>Dear Chapter Leadership,</p>
  <p>We are delighted to announce that <strong>Chapter {{ChapterName}}</strong> in Region <strong>{{RegionName}}</strong> has been granted official network status.</p>
  <div style="background: #f8fafc; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0; border-radius: 4px;">
    <p style="margin: 0 0 6px 0;"><strong>Chapter Name:</strong> {{ChapterName}}</p>
    <p style="margin: 0 0 6px 0;"><strong>Region:</strong> {{RegionName}}</p>
    <p style="margin: 0;"><strong>Effective Charter Date:</strong> {{CharterDate}}</p>
  </div>
  <p>Chapter onboarding resources and initial member rosters are now accessible through the Governance Portal.</p>
  <p style="color: #64748b; font-size: 12px; margin-top: 24px;">SETHU — Dharmic Business Network</p>
</div>',
    '["ChapterName", "RegionName", "CharterDate"]'::jsonb,
    'Published',
    1,
    now()
)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    variables = EXCLUDED.variables,
    updated_at = now();

-- ==============================================================================
-- 6. SEED TEMPLATE 3: KYC Review Alert (IN_APP)
-- Purpose: In-app notification sent to chapter reviewers when a member uploads KYC docs.
-- ==============================================================================
INSERT INTO public.sethu_platform_templates (
    id, code, name, channel, subject, body, variables, status, version, updated_at
)
VALUES (
    'tmp-kyc-alert',
    'TMP_KYC_REVIEW_ALERT',
    'KYC Attestation Pending Review',
    'IN_APP',
    'Action Required: New KYC Submission for {{ChapterName}}',
    'Member {{FullName}} has submitted verification documents ({{DocumentType}}) for {{ChapterName}}. Review link: {{ReviewUrl}}',
    '["FullName", "ChapterName", "DocumentType", "ReviewUrl"]'::jsonb,
    'Published',
    1,
    now()
)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    variables = EXCLUDED.variables,
    updated_at = now();

-- ==============================================================================
-- 7. SEED TEMPLATE 4: SLA Resolution Threshold Warning (SMS)
-- Purpose: Urgent SMS alert sent when a governance SLA threshold is at risk of breach.
-- ==============================================================================
INSERT INTO public.sethu_platform_templates (
    id, code, name, channel, subject, body, variables, status, version, updated_at
)
VALUES (
    'tmp-sla-warn',
    'TMP_SLA_ESCALATION',
    'SLA Resolution Threshold Warning',
    'SMS',
    NULL,
    'Urgent: SLA threshold warning triggered for {{WorkflowCode}} - {{EntityId}}. Remaining: {{RemainingMinutes}} min. Immediate review required.',
    '["WorkflowCode", "EntityId", "RemainingMinutes"]'::jsonb,
    'Published',
    1,
    now()
)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    variables = EXCLUDED.variables,
    updated_at = now();

-- ==============================================================================
-- VERIFICATION QUERIES
-- Run these queries in pgAdmin or psql to verify all templates are active in the database:
-- ==============================================================================
-- Check Platform Catalog Templates (Communication -> Templates):
SELECT code, name, channel, subject, status, version, updated_at 
FROM public.sethu_platform_templates 
ORDER BY code ASC;

-- Check Member Email Dispatch Templates (Communication -> Member Credentials & Email Dispatch):
SELECT template_code, name, subject, is_active, updated_at 
FROM public.email_templates 
ORDER BY template_code ASC;

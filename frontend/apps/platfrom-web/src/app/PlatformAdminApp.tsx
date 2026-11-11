import { lazy, Suspense, type ComponentType } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PlatformAdminShell } from "@/shell/PlatformAdminShell";
import { RequirePermission } from "@/security/RequirePermission";
import { routes } from "@/routes/routeManifest";
import { Loading } from "@/components/Ui";
import { PlatformAdminLoginPage } from "@/pages/PlatformAdminLoginPage";
const lazyNamed = <T extends Record<string, unknown>, K extends keyof T>(
  loader: () => Promise<T>,
  key: K,
) =>
  lazy(async () => {
    const m = await loader();
    return { default: m[key] as ComponentType };
  });
const HistoricalMembersDirect = lazyNamed(
  () => import("@/features/historicalMembers/HistoricalMembersPage"),
  "HistoricalMembersPage",
);
const implemented: Record<string, ComponentType> = {
  "historical-members": lazyNamed(
    () => import("@/features/historicalMembers/HistoricalMembersPage"),
    "HistoricalMembersPage",
  ),
  dashboard: lazyNamed(
    () => import("@/features/dashboard/DashboardPage"),
    "DashboardPage",
  ),
  "action-centre": lazyNamed(
    () => import("@/features/action-centre/ActionCentrePage"),
    "ActionCentrePage",
  ),
  identity: lazyNamed(
    () => import("@/features/identity/IdentityPage"),
    "IdentityPage",
  ),
  sessions: lazyNamed(
    () => import("@/features/sessions/SessionsPage"),
    "SessionsPage",
  ),
  organisation: lazyNamed(
    () => import("@/features/organisation/OrganisationPage"),
    "OrganisationPage",
  ),
  chapters: lazyNamed(
    () => import("@/features/chapters/ChapterManagementWorkflowPage"),
    "ChapterManagementWorkflowPage",
  ),
  "chapter-workflow": lazyNamed(
    () => import("@/features/chapters/ChapterManagementWorkflowPage"),
    "ChapterManagementWorkflowPage",
  ),
  roles: lazyNamed(() => import("@/features/roles/RolesPage"), "RolesPage"),
  permissions: lazyNamed(
    () => import("@/features/permissions/PermissionsPage"),
    "PermissionsPage",
  ),
  assignments: lazyNamed(
    () => import("@/features/assignments/AssignmentsPage"),
    "AssignmentsPage",
  ),
  delegations: lazyNamed(
    () => import("@/features/delegation/DelegationsPage"),
    "DelegationsPage",
  ),
  rbac: lazyNamed(() => import("@/features/rbac/RBACPage"), "RBACPage"),
  raci: lazyNamed(() => import("@/features/raci/RACIPage"), "RACIPage"),
  sod: lazyNamed(() => import("@/features/sod/SoDPage"), "SoDPage"),
  "effective-access": lazyNamed(
    () => import("@/features/effective-access/EffectiveAccessPage"),
    "EffectiveAccessPage",
  ),
  configuration: lazyNamed(
    () => import("@/features/configuration/ConfigurationPage"),
    "ConfigurationPage",
  ),
  "configuration-profiles": lazyNamed(
    () => import("@/features/configuration/ConfigurationProfilesPage"),
    "ConfigurationProfilesPage",
  ),
  "effective-configuration": lazyNamed(
    () =>
      import("@/features/effective-configuration/EffectiveConfigurationPage"),
    "EffectiveConfigurationPage",
  ),
  releases: lazyNamed(
    () => import("@/features/releases/ReleasesPage"),
    "ReleasesPage",
  ),
  "change-sets": lazyNamed(
    () => import("@/features/change-sets/ChangeSetsPage"),
    "ChangeSetsPage",
  ),
  taxonomy: lazyNamed(
    () => import("@/features/taxonomy/TaxonomyPage"),
    "TaxonomyPage",
  ),
  "master-data": lazyNamed(
    () => import("@/features/master-data/MasterDataPage"),
    "MasterDataPage",
  ),
  "reference-data": lazyNamed(
    () => import("@/features/reference-data/ReferenceDataPage"),
    "ReferenceDataPage",
  ),
  forms: lazyNamed(() => import("@/features/forms/FormsPage"), "FormsPage"),
  workflows: lazyNamed(
    () => import("@/features/workflows/WorkflowsPage"),
    "WorkflowsPage",
  ),
  sla: lazyNamed(() => import("@/features/sla/SlaPage"), "SlaPage"),
  calendars: lazyNamed(
    () => import("@/features/calendars/CalendarsPage"),
    "CalendarsPage",
  ),
  features: lazyNamed(
    () => import("@/features/features/FeaturesPage"),
    "FeaturesPage",
  ),
  notifications: lazyNamed(
    () => import("@/features/notifications/NotificationsPage"),
    "NotificationsPage",
  ),
  templates: lazyNamed(
    () => import("@/features/templates/TemplatesPage"),
    "TemplatesPage",
  ),
  "member-emails": lazyNamed(
    () => import("@/features/memberEmails/MemberEmailsPage"),
    "MemberEmailsPage",
  ),
  integrations: lazyNamed(
    () => import("@/features/integrations/IntegrationsPage"),
    "IntegrationsPage",
  ),
  "integration-health": lazyNamed(
    () => import("@/features/integrations/IntegrationHealthPage"),
    "IntegrationHealthPage",
  ),
  imports: lazyNamed(
    () => import("@/features/imports/ImportsPage"),
    "ImportsPage",
  ),
  exports: lazyNamed(
    () => import("@/features/exports/ExportsPage"),
    "ExportsPage",
  ),
  jobs: lazyNamed(() => import("@/features/jobs/JobsPage"), "JobsPage"),
  "data-quality": lazyNamed(
    () => import("@/features/data-quality/DataQualityPage"),
    "DataQualityPage",
  ),
  corrections: lazyNamed(
    () => import("@/features/corrections/CorrectionsPage"),
    "CorrectionsPage",
  ),
  moderation: lazyNamed(
    () => import("@/features/moderation/ModerationPage"),
    "ModerationPage",
  ),
  audit: lazyNamed(() => import("@/features/audit/AuditPage"), "AuditPage"),
  history: lazyNamed(
    () => import("@/features/history/HistoryPage"),
    "HistoryPage",
  ),
  impact: lazyNamed(() => import("@/features/impact/ImpactPage"), "ImpactPage"),
  diagnostics: lazyNamed(
    () => import("@/features/diagnostics/DiagnosticsPage"),
    "DiagnosticsPage",
  ),
  security: lazyNamed(
    () => import("@/features/security/SecurityPage"),
    "SecurityPage",
  ),
  privacy: lazyNamed(
    () => import("@/features/privacy/PrivacyPage"),
    "PrivacyPage",
  ),
  handoffs: lazyNamed(
    () => import("@/features/handoffs/HandoffsPage"),
    "HandoffsPage",
  ),
  reports: lazyNamed(
    () => import("@/features/reports/ReportsPage"),
    "ReportsPage",
  ),
  "consumer-capabilities": lazyNamed(
    () => import("@/features/consumer-capabilities/ConsumerCapabilitiesPage"),
    "ConsumerCapabilitiesPage",
  ),
  "system-settings": lazyNamed(
    () => import("@/features/system/SystemSettingsPage"),
    "SystemSettingsPage",
  ),
};
export function PlatformAdminApp() {
  return (
    <Suspense
      fallback={
        <div className="main">
          <Loading label="Loading Platform Administration module…" />
        </div>
      }
    >
      <Routes>
        <Route
          path="/historical-members"
          element={<HistoricalMembersDirect />}
        />
        <Route path="/login" element={<PlatformAdminLoginPage />} />
        <Route
          path="/platform-admin/login"
          element={<PlatformAdminLoginPage />}
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/platform-admin" element={<PlatformAdminShell />}>
          <Route
            index
            element={<Navigate to="/platform-admin/dashboard" replace />}
          />
          {routes.map((r) => {
            const Component = implemented[r.id];
            if (!Component)
              throw new Error(`Route component missing for ${r.id}`);
            return (
              <Route
                key={r.id}
                path={r.path.replace("/platform-admin/", "")}
                element={
                  <RequirePermission permission={r.permission}>
                    <Component />
                  </RequirePermission>
                }
              />
            );
          })}
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

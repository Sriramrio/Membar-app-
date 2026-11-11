export const PLATFORM_ADMIN_ROUTE_PERMISSIONS={
  '/platform-admin/dashboard':'platform.workspace.access',
  '/platform-admin/identity':'platform.identity.manage',
  '/platform-admin/hierarchy':'platform.organisation.manage',
  '/platform-admin/roles':'platform.role.manage',
  '/platform-admin/rbac':'platform.rbac.manage',
  '/platform-admin/raci':'platform.workflow.manage',
  '/platform-admin/workflows':'platform.workflow.manage',
  '/platform-admin/lookups':'platform.taxonomy.manage',
  '/platform-admin/forms':'platform.form.manage',
  '/platform-admin/imports':'platform.import.manage',
  '/platform-admin/integrations':'platform.integration.manage',
  '/platform-admin/moderation':'platform.moderation.manage',
  '/platform-admin/notifications':'platform.notification.manage',
  '/platform-admin/promotions':'platform.promotion.manage',
  '/platform-admin/audit':'platform.audit.view',
  '/platform-admin/data-quality':'platform.dataquality.manage',
  '/platform-admin/settings':'platform.setting.manage',
} as const;

export type PlatformAdminRoute=keyof typeof PLATFORM_ADMIN_ROUTE_PERMISSIONS;
export type PlatformRoutePermission=(typeof PLATFORM_ADMIN_ROUTE_PERMISSIONS)[PlatformAdminRoute];

export function platformPathPermission(path:string):string{
  const entries=Object.entries(PLATFORM_ADMIN_ROUTE_PERMISSIONS).sort((a,b)=>b[0].length-a[0].length);
  return entries.find(([route])=>path===route||path.startsWith(`${route}/`))?.[1]??'platform.workspace.access';
}

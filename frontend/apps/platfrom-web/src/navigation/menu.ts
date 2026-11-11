import { routes, type RouteDefinition } from '@/routes/routeManifest';

export function filterVisibleRoutes(routeList: RouteDefinition[], permissions: string[]): RouteDefinition[] {
  if (!permissions || permissions.length === 0 || permissions.includes('*') || permissions.includes('platform:admin')) {
    return routeList;
  }
  return routeList.filter((r) => !r.permission || permissions.includes(r.permission));
}

export const menuGroups = [
  'Overview',
  'Platform',
  'Organisation',
  'Identity & Access',
  'Business Definitions',
  'Communication',
  'Integrations',
  'Platform Operations',
  'Assurance',
  'System',
  'Intelligence'
] as const;

export function menuFor(permissions: string[]) {
  const visibleRoutes = filterVisibleRoutes(routes, permissions);
  return menuGroups
    .map((group) => ({
      group,
      items: visibleRoutes.filter((r: RouteDefinition) => r.group === group),
    }))
    .filter((g) => g.items.length > 0);
}

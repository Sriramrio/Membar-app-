export type WorkspaceId = 'platform-admin' | 'organisation' | 'member';
export interface WorkspaceRouteDefinition { id: string; path: string; label?: string; group?: string; permission?: string; parentId?: string; }
export function assertWorkspace(value: string): WorkspaceId;
export function buildDestination(template: string, params?: Record<string,string|number>): string;
export function validateRouteRegistry(workspace: WorkspaceId, routes: readonly WorkspaceRouteDefinition[]): true;
export function resolveWorkspaceRoute(workspace: WorkspaceId, routes: readonly WorkspaceRouteDefinition[], id: string, params?: Record<string,string|number>): string;
export function filterVisibleRoutes<T extends { permission: string }>(routes: readonly T[], permissions: readonly string[]): T[];
export function fallbackReturn(target: string, fallback: string): string;

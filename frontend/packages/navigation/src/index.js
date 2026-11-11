const ALLOWED_WORKSPACES = new Set(['platform-admin', 'organisation', 'member']);

export function assertWorkspace(value) {
  if (!ALLOWED_WORKSPACES.has(value)) {
    throw new Error(`Invalid workspace: ${value}`);
  }
  return value;
}

export function buildDestination(template, params = {}) {
  if (typeof template !== 'string') {
    throw new Error('Template must be a string');
  }

  // Must be an absolute local path, no protocol-relative URLs
  if (!template.startsWith('/') || template.startsWith('//')) {
    throw new Error(`Invalid destination template: ${template}`);
  }

  // Must not contain query strings, fragments, or backslashes
  if (template.includes('?') || template.includes('#') || template.includes('\\')) {
    throw new Error(`Destination must not contain query strings, fragments, or backslashes: ${template}`);
  }

  // Check for dot traversal or encoded separators in templates
  // e.g. /../admin, /./admin, /org/%2e%2e/admin, /org/%2fadmin, /org/%5cadmin
  const lowerTemplate = template.toLowerCase();
  if (
    /(^|\/)(\.\.?|\%2e\%2e|\%2e)(\/|$)/.test(lowerTemplate) ||
    lowerTemplate.includes('%2f') ||
    lowerTemplate.includes('%5c')
  ) {
    throw new Error(`Path traversal or encoded separator detected in template: ${template}`);
  }

  // Replace :paramName
  const result = template.replace(/:([a-zA-Z0-9_]+)/g, (_match, paramName) => {
    if (params == null || !Object.prototype.hasOwnProperty.call(params, paramName)) {
      throw new Error(`Missing parameter for placeholder :${paramName}`);
    }

    const val = params[paramName];
    if (typeof val === 'number') {
      if (!Number.isFinite(val)) {
        throw new Error(`Invalid numeric parameter value for :${paramName}`);
      }
      return String(val);
    }

    if (typeof val !== 'string') {
      throw new Error(`Invalid parameter value for :${paramName}`);
    }

    if (val === '') {
      throw new Error(`Empty parameter value for :${paramName}`);
    }

    // Reject traversal and path separators in parameter values (e.g., '', '../root', 'one/two')
    const lowerVal = val.toLowerCase();
    if (
      val.includes('/') ||
      val.includes('\\') ||
      /(^|\/)(\.\.?|\%2e\%2e|\%2e)(\/|$)/.test(lowerVal) ||
      lowerVal.includes('%2f') ||
      lowerVal.includes('%5c')
    ) {
      throw new Error(`Path traversal or separator in parameter value for :${paramName}`);
    }

    return encodeURIComponent(val);
  });

  return result;
}

export function validateRouteRegistry(workspace, routes) {
  assertWorkspace(workspace);
  if (!Array.isArray(routes)) {
    throw new Error('Routes must be an array');
  }

  const seenIds = new Set();
  for (const route of routes) {
    if (!route || typeof route.id !== 'string') {
      throw new Error('Invalid route definition');
    }
    if (seenIds.has(route.id)) {
      throw new Error(`Duplicate route id: ${route.id}`);
    }
    seenIds.add(route.id);
  }

  for (const route of routes) {
    if (route.parentId) {
      if (!seenIds.has(route.parentId)) {
        throw new Error(`Route "${route.id}" references nonexistent parentId "${route.parentId}"`);
      }
    }
  }

  return true;
}

export function resolveWorkspaceRoute(workspace, routes, id, params = {}) {
  assertWorkspace(workspace);
  if (!Array.isArray(routes)) {
    throw new Error('Routes must be an array');
  }

  const route = routes.find((r) => r.id === id);
  if (!route) {
    throw new Error(`Route "${id}" not found in workspace "${workspace}"`);
  }

  return buildDestination(route.path, params);
}

export function filterVisibleRoutes(routes, permissions = []) {
  if (!Array.isArray(routes)) {
    return [];
  }
  const permSet = new Set(permissions);
  return routes.filter((route) => {
    if (!route.permission) return true;
    return permSet.has(route.permission);
  });
}

export function fallbackReturn(target, fallback) {
  if (
    typeof target === 'string' &&
    target.startsWith('/') &&
    !target.startsWith('//') &&
    !target.includes('\\')
  ) {
    return target;
  }
  return fallback;
}

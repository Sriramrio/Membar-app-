export interface RouteAlias {from:string;to:string;introducedIn:string;reason:string;removalPolicy:'Retain'|'Review'}

/**
 * Canonical compatibility aliases are intentionally small. Existing V3/V4/V5/V6 deep-link
 * paths remain canonical and are not renamed. These aliases cover workspace-root entry points
 * only; new aliases must be registered here rather than embedded in page components.
 */
export const routeAliases:RouteAlias[]=[
 {from:'/app',to:'/app/home',introducedIn:'V6 Baseline',reason:'Stable Member workspace root',removalPolicy:'Retain'},
 {from:'/workspace',to:'/app/home',introducedIn:'V6 Baseline',reason:'Platform overview disabled, route to home',removalPolicy:'Retain'},
 {from:'/manage',to:'/manage/dashboard',introducedIn:'V6 Baseline',reason:'Stable Management workspace root',removalPolicy:'Retain'},
 {from:'/governance',to:'/governance/dashboard',introducedIn:'V6 Baseline',reason:'Stable Governance workspace root',removalPolicy:'Retain'},
 {from:'/platform-admin',to:'/platform-admin/dashboard',introducedIn:'V6 Baseline',reason:'Stable Platform Administration workspace root',removalPolicy:'Retain'},
];

export function resolveRouteAlias(path:string){return routeAliases.find(a=>a.from===path)?.to??path}
export function isSafeCanonicalPath(path:string){return path.startsWith('/')&&!path.startsWith('//')&&!path.includes('://')}

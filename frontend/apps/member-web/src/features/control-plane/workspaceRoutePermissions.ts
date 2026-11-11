export interface RoutePermissionModule {
  enabled:boolean;
  routeRoots:string[];
  requiredPermission?:string;
}

export function requiredPermissionForWorkspacePath(path:string,modules:RoutePermissionModule[]){
  const matches=modules
    .filter(module=>module.enabled&&Boolean(module.requiredPermission))
    .flatMap(module=>module.routeRoots
      .filter(root=>path===root||path.startsWith(`${root}/`))
      .map(root=>({root,permission:module.requiredPermission!})))
    .sort((a,b)=>b.root.length-a.root.length);
  return matches[0]?.permission;
}

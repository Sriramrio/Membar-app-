import fs from 'node:fs';
const access=fs.readFileSync(new URL('../src/security/access.ts',import.meta.url),'utf8');
const routes=fs.readFileSync(new URL('../src/routes/routeRegistry.tsx',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../src/routes/OrgApp.tsx',import.meta.url),'utf8');
const boundary=fs.readFileSync(new URL('../src/components/RouteAccessBoundary.tsx',import.meta.url),'utf8');
const checks=[
 ['empty permissions fail closed',!access.includes('if(!permissions.length)return true')&&access.includes('if(!permissions.length||!requiredPermission)return false')],
 ['no title based auth',!access.includes('Treasurer|Management')],
 ['route policy attached',routes.includes('requiredPermission:string')&&routes.includes('routeAccessPolicy')],
 ['route boundary permission aware',boundary.includes('hasPermissionId')&&boundary.includes('activeAssignment')],
 ['OrgApp passes route permission',app.includes('requiredPermission={r.requiredPermission}')&&app.includes('capability={r.capability}')]
];
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)process.exitCode=1}

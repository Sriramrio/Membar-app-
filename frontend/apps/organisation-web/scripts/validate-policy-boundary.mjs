import fs from 'node:fs';
const roles=fs.readFileSync(new URL('../src/domain/roles.ts',import.meta.url),'utf8');
const page=fs.readFileSync(new URL('../src/pages/RolesAccessPage.tsx',import.meta.url),'utf8');
const checks=[
 ['role file presentation only',!roles.includes('permissions:')&&!roles.includes('workflowRaci')&&!roles.includes('sodRules')],
 ['roles page consumes effective policy',page.includes('s.effectivePolicy')],
 ['roles page has Platform Admin governed handoff',page.includes("targetWorkspace:'PLATFORM_ADMIN'")&&page.includes("commandType:'org.handoff.create'")],
 ['roles page does not expose policy editor',!page.includes('Configured role catalogue')&&!page.includes('RACI examples')]
];
for(const [n,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${n}`);if(!ok)process.exitCode=1}

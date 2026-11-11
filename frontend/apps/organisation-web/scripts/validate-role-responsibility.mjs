import fs from 'node:fs';
const types=fs.readFileSync(new URL('../src/domain/types.ts',import.meta.url),'utf8');
const roles=fs.readFileSync(new URL('../src/domain/roles.ts',import.meta.url),'utf8');
const checks=[
 ['committee roles removed from formal OrgRoleType',!/OrgRoleType=[^;]*COMMITTEE_(CONVENER|MEMBER)/.test(types)],
 ['operational responsibility type exists',types.includes("OperationalResponsibilityType='COMMITTEE_CONVENER'|'COMMITTEE_MEMBER'")],
 ['responsibility assignment is contextual',types.includes('contextType:')&&types.includes('contextId:string')],
 ['role presentation separates responsibility labels',roles.includes('responsibilityLabels')&&roles.includes('roleLabels')]
];
for(const [n,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${n}`);if(!ok)process.exitCode=1}

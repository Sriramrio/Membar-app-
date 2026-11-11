import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const suites=[
 ['Authentication','validate:v6:auth-functional'],
 ['Role/identity assignments','validate:v6:role-model'],
 ['RBAC/action matrix','validate:v6:role-permission-matrix'],
 ['Platform Admin identity/access','validate:v6:platform-admin:functional-access'],
 ['Platform Admin configuration','validate:v6:platform-admin:functional-config'],
 ['Platform Admin operations','validate:v6:platform-admin:functional-operations'],
 ['Platform Admin assurance','validate:v6:platform-admin:functional-assurance'],
 ['Member foundation','validate:v6:member:functional-foundation'],
 ['Member network','validate:v6:member:functional-network'],
 ['Member business','validate:v6:member:functional-business'],
 ['Member community','validate:v6:member:functional-community'],
 ['Member account','validate:v6:member:functional-account'],
 ['Forms/actions','validate:v6:forms-actions'],
 ['Functional UX','validate:v6:functional-ux'],
 ['Role journeys','validate:v6:role-journeys'],
 ['Platform canonical complete regression','validate:v6:platform-canonical:regression'],
];
let completed=0;
for(const [label,script] of suites){
 if(!pkg.scripts?.[script]){console.error(`FAIL: required functional regression script is not registered: ${script}`);process.exit(1)}
 const r=spawnSync('npm',['run',script],{encoding:'utf8'});
 if(r.stdout)process.stdout.write(r.stdout);if(r.stderr)process.stderr.write(r.stderr);
 if(r.status!==0){console.error(`FAIL: F16 functional regression suite — ${label}`);process.exit(r.status||1)}
 completed++;console.log(`PASS: F16 functional regression suite — ${label}`);
}
console.log(`\nSETHU V6.1 full functional regression: PASS — ${completed}/${suites.length} suites.`);

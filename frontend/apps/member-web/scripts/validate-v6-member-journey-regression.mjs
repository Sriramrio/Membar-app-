import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const suites=[
 ['Syntax','validate:v6:syntax'],
 ['Member modernisation','validate:v6:member-journey-modernisation'],
 ['Member mobile contract','validate:v6:member-mobile-contract'],
 ['Member deep clean','validate:v6:member-deep-clean'],
 ['Member networking analytics','validate:v6:member-networking-analytics'],
 ['Member analytics roll-up','validate:v6:member-analytics-rollup'],
 ['Member content/action integrity','validate:v6:member-content-action-integrity'],
 ['Member enterprise closure','validate:v6:member-enterprise-closure'],
 ['Member foundation','validate:v6:member:functional-foundation'],
 ['Member network','validate:v6:member:functional-network'],
 ['Member business','validate:v6:member:functional-business'],
 ['Member community','validate:v6:member:functional-community'],
 ['Member account','validate:v6:member:functional-account'],
 ['Member journeys','validate:v6:member-journeys'],
 ['Member canonical workflows','validate:v6:member-canonical:workflows'],
 ['Member canonical UX','validate:v6:member-canonical:ux'],
 ['Forms/actions','validate:v6:forms-actions'],
 ['Functional UX','validate:v6:functional-ux'],
 ['Navigation metadata','validate:v6:navigation-metadata'],
 ['Navigation coordinator','validate:v6:navigation-coordinator'],
 ['Deep links','validate:v6:deep-links'],
 ['Breadcrumbs','validate:v6:breadcrumbs'],
 ['Action UX','validate:v6:action-ux'],
 ['Dirty navigation','validate:v6:dirty-navigation'],
 ['Production boundary','validate:v6:production-boundary'],
 ['Provider boundaries','validate:v6:provider-boundaries'],
 ['Security boundary','validate:v6:security-trust-boundary'],
 ['Runtime source clean','validate:v6:runtime-remediation:source-clean'],
 ['Static quality','validate:v6:static-quality'],
 ['Performance/resilience','validate:v6:performance-resilience'],
 ['Platform canonical','validate:v6:platform-canonical'],
 ['Platform UX','validate:v6:platform-canonical:ux'],
 ['Platform journeys','validate:v6:platform-canonical:journeys'],
 ['Role journeys','validate:v6:role-journeys'],
 ['RBAC/action matrix','validate:v6:role-permission-matrix'],
];
let done=0;
for(const [label,script] of suites){
 if(!pkg.scripts?.[script]){console.error(`FAIL: missing script ${script}`);process.exit(1)}
 const r=spawnSync('npm',['run',script],{encoding:'utf8'});
 if(r.stdout)process.stdout.write(r.stdout);if(r.stderr)process.stderr.write(r.stderr);
 if(r.status!==0){console.error(`FAIL: Member Journey regression — ${label}`);process.exit(r.status||1)}
 done++;console.log(`PASS: Member Journey regression — ${label}`);
}
console.log(`\nSETHU Member Journey current-source regression: PASS — ${done}/${suites.length} suites.`);

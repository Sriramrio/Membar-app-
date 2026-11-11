import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
let pass=0;
const check=(name,ok)=>{if(!ok){console.error('FAIL',name);process.exitCode=1}else{console.log('PASS',name);pass++}};
check("SLA page", read('src/features/sla/SlaPage.tsx').includes('SLA & Escalation'));
check("SLA contract", read('src/contracts/platform.ts').includes('interface SlaPolicy'));
check("SLA route", read('src/routes/routeManifest.ts').includes('PERMISSIONS.slaRead'));
check("SLA commands", read('src/contracts/catalogue.ts').includes('platform.sla.activate'));
if(!process.exitCode)console.log('PA-S29: '+pass+' checks PASS');

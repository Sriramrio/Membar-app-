import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
let pass=0;
const check=(name,ok)=>{if(!ok){console.error('FAIL',name);process.exitCode=1}else{console.log('PASS',name);pass++}};
check("Workflow page", read('src/features/workflows/WorkflowsPage.tsx').includes('Consumer workspaces execute instances'));
check("Workflow version contract", read('src/contracts/platform.ts').includes('interface WorkflowVersionDefinition'));
check("Workflow route", read('src/routes/routeManifest.ts').includes('PERMISSIONS.workflowRead'));
check("Workflow validation catalog", read('src/contracts/catalogue.ts').includes('platform.workflow.validate-definition'));
if(!process.exitCode)console.log('PA-S28: '+pass+' checks PASS');

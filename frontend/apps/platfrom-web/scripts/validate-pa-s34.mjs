import{readFileSync}from'node:fs';import{join}from'node:path';
const root=process.cwd();let pass=0,fail=0;const read=p=>readFileSync(join(root,p),'utf8');function check(name,ok){if(ok){pass++;console.log('PASS',name)}else{fail++;console.error('FAIL',name)}}
check("import types", read("src/contracts/platform.ts").includes("interface ImportRun"));
check("import commands", read("src/contracts/catalogue.ts").includes("platform.import.reconcile"));
check("import review permission", read("src/contracts/catalogue.ts").includes("platform.import.review"));
check("import route", read("src/routes/routeManifest.ts").includes("id:'imports'"));
check("import UI lifecycle", read("src/features/imports/ImportsPage.tsx").includes("reconcile"));
console.log(`PA-S34: ${pass} PASS / ${fail} FAIL`);if(fail)process.exit(1);

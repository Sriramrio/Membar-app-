import{readFileSync}from'node:fs';import{join}from'node:path';
const root=process.cwd();let pass=0,fail=0;const read=p=>readFileSync(join(root,p),'utf8');function check(name,ok){if(ok){pass++;console.log('PASS',name)}else{fail++;console.error('FAIL',name)}}
check("integration types", read("src/contracts/platform.ts").includes("interface IntegrationDefinition"));
check("integration queries", read("src/contracts/catalogue.ts").includes("platform.integration.health"));
check("integration permissions", read("src/contracts/catalogue.ts").includes("platform.integration.test"));
check("integration route", read("src/routes/routeManifest.ts").includes("id:'integrations'"));
check("integration page", read("src/features/integrations/IntegrationsPage.tsx").includes("Secrets remain server-side"));
console.log(`PA-S33: ${pass} PASS / ${fail} FAIL`);if(fail)process.exit(1);

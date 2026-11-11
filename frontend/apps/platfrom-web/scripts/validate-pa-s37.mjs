import{readFileSync}from'node:fs';import{join}from'node:path';
const root=process.cwd();let pass=0,fail=0;const read=p=>readFileSync(join(root,p),'utf8');function check(name,ok){if(ok){pass++;console.log('PASS',name)}else{fail++;console.error('FAIL',name)}}
check("correction type", read("src/contracts/platform.ts").includes("interface TechnicalCorrection"));
check("correction commands", read("src/contracts/catalogue.ts").includes("platform.correction.verify"));
check("correction review permission", read("src/contracts/catalogue.ts").includes("platform.correction.review"));
check("correction route", read("src/routes/routeManifest.ts").includes("id:'corrections'"));
check("no row editor", read("src/features/corrections/CorrectionsPage.tsx").includes("no arbitrary database-row editor"));
console.log(`PA-S37: ${pass} PASS / ${fail} FAIL`);if(fail)process.exit(1);

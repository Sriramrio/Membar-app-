import{readFileSync}from'node:fs';import{join}from'node:path';
const root=process.cwd();let pass=0,fail=0;const read=p=>readFileSync(join(root,p),'utf8');function check(name,ok){if(ok){pass++;console.log('PASS',name)}else{fail++;console.error('FAIL',name)}}
check("export types", read("src/contracts/platform.ts").includes("interface ExportRun"));
check("job types", read("src/contracts/platform.ts").includes("interface PlatformJob"));
check("export commands", read("src/contracts/catalogue.ts").includes("platform.export.mark-downloaded"));
check("job commands", read("src/contracts/catalogue.ts").includes("platform.jobs.retry"));
check("exports page", read("src/features/exports/ExportsPage.tsx").includes("Sensitive exports are audited"));
check("jobs page", read("src/features/jobs/JobsPage.tsx").includes("controlled retry/cancel"));
console.log(`PA-S35: ${pass} PASS / ${fail} FAIL`);if(fail)process.exit(1);

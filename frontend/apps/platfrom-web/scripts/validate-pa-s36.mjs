import{readFileSync}from'node:fs';import{join}from'node:path';
const root=process.cwd();let pass=0,fail=0;const read=p=>readFileSync(join(root,p),'utf8');function check(name,ok){if(ok){pass++;console.log('PASS',name)}else{fail++;console.error('FAIL',name)}}
check("DQ types", read("src/contracts/platform.ts").includes("interface DataQualityFinding"));
check("DQ rule types", read("src/contracts/platform.ts").includes("interface DataQualityRule"));
check("DQ commands", read("src/contracts/catalogue.ts").includes("platform.data-quality.revalidate"));
check("DQ permissions", read("src/contracts/catalogue.ts").includes("platform.data-quality.remediate"));
check("DQ page no DB edit", read("src/features/data-quality/DataQualityPage.tsx").includes("never direct database editing"));
console.log(`PA-S36: ${pass} PASS / ${fail} FAIL`);if(fail)process.exit(1);

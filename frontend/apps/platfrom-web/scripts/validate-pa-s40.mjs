import{readFileSync}from'node:fs';import{join}from'node:path';const root=process.cwd();let pass=0,fail=0;const read=p=>readFileSync(join(root,p),'utf8');function check(name,ok){ok?(pass++,console.log('PASS',name)):(fail++,console.error('FAIL',name))}
 check("impact page",read("src/features/impact/ImpactPage.tsx").includes("never fabricated"));
check("impact contract",read("src/contracts/platform.ts").includes("interface ImpactAnalysisResult"));
check("impact query",read("src/contracts/catalogue.ts").includes("platform.impact"));
 console.log('PA-S40: '+pass+' PASS / '+fail+' FAIL');if(fail)process.exit(1);

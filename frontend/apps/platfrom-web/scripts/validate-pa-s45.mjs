import{readFileSync}from'node:fs';import{join}from'node:path';const root=process.cwd();let pass=0,fail=0;const read=p=>readFileSync(join(root,p),'utf8');function check(name,ok){ok?(pass++,console.log('PASS',name)):(fail++,console.error('FAIL',name))}
 check("handoff page",read("src/features/handoffs/HandoffsPage.tsx").includes("Source record remains canonical"));
check("rich lifecycle",read("src/contracts/platform.ts").includes("'Source Reconciled'"));
check("handoff review permission",read("src/contracts/catalogue.ts").includes("platform.handoff.review"));
check("handoff close command",read("src/contracts/catalogue.ts").includes("platform.handoff.close"));
 console.log('PA-S45: '+pass+' PASS / '+fail+' FAIL');if(fail)process.exit(1);

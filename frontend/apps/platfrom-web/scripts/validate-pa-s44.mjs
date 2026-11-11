import{readFileSync}from'node:fs';import{join}from'node:path';const root=process.cwd();let pass=0,fail=0;const read=p=>readFileSync(join(root,p),'utf8');function check(name,ok){ok?(pass++,console.log('PASS',name)):(fail++,console.error('FAIL',name))}
 check("privacy page",read("src/features/privacy/PrivacyPage.tsx").includes("does not expose generic physical delete"));
check("retention policy contract",read("src/contracts/platform.ts").includes("interface RetentionPolicy"));
check("allowed lifecycle",read("src/contracts/platform.ts").includes("'ARCHIVE'|'RETIRE'|'ANONYMISE'"));
check("privacy query",read("src/contracts/catalogue.ts").includes("platform.privacy.retention.list"));
 console.log('PA-S44: '+pass+' PASS / '+fail+' FAIL');if(fail)process.exit(1);

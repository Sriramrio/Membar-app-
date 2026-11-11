import{readFileSync}from'node:fs';import{join}from'node:path';const root=process.cwd();let pass=0,fail=0;const read=p=>readFileSync(join(root,p),'utf8');function check(name,ok){ok?(pass++,console.log('PASS',name)):(fail++,console.error('FAIL',name))}
 check("security page",read("src/features/security/SecurityPage.tsx").includes("never grant authority directly"));
check("security policy",read("src/contracts/platform.ts").includes("interface SecurityPolicy"));
check("break glass contract",read("src/contracts/platform.ts").includes("Pending Independent Approval"));
check("security permissions",read("src/contracts/catalogue.ts").includes("platform.security.manage"));
 console.log('PA-S43: '+pass+' PASS / '+fail+' FAIL');if(fail)process.exit(1);

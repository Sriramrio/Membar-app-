import{readFileSync}from'node:fs';import{join}from'node:path';const root=process.cwd();let pass=0,fail=0;const read=p=>readFileSync(join(root,p),'utf8');function check(name,ok){ok?(pass++,console.log('PASS',name)):(fail++,console.error('FAIL',name))}
 check("audit page",read("src/features/audit/AuditPage.tsx").includes("Read-only forensic audit"));
check("history page",read("src/features/history/HistoryPage.tsx").includes("immutable"));
check("audit query",read("src/contracts/catalogue.ts").includes("platform.audit.search"));
check("history query",read("src/contracts/catalogue.ts").includes("platform.version-history.search"));
check("wave3 pages wired",read("src/app/PlatformAdminApp.tsx").includes("integration-health"));
check("moderation wired",read("src/app/PlatformAdminApp.tsx").includes("moderation:ModerationPage"));
 console.log('PA-S39: '+pass+' PASS / '+fail+' FAIL');if(fail)process.exit(1);

import{readFileSync}from'node:fs';import{join}from'node:path';
const root=process.cwd();let pass=0,fail=0;const read=p=>readFileSync(join(root,p),'utf8');function check(name,ok){if(ok){pass++;console.log('PASS',name)}else{fail++;console.error('FAIL',name)}}
check("moderation policy type", read("src/contracts/platform.ts").includes("interface ModerationPolicy"));
check("moderation queue type", read("src/contracts/platform.ts").includes("interface ModerationQueueItem"));
check("policy queries", read("src/contracts/catalogue.ts").includes("platform.moderation.policy.list"));
check("moderation route", read("src/routes/routeManifest.ts").includes("id:'moderation'"));
check("ownership boundary", read("src/features/moderation/ModerationPage.tsx").includes("Consumer workspaces retain ownership"));
console.log(`PA-S38: ${pass} PASS / ${fail} FAIL`);if(fail)process.exit(1);

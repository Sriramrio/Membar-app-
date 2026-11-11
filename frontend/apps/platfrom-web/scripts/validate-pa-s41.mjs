import{readFileSync}from'node:fs';import{join}from'node:path';const root=process.cwd();let pass=0,fail=0;const read=p=>readFileSync(join(root,p),'utf8');function check(name,ok){ok?(pass++,console.log('PASS',name)):(fail++,console.error('FAIL',name))}
 check("effective configuration page",read("src/features/effective-configuration/EffectiveConfigurationPage.tsx").includes("Resolution path"));
check("contract path",read("src/contracts/platform.ts").includes("path:Array"));
check("route certified",read("src/routes/routeManifest.ts").includes("id:'effective-configuration'"));
check("permission explain",read("src/contracts/catalogue.ts").includes("platform.configuration.explain"));
 console.log('PA-S41: '+pass+' PASS / '+fail+' FAIL');if(fail)process.exit(1);

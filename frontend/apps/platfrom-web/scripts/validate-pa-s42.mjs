import{readFileSync}from'node:fs';import{join}from'node:path';const root=process.cwd();let pass=0,fail=0;const read=p=>readFileSync(join(root,p),'utf8');function check(name,ok){ok?(pass++,console.log('PASS',name)):(fail++,console.error('FAIL',name))}
 check("diagnostics page",read("src/features/diagnostics/DiagnosticsPage.tsx").includes("without SQL"));
check("diagnostics contract",read("src/contracts/platform.ts").includes("interface DiagnosticTrace"));
check("diagnostics query",read("src/contracts/catalogue.ts").includes("platform.diagnostics.trace"));
 console.log('PA-S42: '+pass+' PASS / '+fail+' FAIL');if(fail)process.exit(1);

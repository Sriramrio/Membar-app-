import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};

const env=read('src/config/env.ts');
const safety=read('src/config/productionSafety.ts');
const store=read('src/state/OrgStore.tsx');
const query=read('src/services/queryGateway.ts');
const command=read('src/services/commandGateway.ts');
const governed=read('src/hooks/useGovernedCommand.ts');
const realtime=read('src/services/realtimeTransport.ts');
const crossTab=read('src/services/crossTab.ts');
const catalog=read('src/contracts/catalog.ts');
const providers=read('src/infrastructure/runtimeProviders.ts');

check(/useMocks:bool\(import\.meta\.env\.VITE_USE_MOCKS,false\)/.test(env),'Preview/mock mode must default OFF.');
check(/PROD&&env\.useMocks/.test(safety),'Production safety must reject preview/mock mode.');
check(/runtimeProviders\(\)\.bootstrap\.load/.test(store)&&/lazy\(\(\)=>import\('\.\/PreviewOrgProvider'\)\)/.test(store)&&/if\(env\.useMocks\)return/.test(store)&&/bootstrap:\{load:fetchOrgBootstrap\}/.test(providers),'Production OrgProvider must use the HTTP bootstrap provider while preview runtime is isolated behind an explicit lazy mock-mode provider.');
check(/initialState\?\?emptyState\(bootstrap\.units\)/.test(store)&&!/previewFixtures/.test(store),'Production domain state must start empty/server-owned and must not import preview fixtures in the production state module.');
check(/allowedScopeIds/.test(store)&&/SCOPE_CHANGED/.test(store),'Scope changes must be constrained to bootstrap-authorised scopes and synchronised.');
check(/listeners/.test(crossTab)&&/channel\?\.postMessage/.test(crossTab),'Cross-tab runtime must also deliver session/scope events to the detecting tab.');
check(/Idempotency-Key/.test(command)&&/If-Match/.test(command)&&/X-Correlation-ID/.test(command)&&/X-Request-ID/.test(command),'Governed commands must send idempotency/version/correlation headers.');
check(/COMMAND_TIMEOUT/.test(command)&&/unknownOutcome:true/.test(command),'Mutation timeout must preserve unknown-outcome semantics.');
check(/invalidateQueryMemoryCache\(\)/.test(governed),'Successful governed commands must invalidate client read cache before reconciliation.');
check(/invalidateQueryMemoryCache\(\)/.test(realtime),'Realtime domain events must invalidate client read cache.');
check(/QueryProvider/.test(providers)&&/CommandProvider/.test(providers)&&/BootstrapProvider/.test(providers)&&/RealtimeProvider/.test(providers),'Runtime provider interfaces must exist for backend/simulator interchangeability.');
check(/env\.realtimeUrl/.test(realtime),'Realtime transport must honor the configured realtime endpoint.');
check(/Math\.min\(q\.pageSize\?\?25,100\)/.test(query),'Server query page size must remain bounded to 100.');
check(/cachePolicyForQuery/.test(query),'Query cache must be policy-driven, not generic browser persistence.');
check(/crossTab\.publish\(\{type:'SESSION_REVOKED'\}\)/.test(query)&&/crossTab\.publish\(\{type:'SESSION_REVOKED'\}\)/.test(command),'401 query/command responses must revoke runtime authority across tabs.');
check(catalog.includes("'org.today'")&&catalog.includes("'org.record.get'"),'Production query catalogue must include primary projection/detail contracts.');

const previewImports=[];
for(const dir of ['src/pages','src/components','src/hooks','src/services','src/routes']){
  const walk=(d)=>{for(const e of fs.readdirSync(path.join(root,d),{withFileTypes:true})){const rel=path.join(d,e.name);if(e.isDirectory())walk(rel);else if(/\.(ts|tsx)$/.test(e.name)&&read(rel).includes('previewFixtures'))previewImports.push(rel)}};
  walk(dir);
}
check(previewImports.length===0,`Preview fixtures leaked outside runtime state module: ${previewImports.join(', ')}`);

if(failures.length){console.error('Production runtime validation FAILED');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('Production runtime validation PASS');
console.log('Checks: preview isolation, bootstrap authority, scope/session sync, command safety, cache/realtime reconciliation, query bounds, contract presence.');

import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const checks=[];
const check=(name,ok,detail='')=>checks.push({name,ok:Boolean(ok),detail});

const routes=read('src/routes/routeConfig.tsx');
const lazyCount=(routes.match(/= lazy\(\(\) => import\(/g)||[]).length;
check('All 84 authenticated/workspace routes are lazy-loaded',lazyCount===84,`lazy=${lazyCount}`);

const vite=read('vite.config.ts');
check('API requests are NetworkOnly in PWA runtime cache',/url\.pathname\.startsWith\('\/api\/'\)[\s\S]*?handler:\s*'NetworkOnly'/.test(vite));
check('SPA navigation fallback excludes API routes',/navigateFallbackDenylist:\s*\[\/\^\\\/api\\\/\//.test(vite));
check('Outdated service-worker caches are cleaned',/cleanupOutdatedCaches:\s*true/.test(vite));
check('Production source maps remain disabled',/build:\s*\{\s*sourcemap:\s*false/.test(vite));

const api=read('src/services/api/axiosInstance.ts');
const timeout=Number((api.match(/timeout:\s*([\d_]+)/)||[])[1]?.replaceAll('_','')||0);
check('API timeout is bounded and non-zero',timeout>0&&timeout<=15000,`timeout=${timeout}`);
const interceptors=read('src/services/api/interceptors.ts');
check('Mutating API requests receive idempotency keys',/\['post',\s*'put',\s*'patch',\s*'delete'\][\s\S]*Idempotency-Key/.test(interceptors));
check('API requests receive correlation IDs',/X-Correlation-ID/.test(interceptors));

const appRoutes=read('src/routes/AppRoutes.tsx');
check('Route lazy loading has a Suspense loader',/Suspense\s+fallback=\{<Loader/.test(appRoutes));
check('Top-level route error boundary is present',/RouteErrorBoundary/.test(appRoutes));

const directory=read('src/features/member/pages/SmartMemberBusinessDirectoryPage.tsx');
const cursorPaging=read('src/hooks/useDomainCursorPage.ts');
check('Member directory uses bounded cursor pagination',/const pageSize=24/.test(directory)&&/useDomainCursorPage<Business\|Member>/.test(directory)&&/pagination:\{pageSize\}/.test(directory)&&/localItems\.slice\(offset,offset\+pageSize\)/.test(cursorPaging)&&/executeServerPage<T>/.test(cursorPaging));
const header=read('src/components/layout/Header.tsx');
check('Global search result set is bounded',/return out\.slice\(0,9\)/.test(header));

const promotionMgmt=read('src/features/management/pages/PromotionManagementPage.tsx');
check('Promotion uploads are size-bounded',/file\.size>500_000/.test(promotionMgmt));
const runtime=read('src/features/platform-runtime/platformRuntimeSlice.ts');
check('Import validation error materialization is bounded',/validationErrors=\[\.\.\.new Set\(errors\)\]\.slice\(0,25\)/.test(runtime));

const imageFiles=[
  'src/features/network/components/NetworkUI.tsx',
  'src/features/member/pages/PromotionDetailPage.tsx',
  'src/features/management/pages/PromotionManagementPage.tsx'
];
for(const f of imageFiles){const s=read(f);check(`Non-critical media is lazy/async decoded: ${f}`,/loading="lazy"\s+decoding="async"/.test(s));}

const offline=read('src/features/member/pages/InstallOfflinePage.tsx');
check('Offline UI does not claim queued writes as successful',/not claimed successful without an authoritative persistence response/.test(offline));

const failed=checks.filter(c=>!c.ok);
for(const c of checks) console.log(`${c.ok?'PASS':'FAIL'}: ${c.name}${c.detail?` (${c.detail})`:''}`);
if(failed.length){console.error(`\nPerformance/resilience validation FAILED: ${failed.length}/${checks.length}`);process.exit(1)}
console.log(`\nPerformance/resilience validation: PASS — ${checks.length}/${checks.length}.`);

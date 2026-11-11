import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const failures=[];
let passed=0;
const assert=(name,ok,detail='')=>{if(ok){passed++;console.log(`PASS: ${name}`)}else{failures.push(`${name}${detail?`: ${detail}`:''}`);console.error(`FAIL: ${name}${detail?`: ${detail}`:''}`)}};
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const walk=(dir,out=[])=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p,out);else if(/\.(ts|tsx)$/.test(entry.name))out.push(p)}return out};
const rel=p=>path.relative(root,p).replaceAll('\\','/');
const source=walk(path.join(root,'src'));

const legacyHydrator='src/migrations/legacyV4ControlPlane.ts';
const legacyProjection='src/migrations/controlPlaneLegacyProjection.ts';
assert('Historical control-plane hydration isolated under migrations',fs.existsSync(path.join(root,legacyHydrator)));
assert('Legacy control-plane projection is isolated under migrations',fs.existsSync(path.join(root,legacyProjection)));
assert('Current runtime projection module is retired',!fs.existsSync(path.join(root,'src/features/control-plane/runtimeProjection.ts')));
assert('Network Member compatibility projection retired',!fs.existsSync(path.join(root,'src/features/network/compatibilityProjection.ts')));

const featureLegacyImports=[];
for(const file of source){
  const r=rel(file); const text=fs.readFileSync(file,'utf8');
  if((r.startsWith('src/features/')||r.startsWith('src/components/')||r.startsWith('src/pages/')||r.startsWith('src/routes/')) && /from\s+['"]@\/migrations\/(?:legacy|v6Baseline)/.test(text)) featureLegacyImports.push(r);
}
assert('Normal feature/UI code does not import migration-only modules',featureLegacyImports.length===0,featureLegacyImports.join(', '));

const oldCompatibilityImporters=source.filter(file=>read(rel(file)).includes("@/features/control-plane/compatibility")).map(rel);
assert('No current runtime imports historical control-plane compatibility module',oldCompatibilityImporters.length===0,oldCompatibilityImporters.join(', '));

const legacyHydratorImporters=source.filter(file=>read(rel(file)).includes("./legacyV4ControlPlane")||read(rel(file)).includes("@/migrations/legacyV4ControlPlane")).map(rel);
assert('Legacy control-plane hydrator is reachable only through migration boundary',legacyHydratorImporters.every(r=>r==='src/migrations/v6Baseline.ts'),legacyHydratorImporters.join(', '));

const runtimeMiddleware=read('src/app/controlPlaneRuntimeMiddleware.ts');
assert('Runtime middleware no longer consumes compatibility projection',!runtimeMiddleware.includes('runtimeProjection')&&!runtimeMiddleware.includes('runtimeAdapters')&&!runtimeMiddleware.includes('controlPlaneLegacyProjection'));
assert('Runtime middleware consumes canonical Control Plane state directly',runtimeMiddleware.includes('state.controlPlane')||runtimeMiddleware.includes('getState().controlPlane'));

const networkSlice=read('src/features/network/networkSlice.ts');
const forbiddenMirrorWrites=[/\bm\.businessId\s*=/,/\bb\.ownerMemberIds(?:\s*=|\.push\s*\()/,/\bb\.primaryRepresentativeId\s*=/,/\bb\.certifications(?:\s*=|\.push\s*\()/];
const mirrorHits=forbiddenMirrorWrites.flatMap(rx=>[...networkSlice.matchAll(new RegExp(rx.source,'g'))].map(m=>m[0]));
assert('Canonical network reducers do not directly write deprecated relationship/certification mirrors',mirrorHits.length===0,mirrorHits.join(', '));
const networkTypes=read('src/features/network/types.ts');
assert('Member type no longer carries legacy business mirror',!networkTypes.includes('designation:string; businessId:Id'));
assert('Business type no longer carries legacy owner/primary mirrors',!networkTypes.includes('ownerMemberIds')&&!networkTypes.includes('primaryRepresentativeId'));
assert('Business type no longer carries legacy certification string mirror',!networkTypes.includes('certifications:string[]'));

const runtimeAdapterImporters=source.filter(file=>read(rel(file)).includes("control-plane/runtimeAdapters")).map(rel);
assert('No current runtime imports historical runtimeAdapters module name',runtimeAdapterImporters.length===0,runtimeAdapterImporters.join(', '));

assert('Historical feature-layer compatibility facade is retired',!fs.existsSync(path.join(root,'src/features/control-plane/compatibility.ts')));
assert('Historical runtimeAdapters facade is retired',!fs.existsSync(path.join(root,'src/features/control-plane/runtimeAdapters.ts')));

console.log(`\nSETHU V6 legacy-runtime retirement validation: ${passed} groups passed.`);
if(failures.length){console.error(`\n${failures.length} retirement failure(s):`);failures.forEach(x=>console.error(`- ${x}`));process.exit(1)}
console.log('PASS: obsolete Member runtime compatibility projections are retired while historical data migration remains isolated under src/migrations.');

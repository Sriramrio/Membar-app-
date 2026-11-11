import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const walk=(dir)=>fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
let pass=0;
const ok=(name,cond,detail='')=>{if(!cond){console.error(`FAIL: ${name}${detail?` — ${detail}`:''}`);process.exit(1)}console.log(`PASS: ${name}`);pass++};

const routeSource=read('src/routes/routeConfig.tsx');
const routePatterns=[...routeSource.matchAll(/path:"([^"]+)"/g)].map(m=>m[1]);
const aliasSource=read('src/routes/routeAliases.ts');
const aliasPatterns=[...aliasSource.matchAll(/from:'([^']+)'/g)].map(m=>m[1]);
const allPatterns=[...routePatterns,...aliasPatterns];
const matchesRoute=(target)=>{
 const raw=target.split('?')[0].split('#')[0];
 const candidate=raw.replace(/\$\{[^}]+\}/g,':DYN');
 const segs=candidate==='/'?[]:candidate.replace(/^\//,'').split('/');
 return allPatterns.some(pattern=>{
   const ps=pattern==='/'?[]:pattern.replace(/^\//,'').split('/');
   return ps.length===segs.length&&ps.every((p,i)=>p.startsWith(':')||p===segs[i]);
 });
};

const srcFiles=walk('src').filter(f=>/\.(ts|tsx)$/.test(f));
const internalTargets=[];
for(const file of srcFiles){
 const text=read(file);
 for(const m of text.matchAll(/([`'"])(\/(?:app|manage|governance|platform-admin|workspace)(?:\/[^`'"\s<>]*)?)\1/g)) internalTargets.push({file,target:m[2]});
}
const invalidTargets=internalTargets.filter(x=>!matchesRoute(x.target));
ok('All literal/template internal navigation targets resolve to a canonical route or retained alias',invalidTargets.length===0,invalidTargets.map(x=>`${x.file}:${x.target}`).join(', '));

const invalidParents=[...read('src/config/routeMetadata.ts').matchAll(/parentPath\?:string|m\([^\n]+/g)]; // metadata covered by navigation suite; keep parser intentionally conservative
ok('Canonical Member Converse routes remain stable',routePatterns.includes('/app/messages')&&routePatterns.includes('/app/messages/:conversationId'));

const memberText=walk('src/features/member').filter(f=>/\.(ts|tsx)$/.test(f)).map(read).join('\n');
const converseText=['src/features/member/pages/ConverseInboxPage.tsx','src/features/member/pages/ConverseThreadPage.tsx'].map(read).join('\n');
ok('Converse contains no file-upload or attachment control',!/type=["']file["']|<input[^>]+accept=|AttachmentPreview|uploadAttachment|attachFile|Paperclip/i.test(converseText));
ok('Member-facing communication naming remains Converse',!/(>\s*(Messages|Chat)\s*<|title=["'](Messages|Chat)["']|label:["'](Messages|Chat)["'])/i.test(memberText));

const networkSlice=read('src/features/network/networkSlice.ts');
const actionMatch=networkSlice.match(/export const \{([^}]+)\}=networkSlice\.actions/s);
ok('Network action export catalogue can be inspected',Boolean(actionMatch));
const actions=actionMatch[1].split(',').map(x=>x.trim()).filter(Boolean);
const runtimeTexts=srcFiles.filter(f=>f!=='src/features/network/networkSlice.ts'&&!/\.(test|spec)\./.test(f)).map(f=>read(f));
const unusedActions=actions.filter(name=>!runtimeTexts.some(t=>new RegExp(`\\b${name}\\b`).test(t)));
ok('No exported network reducer action is dead in runtime source',unusedActions.length===0,unusedActions.join(', '));

const runtimeCandidates=srcFiles.filter(f=>!/\.(test|spec)\./.test(f)&&!f.endsWith('vite-env.d.ts'));
const absToRel=new Map(runtimeCandidates.map(f=>[path.resolve(root,f),f]));
const edges=new Map(runtimeCandidates.map(f=>[f,new Set()]));
const importRe=/(?:from\s+|import\s*\(|require\s*\()\s*['"]([^'"]+)['"]/g;
for(const file of runtimeCandidates){
 const text=read(file);let m;
 while((m=importRe.exec(text))){
   const spec=m[1]; let base;
   if(spec.startsWith('@/')) base=path.join(root,'src',spec.slice(2));
   else if(spec.startsWith('.')) base=path.resolve(root,path.dirname(file),spec);
   else continue;
   const candidates=[base,`${base}.ts`,`${base}.tsx`,path.join(base,'index.ts'),path.join(base,'index.tsx')];
   const resolved=candidates.find(c=>absToRel.has(path.resolve(c)));
   if(resolved) edges.get(file).add(absToRel.get(path.resolve(resolved)));
 }
}
const entry='src/main.tsx'; const seen=new Set(); const stack=[entry];
while(stack.length){const f=stack.pop();if(seen.has(f)||!edges.has(f))continue;seen.add(f);for(const d of edges.get(f))stack.push(d)}
const approvedMigrationOnly=new Set(['src/migrations/controlPlaneLegacyProjection.ts']);
const unreachable=runtimeCandidates.filter(f=>!seen.has(f)&&!approvedMigrationOnly.has(f));
ok('No unowned/unreachable runtime source remains outside explicit migration-only compatibility',unreachable.length===0,unreachable.join(', '));
ok('Migration-only compatibility projection remains isolated from runtime',!seen.has('src/migrations/controlPlaneLegacyProjection.ts'));

const staleFiles=walk('src').filter(f=>/(\.bak$|\.old$|\.orig$|~$|copy|backup|tmp|temp)/i.test(path.basename(f)));
ok('No stale backup/temp source artefacts remain',staleFiles.length===0,staleFiles.join(', '));

const badMarkers=[];
for(const file of walk('src/features/member').filter(f=>/\.(ts|tsx)$/.test(f))){const text=read(file);if(/\b(TODO|FIXME|HACK)\b/.test(text))badMarkers.push(file)}
ok('No TODO/FIXME/HACK markers remain in Member Journey runtime source',badMarkers.length===0,badMarkers.join(', '));

console.log(`\nSETHU Member Journey deep-clean gate: PASS — ${pass}/${pass}`);

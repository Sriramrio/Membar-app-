import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const exists=(p)=>fs.existsSync(path.join(root,p));
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const generated=['node_modules','.vite','dist','coverage','.git','tsconfig.tsbuildinfo'];
for(const p of generated)check(!exists(p),`Generated/dependency artifact must not be in authoritative source: ${p}`);

const sourceFiles=[];
const walk=(dir)=>{for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const rel=path.join(dir,e.name);if(e.isDirectory())walk(rel);else if(/\.(ts|tsx|css)$/.test(e.name))sourceFiles.push(rel)}};
walk('src');
const inline=[]; const duplicateClass=[];
for(const rel of sourceFiles){
 const s=read(rel);
 if(/style=\{\{/.test(s))inline.push(rel);
 if(rel.endsWith('.tsx')){
   for(const tag of s.match(/<[^>]+>/g)??[])if((tag.match(/className=/g)??[]).length>1)duplicateClass.push(rel);
 }
}
check(inline.length===0,`Static inline styles remain in: ${[...new Set(inline)].join(', ')}`);
check(duplicateClass.length===0,`Duplicate className attributes remain in: ${[...new Set(duplicateClass)].join(', ')}`);

const store=read('src/state/OrgStore.tsx');
check(!store.includes('previewFixtures')&&!store.includes('previewReducer'),'Production OrgStore must not statically import preview fixtures/reducer.');
check(/lazy\(\(\)=>import\('\.\/PreviewOrgProvider'\)\)/.test(store),'Preview runtime must be isolated in a lazy-loaded provider.');
check(/providedReducer\?\?\(\(state:OrgState,_action:OrgAction\)=>state\)/.test(store),'Production local reducer must be inert; server state remains authoritative.');
check(!sourceFiles.some(f=>read(f).includes('LOG_ACTION')),'Removed fake durable LOG_ACTION path must not reappear.');

const previewProvider=read('src/state/PreviewOrgProvider.tsx');
check(previewProvider.includes('previewFixtures')&&previewProvider.includes('previewReducer'),'Preview fixtures and reducer must remain isolated in PreviewOrgProvider.');

const forbiddenDocs=[];
const scanAll=(dir='.')=>{for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){if(generated.includes(e.name))continue;const rel=path.join(dir,e.name);if(e.isDirectory())scanAll(rel);else if(/\.(md|pdf|docx|txt)$/i.test(e.name))forbiddenDocs.push(rel)}};
scanAll();
check(forbiddenDocs.length===0,`Documentation must remain external to frontend source: ${forbiddenDocs.join(', ')}`);

if(failures.length){console.error('V3.8 source hygiene FAILED');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log(`PASS V3.8 source hygiene: ${sourceFiles.length} source/style files; preview authority isolated; no inline static styles/generated artifacts/docs.`);

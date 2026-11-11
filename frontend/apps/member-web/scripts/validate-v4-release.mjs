import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const errors=[];
const exists=async p=>{try{await stat(join(root,p));return true}catch{return false}};
const read=async p=>readFile(join(root,p),'utf8');
const pkg=JSON.parse(await read('package.json'));
const lock=JSON.parse(await read('package-lock.json'));

if(pkg.version!=='4.0.0') errors.push(`package.json version must be 4.0.0, found ${pkg.version}`);
if(lock.version!=='4.0.0') errors.push(`package-lock root version must be 4.0.0, found ${lock.version}`);
if(lock.packages?.['']?.version!=='4.0.0') errors.push(`package-lock packages[""] version must be 4.0.0, found ${lock.packages?.['']?.version}`);

const required=[
  'README.md','ARCHITECTURE.md','RUNBOOK.md','SOURCE_ALIGNMENT.md','TRACEABILITY.md',
  'V4_RELEASE_NOTES.md','V4_COMPLETION_MATRIX.md','V4_ARCHITECTURE_CLOSURE_MATRIX.md',
  'V4_DOMAIN_EVENT_MAP.md','V4_SECURITY_BOUNDARY.md','V4_VALIDATION_REPORT.md',
  'V4_CHANGE_MANIFEST.txt','V4_RELEASE_CHECKLIST.md','V4_VALIDATION_EVIDENCE.txt','V4_SOURCE_MANIFEST_SHA256.txt','VERSION','RELEASE_LOCK.json'
];
for(const f of required) if(!(await exists(f))) errors.push(`Missing V4 release artefact: ${f}`);

for(const f of ['README.md','ARCHITECTURE.md','RUNBOOK.md','SOURCE_ALIGNMENT.md','V4_RELEASE_NOTES.md','V4_COMPLETION_MATRIX.md','V4_VALIDATION_REPORT.md']){
  if(!(await exists(f))) continue;
  const text=await read(f);
  if(/sethu2026/.test(text)) errors.push(`Static legacy preview password remains in ${f}`);
  if(/current V3|For the current V3|V3 note/.test(text)) errors.push(`Stale V3-current wording remains in ${f}`);
}
const readme=await read('README.md');
for(const token of ['Package version:** `4.0.0`','SETHU_Enterprise_Platform_V4_FINAL','npm run validate:v4:source']) if(!readme.includes(token)) errors.push(`README missing release marker: ${token}`);
const runbook=await read('RUNBOOK.md');
if(!runbook.includes('there is no universal static QA password')) errors.push('Runbook does not document V4 preview credential boundary');
const arch=await read('ARCHITECTURE.md');
if(!arch.includes('Protected runtime data is session-scoped')) errors.push('Architecture does not document session-scoped protected state');

console.log('SETHU V4 release-lock validation');
console.log(`Package version: ${pkg.version}`);
console.log(`Required release artefacts: ${required.length}`);
if(errors.length){for(const e of errors) console.error(`ERROR: ${e}`);process.exit(1)}
console.log('PASS: V4 version lock, package-lock alignment, release artefacts and stale-security documentation checks are clean.');

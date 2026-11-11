import { readFile, stat, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const errors=[];
const exists=async p=>{try{await stat(join(root,p));return true}catch{return false}};
const read=async p=>readFile(join(root,p),'utf8');
const required=[
  'V6_MEMBER_ENTERPRISE_AS_IS_AUDIT.md',
  'V6_MEMBER_ENTERPRISE_REQUIREMENTS_TRACEABILITY.md',
  'V6_MEMBER_ENTERPRISE_SCREEN_INVENTORY.md',
  'V6_MEMBER_ENTERPRISE_JOURNEY_CATALOGUE.md',
  'V6_MEMBER_ENTERPRISE_INTERACTION_INVENTORY.md',
  'V6_MEMBER_ENTERPRISE_EDGE_CASE_MATRIX.md',
  'V6_MEMBER_ENTERPRISE_RESPONSIVE_AUDIT.md',
  'V6_MEMBER_ENTERPRISE_ACCESSIBILITY_AUDIT.md',
  'V6_MEMBER_ENTERPRISE_VALIDATION_REPORT.md',
  'V6_MEMBER_ENTERPRISE_VALIDATION_EVIDENCE.txt',
  'V6_MEMBER_ENTERPRISE_M14_VALIDATION_EVIDENCE.txt',
  'V6_MEMBER_ENTERPRISE_COMPLETION_MATRIX.md',
  'V6_MEMBER_ENTERPRISE_CHANGE_MANIFEST.txt',
  'V6_MEMBER_ENTERPRISE_CHECKPOINT_STATUS.md',
  'V6_MEMBER_ENTERPRISE_RELEASE_CHECKLIST.md',
  'V6_MEMBER_ENTERPRISE_RELEASE_LOCK.json',
  'V6_MEMBER_ENTERPRISE_SOURCE_MANIFEST_SHA256.txt',
];
for(const f of required) if(!(await exists(f))) errors.push(`Missing Member Enterprise release artifact: ${f}`);
const pkg=JSON.parse(await read('package.json'));
if(pkg.version!=='6.1.0') errors.push(`package version must remain 6.1.0, found ${pkg.version}`);
if(pkg.scripts?.['validate:v6:member-enterprise']!=='node scripts/validate-v6-member-enterprise.mjs') errors.push('Member Enterprise validator is not registered');
if(!String(pkg.scripts?.['validate:v6:member-journeys']??'').includes('validate-v6-member-journeys.mjs')) errors.push('Member journey validator is not registered');
if(!String(pkg.scripts?.['validate:v6:member-release']??'').includes('validate-v6-member-release.mjs')) errors.push('Member release validator is not registered');
const lock=JSON.parse(await read('V6_MEMBER_ENTERPRISE_RELEASE_LOCK.json'));
if(lock.version!=='6.1.0') errors.push('Member release-lock version is not 6.1.0');
if(lock.release!=='SETHU Enterprise Platform V6 Member Enterprise') errors.push('Member release identity mismatch');
if(lock.release_status!=='FINAL_SOURCE_VERIFIED_RUNTIME_BLOCKED_ENVIRONMENT') errors.push('Member release status does not state the runtime environment block precisely');
if(lock.dependency_certification!=='BLOCKED_ENVIRONMENT') errors.push('Dependency certification must remain BLOCKED_ENVIRONMENT unless dependency gates actually run');
if(lock.browser_certification!=='NOT_CLAIMED_ENVIRONMENT_BLOCKED') errors.push('Browser certification must remain explicitly not claimed');
for(const d of ['node_modules','dist','.git','coverage','.vite']) if(await exists(d)) errors.push(`Forbidden packaged directory exists: ${d}`);
const roots=await readdir(root); if(roots.some(f=>f.endsWith('.zip'))) errors.push('Nested ZIP artifact found inside source package');
const manifest=await read('V6_MEMBER_ENTERPRISE_SOURCE_MANIFEST_SHA256.txt');
let count=0;
for(const line of manifest.trim().split(/\r?\n/)){
  if(!line.trim()) continue;
  count++;
  const m=line.match(/^([a-f0-9]{64})  (.+)$/);
  if(!m){errors.push(`Invalid Member manifest line: ${line}`);continue;}
  const file=m[2];
  if(!(await exists(file))){errors.push(`Member manifest file missing: ${file}`);continue;}
  const hash=createHash('sha256').update(await readFile(join(root,file))).digest('hex');
  if(hash!==m[1]) errors.push(`Member manifest mismatch: ${file}`);
}
if(Number(lock.manifest_file_count)!==count) errors.push(`Member release-lock manifest count ${lock.manifest_file_count} differs from manifest ${count}`);
const report=await read('V6_MEMBER_ENTERPRISE_VALIDATION_REPORT.md');
for(const marker of ['EAI_AGAIN','ENOTCACHED','NOT CLAIMED','45/45']) if(!report.includes(marker)) errors.push(`Validation report missing honesty marker: ${marker}`);
const completion=await read('V6_MEMBER_ENTERPRISE_COMPLETION_MATRIX.md');
if(!completion.includes('BLOCKED by dependency restoration')) errors.push('Completion matrix does not expose runtime dependency block');
console.log('SETHU V6 Member Enterprise release validation');
console.log(`Package version: ${pkg.version}`);
console.log(`Required Member release artifacts: ${required.length}`);
console.log(`Member source manifest entries: ${count}`);
if(errors.length){errors.forEach(e=>console.error(`ERROR: ${e}`));process.exit(1);}
console.log('PASS: Member Enterprise source release identity, evidence set, clean-package rules, runtime non-claims and source-manifest hashes are internally consistent.');

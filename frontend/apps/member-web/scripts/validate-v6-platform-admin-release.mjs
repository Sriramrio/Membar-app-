import { readFile,stat,readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));const errors=[];
const exists=async p=>{try{await stat(join(root,p));return true}catch{return false}};const read=async p=>readFile(join(root,p),'utf8');
const required=[
 'V6_PLATFORM_ADMIN_HARDENING_CHECKPOINT_STATUS.md','V6_PLATFORM_ADMIN_INTERACTION_INVENTORY.md','V6_PLATFORM_ADMIN_DEFECT_REGISTER.md','V6_PLATFORM_ADMIN_UI_RESPONSIVE_AUDIT.md','V6_FORM_BUILDER_CLOSURE_REPORT.md','V6_PLATFORM_ADMIN_FUNCTIONAL_CLOSURE_MATRIX.md','V6_PLATFORM_ADMIN_VALIDATION_REPORT.md','V6_PLATFORM_ADMIN_VALIDATION_EVIDENCE.txt','V6_PLATFORM_ADMIN_RELEASE_CHECKLIST.md','V6_PLATFORM_ADMIN_CHANGE_MANIFEST.txt','V6_PLATFORM_ADMIN_RELEASE_NOTES.md','V6_PLATFORM_ADMIN_SOURCE_MANIFEST_SHA256.txt','RELEASE_LOCK.json','VERSION'
];
for(const f of required)if(!(await exists(f)))errors.push(`Missing hardened release artefact: ${f}`);
const pkg=JSON.parse(await read('package.json'));if(pkg.version!=='6.1.0')errors.push(`package version must remain 6.1.0, found ${pkg.version}`);
if((await read('VERSION')).trim()!=='6.1.0')errors.push('VERSION must remain 6.1.0');
const rl=JSON.parse(await read('RELEASE_LOCK.json'));if(rl.release!=='SETHU Enterprise Platform V6 Platform Admin Hardened')errors.push('RELEASE_LOCK release identity is not Platform Admin Hardened');if(rl.version!=='6.1.0')errors.push('RELEASE_LOCK version is not 6.1.0');if(!['CANDIDATE','FINAL'].some(x=>String(rl.release_status??'').includes(x)))errors.push('RELEASE_LOCK status must contain CANDIDATE or FINAL');
const manifestName='V6_PLATFORM_ADMIN_SOURCE_MANIFEST_SHA256.txt';
if(await exists(manifestName)){const manifest=await read(manifestName);let count=0;for(const line of manifest.trim().split(/\r?\n/)){if(!line.trim())continue;count++;const m=line.match(/^([a-f0-9]{64})  (.+)$/);if(!m){errors.push(`Invalid manifest line: ${line}`);continue}const file=m[2];if(!(await exists(file))){errors.push(`Manifest file missing: ${file}`);continue}const hash=createHash('sha256').update(await readFile(join(root,file))).digest('hex');if(hash!==m[1])errors.push(`Manifest mismatch: ${file}`)}if(Number(rl.manifest_file_count)!==count)errors.push(`Release-lock manifest count ${rl.manifest_file_count} differs from manifest ${count}`)}
for(const d of ['node_modules','dist','.git','coverage','.vite'])if(await exists(d))errors.push(`Forbidden packaged directory exists: ${d}`);
const roots=await readdir(root);if(roots.some(f=>f.endsWith('.zip')))errors.push('Nested ZIP artifact found inside source package');
console.log('SETHU V6 Platform Admin hardened release validation');console.log(`Package version: ${pkg.version}`);console.log(`Required hardened artefacts: ${required.length}`);if(errors.length){errors.forEach(e=>console.error(`ERROR: ${e}`));process.exit(1)}console.log('PASS: hardened release identity, evidence set, forbidden-artifact scan and source-manifest hashes are clean.');

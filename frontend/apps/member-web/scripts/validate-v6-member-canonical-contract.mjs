import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const matrix=read('V6_MEMBER_CONTRACT_MIGRATION_MATRIX.md');
const expected={V3:14,V4:35,V5:45,V6:29};let failures=0;
for(const [prefix,count] of Object.entries(expected)){
 const hits=[...matrix.matchAll(new RegExp(`\\| ${prefix}-\\d+ \\|`,'g'))].length;
 if(hits!==count){console.error(`FAIL: historical mapping catalogue ${prefix} ${hits}/${count}`);failures++;}
 else console.log(`PASS: historical mapping catalogue ${prefix} ${hits}/${count}`);
}
const canonicalTargets=[...matrix.matchAll(/\| (V6-CANON-[^ |]+) \|/g)].map(m=>m[1]);
if(canonicalTargets.length<1){console.error('FAIL: no Member-specific canonical contract mappings found');failures++;}
else console.log(`PASS: ${canonicalTargets.length} Member-specific historical behaviours map to canonical V6 contract IDs.`);
if(/historical contract dependency retires C08/i.test(matrix)) {console.error('FAIL: migration matrix still contains C08-pending retirement wording');failures++;}
else console.log('PASS: migration matrix no longer contains pending C08 retirement status.');
if(failures)process.exit(1);
const suites=[
 ['C02 canonical domain/state','scripts/validate-v6-member-canonical-domain.mjs',[]],
 ['C03 canonical routes/pages','scripts/validate-v6-member-canonical-routes.mjs',[]],
 ['C04 canonical features','scripts/validate-v6-member-canonical-features.mjs',[]],
 ['C05 canonical workflows','scripts/validate-v6-member-canonical-workflows.mjs',['--experimental-strip-types','--no-warnings']],
 ['C07 canonical retirement','scripts/validate-v6-member-canonical-retirement.mjs',[]],
 ['Current V6 Member Enterprise','scripts/validate-v6-member-enterprise.mjs',[]],
 ['Current V6 Member Journeys','scripts/validate-v6-member-journeys.mjs',['--experimental-strip-types','--no-warnings']],
];
for(const [label,rel,flags] of suites){const r=spawnSync(process.execPath,[...flags,path.join(root,rel)],{cwd:root,encoding:'utf8'});if(r.stdout)process.stdout.write(r.stdout);if(r.stderr)process.stderr.write(r.stderr);if(r.status!==0){console.error(`FAIL: ${label}`);process.exit(r.status||1)}console.log(`PASS: V6-only canonical contract — ${label}`)}
console.log('PASS: C08 V6-only Member contract suite — historical Member behaviour is traceable through the migration matrix and validated by current canonical V6 ownership/workflow/journey suites without executing V3/V4/V5/V6 historical Member validators.');

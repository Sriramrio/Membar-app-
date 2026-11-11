import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const matrixPath=path.join(root,'V6_MEMBER_CONTRACT_MIGRATION_MATRIX.md');
const matrix=fs.readFileSync(matrixPath,'utf8');
const expected={V3:14,V4:35,V5:45,V6:29};
let failures=0;
for(const [prefix,count] of Object.entries(expected)){
  const hits=[...matrix.matchAll(new RegExp(`\\| ${prefix}-\\d+ \\|`,'g'))].length;
  if(hits!==count){console.error(`FAIL: ${prefix} contract matrix coverage ${hits}/${count}`);failures++;}
  else console.log(`PASS: ${prefix} historical contract matrix coverage ${hits}/${count}`);
}
if(failures) process.exit(1);

const suites=[
  ['V3 historical contract','scripts/validate-v3-contract.mjs',[]],
  ['V4 historical contract','scripts/validate-v4-contract.mjs',[]],
  ['V5 historical contract','scripts/validate-v5-contract.mjs',[]],
  ['V6 Member Experience contract','scripts/validate-v6-contract.mjs',[]],
  ['C02 canonical domain/state','scripts/validate-v6-member-canonical-domain.mjs',[]],
  ['C03 canonical routes/pages','scripts/validate-v6-member-canonical-routes.mjs',[]],
  ['C04 canonical features','scripts/validate-v6-member-canonical-features.mjs',[]],
  ['C05 canonical workflows','scripts/validate-v6-member-canonical-workflows.mjs',['--experimental-strip-types','--no-warnings']],
  ['Current V6 Member Enterprise','scripts/validate-v6-member-enterprise.mjs',[]],
  ['Current V6 Member Journeys','scripts/validate-v6-member-journeys.mjs',['--experimental-strip-types','--no-warnings']],
];
for(const [label,rel,flags] of suites){
  const full=path.join(root,rel);
  const args=[...flags,full];
  const r=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'});
  if(r.stdout) process.stdout.write(r.stdout);
  if(r.stderr) process.stderr.write(r.stderr);
  if(r.status!==0){console.error(`FAIL: ${label}`);process.exit(r.status||1)}
  console.log(`PASS: canonical bridge suite — ${label}`);
}
console.log('PASS: C06 canonical V6 Member bridge contract suite — 123 historical groups are enumerated and remain regression-green while canonical C02-C05 + current V6 Member suites pass.');
console.log('NOTE: C06 intentionally retains historical validators as parallel evidence. Independence/retirement occurs only after C07 production retirement and C08 contract retirement.');

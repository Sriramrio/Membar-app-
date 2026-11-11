import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'

const root=process.cwd(); let failures=0; let passes=0
const ok=(name,cond,detail='')=>{if(cond){passes++;console.log(`PASS: ${name}`)}else{failures++;console.error(`FAIL: ${name}${detail?` — ${detail}`:''}`)}}
const exists=p=>fs.existsSync(path.join(root,p))
const read=p=>fs.readFileSync(path.join(root,p),'utf8')

const required=[
 'V6_RUNTIME_REMEDIATION_CHECKPOINT_STATUS.md','V6_RUNTIME_REMEDIATION_R10_FINAL_REPORT.md','V6_RUNTIME_REMEDIATION_COMPLETION_MATRIX.md',
 'V6_RUNTIME_REMEDIATION_RELEASE_CHECKLIST.md','V6_RUNTIME_REMEDIATION_FINAL_RELEASE_LOCK.json','V6_RUNTIME_REMEDIATION_SOURCE_MANIFEST_SHA256.txt',
 'V6_CURRENT_RELEASE_INDEX.md','V6_PRODUCTION_API_CONTRACT.md','V6_PRODUCTION_SECURITY_DEPLOYMENT_REQUIREMENTS.md','V6_TEST_COVERAGE_MATRIX.md'
]
for(const f of required)ok(`Required remediation release artifact: ${f}`,exists(f))

const suites=[
 'validate:v6:functional-closure',
 'validate:v6:management:functional','validate:v6:governance-public:functional',
 'validate:v6:production-boundary','validate:v6:security-trust-boundary','validate:v6:pure-contracts',
 'validate:v6:static-quality','validate:v6:performance-resilience','validate:v6:documentation-hygiene',
 'validate:v6:runtime-remediation:source-clean'
]
for(const name of suites){
 const r=spawnSync('npm',['run','-s',name],{cwd:root,encoding:'utf8',env:{...process.env,TERM:'dumb'}})
 if(r.status===0){passes++;console.log(`PASS: suite ${name}`)}else{failures++;console.error(`FAIL: suite ${name}`);console.error((r.stdout??'')+(r.stderr??''))}
}

for(const d of ['node_modules','dist','.git','coverage','.vite'])ok(`Forbidden generated directory absent: ${d}`,!exists(d))
const buildInfo=[]
function walkBuild(d='.'){
 for(const e of fs.readdirSync(path.join(root,d),{withFileTypes:true})){
  if(['node_modules','dist','.git','coverage','.vite'].includes(e.name))continue
  const rel=(d==='.'?e.name:path.join(d,e.name)).replaceAll('\\','/')
  if(e.isDirectory())walkBuild(rel); else if(e.name.endsWith('.tsbuildinfo'))buildInfo.push(rel)
 }
}
walkBuild();ok('No tsbuildinfo packaged',buildInfo.length===0,buildInfo.join(', '))

const manifestName='V6_RUNTIME_REMEDIATION_SOURCE_MANIFEST_SHA256.txt'
const excludedFromRuntimeManifest=new Set([manifestName,'V6_PLATFORM_CANONICAL_SOURCE_MANIFEST_SHA256.txt'])
const lines=read(manifestName).trim().split(/\r?\n/).filter(Boolean);const manifest=new Map()
for(const line of lines){
 const m=line.match(/^([a-f0-9]{64})  (.+)$/)
 if(!m){failures++;console.error(`FAIL: invalid remediation manifest line ${line}`);continue}
 if(manifest.has(m[2])){failures++;console.error(`FAIL: duplicate remediation manifest path ${m[2]}`);continue}
 manifest.set(m[2],m[1]);const f=path.join(root,m[2])
 if(!fs.existsSync(f)){failures++;console.error(`FAIL: remediation manifest file missing ${m[2]}`);continue}
 const h=crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');if(h!==m[1]){failures++;console.error(`FAIL: remediation manifest mismatch ${m[2]}`)}
}
const actual=[]
function walkAll(d='.'){
 for(const e of fs.readdirSync(path.join(root,d),{withFileTypes:true})){
  if(['node_modules','dist','.git','coverage','.vite'].includes(e.name))continue
  const rel=(d==='.'?e.name:path.join(d,e.name)).replaceAll('\\','/')
  if(e.isDirectory())walkAll(rel); else if(!excludedFromRuntimeManifest.has(rel)&&!e.name.endsWith('.tsbuildinfo'))actual.push(rel)
 }
}
walkAll();actual.sort()
const missing=actual.filter(f=>!manifest.has(f));const stale=[...manifest.keys()].filter(f=>!actual.includes(f))
ok('Every runtime-remediation package file in final scope is tracked',missing.length===0,missing.join(', '))
ok('Runtime-remediation manifest has no stale paths',stale.length===0,stale.join(', '))
const lock=JSON.parse(read('V6_RUNTIME_REMEDIATION_FINAL_RELEASE_LOCK.json'))
ok('Remediation release identity',lock.release==='SETHU V6.1 Runtime Remediated Final')
ok('Remediation version remains 6.1.0',lock.version==='6.1.0')
ok('Manifest count matches final release lock',Number(lock.manifest_file_count)===manifest.size,`${lock.manifest_file_count}/${manifest.size}`)
ok('Runtime block is preserved honestly',lock.runtime_certification==='BLOCKED_ENVIRONMENT'&&lock.browser_certification==='NOT_CLAIMED_ENVIRONMENT_BLOCKED')
ok('Legacy Member runtime dependency remains zero',Number(lock.active_v3_v4_v5_member_runtime_dependencies)===0)
ok('Retired enterprise runtime dependency remains zero',Number(lock.retired_enterprise_production_dependencies)===0)
ok('External production services are not falsely claimed',lock.external_production_services==='REQUIRED_NOT_INCLUDED')

if(failures){console.error(`\nSETHU V6.1 runtime-remediated release: FAIL — ${passes} passed, ${failures} failed.`);process.exit(1)}
console.log(`\nSETHU V6.1 runtime-remediated release: PASS — ${passes} release checks/suites, ${manifest.size} runtime-manifest entries. Runtime/external production non-claims preserved.`)

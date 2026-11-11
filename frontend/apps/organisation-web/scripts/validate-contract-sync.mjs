import fs from 'node:fs';
import path from 'node:path';
const catalog=fs.readFileSync('src/contracts/catalog.ts','utf8');
const extract=(label)=>{
  const start=catalog.indexOf(`export const ${label}=[`);
  if(start<0)throw new Error(`missing ${label}`);
  const end=catalog.indexOf('] as const',start);
  if(end<0)throw new Error(`unterminated ${label}`);
  return [...catalog.slice(start,end).matchAll(/'([^']+)'/g)].map(x=>x[1]);
};
const queries=new Set(extract('queryIds'));
const commands=new Set(extract('commandIds'));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=walk('src').filter(f=>/\.(ts|tsx)$/.test(f)&&!f.endsWith('catalog.ts')&&!f.endsWith('.d.ts'));
const usedQ=new Set(),usedC=new Set();
for(const f of files){
  const t=fs.readFileSync(f,'utf8');
  for(const m of t.matchAll(/queryId:\s*['\"]([^'\"]+)['\"]/g))usedQ.add(m[1]);
  for(const m of t.matchAll(/commandType:\s*['\"]([^'\"]+)['\"]/g))usedC.add(m[1]);
}
for(const id of usedQ)if(!queries.has(id)){console.error('unknown query id used in source',id);process.exit(1)}
for(const id of usedC)if(!commands.has(id)){console.error('unknown command id used in source',id);process.exit(1)}
for(const id of ['org.today','org.action-centre','org.record.get','org.members.list','org.tasks.list','org.converse.inbox','org.converse.messages','org.volunteer-digest.summary'])if(!queries.has(id)){console.error('required query missing',id);process.exit(1)}
for(const id of ['org.task.create','org.task.update','org.task.complete','org.approval.decide','org.converse.message.send','org.mom.publish','org.dues.reconcile','org.support-request.create','org.handoff.create'])if(!commands.has(id)){console.error('required command missing',id);process.exit(1)}
console.log(`PASS contract catalogue sync (${queries.size} queries / ${commands.size} commands; source usages known)`);

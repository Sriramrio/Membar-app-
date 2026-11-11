import fs from 'node:fs';
const search=fs.readFileSync(new URL('../src/pages/SearchPage.tsx',import.meta.url),'utf8');
const hierarchy=fs.readFileSync(new URL('../src/pages/HierarchyPage.tsx',import.meta.url),'utf8');
const people=fs.readFileSync(new URL('../src/pages/PeoplePage.tsx',import.meta.url),'utf8');
const store=fs.readFileSync(new URL('../src/state/OrgStore.tsx',import.meta.url),'utf8');
const checks=[
 ['Region search resolves exact record',search.includes('`/org/regions/${x.id}`')],
 ['City search resolves exact record',search.includes('`/org/cities/${x.id}`')],
 ['State search resolves exact record',search.includes('`/org/states/${x.id}`')],
 ['Hierarchy attention resolves exact Region record',hierarchy.includes('`/org/regions/${u.id}`')],
 ['Hierarchy attention resolves exact City record',hierarchy.includes('`/org/cities/${u.id}`')],
 ['Hierarchy attention resolves exact State record',hierarchy.includes('`/org/states/${u.id}`')],
 ['saved search is explicitly session-only',people.includes('Keep search for this session')&&!people.includes('Save current search')],
 ['no fake durable LOG_ACTION reducer remains',!store.includes("type:'LOG_ACTION'")&&!store.includes("a.type==='LOG_ACTION'")]
];
for(const [n,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${n}`);if(!ok)process.exitCode=1}

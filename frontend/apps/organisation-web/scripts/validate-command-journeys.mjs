import {readFile,readdir,stat} from 'node:fs/promises';
import {join} from 'node:path';
const catalog=await readFile(new URL('../src/contracts/catalog.ts',import.meta.url),'utf8');
const block=catalog.match(/commandIds=\[(.*?)\] as const/s)?.[1]||'';
const commands=[...block.matchAll(/'([^']+)'/g)].map(m=>m[1]);
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../src/',import.meta.url));
const files=[];async function walk(dir){for(const name of await readdir(dir)){const p=join(dir,name);const st=await stat(p);if(st.isDirectory())await walk(p);else if(/\.tsx?$/.test(name))files.push(p)}}await walk(root);
const source=(await Promise.all(files.map(f=>readFile(f,'utf8')))).join('\n');
const missing=commands.filter(c=>!source.includes(c));
if(missing.length){console.error(`Commands without frontend journey/action reference:\n${missing.join('\n')}`);process.exit(1)}
console.log(`PASS command journey coverage ${commands.length}/${commands.length} command contracts referenced by frontend source`);

import ts from 'typescript';
import { readdir,readFile } from 'node:fs/promises';
import { join,relative } from 'node:path';
const root=new URL('..',import.meta.url).pathname;const files=[];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())await walk(p);else if(/\.(ts|tsx)$/.test(e.name))files.push(p)}}
await walk(join(root,'src'));let errors=0;
for(const f of files){const text=await readFile(f,'utf8');const sf=ts.createSourceFile(f,text,ts.ScriptTarget.Latest,true,f.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);for(const d of sf.parseDiagnostics){errors++;const pos=sf.getLineAndCharacterOfPosition(d.start??0);console.error(`${relative(root,f)}:${pos.line+1}:${pos.character+1} ${ts.flattenDiagnosticMessageText(d.messageText,' ')}`)}}
console.log(`Parsed ${files.length} TypeScript/TSX source files`);if(errors){console.error(`Syntax diagnostics: ${errors}`);process.exit(1)}console.log('PASS: zero TypeScript/TSX syntax diagnostics.');

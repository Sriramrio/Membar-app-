import fs from 'node:fs';import path from 'node:path';
const root='src/features/member/pages';let pass=0;const ok=(n,c,d='')=>{if(!c){console.error(`FAIL: ${n}${d?` — ${d}`:''}`);process.exit(1)}console.log(`PASS: ${n}`);pass++};
const files=fs.readdirSync(root).filter(x=>x.endsWith('.tsx'));const descriptions=[];
for(const f of files){const t=fs.readFileSync(path.join(root,f),'utf8');for(const m of t.matchAll(/description="([^"]+)"/g))descriptions.push({f,text:m[1]});}
const long=descriptions.filter(x=>x.text.length>140);ok('Member PageHead copy is concise (<=140 characters)',long.length===0,long.map(x=>`${x.f}:${x.text.length}`).join(', '));
const required=['MemberHomePage.tsx','MemberDashboardPage.tsx','OneToOneMeetingsPage.tsx','BusinessReferencesPage.tsx','OpportunityMarketplacePage.tsx','TransactionsPage.tsx'];for(const f of required)ok(`${f} retains actionable navigation`,/go\(|onClick=|actions=/.test(fs.readFileSync(path.join(root,f),'utf8')));
const all=files.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');ok('No stale Message/Chat user-facing titles returned',!all.includes('title="Messages"')&&!all.includes('title="Chat"')&&!all.includes('>Messages<')&&!all.includes('>Chat<'));
ok('Converse V1 remains text-only',!/(type="file"|attachFile|uploadAttachment|AttachmentPreview)/i.test(all));
console.log(`\nSETHU Member content/action integrity gate: PASS — ${pass}/${pass}`);

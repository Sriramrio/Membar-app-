import fs from 'node:fs';import path from 'node:path';
const root=new URL('../',import.meta.url);const read=p=>fs.readFileSync(new URL(p,root),'utf8');const bad=[];const check=(name,ok)=>{if(!ok)bad.push(name);else console.log('PASS',name)};
const chapter=read('src/pages/ChapterDetailPage.tsx'),members=read('src/pages/MembersPage.tsx'),committees=read('src/pages/CommitteesPage.tsx'),meetings=read('src/pages/MeetingsPage.tsx'),continuity=read('src/pages/ContinuityPage.tsx'),people=read('src/pages/PeoplePage.tsx'),chapters=read('src/pages/ChaptersPage.tsx'),search=read('src/pages/SearchPage.tsx'),memberDetail=read('src/pages/MemberDetailPage.tsx'),contracts=read('src/contracts/runtimeContracts.ts');
check('chapter scoped member link is consumed',chapter.includes('/org/members?scopeId=')&&members.includes("params.get('scopeId')"));
check('chapter scoped committee link is consumed',chapter.includes('/org/committees?scopeId=')&&committees.includes("params.get('scopeId')"));
check('chapter scoped meeting link is consumed',chapter.includes('/org/meetings?scopeId=')&&meetings.includes("params.get('scopeId')"));
check('continuity delegate list uses server query',continuity.includes("queryId:'org.people.list'")&&continuity.includes('delegateOptions'));
check('member lifecycle mutation is versioned',memberDetail.includes('expectedVersion:m.version'));
check('scope-sensitive local memo dependencies',people.includes('s.scope,s.permissions')&&chapters.includes('s.scope,s.permissions')&&search.includes('s.scope,s.permissions'));
check('contract version is current',contracts.includes("ORGANISATIONAL_CONTRACT_VERSION='3.5.0'"));
import {fileURLToPath} from 'node:url';
const src=fileURLToPath(new URL('../src',import.meta.url));for(const f of fs.readdirSync(path.join(src,'pages')).filter(x=>x.endsWith('.tsx'))){const t=fs.readFileSync(path.join(src,'pages',f),'utf8');if(/(?:to|href)=["']#["']/.test(t)||/javascript:/.test(t))bad.push(`${f}: dummy link`)}
if(bad.length){for(const x of bad)console.error('FAIL',x);process.exit(1)}console.log('Final closure static checks PASS');

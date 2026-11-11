import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const srcRoot=path.join(root,'src');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const sourceFiles=walk(srcRoot).filter(p=>/\.(ts|tsx|js|jsx)$/.test(p));
const productionText=sourceFiles.filter(p=>!/[\\/](?:__tests__|test|tests)[\\/]/.test(p)&&!(/\.(test|spec)\./.test(p))).map(p=>[p,fs.readFileSync(p,'utf8')]);
const results=[];
function check(label,ok,detail=''){results.push({label,ok,detail});}
function any(re){return productionText.some(([,s])=>re.test(s));}

check('No merge-conflict markers remain',!any(/^(?:<<<<<<<|=======|>>>>>>>)/m));
check('No TODO/FIXME/HACK/XXX truncation markers remain',!any(/\b(?:TODO|FIXME|HACK|XXX)\b/));
check('No empty catch blocks remain',!any(/catch\s*(?:\([^)]*\))?\s*\{\s*\}/));
check('No Math.random production identifiers remain',!any(/Math\.random\s*\(/));

const memberPages=productionText.filter(([p])=>p.includes(`${path.sep}features${path.sep}member${path.sep}pages${path.sep}`));
const broadMember=memberPages.filter(([,s])=>/useAppSelector\s*\(\s*\(?\s*\w+\s*\)?\s*=>\s*\w+\.network\s*\)/.test(s));
check('Member pages contain no whole-network subscriptions',broadMember.length===0,broadMember.map(([p])=>path.relative(root,p)).join(', '));
const broadAll=productionText.filter(([,s])=>/useAppSelector\s*\(\s*\(?\s*\w+\s*\)?\s*=>\s*\w+\.network\s*\)/.test(s));
check('Production source contains no exact whole-network subscriptions',broadAll.length===0,broadAll.map(([p])=>path.relative(root,p)).join(', '));

const businessRoots=['features/member','features/management','features/governance','features/platform-admin','features/public','features/auth'];
const forbiddenDateNow=productionText.filter(([p,s])=>businessRoots.some(part=>p.includes(`${path.sep}${part.replace('/',path.sep)}${path.sep}`))&&/Date\.now\s*\(/.test(s));
check('Business-facing feature code contains no raw Date.now business decisions',forbiddenDateNow.length===0,forbiddenDateNow.map(([p])=>path.relative(root,p)).join(', '));

const governed=read('src/hooks/useGovernedCommand.ts');
check('Governed commands suppress duplicate in-flight submits',governed.includes('duplicateSuppressed')&&governed.includes('inFlight.current'));
check('Governed command retry reuses the original command id',governed.includes('previous.commandId')&&governed.includes('last.current'));
check('Governed commands normalize thrown exceptions and clear busy state',governed.includes('catch (cause)')&&governed.includes('toApiError(cause)')&&/setState\(\{\s*busy:\s*false,\s*error/.test(governed)&&governed.includes('finally'));

const connection=read('src/hooks/useConnectionCommands.ts');
check('Connection command seam preserves preview actions and concurrency version', ['requestConnection','respondConnection','cancelConnectionRequest','removeConnection','blockMember','createConversation','expectedVersion'].every(x=>connection.includes(x)));

const feedback=read('src/components/commands/CommandExecutionFeedback.tsx');
check('Structured conflict recovery UI is wired',feedback.includes("error.type === 'CONFLICT'")&&feedback.includes('ConflictResolutionPanel')&&feedback.includes('currentVersion'));

const stable=read('src/utils/stableId.ts');
check('Stable client-id fallback does not use Math.random',!stable.includes('Math.random')&&stable.includes('crypto.randomUUID'));

const clock=read('src/services/time/serverClock.ts');
check('Server clock exposes synchronized business-time helpers', ['nowMs()','isoNow()','todayIso()','addMs('].every(x=>clock.includes(x)));

const mutationScreens=[
 'src/features/member/pages/CreateReferencePage.tsx','src/features/member/pages/CreateOpportunityPage.tsx','src/features/member/pages/OpportunityResponsePage.tsx',
 'src/features/member/pages/MyProfilePage.tsx','src/features/member/pages/OneToOneMeetingsPage.tsx','src/features/member/pages/ConnectionsPage.tsx',
 'src/features/member/pages/MemberEventDetailPage.tsx','src/features/member/pages/ConverseThreadPage.tsx','src/features/member/pages/ConverseInboxPage.tsx',
 'src/features/member/pages/MyBusinessesPage.tsx','src/features/member/pages/BusinessReferencesPage.tsx','src/features/member/pages/TransactionsPage.tsx',
 'src/features/member/pages/OpportunityDetailPage.tsx','src/features/member/pages/ThankYouNotesPage.tsx','src/features/member/pages/MyAttendancePage.tsx'
];
const ungoverned=mutationScreens.filter(p=>{const s=read(p);return !s.includes('useGovernedCommand')&&!s.includes('useConnectionCommands');});
check('High-value mutable Member screens use governed command seams',ungoverned.length===0,ungoverned.join(', '));

const marketplace=read('src/features/member/pages/OpportunityMarketplacePage.tsx');
check('Opportunity marketplace retains cursor-query adoption after stale JSX repair',marketplace.includes('useDomainCursorPage')&&marketplace.includes('member.opportunities.marketplace'));

const photo=read('src/features/member/pages/PhotoGalleryPage.tsx');
check('Gallery uses collection-scoped network subscription',photo.includes("useNetworkSlice(['galleryItems','events'] as const)"));

let failed=0;
for(const r of results){console.log(`${r.ok?'PASS':'FAIL'}: ${r.label}${r.detail?` — ${r.detail}`:''}`);if(!r.ok)failed++;}
console.log(`\nSETHU V7 production-readiness source hardening: ${results.length-failed}/${results.length} PASS`);
if(failed)process.exit(1);

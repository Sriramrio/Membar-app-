import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

const root=fileURLToPath(new URL('..',import.meta.url));
const read=async p=>readFile(join(root,p),'utf8');
let failures=0,passes=0;
const pass=m=>{passes++;console.log(`PASS: ${m}`)};
const fail=m=>{failures++;console.error(`FAIL: ${m}`)};
const need=async(label,file,required)=>{const text=await read(file);const missing=required.filter(x=>!text.includes(x));missing.length?fail(`${label}: missing ${missing.join(', ')}`):pass(`${label}: ${required.length}/${required.length} functional markers`);return text};

const routes=await read('src/routes/routeConfig.tsx');
const routeModules=[
  ['/app/opportunities','OpportunityMarketplacePage'],
  ['/app/opportunities/new','CreateOpportunityPage'],
  ['/app/opportunities/:id','OpportunityDetailPage'],
  ['/app/opportunities/my','MyOpportunitiesPage'],
  ['/app/responses/my','MyResponsesPage'],
  ['/app/opportunities/:id/respond','OpportunityResponsePage'],
  ['/app/transactions','TransactionsPage'],
];
for(const [path,module] of routeModules){
  routes.includes(`path:"${path}"`)&&routes.includes(`/pages/${module}`)?pass(`${path} uses ${module}`):fail(`${path} canonical route ownership`);
}

await need('Opportunity marketplace','src/features/member/pages/OpportunityMarketplacePage.tsx',['Opportunity Marketplace','member.opportunities.marketplace','toggleSavedOpportunity','Post Opportunity','No opportunities match these filters','Saved only']);
await need('Opportunity authoring','src/features/member/pages/CreateOpportunityPage.tsx',['createOpportunity','updateOpportunity','setDirtyGuard','Review','Save Draft','Only draft or open opportunities can be edited','configurableFormComplete']);
await need('Owner opportunity workspace','src/features/member/pages/MyOpportunitiesPage.tsx',['My Opportunities','updateOpportunityStatus','ownerMemberId:memberId','Publish','Extend 7 days','Close']);
await need('Opportunity detail','src/features/member/pages/OpportunityDetailPage.tsx',['ownerView','askOpportunityQuestion','answerOpportunityQuestion','canTransitionResponse','awardResponse','/app/transactions?opportunity=',"command:'opportunity.response.status'",'expectedVersion:r.version']);
await need('Opportunity response','src/features/member/pages/OpportunityResponsePage.tsx',['saveResponseDraft','submitResponse','setDirtyGuard','Response already submitted','Review & Submit','Relevant verified certifications']);
await need('Response tracking','src/features/member/pages/MyResponsesPage.tsx',['My Responses','canTransitionResponse','actorMemberId:memberId','Continue Draft','Withdraw','Business Outcome']);
await need('Business outcomes','src/features/member/pages/TransactionsPage.tsx',['Business Outcomes','transactionTransitions','actorMemberId:memberId','Record next business stage','Close Without Business','Request Correction']);

const slice=await read('src/features/network/networkSlice.ts');
for(const marker of [
  "ownerMemberId===a.payload.ownerMemberId&&['draft','open'].includes(o.status)",
  "ownerMemberId===a.payload.ownerMemberId&&canTransitionOpportunity",
  "authorisedBusiness=state.affiliations.some",
  "supplierAction=a.payload.status==='withdrawn'",
  "buyerAction=a.payload.status!=='withdrawn'",
  "o.status!=='open'||!canTransitionResponse(selected.status,'won')",
  "affiliated=state.affiliations.some",
  "opportunity.ownerMemberId===a.payload.askedBy",
  "opportunity.ownerMemberId!==a.payload.answeredBy",
]) slice.includes(marker)?pass(`Reducer boundary guard: ${marker}`):fail(`Missing reducer boundary guard: ${marker}`);

const machine=await import(pathToFileURL(join(root,'src/features/network/stateMachines.ts')).href);
const transitionChecks=[
  ['Opportunity draft -> open',machine.canTransitionOpportunity('draft','open')===true],
  ['Opportunity open -> closed',machine.canTransitionOpportunity('open','closed')===true],
  ['Opportunity closed cannot reopen',machine.canTransitionOpportunity('closed','open')===false],
  ['Response draft -> submitted',machine.canTransitionResponse('draft','submitted')===true],
  ['Response submitted -> shortlisted',machine.canTransitionResponse('submitted','shortlisted')===true],
  ['Response shortlisted -> discussion',machine.canTransitionResponse('shortlisted','discussion')===true],
  ['Response discussion -> won',machine.canTransitionResponse('discussion','won')===true],
  ['Response won cannot withdraw',machine.canTransitionResponse('won','withdrawn')===false],
  ['Transaction proposed -> contacted',machine.canTransitionTransaction('proposed','contacted')===true],
  ['Transaction confirmed -> won',machine.canTransitionTransaction('confirmed','won')===true],
  ['Transaction won -> closed',machine.canTransitionTransaction('won','closed')===true],
  ['Transaction closed cannot regress',machine.canTransitionTransaction('closed','proposed')===false],
];
for(const [label,ok] of transitionChecks) ok?pass(label):fail(label);

for(const [,module] of routeModules){
  const file=`src/features/member/pages/${module}.tsx`;
  const text=await read(file);
  /features\/enterprise|network\/pages\/memberPages|window\.confirm\s*\(|window\.prompt\s*\(|TODO|COMING_SOON|coming soon/i.test(text)?fail(`${file} contains retired/native/placeholder dependency`):pass(`${file} has no retired/native/placeholder dependency`);
}

if(failures){console.error(`\nSETHU V6.1 Member Business validation: FAIL (${failures} failed, ${passes} passed).`);process.exit(1)}
console.log(`\nSETHU V6.1 Member Business validation: PASS (${passes}/${passes} checks).`);

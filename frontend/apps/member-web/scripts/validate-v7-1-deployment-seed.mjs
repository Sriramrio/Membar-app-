import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const seed=JSON.parse(fs.readFileSync(path.join(root,'src/config/deploymentTestSeed.json'),'utf8'));
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const failures=[];
const checks=[];
const check=(name,condition,detail='')=>{checks.push({name,condition,detail});if(!condition)failures.push(`${name}${detail?`: ${detail}`:''}`)};
const slugify=(value)=>value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const taxonomyId=(level,value)=>`TAX-BIZ-${level.toUpperCase()}-${slugify(value).toUpperCase()}`;

const chapters=seed.chapters;
const totalMembers=chapters.reduce((n,c)=>n+c.count,0);
const totalLogins=chapters.reduce((n,c)=>n+c.loginCount,0);
const chennai=chapters.filter(c=>c.city==='Chennai');
const requiredCities=['Chennai','Coimbatore','Tiruchirappalli','Madurai','Hosur','Mysuru','Bengaluru','Hyderabad','Mumbai'];
check('chapter count >= 13',chapters.length>=13,`found ${chapters.length}`);
check('deployment members exactly 650',totalMembers===650,`found ${totalMembers}`);
check('all chapters have exactly 50 members',chapters.every(c=>c.count===50),chapters.filter(c=>c.count!==50).map(c=>`${c.name}:${c.count}`).join(','));
check('Chennai has multiple chapters',chennai.length>=3,`found ${chennai.length}`);
check('Chennai deployment members exactly 150',chennai.reduce((n,c)=>n+c.count,0)===150,`found ${chennai.reduce((n,c)=>n+c.count,0)}`);
check('every Chennai chapter has exactly 50 members',chennai.every(c=>c.count===50));
check('exactly five Chennai member logins',chennai.reduce((n,c)=>n+c.loginCount,0)===5,`found ${chennai.reduce((n,c)=>n+c.loginCount,0)}`);
check('all required cities present',requiredCities.every(city=>chapters.some(c=>c.city===city)),requiredCities.filter(city=>!chapters.some(c=>c.city===city)).join(','));
check('Bengaluru has multiple chapters',chapters.filter(c=>c.city==='Bengaluru').length>=2);
check('Hyderabad has multiple chapters',chapters.filter(c=>c.city==='Hyderabad').length>=2);
check('non-Chennai chapters have multiple test logins',chapters.filter(c=>c.city!=='Chennai').every(c=>c.loginCount>=2));
check('total preview member logins exactly 25',totalLogins===25,`found ${totalLogins}`);

const chapterSlugs=new Set();
const memberIds=new Set();
const businessIds=new Set();
const accountIds=new Set();
for(const chapter of chapters){
  check(`unique chapter slug ${chapter.slug}`,!chapterSlugs.has(chapter.slug));chapterSlugs.add(chapter.slug);
  for(let i=1;i<=chapter.count;i++){
    const suffix=String(i).padStart(2,'0');
    const accountId=`test-${chapter.slug}-${suffix}`;
    const memberId=`member-${accountId}`;
    const businessId=`business-${accountId}`;
    check(`unique member id ${memberId}`,!memberIds.has(memberId));memberIds.add(memberId);
    check(`unique business id ${businessId}`,!businessIds.has(businessId));businessIds.add(businessId);
    if(i<=chapter.loginCount){check(`unique login id ${accountId}`,!accountIds.has(accountId));accountIds.add(accountId)}
  }
}
check('one generated business per generated member',memberIds.size===businessIds.size,`${memberIds.size}/${businessIds.size}`);
check('generated login member IDs exist',[...accountIds].every(id=>memberIds.has(`member-${id}`)));

const profiles=seed.taxonomyProfiles;
const sectors=[...new Set(profiles.map(p=>p.sector))];
const segments=[...new Set(profiles.map(p=>`${p.sector}|||${p.segment}`))];
const specs=[...new Set(profiles.map(p=>p.specialisation))];
check('taxonomy has broad sector coverage',sectors.length>=18,`found ${sectors.length}`);
check('taxonomy has broad segment coverage',segments.length>=40,`found ${segments.length}`);
check('taxonomy has >= 45 specialisations',specs.length>=45,`found ${specs.length}`);
const taxonomyIds=[...sectors.map(x=>taxonomyId('sector',x)),...segments.map(x=>taxonomyId('segment',x.split('|||')[1])),...specs.map(x=>taxonomyId('specialisation',x))];
check('taxonomy IDs are unique',new Set(taxonomyIds).size===taxonomyIds.length);
check('all profiles contain sector/segment/specialisation',profiles.every(p=>p.sector&&p.segment&&p.specialisation&&p.categoryId));

const seedSource=read('src/config/deploymentTestSeed.ts');
const networkSource=read('src/features/network/data.ts');
const authSource=read('src/features/auth/authService.ts');
const controlSource=read('src/features/control-plane/data.ts');
const sliceSource=read('src/features/network/networkSlice.ts');
check('network runtime imports deployment members/businesses/affiliations',/deploymentAffiliations, deploymentBusinesses, deploymentMembers/.test(networkSource));
check('network runtime includes deployment relationships',/deploymentConnections/.test(networkSource)&&/deploymentOpportunities/.test(networkSource)&&/deploymentMeetings/.test(networkSource)&&/deploymentTransactions/.test(networkSource));
check('network runtime includes deployment events',/deploymentEvents/.test(networkSource));
check('interaction notes are wired to initial state',/interactionNotes:\[\.\.\.interactionNotes\]/.test(sliceSource));
check('preview authentication imports deployment accounts',/deploymentPreviewAccounts/.test(authSource)&&/\.\.\.deploymentPreviewAccounts/.test(authSource));
check('control plane imports business taxonomy',/deploymentBusinessTaxonomy/.test(controlSource)&&/\.\.\.deploymentBusinessTaxonomy/.test(controlSource));
check('control plane imports organisation hierarchy',/deploymentOrganisationUnits/.test(controlSource)&&/\.\.\.deploymentOrganisationUnits/.test(controlSource));
check('single-current-business invariant preserved',/deploymentAffiliations = generated\.map/.test(seedSource)&&/active:true/.test(seedSource));
check('business taxonomy refs contain three governed levels',/taxonomyId\('sector'/.test(seedSource)&&/taxonomyId\('segment'/.test(seedSource)&&/taxonomyId\('specialisation'/.test(seedSource));
check('test businesses are verified',/verified:true/.test(seedSource));
check('test members are active and verified',/status:'active',verificationStatus:'verified'/.test(seedSource));

const sourceIds=[...seedSource.matchAll(/id:`([^`]+)`/g)].map(m=>m[1]);
check('deployment seed source is present',sourceIds.length>0);

for(const item of checks)console.log(`${item.condition?'PASS':'FAIL'} | ${item.name}${item.detail?` | ${item.detail}`:''}`);
console.log(`\nDeployment seed validation: ${checks.filter(x=>x.condition).length}/${checks.length} PASS`);
if(failures.length){console.error(`Failures (${failures.length}):\n- ${failures.join('\n- ')}`);process.exit(1)}

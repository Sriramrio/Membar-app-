import seed from './deploymentTestSeed.json';
import type { AppAccount, AccountAssignment } from '@/types/common';
import type { Business, Member, MemberBusinessAffiliation, Connection, Opportunity, Meeting, Transaction, Event, MemberInteractionNote } from '@/features/network/types';
import type { OrganisationUnitDefinition, TaxonomyDefinition } from '@/features/control-plane/types';

const effectiveFrom = '2026-10-06';
const memberStart = '2026-04-01';
const memberEnd = '2027-03-31';
const firstNames = ['Aarav','Aditya','Akash','Ananya','Arjun','Bhavya','Charan','Deepak','Devika','Girish','Harini','Ishaan','Janani','Karthik','Kavya','Krishna','Lakshmi','Manoj','Meera','Mohan','Nandini','Naveen','Neha','Nikhil','Pooja','Pranav','Priya','Rahul','Rajesh','Ramesh','Ravi','Rohit','Sanjay','Saranya','Shalini','Sridhar','Suresh','Swetha','Venkatesh','Vijay'];
const lastNames = ['Iyer','Raman','Kumar','Shankar','Narayanan','Rao','Menon','Krishnan','Subramanian','Bhat','Patel','Shah','Desai','Kulkarni','Reddy','Naidu','Shetty','Prasad','Jain','Agarwal'];
const suffixes = ['Industries','Engineering','Solutions','Systems','Technologies','Enterprises','Works','Innovations'];

const slugify = (value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const title = (slug:string)=>slug.split('-').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ');
const taxonomyId = (level:'sector'|'segment'|'specialisation', value:string)=>`TAX-BIZ-${level.toUpperCase()}-${slugify(value).toUpperCase()}`;

const sectors = [...new Set(seed.taxonomyProfiles.map(p=>p.sector))];
const segments = [...new Set(seed.taxonomyProfiles.map(p=>`${p.sector}|||${p.segment}`))];
export const deploymentBusinessTaxonomy:TaxonomyDefinition[] = [
  ...sectors.map((name,index)=>({id:taxonomyId('sector',name),domain:'Business Sector',code:`BSECTOR-${String(index+1).padStart(2,'0')}`,name,description:`Business-sector classification for ${name}.`,synonyms:[],keywords:name.toLowerCase().split(/\s+|&/).filter(Boolean),active:true,effectiveFrom,version:7})),
  ...segments.map((pair,index)=>{const [sector,name]=pair.split('|||');return {id:taxonomyId('segment',name),domain:'Business Segment',code:`BSEG-${String(index+1).padStart(2,'0')}`,name,description:`Business segment under ${sector}.`,parentId:taxonomyId('sector',sector),synonyms:[],keywords:name.toLowerCase().split(/\s+|&/).filter(Boolean),active:true,effectiveFrom,version:7}}),
  ...seed.taxonomyProfiles.map((profile,index)=>({id:taxonomyId('specialisation',profile.specialisation),domain:'Business Specialisation',code:`BSPEC-${String(index+1).padStart(3,'0')}`,name:profile.specialisation,description:`Business specialisation under ${profile.segment}.`,parentId:taxonomyId('segment',profile.segment),synonyms:[profile.capability],keywords:[profile.product,profile.service,...profile.specialisation.toLowerCase().split(/\s+|&|,/).filter(Boolean)],active:true,effectiveFrom,version:7})),
];

const generated = seed.chapters.flatMap((chapter,chapterIndex)=>Array.from({length:chapter.count},(_,memberIndex)=>{
  const sequence = memberIndex + 1;
  const accountId = `test-${chapter.slug}-${String(sequence).padStart(2,'0')}`;
  const memberId = `member-${accountId}`;
  const businessId = `business-${accountId}`;
  const profile = seed.taxonomyProfiles[(chapterIndex * 5 + memberIndex) % seed.taxonomyProfiles.length];
  const name = `${firstNames[(chapterIndex*7+memberIndex)%firstNames.length]} ${lastNames[(chapterIndex*3+memberIndex)%lastNames.length]}`;
  const designation = ['Founder','Managing Director','Director','CEO','Partner','Business Head'][memberIndex%6];
  const businessName = `${title(chapter.slug)} ${profile.specialisation.split(/[,&]/)[0].trim()} ${suffixes[(chapterIndex+memberIndex)%suffixes.length]} ${String(sequence).padStart(2,'0')}`;
  const business:Business = {
    id:businessId,name:businessName,legalName:businessName,tradeName:businessName,categoryIds:[profile.categoryId],city:chapter.city,region:chapter.region,state:chapter.state,country:chapter.country,chapter:chapter.name,
    description:`${profile.specialisation} business serving B2B customers from ${chapter.city}.`,capabilities:[profile.capability,profile.specialisation,'B2B collaboration'],products:[profile.product],services:[profile.service,'Vendor and customer development'],
    website:`https://example.com/${businessId}`,phone:`+91 90${String(10000000+chapterIndex*100000+memberIndex*1371).slice(-8)}`,email:`${accountId}@business.example.com`,logoText:businessName.split(' ').slice(0,2).map(x=>x[0]).join('').toUpperCase(),featured:memberIndex<2,visibility:'network',verified:true,
    industries:[profile.sector],processes:[profile.capability],serviceAreas:[chapter.city,chapter.state],taxonomyRefs:[
      {taxonomyId:taxonomyId('sector',profile.sector),source:'Verified'},
      {taxonomyId:taxonomyId('segment',profile.segment),source:'Verified'},
      {taxonomyId:taxonomyId('specialisation',profile.specialisation),source:'Verified'}
    ]
  };
  const member:Member = {
    id:memberId,name,designation,chapter:chapter.name,city:chapter.city,region:chapter.region,state:chapter.state,country:chapter.country,status:'active',verificationStatus:'verified',
    bio:`${designation} at ${businessName}, specialising in ${profile.specialisation} and cross-chapter B2B collaboration.`,expertise:[profile.specialisation,profile.capability],email:`${accountId}@sethu.local`,phone:`+91 91${String(20000000+chapterIndex*100000+memberIndex*1931).slice(-8)}`,avatarText:name.split(' ').map(x=>x[0]).slice(0,2).join(''),profileCompleteness:84+(memberIndex%5)*3
  };
  const affiliation:MemberBusinessAffiliation = {id:`AFF-${accountId.toUpperCase()}`,memberId,businessId,relationshipType:memberIndex%4===0?'Founder':memberIndex%4===1?'Owner':memberIndex%4===2?'Director':'Representative',designation,primaryRepresentative:true,authorisedRepresentative:true,authorityLevel:'Administer',startsAt:memberStart,verificationStatus:'Verified',visibility:'Network',active:true};
  const account:AppAccount|undefined = sequence <= chapter.loginCount ? {
    id:accountId,name,email:member.email,baseChapter:chapter.name,workspaces:['Member'],role:'Member',unit:chapter.name,status:'active',assignments:[{id:`ASN-${accountId}`,workspace:'Member',role:'Member',unit:chapter.name,unitType:'Chapter',startsAt:memberStart,endsAt:memberEnd,status:'Active'}]
  } : undefined;
  return {chapter,member,business,affiliation,account};
}));

export const deploymentMembers = generated.map(x=>x.member);
export const deploymentBusinesses = generated.map(x=>x.business);
export const deploymentAffiliations = generated.map(x=>x.affiliation);
export const deploymentPreviewAccounts = generated.map(x=>x.account).filter((x):x is AppAccount=>Boolean(x));

const stateCode:Record<string,string>={'Tamil Nadu':'TN','Karnataka':'KA','Telangana':'TG','Maharashtra':'MH'};
const stateUnitId=(state:string,index=0)=>state==='Tamil Nadu'?'OU-TN':`OU-TEST-STATE-${stateCode[state]??index}`;
const stateUnits = [...new Set(seed.chapters.map(c=>c.state))].filter(state=>state!=='Tamil Nadu').map((state,index):OrganisationUnitDefinition=>({id:stateUnitId(state,index),code:`TEST-${stateCode[state]??index}`,name:state,unitTypeId:'OUT-STATE',parentId:'OU-NATIONAL',active:true,effectiveFrom,aliases:[],version:7}));
type ChapterSeed=(typeof seed.chapters)[number];
const uniqueChapterRows=(key:(chapter:ChapterSeed)=>string)=>{const rows=new Map<string,ChapterSeed>();for(const chapter of seed.chapters)if(!rows.has(key(chapter)))rows.set(key(chapter),chapter);return [...rows.values()]};
const regionRows = uniqueChapterRows(c=>`${c.state}|||${c.region}`);
const regionUnitId=(region:string)=>`OU-TEST-REGION-${slugify(region).toUpperCase()}`;
const regionUnits = regionRows.map((chapter,index):OrganisationUnitDefinition=>({id:regionUnitId(chapter.region),code:`TEST-REG-${String(index+1).padStart(2,'0')}`,name:chapter.region,unitTypeId:'OUT-REGION',parentId:stateUnitId(chapter.state,index),active:true,effectiveFrom,aliases:[],version:7}));
const existingCityUnit:Record<string,string>={'Tamil Nadu|||Chennai':'OU-CHENNAI-CITY','Tamil Nadu|||Hosur':'OU-HOSUR-CITY'};
const cityUnitId=(chapter:ChapterSeed)=>existingCityUnit[`${chapter.state}|||${chapter.city}`]??`OU-TEST-CITY-${slugify(chapter.state+'-'+chapter.city).toUpperCase()}`;
const cityRows = uniqueChapterRows(c=>`${c.state}|||${c.city}`);
const cityUnits = cityRows.filter(chapter=>!existingCityUnit[`${chapter.state}|||${chapter.city}`]).map((chapter,index):OrganisationUnitDefinition=>({id:cityUnitId(chapter),code:`TEST-CITY-${String(index+1).padStart(2,'0')}`,name:chapter.city,unitTypeId:'OUT-CITY',parentId:regionUnitId(chapter.region),active:true,effectiveFrom,aliases:chapter.city==='Mysuru'?['Mysore']:[],version:7}));
const existingChapterUnit:Record<string,string>={'Hosur Chapter':'OU-HOSUR'};
const chapterUnits = seed.chapters.filter(chapter=>!existingChapterUnit[chapter.name]).map((chapter,index):OrganisationUnitDefinition=>({id:`OU-TEST-CH-${chapter.slug.toUpperCase()}`,code:`TEST-CH-${String(index+1).padStart(2,'0')}`,name:chapter.name,unitTypeId:'OUT-CHAPTER',parentId:cityUnitId(chapter),active:true,effectiveFrom,aliases:chapter.name==='Mysuru Chapter'?['Mysore Chapter']:[],version:7}));
export const deploymentOrganisationUnits:OrganisationUnitDefinition[]=[...stateUnits,...regionUnits,...cityUnits,...chapterUnits];


const chapterGroups = seed.chapters.map(chapter=>{
  const rows=generated.filter(x=>x.chapter.slug===chapter.slug);
  return {chapter,rows};
});
const allRows=chapterGroups.flatMap(group=>group.rows);
const rowByMemberId=new Map(allRows.map(row=>[row.member.id,row]));
const pickRow=(groupIndex:number,memberIndex:number,chapterOffset:number,indexOffset:number)=>{
  const group=chapterGroups[(groupIndex+chapterOffset+chapterGroups.length)%chapterGroups.length];
  return group.rows[(memberIndex+indexOffset+group.rows.length)%group.rows.length];
};
const sameCityOtherGroup=(groupIndex:number)=>chapterGroups.find((candidate,index)=>index!==groupIndex&&candidate.chapter.city===chapterGroups[groupIndex].chapter.city);
const sameStateOtherCityGroup=(groupIndex:number)=>chapterGroups.find(candidate=>candidate.chapter.state===chapterGroups[groupIndex].chapter.state&&candidate.chapter.city!==chapterGroups[groupIndex].chapter.city);
const otherStateGroup=(groupIndex:number)=>chapterGroups.find(candidate=>candidate.chapter.state!==chapterGroups[groupIndex].chapter.state);
const isoDay=(day:number)=>`2026-09-${String(1+(day%28)).padStart(2,'0')}`;
const isoDateTime=(day:number,hour:number)=>`${isoDay(day)}T${String(hour).padStart(2,'0')}:30:00+05:30`;

// Dense, deterministic social graph: local, same-city (where possible), same-state/different-city and cross-state.
export const deploymentConnections:Connection[] = chapterGroups.flatMap((group,groupIndex)=>group.rows.flatMap((row,memberIndex)=>{
  const targets=[
    group.rows[(memberIndex+1)%group.rows.length],
    group.rows[(memberIndex+7)%group.rows.length],
    sameCityOtherGroup(groupIndex)?.rows[(memberIndex+3)%50],
    sameStateOtherCityGroup(groupIndex)?.rows[(memberIndex+5)%50],
    otherStateGroup(groupIndex)?.rows[(memberIndex+11)%50],
  ].filter((target):target is typeof row=>Boolean(target)&&target?.member.id!==row.member.id);
  const unique=[...new Map(targets.map(target=>[target.member.id,target])).values()];
  return unique.map((target,index)=>({
    id:`conn-r18-${group.chapter.slug}-${String(memberIndex+1).padStart(2,'0')}-${index+1}`,
    ownerId:row.member.id,targetId:target.member.id,status:'connected',updatedAt:isoDateTime(memberIndex+groupIndex+index,9+index),
    purpose:index<2?'Chapter relationship building':index===2?'Cross-chapter city collaboration':index===3?'Cross-city business collaboration':'Cross-state business networking'
  }));
}));

// Opportunities cover requirements, offerings and collaborations, distributed across chapter/regional/network visibility.
export const deploymentOpportunities:Opportunity[] = chapterGroups.flatMap((group,groupIndex)=>group.rows.filter((_,memberIndex)=>memberIndex%2===0).map((owner,localIndex)=>{
  const memberIndex=localIndex*2;
  const profile=seed.taxonomyProfiles[(groupIndex*11+memberIndex)%seed.taxonomyProfiles.length];
  const type=(memberIndex%3===0?'Requirement':memberIndex%3===1?'Offering':'Collaboration') as Opportunity['type'];
  const visibility=(localIndex%3===0?'chapter':localIndex%3===1?'regional':'network') as Opportunity['visibility'];
  const valueLow=1+((groupIndex+memberIndex)%8);
  const valueHigh=valueLow+2+((memberIndex)%5);
  return {
    id:`opp-r18-${group.chapter.slug}-${String(memberIndex+1).padStart(2,'0')}`,
    ownerMemberId:owner.member.id,businessId:owner.business.id,
    title:`${profile.specialisation}: ${type?.toLowerCase()} - ${group.chapter.city}`,
    description:`Synthetic but realistic ${type?.toLowerCase()} for ${profile.specialisation}, created to exercise chapter, city, state and network discovery and relationship workflows.`,
    categoryId:profile.categoryId,location:`${group.chapter.city}, ${group.chapter.state}`,closingDate:`2026-${memberIndex%3===0?'10-31':memberIndex%3===1?'11-15':'12-05'}`,
    budget:`₹${valueLow}–${valueHigh} lakh indicative`,quantity:type==='Offering'?'Capacity available':`${20+(memberIndex%12)*10} units / engagements`,timeline:`${2+(memberIndex%5)}–${5+(memberIndex%7)} weeks`,
    status:memberIndex%11===0?'closed':'open',createdAt:isoDay(memberIndex+groupIndex),visibility,type
  };
}));

const opportunityFor=(groupSlug:string,memberIndex:number)=>`opp-r18-${groupSlug}-${String((Math.floor(memberIndex/2)*2)+1).padStart(2,'0')}`;

// Two One-to-Ones per generated member: one within chapter and one deliberately across organisational scope.
export const deploymentMeetings:Meeting[] = chapterGroups.flatMap((group,groupIndex)=>group.rows.flatMap((requester,memberIndex)=>{
  const local=group.rows[(memberIndex+1)%group.rows.length];
  const sameCity=sameCityOtherGroup(groupIndex)?.rows[(memberIndex+4)%50];
  const sameState=sameStateOtherCityGroup(groupIndex)?.rows[(memberIndex+6)%50];
  const crossState=otherStateGroup(groupIndex)?.rows[(memberIndex+9)%50];
  const external=(memberIndex%3===0?sameCity:memberIndex%3===1?sameState:crossState)??pickRow(groupIndex,memberIndex,1,9);
  const targets=[{target:local,scope:'Within chapter'},{target:external,scope:external.chapter.city===group.chapter.city?'Across chapter / same city':external.chapter.state===group.chapter.state?'Across city / same state':'Across state'}];
  return targets.map(({target,scope},slot)=>{
    const completed=(memberIndex+slot)%3!==2;
    const opportunityId=opportunityFor(group.chapter.slug,memberIndex);
    return {
      id:`meeting-r18-${group.chapter.slug}-${String(memberIndex+1).padStart(2,'0')}-${slot+1}`,
      participantIds:[requester.member.id,target.member.id],title:`${scope}: ${requester.business.name} × ${target.business.name}`,
      dateTime:completed?isoDateTime(memberIndex+groupIndex+slot,10+((memberIndex+slot)%7)):`2026-10-${String(10+((memberIndex+groupIndex+slot)%18)).padStart(2,'0')}T${String(10+((memberIndex+slot)%7)).padStart(2,'0')}:30:00+05:30`,
      mode:(memberIndex+slot)%3===0?'Online':(memberIndex+slot)%3===1?'In person':'Phone',
      location:(memberIndex+slot)%3===0?'Video meeting':(memberIndex+slot)%3===1?`${requester.chapter.city} business venue`:'Phone',
      agenda:`Explore ${requester.business.services[0]} and ${target.business.services[0]} collaboration; capture next action and opportunity fit.`,
      status:completed?'completed':'confirmed',requesterId:requester.member.id,recipientId:target.member.id,businessId:requester.business.id,opportunityId,
      outcome:completed?`${scope} discussion completed; identified a practical ${memberIndex%2===0?'referral':'commercial'} next step.`:undefined,
      followUp:completed?`Exchange relevant non-confidential profile and follow up within ${3+(memberIndex%5)} working days.`:undefined,
      participantNotes:completed?`Shared note: ${requester.member.name} and ${target.member.name} agreed the next action and owner.`:undefined,
      completionConfirmedBy:completed?[requester.member.id,target.member.id]:undefined
    } as Meeting;
  });
}));

// Business outcomes intentionally span local, city, state and cross-state relationships with varied commercial values/statuses.
export const deploymentTransactions:Transaction[] = chapterGroups.flatMap((group,groupIndex)=>group.rows.filter((_,memberIndex)=>memberIndex%3===0).flatMap((buyer,transactionIndex)=>{
  const memberIndex=transactionIndex*3;
  const local=group.rows[(memberIndex+8)%50];
  const cross=(transactionIndex%3===0?sameCityOtherGroup(groupIndex)?.rows[(memberIndex+13)%50]:transactionIndex%3===1?sameStateOtherCityGroup(groupIndex)?.rows[(memberIndex+17)%50]:otherStateGroup(groupIndex)?.rows[(memberIndex+19)%50])??pickRow(groupIndex,memberIndex,1,19);
  return [local,cross].map((counterparty,slot)=>{
    const value=35000+((groupIndex+1)*17500)+((memberIndex+1)*9500)+(slot*125000);
    const status=(memberIndex+slot)%5===0?'proposal':(memberIndex+slot)%5===1?'negotiation':'confirmed';
    return {
      id:`txn-r18-${group.chapter.slug}-${String(memberIndex+1).padStart(2,'0')}-${slot+1}`,
      memberId:buyer.member.id,buyerBusinessId:buyer.business.id,counterpartyBusinessId:counterparty.business.id,
      opportunityId:opportunityFor(group.chapter.slug,memberIndex),
      description:`${slot===0?'Within-chapter':'Cross-network'} business outcome: ${buyer.business.services[0]} with ${counterparty.business.name}.`,
      value,status,createdAt:isoDay(memberIndex+groupIndex+slot),valueVisibility:'participants',
      proofNote:`Synthetic QA business outcome; value ₹${value.toLocaleString('en-IN')} used for participant-visible analytics and transaction-note testing.`
    } as Transaction;
  });
}));

// Multiple chapter events provide enough attendance density for chapter/city/state testing.
export const deploymentEvents:Event[] = chapterGroups.flatMap((group,groupIndex)=>[0,1,2].map(eventIndex=>({
  id:`event-r18-${group.chapter.slug}-${eventIndex+1}`,
  name:eventIndex===0?`${group.chapter.name} Monthly Business Connect`:eventIndex===1?`${group.chapter.name} Opportunity Exchange`:`${group.chapter.name} Knowledge & Referral Forum`,
  description:eventIndex===0?'Structured introductions, member updates and one-to-one scheduling.':eventIndex===1?'Member-led opportunity, referral and collaboration exchange.':'Knowledge sharing with practical referrals and cross-chapter introductions.',
  dateTime:`2026-10-${String(12+((groupIndex*2+eventIndex)%16)).padStart(2,'0')}T${eventIndex===0?'18:00':'10:30'}:00+05:30`,
  endDateTime:`2026-10-${String(12+((groupIndex*2+eventIndex)%16)).padStart(2,'0')}T${eventIndex===0?'20:30':'13:00'}:00+05:30`,
  venue:eventIndex===2?'Hybrid / chapter venue':`${group.chapter.city} Chapter Venue`,city:group.chapter.city,region:group.chapter.region,state:group.chapter.state,country:group.chapter.country,chapter:group.chapter.name,
  type:eventIndex===0?'Chapter Networking':eventIndex===1?'Opportunity Exchange':'Knowledge & Referral',capacity:80,
  attendeeIds:group.rows.slice(eventIndex*5,eventIndex*5+30).map(row=>row.member.id),waitlistIds:group.rows.slice(30+eventIndex*3,35+eventIndex*3).map(row=>row.member.id),
  registrationOpenAt:'2026-10-06T09:00:00+05:30',registrationCloseAt:'2026-10-11T18:00:00+05:30',terms:'Synthetic deployment event. Registration, attendance and visibility data are exclusively for QA.',attendeeVisibility:'registered',paymentRequired:false
} as Event)));

// Relationship notes are separate from Converse and cover general, meeting, opportunity and transaction contexts.
export const deploymentInteractionNotes:MemberInteractionNote[] = [
  ...deploymentMeetings.flatMap((meeting,index)=>{
    const author=rowByMemberId.get(meeting.requesterId??meeting.participantIds[0]);
    const target=rowByMemberId.get(meeting.recipientId??meeting.participantIds[1]);
    if(!author||!target)return [];
    const base:MemberInteractionNote={id:`note-r18-meeting-${index+1}`,authorMemberId:author.member.id,targetMemberId:target.member.id,businessId:target.business.id,contextType:'Meeting',contextId:meeting.id,noteType:'Meeting',text:`Private meeting note: assess ${target.business.services[0]} fit and follow the agreed next action.`,visibility:'Private',createdAt:meeting.dateTime};
    const shared:MemberInteractionNote={id:`note-r18-meeting-shared-${index+1}`,authorMemberId:author.member.id,targetMemberId:target.member.id,businessId:target.business.id,contextType:'Meeting',contextId:meeting.id,noteType:'FollowUp',text:'Participant note: follow-up owner, expected response and next discussion point recorded.',visibility:'Participants',createdAt:meeting.dateTime};
    return meeting.status==='completed'?[base,shared]:[base];
  }),
  ...deploymentTransactions.map((transaction,index)=>{
    const author=rowByMemberId.get(transaction.memberId)!;
    const target=allRows.find(row=>row.business.id===transaction.counterpartyBusinessId)!;
    return {id:`note-r18-txn-${index+1}`,authorMemberId:author.member.id,targetMemberId:target.member.id,businessId:target.business.id,contextType:'Transaction',contextId:transaction.id,noteType:'Transaction',text:`Transaction note: ₹${(transaction.value??0).toLocaleString('en-IN')} ${transaction.status} outcome; verify follow-up, acknowledgement and closure status.`,visibility:index%4===0?'Participants':'Private',createdAt:`${transaction.createdAt}T17:00:00+05:30`} as MemberInteractionNote;
  }),
  ...deploymentOpportunities.filter((_,index)=>index%2===0).map((opportunity,index)=>{
    const author=rowByMemberId.get(opportunity.ownerMemberId)!;
    const target=pickRow(index%chapterGroups.length,index,1,7);
    return {id:`note-r18-opp-${index+1}`,authorMemberId:author.member.id,targetMemberId:target.member.id,businessId:target.business.id,contextType:'Opportunity',contextId:opportunity.id,noteType:'Opportunity',text:`Opportunity note: evaluate ${target.business.name} for ${opportunity.title}; confirm fit, timeline and next introduction.`,visibility:'Private',createdAt:'2026-10-05T16:00:00+05:30'} as MemberInteractionNote;
  })
];

export const deploymentSeedSummary = {
  chapters: seed.chapters.length,
  members: deploymentMembers.length,
  businesses: deploymentBusinesses.length,
  logins: deploymentPreviewAccounts.length,
  taxonomyTerms: deploymentBusinessTaxonomy.length,
  chennaiMembers: deploymentMembers.filter(m=>m.city==='Chennai').length,
  chennaiChapters: new Set(deploymentMembers.filter(m=>m.city==='Chennai').map(m=>m.chapter)).size,
  connections: deploymentConnections.length,
  opportunities: deploymentOpportunities.length,
  meetings: deploymentMeetings.length,
  transactions: deploymentTransactions.length,
  events: deploymentEvents.length,
  interactionNotes: deploymentInteractionNotes.length
};

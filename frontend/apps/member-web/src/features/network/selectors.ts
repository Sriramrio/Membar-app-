import { createSelector } from '@reduxjs/toolkit';
import { selectMemberEntities, selectBusinessEntities, selectAffiliationsByMember } from './readModel';
import type { RootState } from '@/app/store';
import type { Opportunity, Promotion } from './types';

type Network=RootState['network'];
export const activeMemberId=(s:RootState)=>{
  if(!s.auth.account)return '';
  const direct=`member-${s.auth.account.id}`;
  if(s.network.members.some(m=>m.id===direct))return direct;
  const byEmail=s.network.members.find(m=>m.email&&s.auth.account?.email&&m.email.toLowerCase()===s.auth.account.email.toLowerCase());
  return byEmail?.id||direct;
};
export const selectActiveMember=createSelector(
  [selectMemberEntities,activeMemberId,(s:RootState)=>s.auth.account],
  (members,id,account)=>{
    if(!account)return undefined;
    if(id&&members[id])return members[id];
    const byEmail=account.email?Object.values(members).find(m=>m.email&&m.email.toLowerCase()===account.email.toLowerCase()):undefined;
    if(byEmail)return byEmail;
    return {
      id:id||`member-${account.id}`,
      name:account.name||'Member',
      designation:account.role||'Member',
      chapter:account.baseChapter||'Chennai Chapter',
      city:'Chennai',
      region:'Tamil Nadu',
      state:'Tamil Nadu',
      country:'India',
      bio:'',
      expertise: [] as string[],
      email: account.email || '',
      phone: (account as any).phone || '',
      avatarText:(account.name||'M').slice(0,2).toUpperCase(),
      profileCompleteness:85,
      status:'active' as const,
      verificationStatus:'verified' as const
    };
  }
);
export const verifiedAffiliationsForMember=(n:Network,memberId:string)=>n.affiliations.filter(a=>a.memberId===memberId&&a.active&&a.verificationStatus==='Verified');
export const primaryAffiliationForMember=(n:Network,memberId:string)=>{const rows=verifiedAffiliationsForMember(n,memberId);return rows.find(a=>a.primaryRepresentative)??rows.find(a=>a.authorisedRepresentative)??rows[0]};
export const affiliatedBusinessIdsForMember=(n:Network,memberId:string)=>[...new Set(verifiedAffiliationsForMember(n,memberId).map(a=>a.businessId))];
export const businessForMember=(n:Network,memberId:string)=>{
  const affiliation=primaryAffiliationForMember(n,memberId);
  if(affiliation){
    const b=n.businesses.find(x=>x.id===affiliation.businessId);
    if(b)return b;
  }
  return n.businesses.find(b=>(b as any).memberId===memberId||(b as any).ownerMemberId===memberId);
};
export const representativeMemberIdsForBusiness=(n:Network,businessId:string)=>n.affiliations.filter(a=>a.businessId===businessId&&a.active&&a.verificationStatus==='Verified'&&(a.primaryRepresentative||a.authorisedRepresentative||['Founder','Owner','Director','Representative'].includes(a.relationshipType))).map(a=>a.memberId).filter((id,i,all)=>all.indexOf(id)===i);
export const affiliationsForBusiness=(n:Network,businessId:string)=>n.affiliations.filter(a=>a.businessId===businessId&&a.active);
export const verifiedAffiliationsForBusiness=(n:Network,businessId:string)=>affiliationsForBusiness(n,businessId).filter(a=>a.verificationStatus==='Verified');
export const authoritativeRepresentativeMemberIdsForBusiness=(n:Network,businessId:string)=>[...new Set(verifiedAffiliationsForBusiness(n,businessId).filter(a=>['Founder','Owner','Director','Representative'].includes(a.relationshipType)).map(a=>a.memberId))];
export const primaryRepresentativeMemberIdForBusiness=(n:Network,businessId:string)=>{const rows=verifiedAffiliationsForBusiness(n,businessId);return (rows.find(a=>a.primaryRepresentative)??rows.find(a=>a.authorisedRepresentative)??rows[0])?.memberId};
export const certificationRecordsForBusiness=(n:Network,businessId:string)=>n.certificationRecords.filter(c=>c.businessId===businessId);
export const certificationStandardsForBusiness=(n:Network,businessId:string,verifiedOnly=false)=>[...new Set(certificationRecordsForBusiness(n,businessId).filter(c=>!verifiedOnly||c.verificationStatus==='Verified').filter(c=>c.verificationStatus!=='Rejected'&&c.verificationStatus!=='Expired').map(c=>c.standard))];

export const selectActiveBusiness=createSelector([selectActiveMember,selectBusinessEntities,selectAffiliationsByMember],(member,businesses,byMember)=>{if(!member)return undefined;const rows=(byMember[member.id]??[]).filter(a=>a.active&&a.verificationStatus==='Verified');const affiliation=rows.find(a=>a.primaryRepresentative)??rows.find(a=>a.authorisedRepresentative)??rows[0];return affiliation?businesses[affiliation.businessId]:undefined});
export const connectionStatus=(s:Pick<RootState,'network'>,ownerId:string,targetId:string)=>{const c=s.network.connections.find(x=>(x.ownerId===ownerId&&x.targetId===targetId)||(x.ownerId===targetId&&x.targetId===ownerId));if(!c)return'none'as const;if(c.ownerId===ownerId)return c.status;if(c.status==='sent')return'received'as const;if(c.status==='received')return'sent'as const;return c.status};
export const directConversationBetween=(n:Network,memberAId:string,memberBId:string)=>n.conversations.find(c=>(c.kind??'direct')==='direct'&&c.participantIds.length===2&&c.participantIds.includes(memberAId)&&c.participantIds.includes(memberBId));
export function opportunityVisibleToMember(s:Pick<RootState,'network'>,o:Opportunity,memberId:string){if(o.ownerMemberId===memberId)return true;const member=s.network.members.find(x=>x.id===memberId);const owner=s.network.members.find(x=>x.id===o.ownerMemberId);const business=s.network.businesses.find(x=>x.id===o.businessId);if(!member||!owner||owner.status==='suspended'||!business||business.visibility==='hidden')return false;if(o.visibility==='network')return true;if(o.visibility==='chapter')return owner.chapter===member.chapter;return owner.region===member.region}
export function promotionEligibleForMember(s:Pick<RootState,'network'>,p:Promotion,memberId:string){const member=s.network.members.find(x=>x.id===memberId);if(!member)return false;const mb=businessForMember(s.network,memberId);const advertiser=s.network.businesses.find(x=>x.id===p.businessId);if(!mb||!advertiser||(advertiser.visibility==='hidden'&&advertiser.id!==mb.id))return false;const t=p.target;const broad=(a:string[],v:string)=>a.length===0||a.includes(v);if(!broad(t.chapters,member.chapter)||!broad(t.cities,member.city)||!broad(t.regions,member.region)||!broad(t.states,member.state)||!broad(t.countries,member.country))return false;if(t.categoryIds.length&&!t.categoryIds.some(id=>mb.categoryIds.includes(id)))return false;const terms=(t.productServiceTerms??[]).map(x=>x.trim().toLowerCase()).filter(Boolean);if(terms.length){const profile=[...mb.products,...mb.services,...mb.capabilities].join(' ').toLowerCase();if(!terms.some(term=>profile.includes(term)))return false}return true}
export const savedBusinesses=(n:Network,memberId:string)=>n.savedBusinessIdsByMember[memberId]??[];
export const savedOpportunities=(n:Network,memberId:string)=>n.savedOpportunityIdsByMember[memberId]??[];

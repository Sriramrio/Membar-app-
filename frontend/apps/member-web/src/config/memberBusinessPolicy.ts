import type { MemberBusinessAffiliation } from '@/features/network/types';

/** Deployment policy: the domain remains multi-affiliation capable, while SETHU allows one current/pending business per member. */
export const memberBusinessPolicy={
  maxCurrentAffiliationsPerMember:1,
  allowMultipleHistoricalAffiliations:true,
  allowMultiplePendingAffiliations:false,
  allowBusinessToHaveMultipleRepresentatives:true,
} as const;

export function isCurrentAffiliation(a:MemberBusinessAffiliation){return !a.endsAt&&a.verificationStatus!=='Rejected'&&(a.active||a.verificationStatus==='Pending');}
export function currentAffiliationsForMember(affiliations:readonly MemberBusinessAffiliation[],memberId:string){return affiliations.filter(a=>a.memberId===memberId&&isCurrentAffiliation(a));}
export function canRequestAnotherBusinessAffiliation(affiliations:readonly MemberBusinessAffiliation[],memberId:string){return currentAffiliationsForMember(affiliations,memberId).length<memberBusinessPolicy.maxCurrentAffiliationsPerMember;}
export function enforceSingleCurrentAffiliation(affiliations:readonly MemberBusinessAffiliation[],candidate:MemberBusinessAffiliation){
  const existing=currentAffiliationsForMember(affiliations,candidate.memberId).filter(a=>a.id!==candidate.id);
  if(isCurrentAffiliation(candidate)&&existing.length>=memberBusinessPolicy.maxCurrentAffiliationsPerMember){
    throw new Error('Only one active or pending business affiliation is allowed in SETHU. End or resolve that relationship before adding another business.');
  }
}

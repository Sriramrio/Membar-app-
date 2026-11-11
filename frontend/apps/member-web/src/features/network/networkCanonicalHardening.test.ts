import { describe,expect,it } from 'vitest';
import reducer,{addInteractionNote,applyCertificationReview,applyImportRecords,initialNetworkState,rsvpEvent,upsertAffiliation,upsertCertificationRecord} from './networkSlice';
import type { MemberBusinessAffiliation } from './types';

describe('Canonical V6 member/business hardening',()=>{
  it('preserves historical affiliations but rejects a second current SETHU business affiliation',()=>{
    const affiliation:MemberBusinessAffiliation={id:'AFF-test',memberId:'member-member',businessId:'business-007',relationshipType:'Advisor',designation:'Advisor',primaryRepresentative:false,authorisedRepresentative:false,authorityLevel:'View',startsAt:'2026-09-24',verificationStatus:'Verified',visibility:'Network',active:true};
    expect(()=>reducer(initialNetworkState,upsertAffiliation(affiliation))).toThrow(/one active or pending business affiliation/i);
    const historical={...affiliation,active:false,endsAt:'2026-09-25',endedReason:'Assignment completed'};
    const state=reducer(initialNetworkState,upsertAffiliation(historical));
    expect(state.affiliations.find(a=>a.id===historical.id)?.active).toBe(false);
    expect(state.affiliations.find(a=>a.id===historical.id)?.endedReason).toBe('Assignment completed');
  });

  it('stores contextual relationship notes separately from Converse and defaults can remain private',()=>{
    const state=reducer(initialNetworkState,addInteractionNote({authorMemberId:'member-member',targetMemberId:'member-002',businessId:'business-002',contextType:'Opportunity',contextId:'opp-001',noteType:'Opportunity',text:'Follow up after the opportunity discussion',visibility:'Private'}));
    const note=state.interactionNotes[0];
    expect(note?.contextType).toBe('Opportunity');
    expect(note?.visibility).toBe('Private');
    expect(note?.text).toContain('Follow up');
  });

  it('does not expose a pending certification as verified capability',()=>{
    const record={id:'CERT-test',businessId:'business-007',standard:'AS9100',evidenceName:'certificate.pdf',verificationStatus:'Pending' as const};
    let state=reducer(initialNetworkState,upsertCertificationRecord(record));
    expect(state.certificationRecords.find(c=>c.id===record.id)?.verificationStatus).toBe('Pending');
    state=reducer(state,applyCertificationReview({id:record.id,decision:'Verified',actor:'Platform Reviewer'}));
    expect(state.certificationRecords.find(c=>c.id===record.id)?.verificationStatus).toBe('Verified');
  });

  it('retains event form version, answers and waitlist state',()=>{
    const event=initialNetworkState.events.find(e=>e.id==='event-001')!;
    const memberId='member-008';
    const state=reducer(initialNetworkState,rsvpEvent({eventId:event.id,memberId,attending:true,responses:{meetingGoal:'Meet buyers'},formVersion:'v3',acceptedTerms:true}));
    expect(state.events.find(e=>e.id===event.id)?.registrationResponses?.[memberId]?.meetingGoal).toBe('Meet buyers');
    expect(state.events.find(e=>e.id===event.id)?.registrationMeta?.[memberId]?.formVersion).toBe('v3');
  });

  it('posts checker-approved imports into live domain state and records reversible ledger',()=>{
    const state=reducer(initialNetworkState,applyImportRecords({batchId:'IMP-test',type:'Payment',records:[{memberId:'member-member',description:'Imported fee',amount:1000,status:'paid',dueDate:'2026-09-24'}]}));
    expect(state.payments.some(p=>p.id==='import-IMP-test-0'&&p.status==='paid')).toBe(true);
    expect(state.importLedger.some(l=>l.batchId==='IMP-test'&&l.appliedIds.includes('payment:import-IMP-test-0'))).toBe(true);
  });
});

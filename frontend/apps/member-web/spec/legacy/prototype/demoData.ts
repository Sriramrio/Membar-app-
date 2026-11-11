import type { ScreenDefinition } from '@/types/screen';

export type DemoRow = Record<string, string | number | boolean | null | undefined>;

const members: DemoRow[] = [
  { id:'M-1024', member:'Arun Kumar', business:'Astra Precision Components', chapter:'Hosur Chapter', city:'Hosur', category:'Precision Manufacturing', capability:'CNC turning · Inspection', connection:'Same chapter', status:'Active', updated:'22 Sep 2026' },
  { id:'M-1047', member:'Deepa Raman', business:'DigiForge Automation', chapter:'Chennai Chapter', city:'Chennai', category:'Industrial Automation', capability:'PLC · Vision · MES', connection:'Connected', status:'Active', updated:'21 Sep 2026' },
  { id:'M-1089', member:'Suresh Babu', business:'Apex Industrial Services', chapter:'Coimbatore Chapter', city:'Coimbatore', category:'Engineering Services', capability:'Maintenance · Retrofit', connection:'Preview only', status:'Active', updated:'19 Sep 2026' },
  { id:'M-1132', member:'Anitha Krishnan', business:'GreenMach Systems', chapter:'Salem Chapter', city:'Salem', category:'Sustainable Manufacturing', capability:'Energy audit · Retrofit', connection:'Request pending', status:'Active', updated:'18 Sep 2026' },
  { id:'M-1176', member:'Prakash Menon', business:'Pragati Tooling', chapter:'Hosur Chapter', city:'Hosur', category:'Tooling', capability:'Jigs · Fixtures · EDM', connection:'Same chapter', status:'Active', updated:'17 Sep 2026' },
  { id:'M-1219', member:'Farah Khan', business:'Fenix Packaging', chapter:'Bengaluru East Chapter', city:'Bengaluru', category:'Industrial Packaging', capability:'Export packing · VCI', connection:'Not connected', status:'Active', updated:'15 Sep 2026' },
];

const businesses: DemoRow[] = [
  { id:'B-210', business:'Astra Precision Components', legalName:'Astra Precision Components Pvt. Ltd.', category:'Precision Manufacturing', location:'Hosur, Tamil Nadu', products:'CNC turned parts · Shafts · Sub-assemblies', certifications:'ISO 9001', owners:'Arun Kumar', status:'Approved' },
  { id:'B-236', business:'DigiForge Automation', legalName:'DigiForge Automation LLP', category:'Industrial Automation', location:'Chennai, Tamil Nadu', products:'PLC · Machine Vision · MES Integration', certifications:'ISO 9001', owners:'Deepa Raman', status:'Approved' },
  { id:'B-271', business:'Pragati Tooling', legalName:'Pragati Tooling Industries', category:'Tooling', location:'Hosur, Tamil Nadu', products:'Fixtures · Gauges · EDM tooling', certifications:'IATF supplier', owners:'Prakash Menon', status:'Approved' },
  { id:'B-295', business:'Fenix Packaging', legalName:'Fenix Packaging Solutions Pvt. Ltd.', category:'Industrial Packaging', location:'Bengaluru, Karnataka', products:'Export packaging · Crates · VCI', certifications:'ISO 14001', owners:'Farah Khan', status:'Pending review' },
];

const connections: DemoRow[] = [
  { id:'CON-741', member:'Deepa Raman', business:'DigiForge Automation', chapter:'Chennai Chapter', direction:'Received', sent:'20 Sep 2026', context:'Automation collaboration', status:'Pending' },
  { id:'CON-719', member:'Suresh Babu', business:'Apex Industrial Services', chapter:'Coimbatore Chapter', direction:'Active', sent:'11 Aug 2026', context:'Maintenance partner', status:'Connected' },
  { id:'CON-704', member:'Prakash Menon', business:'Pragati Tooling', chapter:'Hosur Chapter', direction:'Active', sent:'22 Jul 2026', context:'Tooling partner', status:'Connected' },
  { id:'CON-752', member:'Anitha Krishnan', business:'GreenMach Systems', chapter:'Salem Chapter', direction:'Sent', sent:'18 Sep 2026', context:'Energy saving project', status:'Awaiting response' },
];

const references: DemoRow[] = [
  { id:'REF-1042', from:'Ramesh Iyer', to:'Arun Kumar', need:'Precision shafts for packaging equipment', category:'Precision Manufacturing', followUp:'23 Sep 2026', linked:'—', status:'Action required' },
  { id:'REF-1038', from:'Arun Kumar', to:'Deepa Raman', need:'Machine vision inspection requirement', category:'Industrial Automation', followUp:'26 Sep 2026', linked:'OP-401', status:'In progress' },
  { id:'REF-1029', from:'Arun Kumar', to:'Prakash Menon', need:'Fixture design for new component', category:'Tooling', followUp:'30 Aug 2026', linked:'TX-209', status:'Closed · successful' },
  { id:'REF-1018', from:'Farah Khan', to:'Arun Kumar', need:'Machined inserts for export packaging line', category:'Precision Manufacturing', followUp:'28 Sep 2026', linked:'—', status:'Clarification requested' },
];

const transactions: DemoRow[] = [
  { id:'TX-209', source:'REF-1029', counterparty:'Pragati Tooling', product:'Inspection fixture', date:'12 Sep 2026', stage:'Completed', valueVisibility:'Restricted', confirmation:'Both confirmed' },
  { id:'TX-211', source:'REF-1038', counterparty:'DigiForge Automation', product:'Vision station', date:'19 Sep 2026', stage:'Proposal', valueVisibility:'Restricted', confirmation:'Awaiting counterparty' },
  { id:'TX-214', source:'REF-1042', counterparty:'Rivaan Industrial Supplies', product:'Precision shafts', date:'21 Sep 2026', stage:'Qualified', valueVisibility:'Restricted', confirmation:'Draft claim' },
  { id:'TX-216', source:'OP-391', counterparty:'Mitra Machines', product:'Machined assembly', date:'20 Sep 2026', stage:'Disputed', valueVisibility:'Restricted', confirmation:'Correction workflow' },
];

const oneToOnes: DemoRow[] = [
  { id:'OTO-901', participant:'Ramesh Iyer', date:'24 Sep 2026 · 11:00', mode:'In person', agenda:'REF-1042 follow-up', outcome:'—', status:'Accepted' },
  { id:'OTO-907', participant:'Deepa Raman', date:'27 Sep 2026 · 15:30', mode:'Online', agenda:'Automation capability discussion', outcome:'—', status:'Proposed' },
  { id:'OTO-889', participant:'Prakash Menon', date:'18 Sep 2026 · 10:00', mode:'In person', agenda:'Fixture project close-out', outcome:'Follow-up created', status:'Awaiting confirmation' },
  { id:'OTO-873', participant:'Anitha Krishnan', date:'10 Sep 2026 · 16:00', mode:'Phone', agenda:'Energy audit collaboration', outcome:'Reference planned', status:'Completed' },
];

const thankYou: DemoRow[] = [
  { id:'THX-118', recipient:'Prakash Menon', linked:'TX-209', visibility:'Member network', note:'Excellent support in closing the inspection fixture requirement.', date:'13 Sep 2026', status:'Published' },
  { id:'THX-121', recipient:'Deepa Raman', linked:'REF-1038', visibility:'Private to recipient', note:'Thank you for the detailed technical inputs.', date:'20 Sep 2026', status:'Published' },
  { id:'THX-125', recipient:'Ramesh Iyer', linked:'REF-1042', visibility:'Draft', note:'', date:'22 Sep 2026', status:'Draft' },
];

const opportunities: DemoRow[] = [
  { id:'OP-401', type:'Requirement', title:'CNC machining partner for stainless steel parts', owner:'Apex Process Equipment', category:'Precision Manufacturing', location:'Chennai', deadline:'05 Oct 2026', responses:8, match:'Capability + location', status:'Published' },
  { id:'OP-404', type:'Collaboration', title:'Joint industrial automation proposal', owner:'DigiForge Automation', category:'Industrial Automation', location:'Tamil Nadu', deadline:'12 Oct 2026', responses:4, match:'Complementary capability', status:'Published' },
  { id:'OP-408', type:'Offering', title:'Supplier audit and QMS readiness service', owner:'Nexon Quality Systems', category:'Quality Services', location:'South India', deadline:'20 Oct 2026', responses:11, match:'Saved category', status:'Published' },
  { id:'OP-412', type:'Requirement', title:'Export packaging for machinery spares', owner:'Mitra Machines', category:'Industrial Packaging', location:'Bengaluru', deadline:'30 Sep 2026', responses:3, match:'Business need', status:'Closing soon' },
];

const responses: DemoRow[] = [
  { id:'RSP-610', opportunity:'OP-401', owner:'Astra Precision Components', submitted:'21 Sep 2026', capability:'CNC turning · SS316', commercial:'Private', nextAction:'Owner review', status:'Submitted' },
  { id:'RSP-604', opportunity:'OP-391', owner:'Astra Precision Components', submitted:'14 Sep 2026', capability:'Precision shafts', commercial:'Private', nextAction:'One-to-one scheduled', status:'Shortlisted' },
  { id:'RSP-587', opportunity:'OP-366', owner:'Astra Precision Components', submitted:'02 Sep 2026', capability:'Small batch machining', commercial:'Private', nextAction:'—', status:'Closed' },
];

const announcements: DemoRow[] = [
  { id:'ANN-88', title:'Chapter meeting agenda published', audience:'Hosur Chapter', priority:'Important', publish:'21 Sep 2026', expiry:'25 Sep 2026', acknowledgement:'Required', status:'Published' },
  { id:'ANN-84', title:'Regional buyer meet registration open', audience:'Tamil Nadu North Region', priority:'Normal', publish:'18 Sep 2026', expiry:'28 Sep 2026', acknowledgement:'Optional', status:'Published' },
  { id:'ANN-79', title:'Profile capability data quality review', audience:'Tamil Nadu', priority:'Action', publish:'15 Sep 2026', expiry:'01 Oct 2026', acknowledgement:'Required', status:'Published' },
];

const events: DemoRow[] = [
  { id:'EVT-2409', title:'Chapter Business Meeting', date:'24 Sep 2026 · 07:30', venue:'DBN Centre, Hosur', audience:'Hosur Chapter', capacity:'120 / 160', fee:'No fee', registration:'Confirmed', status:'Open' },
  { id:'EVT-2809', title:'Manufacturing Buyer Meet', date:'28 Sep 2026 · 10:00', venue:'Convention Hall, Chennai', audience:'Tamil Nadu North Region', capacity:'312 / 400', fee:'₹1,000', registration:'Not registered', status:'Open' },
  { id:'EVT-0310', title:'Regional Leadership Review', date:'03 Oct 2026 · 16:00', venue:'Online', audience:'Office bearers', capacity:'38 / 50', fee:'No fee', registration:'Maybe', status:'Scheduled' },
  { id:'EVT-0910', title:'Responsible Enterprise Workshop', date:'09 Oct 2026 · 14:00', venue:'Hybrid', audience:'Tamil Nadu', capacity:'144 / 220', fee:'₹500', registration:'Not registered', status:'Open' },
];

const gallery: DemoRow[] = [
  { id:'GAL-44', album:'Chapter Business Meet', date:'14 Sep 2026', unit:'Hosur Chapter', media:42, consent:'Verified', moderation:'Approved', status:'Published' },
  { id:'GAL-41', album:'Supplier Development Workshop', date:'06 Sep 2026', unit:'Tamil Nadu North Region', media:68, consent:'Verified', moderation:'Approved', status:'Published' },
  { id:'GAL-37', album:'Member Induction', date:'30 Aug 2026', unit:'Hosur Chapter', media:26, consent:'2 pending', moderation:'Needs review', status:'Draft' },
];

const news: DemoRow[] = [
  { id:'NEWS-91', headline:'Member collaboration programme announced', authoringUnit:'Network Office', publish:'22 Sep 2026', expiry:'22 Dec 2026', audience:'Members', status:'Published' },
  { id:'NEWS-87', headline:'Responsible sourcing knowledge series', authoringUnit:'Tamil Nadu', publish:'16 Sep 2026', expiry:'16 Nov 2026', audience:'Tamil Nadu members', status:'Published' },
  { id:'NEWS-82', headline:'New partner benefit for MSME finance readiness', authoringUnit:'Partnerships', publish:'08 Sep 2026', expiry:'08 Dec 2026', audience:'All members', status:'Published' },
];

const partners: DemoRow[] = [
  { id:'PAR-11', partner:'Enterprise Finance Desk', benefit:'Finance readiness clinics', eligibility:'Active members', contact:'Member support route', geography:'India', status:'Active' },
  { id:'PAR-14', partner:'Quality Excellence Forum', benefit:'Supplier quality workshops', eligibility:'Manufacturing members', contact:'Event registration', geography:'South India', status:'Active' },
  { id:'PAR-18', partner:'Export Facilitation Network', benefit:'Export compliance guidance', eligibility:'Exporting / aspiring members', contact:'Partner enquiry', geography:'India', status:'Active' },
];

const resources: DemoRow[] = [
  { id:'RES-201', title:'One-to-One Meeting Guide', type:'Guide', category:'Networking', updated:'18 Sep 2026', audience:'All members', format:'PDF', status:'Current' },
  { id:'RES-194', title:'Opportunity Posting Checklist', type:'Template', category:'Business Opportunities', updated:'11 Sep 2026', audience:'All members', format:'DOCX', status:'Current' },
  { id:'RES-176', title:'Chapter Meeting Minutes Template', type:'Template', category:'Operations', updated:'02 Sep 2026', audience:'Office bearers', format:'DOCX', status:'Current' },
];

const attendance: DemoRow[] = [
  { id:'AT-901', meeting:'Chapter Business Meeting · 14 Sep', member:'Arun Kumar', attendance:'Present', source:'QR', checkIn:'07:28', correction:'—', finalised:'Yes' },
  { id:'AT-902', meeting:'Chapter Business Meeting · 14 Sep', member:'Ramesh Iyer', attendance:'Present', source:'Upload', checkIn:'07:34', correction:'—', finalised:'Yes' },
  { id:'AT-903', meeting:'Regional Connect · 18 Sep', member:'Deepa Raman', attendance:'Late', source:'API', checkIn:'16:17', correction:'—', finalised:'Yes' },
  { id:'AT-904', meeting:'Chapter Business Meeting · 14 Sep', member:'Prakash Menon', attendance:'Absent', source:'Manual', checkIn:'—', correction:'Requested', finalised:'Yes' },
];

const payments: DemoRow[] = [
  { id:'PAY-8001', member:'Arun Kumar', type:'Membership', period:'2026–2027', amount:'₹5,000', source:'API', receipt:'RCPT-8001', reconciliation:'Matched', status:'Reconciled' },
  { id:'PAY-8002', member:'Ramesh Iyer', type:'Event', period:'Buyer Meet', amount:'₹1,000', source:'Upload', receipt:'Pending', reconciliation:'Matched', status:'Received' },
  { id:'PAY-8003', member:'Prakash Menon', type:'Membership', period:'2026–2027', amount:'₹5,000', source:'Upload', receipt:'—', reconciliation:'Amount mismatch', status:'Exception' },
  { id:'PAY-8004', member:'Deepa Raman', type:'Event', period:'Workshop', amount:'₹500', source:'API', receipt:'RCPT-8004', reconciliation:'Matched', status:'Posted' },
];

const activity: DemoRow[] = [
  { id:'ACT-991', occurred:'22 Sep 2026 · 10:42', type:'Reference', action:'Updated follow-up', record:'REF-1042', context:'Member PWA', result:'Succeeded' },
  { id:'ACT-987', occurred:'22 Sep 2026 · 09:18', type:'Connection', action:'Accepted request', record:'CON-719', context:'Member PWA', result:'Succeeded' },
  { id:'ACT-976', occurred:'21 Sep 2026 · 16:24', type:'Opportunity', action:'Submitted response', record:'RSP-610', context:'Member PWA', result:'Succeeded' },
  { id:'ACT-962', occurred:'20 Sep 2026 · 11:02', type:'Security', action:'Signed in on Chrome', record:'Session S-219', context:'Member PWA', result:'Succeeded' },
];

const workflows: DemoRow[] = [
  { id:'WF-712', process:'Membership decision', subject:'Sara Thomas · Thrive Engineering', unit:'Hosur Chapter', assignee:'Chapter President', sla:'4h', priority:'High', status:'Due today' },
  { id:'WF-709', process:'Announcement approval', subject:'Buyer Meet reminder', unit:'Tamil Nadu North Region', assignee:'Regional Director', sla:'1d', priority:'Normal', status:'Assigned' },
  { id:'WF-701', process:'Attendance correction', subject:'Member M-1044 · 14 Sep meeting', unit:'Hosur Chapter', assignee:'Chapter Secretary', sla:'-6h', priority:'High', status:'Overdue' },
  { id:'WF-698', process:'Role nomination', subject:'Incoming Chapter Treasurer', unit:'Hosur Chapter', assignee:'Management', sla:'3d', priority:'Normal', status:'Consultation' },
];

const visitors: DemoRow[] = [
  { id:'VIS-3104', visitor:'Aditi Rao', business:'Aditi Fabworks', chapter:'Hosur Chapter', interest:'Join immediately', consent:'Current', followUp:'23 Sep 2026', reviewer:'Meera Narayanan', status:'Due diligence' },
  { id:'VIS-3105', visitor:'Mohit Jain', business:'MJ Industrial Coatings', chapter:'Hosur Chapter', interest:'Need time', consent:'Current', followUp:'27 Sep 2026', reviewer:'Unassigned', status:'Follow-up' },
  { id:'VIS-3106', visitor:'Sara Thomas', business:'Thrive Engineering', chapter:'Hosur Chapter', interest:'Join immediately', consent:'Current', followUp:'22 Sep 2026', reviewer:'Membership Committee', status:'Decision pending' },
  { id:'VIS-3097', visitor:'Ganesh Babu', business:'GB Techplast', chapter:'Hosur Chapter', interest:'Joined', consent:'Current', followUp:'12 Sep 2026', reviewer:'Meera Narayanan', status:'Converted' },
];

const onboarding: DemoRow[] = [
  { id:'APP-510', applicant:'Sara Thomas', business:'Thrive Engineering', stage:'Committee decision', identity:'Verified', businessReview:'Complete', payment:'Pending', owner:'Membership Committee', status:'Action required' },
  { id:'APP-506', applicant:'Ganesh Babu', business:'GB Techplast', stage:'Activation', identity:'Verified', businessReview:'Approved', payment:'Reconciled', owner:'Chapter Secretary', status:'Ready to activate' },
  { id:'APP-498', applicant:'Aditi Rao', business:'Aditi Fabworks', stage:'Due diligence', identity:'Verified', businessReview:'In progress', payment:'Not due', owner:'Meera Narayanan', status:'In review' },
];

const meetingsAdmin: DemoRow[] = [
  { id:'MTG-2409', meeting:'Chapter Business Meeting', unit:'Hosur Chapter', date:'24 Sep 2026 · 07:30', poll:'116 responded', registration:'—', agenda:'Published', minutes:'Not started', status:'Scheduled' },
  { id:'MTG-1809', meeting:'Regional Connect', unit:'Tamil Nadu North Region', date:'18 Sep 2026 · 16:00', poll:'74 responded', registration:'—', agenda:'Published', minutes:'Draft', status:'Completed' },
  { id:'MTG-1409', meeting:'Chapter Business Meeting', unit:'Hosur Chapter', date:'14 Sep 2026 · 07:30', poll:'121 responded', registration:'—', agenda:'Published', minutes:'Approved', status:'Finalised' },
];

const promotions: DemoRow[] = [
  { id:'PRO-118', campaign:'Member Business Spotlight · Oct', owner:'Astra Precision Components', scope:'Tamil Nadu', placement:'Home banner', period:'01–15 Oct 2026', commercial:'Approved', creative:'Pending review', status:'Awaiting creative approval' },
  { id:'PRO-112', campaign:'Buyer Meet Partner Tile', owner:'Enterprise Finance Desk', scope:'Tamil Nadu North Region', placement:'Event detail', period:'20–28 Sep 2026', commercial:'Approved', creative:'Approved', status:'Scheduled' },
  { id:'PRO-104', campaign:'Quality Workshop Promotion', owner:'Quality Excellence Forum', scope:'Hosur Chapter', placement:'Home card', period:'12–18 Sep 2026', commercial:'Approved', creative:'Approved', status:'Expired' },
];

const decisions: DemoRow[] = [
  { id:'DEC-204', proposal:'Approve updated role tenure policy', meeting:'Board Meeting 04', owner:'Governance Secretary', conflict:'None declared', vote:'Pending', actions:'2 proposed', status:'For decision' },
  { id:'DEC-197', proposal:'Approve regional expansion plan', meeting:'Board Meeting 03', owner:'Strategy Committee', conflict:'1 recusal', vote:'6–0', actions:'4 open', status:'Approved' },
  { id:'DEC-188', proposal:'Adopt promotion policy v2', meeting:'Board Meeting 02', owner:'Commercial Committee', conflict:'None', vote:'Unanimous consent', actions:'Closed', status:'Implemented' },
];

const boardPacks: DemoRow[] = [
  { id:'BP-04', meeting:'Board Meeting 04', date:'28 Sep 2026 · 10:30', papers:8, acknowledgements:'7 / 9', classification:'Confidential', version:'v3', status:'Published to Board' },
  { id:'BP-03', meeting:'Board Meeting 03', date:'12 Aug 2026 · 10:30', papers:7, acknowledgements:'9 / 9', classification:'Confidential', version:'Final', status:'Minutes approved' },
  { id:'BP-02', meeting:'Board Meeting 02', date:'18 Jun 2026 · 10:30', papers:6, acknowledgements:'9 / 9', classification:'Confidential', version:'Final', status:'Archived' },
];

const strategy: DemoRow[] = [
  { id:'OBJ-01', objective:'Increase verified business collaboration', measure:'Confirmed outcomes', target:'1,500 / year', actual:'1,142', owner:'Network Growth Committee', review:'Oct 2026', status:'On track' },
  { id:'OBJ-02', objective:'Improve Chapter participation', measure:'Average attendance', target:'85%', actual:'82%', owner:'Chapter Excellence Committee', review:'Oct 2026', status:'Watch' },
  { id:'OBJ-03', objective:'Strengthen governance closure', measure:'Decision SLA', target:'95%', actual:'89%', owner:'Governance Secretary', review:'Sep 2026', status:'Action required' },
];

const policies: DemoRow[] = [
  { id:'POL-18', policy:'Cross-Chapter connection policy', owner:'Member Experience', version:'v4', effective:'01 Oct 2026', acknowledgement:'Not required', exceptions:2, status:'Pending Board approval' },
  { id:'POL-17', policy:'Role tenure and handover', owner:'Governance', version:'v3', effective:'01 Apr 2026', acknowledgement:'Office bearers', exceptions:0, status:'Active' },
  { id:'POL-14', policy:'Promotion governance', owner:'Commercial Governance', version:'v2', effective:'01 Jul 2026', acknowledgement:'Promotion owners', exceptions:1, status:'Active' },
];

const exceptions: DemoRow[] = [
  { id:'EX-42', policy:'Attendance import control', requestor:'Operations', unit:'Hosur Chapter', reason:'Legacy device export gap', compensatingControl:'Independent checker + sample evidence', expiry:'30 Sep 2026', risk:'Medium', status:'Active' },
  { id:'EX-39', policy:'Promotion placement frequency', requestor:'Events Team', unit:'Tamil Nadu', reason:'Buyer meet launch window', compensatingControl:'Seven-day cap', expiry:'28 Sep 2026', risk:'Low', status:'Approved' },
  { id:'EX-36', policy:'Role delegation duration', requestor:'Regional Director', unit:'Tamil Nadu North', reason:'Travel period', compensatingControl:'Restricted actions', expiry:'15 Sep 2026', risk:'Low', status:'Expired' },
];

const roles: DemoRow[] = [
  { id:'RA-1', member:'Meera Narayanan', role:'Chapter Secretary', unit:'Hosur Chapter', starts:'01 Apr 2026', ends:'31 Mar 2027', delegation:'None', handover:'Not due', status:'Active' },
  { id:'RA-2', member:'Karthik Iyer', role:'Chapter Treasurer', unit:'Chennai Chapter', starts:'01 Apr 2026', ends:'31 Mar 2027', delegation:'Treasurer Delegate · 5 days', handover:'Not due', status:'Active' },
  { id:'RA-3', member:'Ravi Shankar', role:'Regional Convenor', unit:'Tamil Nadu West Region', starts:'01 Apr 2026', ends:'31 Mar 2027', delegation:'None', handover:'Not due', status:'Active' },
  { id:'RA-4', member:'Hari Krishnan', role:'Chapter President', unit:'Hosur Chapter', starts:'01 Apr 2025', ends:'31 Mar 2026', delegation:'—', handover:'Complete', status:'Expired · Past President' },
  { id:'RA-5', member:'Lakshmi Das', role:'Chapter Treasurer', unit:'Hosur Chapter', starts:'01 Apr 2027', ends:'31 Mar 2028', delegation:'—', handover:'Planned', status:'Scheduled' },
];

const identities: DemoRow[] = [
  { id:'USR-1004', account:'Arun Kumar', identifier:'a•••@example.in', verification:'Email + mobile verified', mfa:'Optional', sessions:2, lastSignIn:'22 Sep 2026 · 09:42', status:'Active' },
  { id:'USR-1012', account:'Meera Narayanan', identifier:'m•••@example.in', verification:'Email + mobile verified', mfa:'Required · verified', sessions:1, lastSignIn:'22 Sep 2026 · 08:38', status:'Active' },
  { id:'USR-1021', account:'Karthik Iyer', identifier:'k•••@example.in', verification:'Email + mobile verified', mfa:'Required · verified', sessions:2, lastSignIn:'21 Sep 2026 · 18:22', status:'Active' },
  { id:'USR-1048', account:'Pending applicant', identifier:'p•••@example.in', verification:'Email verified', mfa:'Not applicable', sessions:0, lastSignIn:'—', status:'Invitation pending' },
];

const hierarchy: DemoRow[] = [
  { id:'OU-IN', type:'Country', code:'IN', name:'India', parent:'—', effective:'2024 →', memberCount:4286, status:'Active' },
  { id:'OU-TN', type:'State', code:'TN', name:'Tamil Nadu', parent:'India', effective:'2024 →', memberCount:2140, status:'Active' },
  { id:'OU-TNN', type:'Region', code:'TN-N', name:'Tamil Nadu North', parent:'Tamil Nadu', effective:'2025 →', memberCount:1084, status:'Active' },
  { id:'OU-HSR', type:'City', code:'HSR', name:'Hosur', parent:'Tamil Nadu North', effective:'2025 →', memberCount:326, status:'Active' },
  { id:'OU-HSR-C', type:'Chapter', code:'HSR-C', name:'Hosur Chapter', parent:'Hosur', effective:'2025 →', memberCount:214, status:'Active' },
];

const rbac: DemoRow[] = [
  { id:'RB-01', role:'Member', resource:'MemberProfile', action:'View', scope:'Same Chapter', condition:'Visibility permits', fields:'Profile-safe', effect:'Allow' },
  { id:'RB-02', role:'Member', resource:'DirectMessage', action:'Create', scope:'Connected Member', condition:'Connection active', fields:'Message', effect:'Allow' },
  { id:'RB-03', role:'Chapter Secretary', resource:'Attendance', action:'Finalise', scope:'Assigned Chapter', condition:'Meeting published', fields:'Operational', effect:'Allow' },
  { id:'RB-04', role:'Platform Administrator', resource:'MembershipDecision', action:'Approve', scope:'Any', condition:'No business authority', fields:'—', effect:'Deny' },
];

const raci: DemoRow[] = [
  { id:'RC-01', process:'Chapter meeting', step:'Publish agenda', responsible:'Secretary / Convenor', accountable:'Chapter President', consulted:'EC / Committee', informed:'Members' },
  { id:'RC-02', process:'Visitor onboarding', step:'Membership decision', responsible:'Membership Officer', accountable:'Chapter President', consulted:'Committee', informed:'Applicant' },
  { id:'RC-03', process:'Payment posting', step:'Checker approval', responsible:'Treasurer Delegate', accountable:'Treasurer', consulted:'Secretary', informed:'Member' },
  { id:'RC-04', process:'Policy exception', step:'Approve', responsible:'Management', accountable:'Board', consulted:'Security / Data', informed:'Affected units' },
];

const workflowDefinitions: DemoRow[] = [
  { id:'WFD-12', workflow:'Membership onboarding', version:'v8', states:7, sla:'5 business days', makerChecker:'Yes', published:'15 Sep 2026', status:'Active' },
  { id:'WFD-09', workflow:'Payment reconciliation', version:'v6', states:6, sla:'2 business days', makerChecker:'Yes', published:'02 Sep 2026', status:'Active' },
  { id:'WFD-07', workflow:'Announcement approval', version:'v4', states:4, sla:'1 business day', makerChecker:'Yes', published:'21 Aug 2026', status:'Active' },
];

const lookups: DemoRow[] = [
  { id:'LKP-101', taxonomy:'Business Category', code:'PREC-MFG', label:'Precision Manufacturing', parent:'Manufacturing', synonyms:'CNC · Machining', usage:128, status:'Active' },
  { id:'LKP-102', taxonomy:'Opportunity Type', code:'REQ', label:'Requirement', parent:'—', synonyms:'Buy · Need', usage:406, status:'Active' },
  { id:'LKP-103', taxonomy:'Meeting Type', code:'CHAPTER', label:'Chapter Business Meeting', parent:'Meeting', synonyms:'Monthly chapter meeting', usage:118, status:'Active' },
  { id:'LKP-104', taxonomy:'Reason Code', code:'PAY-MISMATCH', label:'Payment amount mismatch', parent:'Payment exception', synonyms:'Underpay · Overpay', usage:31, status:'Active' },
];

const forms: DemoRow[] = [
  { id:'FORM-18', form:'Visitor Registration', version:'v5', fields:18, workflow:'Visitor onboarding', consent:'Required', lastPublished:'19 Sep 2026', status:'Active' },
  { id:'FORM-15', form:'Opportunity Posting', version:'v4', fields:16, workflow:'Opportunity approval', consent:'Not applicable', lastPublished:'12 Sep 2026', status:'Active' },
  { id:'FORM-11', form:'Attendance Correction', version:'v3', fields:9, workflow:'Attendance correction', consent:'Not applicable', lastPublished:'01 Sep 2026', status:'Active' },
];

const imports: DemoRow[] = [
  { id:'IMP-450', type:'Attendance', source:'CSV Upload', unit:'Hosur Chapter', rows:42, valid:39, exceptions:3, reconciliation:'39 matched', checker:'Pending', status:'Awaiting checker' },
  { id:'IMP-449', type:'Payment', source:'Payment API', unit:'Chennai Chapter', rows:18, valid:18, exceptions:0, reconciliation:'₹90,000 matched', checker:'Approved', status:'Posted' },
  { id:'IMP-446', type:'Attendance', source:'Attendance API', unit:'Tamil Nadu North Region', rows:164, valid:160, exceptions:4, reconciliation:'160 matched', checker:'Approved', status:'Reconciled' },
];

const integrations: DemoRow[] = [
  { id:'INT-01', integration:'Attendance API', type:'Inbound', endpoint:'Configured', auth:'Client credential', lastSuccess:'22 Sep · 08:42', failures24h:0, status:'Healthy' },
  { id:'INT-02', integration:'Payment API', type:'Inbound', endpoint:'Configured', auth:'Signed webhook', lastSuccess:'22 Sep · 08:38', failures24h:0, status:'Healthy' },
  { id:'INT-03', integration:'Email notifications', type:'Outbound', endpoint:'Configured', auth:'Service account', lastSuccess:'22 Sep · 08:21', failures24h:3, status:'Degraded' },
  { id:'INT-04', integration:'Search index', type:'Internal', endpoint:'Configured', auth:'Managed identity', lastSuccess:'22 Sep · 08:44', failures24h:0, status:'Healthy' },
];

const moderation: DemoRow[] = [
  { id:'MOD-209', content:'Member profile', record:'M-1219', report:'Potential promotional claim', reporter:'Member', age:'2h', evidence:'Profile text', reviewer:'Unassigned', status:'Open' },
  { id:'MOD-204', content:'Gallery image', record:'GAL-37-IMG-14', report:'Consent concern', reporter:'Member', age:'6h', evidence:'Image metadata', reviewer:'Privacy reviewer', status:'In review' },
  { id:'MOD-198', content:'Promotion creative', record:'PRO-118', report:'Unverified claim', reporter:'Commercial reviewer', age:'1d', evidence:'Creative v2', reviewer:'Moderation team', status:'Action required' },
];

const notificationTemplates: DemoRow[] = [
  { id:'NTF-01', template:'Connection request received', channel:'In-app + email', mandatory:'No', audience:'Member', retries:'3', locale:'English', lastPublished:'10 Sep 2026', status:'Active' },
  { id:'NTF-02', template:'Payment receipt issued', channel:'Email + in-app', mandatory:'Yes', audience:'Payer', retries:'5', locale:'English', lastPublished:'12 Sep 2026', status:'Active' },
  { id:'NTF-03', template:'Workflow SLA escalation', channel:'In-app + email', mandatory:'Yes', audience:'Assignee + accountable', retries:'5', locale:'English', lastPublished:'18 Sep 2026', status:'Active' },
];

const promotionInventory: DemoRow[] = [
  { id:'PIN-01', placement:'Member Home hero card', allowedScopes:'Chapter · City · Region · State', eligibility:'Approved commercial owner', frequency:'1 / 7 days', pricingRule:'Configured', approvals:'Commercial + creative', status:'Active' },
  { id:'PIN-02', placement:'Event detail partner tile', allowedScopes:'Event audience', eligibility:'Event partner', frequency:'Always on event page', pricingRule:'Package based', approvals:'Commercial + creative', status:'Active' },
  { id:'PIN-03', placement:'Directory category sponsor', allowedScopes:'State · Country', eligibility:'Approved partner', frequency:'1 / session', pricingRule:'Monthly', approvals:'Commercial + creative', status:'Paused' },
];

const audit: DemoRow[] = [
  { id:'AUD-9021', occurred:'22 Sep 2026 · 10:42', actor:'Meera Narayanan', assignment:'Chapter Secretary', portal:'Management', action:'VISITOR_UPDATE', resource:'VIS-3104', result:'Succeeded', correlationId:'COR-7A82' },
  { id:'AUD-9018', occurred:'22 Sep 2026 · 10:39', actor:'Karthik Iyer', assignment:'Chapter Treasurer', portal:'Management', action:'PAYMENT_POST', resource:'BAT-908', result:'Pending', correlationId:'COR-7A75' },
  { id:'AUD-9013', occurred:'22 Sep 2026 · 10:32', actor:'System Reviewer', assignment:'System Reviewer', portal:'Platform Admin', action:'RBAC_SIMULATE', resource:'RBAC-v14', result:'Succeeded', correlationId:'COR-7A61' },
  { id:'AUD-9008', occurred:'22 Sep 2026 · 10:25', actor:'Unknown role', assignment:'Expired', portal:'Management', action:'MEMBER_EXPORT', resource:'Hosur Chapter', result:'Denied', correlationId:'COR-7A49' },
];

const quality: DemoRow[] = [
  { id:'DQ-441', rule:'Potential duplicate person', entity:'M-1028 / M-2094', unit:'Hosur Chapter', confidence:'94%', severity:'High', owner:'Data Steward', status:'Open' },
  { id:'DQ-438', rule:'Missing business category', entity:'B-1440', unit:'Coimbatore Chapter', confidence:'100%', severity:'Medium', owner:'Chapter Secretary', status:'Assigned' },
  { id:'DQ-429', rule:'Expired role still mapped', entity:'RA-882', unit:'Tamil Nadu North Region', confidence:'100%', severity:'High', owner:'Platform Admin', status:'Action required' },
  { id:'DQ-421', rule:'Unmatched payment import', entity:'IMP-449 row 17', unit:'Chennai Chapter', confidence:'82%', severity:'Medium', owner:'Treasurer', status:'Under review' },
];

const settings: DemoRow[] = [
  { id:'SET-01', group:'Security', setting:'Require MFA for privileged workspaces', value:'Enabled', environment:'All', changeControl:'Maker-checker', status:'Effective' },
  { id:'SET-02', group:'PWA', setting:'Offline reference cache duration', value:'24 hours', environment:'Production', changeControl:'Platform approval', status:'Effective' },
  { id:'SET-03', group:'Retention', setting:'Expired visitor draft retention', value:'30 days', environment:'All', changeControl:'Policy bound', status:'Effective' },
  { id:'SET-04', group:'Feature', setting:'Opportunity response Q&A', value:'Enabled', environment:'All', changeControl:'Feature flag', status:'Effective' },
];

function categories(): DemoRow[] {
  return [
    { id:'CAT-01', category:'Manufacturing', subcategories:18, members:436, businesses:398, synonyms:'Production · Factory', status:'Active' },
    { id:'CAT-02', category:'Industrial Automation', subcategories:9, members:124, businesses:116, synonyms:'PLC · Controls · MES', status:'Active' },
    { id:'CAT-03', category:'Professional Services', subcategories:13, members:207, businesses:184, synonyms:'Consulting · Advisory', status:'Active' },
    { id:'CAT-04', category:'Industrial Supplies', subcategories:11, members:161, businesses:149, synonyms:'MRO · Consumables', status:'Active' },
    { id:'CAT-05', category:'Packaging', subcategories:7, members:88, businesses:81, synonyms:'Export pack · Protective pack', status:'Active' },
  ];
}

function profileFields(): DemoRow[] {
  return [
    { id:'PF-01', section:'Identity', field:'Display name', value:'Arun Kumar', visibility:'Network', approval:'Direct edit', status:'Complete' },
    { id:'PF-02', section:'Professional', field:'Headline', value:'Founder · Precision manufacturing', visibility:'Network', approval:'Direct edit', status:'Complete' },
    { id:'PF-03', section:'Contact', field:'Mobile', value:'+91 •••••• 4821', visibility:'Connections', approval:'Verification required', status:'Verified' },
    { id:'PF-04', section:'Capability', field:'Skills / interests', value:'CNC · Supplier development · Quality', visibility:'Network', approval:'Direct edit', status:'Complete' },
    { id:'PF-05', section:'Photo', field:'Profile photo', value:'Uploaded', visibility:'Network', approval:'Moderation', status:'Approved' },
  ];
}

function familyRows(): DemoRow[] {
  return [
    { id:'FAM-01', relation:'Spouse', name:'Optional record', purpose:'Approved event / family programme only', visibility:'Private', consent:'Current', status:'Active' },
    { id:'FAM-02', relation:'Child', name:'Optional record', purpose:'Approved family programme only', visibility:'Private', consent:'Current', status:'Active' },
  ];
}

function membershipRows(): DemoRow[] {
  return [
    { id:'MEM-2024-1024', membershipNo:'DBN-HSR-1024', chapter:'Hosur Chapter', joined:'14 Jun 2024', currentPeriod:'2026–2027', renewal:'Reconciled', lifecycle:'Active', status:'Good standing' },
    { id:'TEN-01', membershipNo:'Role history', chapter:'Hosur Chapter', joined:'01 Apr 2025', currentPeriod:'Committee Member', renewal:'Ended 31 Mar 2026', lifecycle:'Historical', status:'Past role' },
  ];
}

function reports(): DemoRow[] {
  return [
    { id:'RPT-01', report:'Membership and visitor funnel', dimensions:'Period · Unit · Stage', freshness:'10 min', export:'CSV / PDF', classification:'Operational', status:'Available' },
    { id:'RPT-02', report:'Attendance and participation', dimensions:'Period · Meeting · Member', freshness:'Finalised meetings', export:'CSV / PDF', classification:'Operational', status:'Available' },
    { id:'RPT-03', report:'Business references and outcomes', dimensions:'Period · Category · Unit', freshness:'Daily', export:'Aggregated only', classification:'Restricted', status:'Available' },
    { id:'RPT-04', report:'Payments and reconciliation', dimensions:'Period · Type · Status', freshness:'Near real time', export:'Permission controlled', classification:'Financial', status:'Available' },
  ];
}

function settingsRows(screenId:number): DemoRow[] {
  if(screenId===39) return [
    { id:'PRV-01', setting:'Profile visibility outside Chapter', value:'Preview only', mandatory:'No', impact:'Contact stays hidden until connection', status:'Active' },
    { id:'PRV-02', setting:'Allow connection requests', value:'Yes', mandatory:'No', impact:'Eligible members can request connection', status:'Active' },
    { id:'PRV-03', setting:'Business contact visibility', value:'Connections only', mandatory:'No', impact:'Phone/email hidden from unconnected members', status:'Active' },
  ];
  if(screenId===40) return [
    { id:'NOT-01', topic:'Connection requests', inApp:'On', email:'On', sms:'Off', mandatory:'No', status:'Active' },
    { id:'NOT-02', topic:'Payment receipts', inApp:'On', email:'On', sms:'Off', mandatory:'Yes', status:'Locked on' },
    { id:'NOT-03', topic:'Event reminders', inApp:'On', email:'Off', sms:'Off', mandatory:'No', status:'Active' },
    { id:'NOT-04', topic:'Security alerts', inApp:'On', email:'On', sms:'On', mandatory:'Yes', status:'Locked on' },
  ];
  if(screenId===41) return [
    { id:'SEC-01', control:'Password', value:'Changed 48 days ago', action:'Change password', risk:'Normal', status:'Healthy' },
    { id:'SEC-02', control:'MFA', value:'Authenticator + recovery codes', action:'Review methods', risk:'Low', status:'Enabled' },
    { id:'SEC-03', control:'Trusted devices', value:'2 devices', action:'Review devices', risk:'Normal', status:'Active' },
    { id:'SEC-04', control:'Active sessions', value:'2 sessions', action:'Sign out others', risk:'Normal', status:'Active' },
  ];
  return settings;
}

export function rowsForScreen(screen: ScreenDefinition): DemoRow[] {
  switch(screen.id){
    case 3: case 5: case 7: case 8: return members;
    case 4: return categories();
    case 6: case 33: return businesses;
    case 9: return connections;
    case 10: case 11: return references;
    case 12: return transactions;
    case 13: return oneToOnes;
    case 14: return thankYou;
    case 15: case 16: case 17: case 18: return opportunities;
    case 19: case 20: return responses;
    case 21: case 22: return [
      { id:'CHAT-01', conversation:'Ramesh Iyer', context:'Direct · Connected', unread:2, lastMessage:'I have shared the updated requirement.', updated:'09:42', status:'Authorised' },
      { id:'CHAT-02', conversation:'Hosur Chapter Business Forum', context:'Chapter group', unread:5, lastMessage:'Agenda for Thursday is now available.', updated:'Yesterday', status:'Authorised' },
      { id:'CHAT-03', conversation:'Deepa Raman', context:'Connection pending', unread:0, lastMessage:'Messaging locked until connection is accepted.', updated:'18 Sep', status:'Restricted' },
    ];
    case 23: case 51: return announcements;
    case 24: case 25: case 26: case 48: case 52: return events;
    case 27: case 53: return gallery;
    case 28: return news;
    case 29: return partners;
    case 30: return resources;
    case 31: return [
      { id:'CASE-418', topic:'Directory correction', subject:'Business category update', opened:'18 Sep 2026', owner:'Member Support', priority:'Normal', nextUpdate:'23 Sep 2026', status:'In progress' },
      { id:'CASE-409', topic:'Payment receipt', subject:'Receipt copy request', opened:'12 Sep 2026', owner:'Finance Support', priority:'Normal', nextUpdate:'Closed', status:'Resolved' },
    ];
    case 32: return profileFields();
    case 34: return familyRows();
    case 35: return membershipRows();
    case 36: case 49: return attendance;
    case 37: case 50: return payments;
    case 38: return activity;
    case 39: case 40: case 41: case 80: return settingsRows(screen.id);
    case 42: return [
      { id:'PWA-01', capability:'App shell', offline:'Available', storage:'Cache storage', sensitiveData:'Not cached', update:'Automatic prompt', status:'Ready' },
      { id:'PWA-02', capability:'Directory reference data', offline:'Approved subset only', storage:'Cache with expiry', sensitiveData:'Restricted fields excluded', update:'Revalidate online', status:'Configured' },
      { id:'PWA-03', capability:'Chat / payments / family', offline:'Unavailable', storage:'Not cached', sensitiveData:'Protected', update:'Online only', status:'Protected' },
    ];
    case 44: return workflows;
    case 45: return members;
    case 46: return visitors;
    case 47: return onboarding;
    case 54: return promotions;
    case 55: return reports();
    case 57: return decisions;
    case 58: return boardPacks;
    case 59: return strategy;
    case 60: return policies;
    case 61: return exceptions;
    case 62: case 63: case 67: return roles;
    case 65: return identities;
    case 66: return hierarchy;
    case 68: return rbac;
    case 69: return raci;
    case 70: return workflowDefinitions;
    case 71: return lookups;
    case 72: return forms;
    case 73: return imports;
    case 74: return integrations;
    case 75: return moderation;
    case 76: return notificationTemplates;
    case 77: return promotionInventory;
    case 78: return audit;
    case 79: return quality;
    default: return Array.from({length:6},(_,i)=>({
      id:`${String(screen.id).padStart(2,'0')}-${100+i}`,
      record:`${screen.title} record ${i+1}`,
      unit:i%2?'Hosur Chapter':'Tamil Nadu',
      owner:['Meera Narayanan','Karthik Iyer','Arun Kumar'][i%3],
      updated:`${22-i} Sep 2026`,
      status:['Active','Pending review','Approved','Action required','Scheduled','Reconciled'][(screen.id+i)%6]
    }));
  }
}


export type OperationalVariant = 'register' | 'queue' | 'matrix' | 'hierarchy' | 'builder' | 'report' | 'audit' | 'settings' | 'integration';

export interface OperationalRow {
  id: string;
  primary: string;
  secondary: string;
  owner: string;
  scope: string;
  status: string;
  updated: string;
  detail: string;
}

export interface OperationalDefinition {
  id: number;
  title: string;
  description: string;
  variant: OperationalVariant;
  noun: string;
  createLabel?: string;
  rows: OperationalRow[];
  matrix?: { rows: string[]; columns: string[]; enabled: string[] };
  settings?: { key: string; label: string; description: string; enabled: boolean }[];
}

const r=(id:string,primary:string,secondary:string,owner:string,scope:string,status:string,updated:string,detail:string):OperationalRow=>({id,primary,secondary,owner,scope,status,updated,detail});

export const operationalRegistry: Record<number, OperationalDefinition> = {
44:{id:44,title:'Workflow Inbox',description:'Review approvals, exceptions and follow-ups routed to your management scope.',variant:'queue',noun:'workflow task',rows:[
 r('wf-101','Approve new member application','Application completed with business and chapter details','Membership Team','Chennai Chapter','Pending','23 Sep 2026, 09:20','Validate membership information, chapter mapping and supporting documents before approval.'),
 r('wf-102','Resolve payment exception','Renewal payment recorded without membership allocation','Finance Desk','Tamil Nadu','Needs review','23 Sep 2026, 08:45','Match the payment reference to the member and confirm the effective membership period.'),
 r('wf-103','Publish event communication','Regional networking event announcement is ready for release','Communications Team','South Region','Ready','22 Sep 2026, 18:10','Review audience scope and publishing schedule before release.')
]},
45:{id:45,title:'Member Management',description:'Search, review and maintain member records within authorised organisational scope.',variant:'register',noun:'member',createLabel:'Add member',rows:[
 r('mem-201','Arun Prakash','Director · Apex Precision Systems','Chapter Administrator','Chennai Chapter','Active','23 Sep 2026','Membership active through 31 Mar 2027. Business profile is complete.'),
 r('mem-202','Meera Krishnan','Founder · Vector Automation','Membership Team','Hosur Chapter','Active','22 Sep 2026','Primary category: Industrial Automation. Two active business locations.'),
 r('mem-203','Karthik Raman','Partner · KVR Components','Membership Team','Coimbatore Chapter','Renewal due','21 Sep 2026','Membership renewal is due within 30 days; payment reminder has been sent.')
]},
46:{id:46,title:'Visitor Management',description:'Track prospective members and event visitors from first contact through conversion.',variant:'register',noun:'visitor',createLabel:'Add visitor',rows:[
 r('vis-301','Nithya Engineering Works','Referred by an existing member','Chapter Team','Chennai Chapter','Follow-up','23 Sep 2026','Interested in member networking and supplier discovery. Follow-up call requested.'),
 r('vis-302','Pranav Industrial Services','Met at regional business event','Events Team','South Region','Qualified','22 Sep 2026','Business profile captured; eligible for chapter onboarding.'),
 r('vis-303','Sree Tools & Dies','Website enquiry','Membership Team','Hosur Chapter','New','22 Sep 2026','Initial enquiry received. Chapter and business category need confirmation.')
]},
47:{id:47,title:'Member Onboarding',description:'Move approved applicants through verification, chapter assignment and activation.',variant:'queue',noun:'onboarding case',rows:[
 r('onb-401','Nithya Engineering Works','Documents verified; chapter assignment pending','Membership Team','Chennai Chapter','In progress','23 Sep 2026','Assign chapter, validate business category and issue member login after final approval.'),
 r('onb-402','Mitra Process Controls','Payment completed; profile completion pending','Onboarding Desk','Hosur Chapter','Waiting on member','22 Sep 2026','Member must add primary business capability and contact preferences.'),
 r('onb-403','Aadhi Plastics','Application approved','Chapter Administrator','Coimbatore Chapter','Ready to activate','22 Sep 2026','All checks complete. Account activation and welcome communication can be issued.')
]},
48:{id:48,title:'Meeting Administration',description:'Plan chapter and organisational meetings, participation and completion follow-up.',variant:'register',noun:'meeting',createLabel:'Schedule meeting',rows:[
 r('mtg-501','Chennai Chapter Monthly Meet','26 Sep 2026 · 18:00 · Chennai','Chapter Secretary','Chennai Chapter','Scheduled','23 Sep 2026','Agenda published. Attendance response is open until 25 Sep 2026.'),
 r('mtg-502','South Region Leadership Review','28 Sep 2026 · 10:30 · Online','Regional Office','South Region','Scheduled','22 Sep 2026','Leadership review covering membership growth, events and opportunity activity.'),
 r('mtg-503','Hosur Buyer–Seller Follow-up','24 Sep 2026 · 15:00 · Hosur','Business Connect Team','Hosur Chapter','Confirmation pending','22 Sep 2026','Confirm participating members and outstanding buyer follow-up actions.')
]},
49:{id:49,title:'Attendance Administration',description:'Review attendance capture, exceptions and meeting participation records.',variant:'register',noun:'attendance record',rows:[
 r('att-601','Chennai Chapter Monthly Meet · Aug','118 present · 9 absent · 4 excused','Chapter Secretary','Chennai Chapter','Closed','20 Sep 2026','Attendance is reconciled and locked for the August meeting.'),
 r('att-602','Regional Business Connect','86 present · 7 records need review','Events Team','South Region','Needs review','22 Sep 2026','Seven check-ins have duplicate or incomplete member references.'),
 r('att-603','Hosur Chapter Weekly Connect','42 present · 3 absent','Chapter Secretary','Hosur Chapter','Open','23 Sep 2026','Attendance remains open for authorised correction until end of day.')
]},
50:{id:50,title:'Payment Administration',description:'Reconcile membership payments, dues and exceptions without exposing unnecessary financial data.',variant:'queue',noun:'payment record',rows:[
 r('pay-701','Membership renewal · Karthik Raman','₹12,000 · reference UTR-902184','Finance Desk','Coimbatore Chapter','Needs allocation','23 Sep 2026','Payment is received but the renewal period has not yet been applied.'),
 r('pay-702','New membership · Aadhi Plastics','₹15,000 · online payment','Finance Desk','Coimbatore Chapter','Paid','22 Sep 2026','Payment verified and linked to onboarding case onb-403.'),
 r('pay-703','Membership renewal · S. Balaji','₹12,000 · due 30 Sep 2026','Finance Desk','Chennai Chapter','Due','22 Sep 2026','Automated reminder issued; no payment reference received yet.')
]},
51:{id:51,title:'Announcement Management',description:'Draft, target, schedule and publish organisational announcements.',variant:'builder',noun:'announcement',createLabel:'Create announcement',rows:[
 r('ann-801','Chapter meeting reminder','Target: Chennai Chapter · Publish 24 Sep','Communications Team','Chennai Chapter','Scheduled','23 Sep 2026','Reminder includes meeting venue, RSVP link and agenda summary.'),
 r('ann-802','New opportunity categories available','Target: All members','Platform Communications','National','Published','22 Sep 2026','Introduces expanded product and service categories for matching.'),
 r('ann-803','Regional event registration','Target: South Region','Events Team','South Region','Draft','22 Sep 2026','Registration copy is awaiting venue confirmation.')
]},
52:{id:52,title:'Event Management',description:'Manage event publishing, registration windows, attendance and post-event follow-up.',variant:'builder',noun:'event',createLabel:'Create event',rows:[
 r('evt-901','South Region Supplier Connect','04 Oct 2026 · Bengaluru','Events Team','South Region','Registration open','23 Sep 2026','Capacity 250. Registration is open to members across the South Region.'),
 r('evt-902','Chennai Manufacturing Roundtable','30 Sep 2026 · Chennai','Chapter Team','Chennai Chapter','Published','22 Sep 2026','Roundtable for manufacturing members; 64 registrations recorded.'),
 r('evt-903','Digital Capability Workshop','12 Oct 2026 · Online','Learning Team','National','Draft','21 Sep 2026','Speaker confirmation pending before publication.')
]},
53:{id:53,title:'Gallery Management',description:'Curate event media, captions and publishing visibility.',variant:'register',noun:'gallery collection',createLabel:'Create gallery',rows:[
 r('gal-1001','MSME Sangamam · Hosur 2026','84 approved media items','Media Team','Hosur Chapter','Published','22 Sep 2026','Event gallery includes inauguration, business meetings and exhibitor interactions.'),
 r('gal-1002','Chennai Chapter August Meet','31 media items · 2 pending review','Chapter Communications','Chennai Chapter','Needs review','21 Sep 2026','Two uploads require caption and consent verification.'),
 r('gal-1003','South Region Leadership Meet','18 media items','Regional Office','South Region','Draft','20 Sep 2026','Collection prepared; publishing audience not yet selected.')
]},
55:{id:55,title:'Operational Reports',description:'Review membership, engagement and operational measures with clear drill-down context.',variant:'report',noun:'report',rows:[
 r('rep-1101','Membership health','Active, renewal-due and onboarding status','Membership Team','Authorised scope','Current','23 Sep 2026','Use this report to identify renewal risk and incomplete onboarding cases.'),
 r('rep-1102','Network engagement','Connections, meetings, opportunities and event activity','Operations Team','Authorised scope','Current','23 Sep 2026','Highlights participation trends without exposing private message content.'),
 r('rep-1103','Payment reconciliation','Paid, due and exception records','Finance Desk','Authorised scope','Current','23 Sep 2026','Reconciles membership payment status and unresolved allocation exceptions.')
]},
57:{id:57,title:'Decision Register',description:'Record formal governance decisions, owners, due dates and implementation status.',variant:'register',noun:'decision',createLabel:'Record decision',rows:[
 r('dec-1201','Approve Q4 member engagement plan','Approved at Management Board meeting','Board Secretariat','National','Approved','20 Sep 2026','Implementation owner: Membership Committee. First progress review due 15 Oct 2026.'),
 r('dec-1202','Standardise regional event reporting','Decision requires implementation across regions','Board Secretariat','National','In progress','18 Sep 2026','Regional offices to adopt the common post-event reporting template.'),
 r('dec-1203','Review promotion governance thresholds','Referred to Policy Committee','Policy Committee','National','Under review','15 Sep 2026','Assess approval thresholds for national and cross-region promotion campaigns.')
]},
58:{id:58,title:'Board Packs',description:'Prepare board meeting packs with controlled agenda, papers and publication status.',variant:'builder',noun:'board pack',createLabel:'Create board pack',rows:[
 r('bp-1301','Management Board · October 2026','Meeting date: 10 Oct 2026 · 8 papers','Board Secretariat','National','In preparation','23 Sep 2026','Five papers approved, two under review and one awaiting submission.'),
 r('bp-1302','Management Board · September 2026','Meeting held 12 Sep 2026 · 10 papers','Board Secretariat','National','Closed','13 Sep 2026','Final pack and approved minutes are locked for governance history.'),
 r('bp-1303','Policy Committee · Q4 Review','Meeting date: 18 Oct 2026 · 4 papers','Policy Secretariat','National','Draft','21 Sep 2026','Agenda is being assembled from scheduled policy review items.')
]},
59:{id:59,title:'Strategy Outcomes',description:'Track strategic outcomes, measures, owners and delivery confidence.',variant:'report',noun:'strategy outcome',rows:[
 r('str-1401','Increase meaningful member connections','Q4 target: +20% completed one-to-one meetings','Membership Committee','National','On track','23 Sep 2026','Current run-rate is aligned to the quarterly target; regional variation remains.'),
 r('str-1402','Expand opportunity participation','Improve buyer and supplier response conversion','Business Connect Committee','National','Watch','22 Sep 2026','Opportunity creation is healthy; supplier response completion requires attention.'),
 r('str-1403','Improve data completeness','95% complete member and business profiles','Platform Committee','National','In progress','22 Sep 2026','Profile completion has improved; legacy records remain below target.')
]},
60:{id:60,title:'Policy Register',description:'Maintain approved governance policies, effective dates and review ownership.',variant:'register',noun:'policy',createLabel:'Add policy',rows:[
 r('pol-1501','Member Data & Privacy Policy','Version 3.2 · effective 01 Jul 2026','Policy Committee','National','Active','20 Sep 2026','Annual review due June 2027. Applies to member profile and communication data.'),
 r('pol-1502','Promotion & Sponsorship Policy','Version 2.1 · effective 15 Aug 2026','Policy Committee','National','Active','18 Sep 2026','Defines targeting, approval and disclosure requirements for promotions.'),
 r('pol-1503','Chapter Event Governance','Version 1.8 · review due 30 Sep 2026','Events Committee','National','Review due','22 Sep 2026','Scheduled review covers approvals, attendance and post-event reporting.')
]},
61:{id:61,title:'Policy Exceptions',description:'Review time-bound policy exceptions with evidence, approver and expiry controls.',variant:'queue',noun:'policy exception',rows:[
 r('pex-1601','Extended promotion placement','Regional campaign requests 10-day extension','Policy Committee','South Region','Pending approval','23 Sep 2026','Extension is within campaign budget but exceeds standard placement duration.'),
 r('pex-1602','Temporary chapter administrator delegation','Cover required during authorised leave','Governance Secretariat','Chennai Chapter','Approved','22 Sep 2026','Delegation expires automatically on 30 Sep 2026.'),
 r('pex-1603','Late event report submission','Regional office requests five-day extension','Events Committee','West Region','Closed','18 Sep 2026','Exception completed and evidence attached to governance history.')
]},
62:{id:62,title:'Role & Tenure Oversight',description:'Monitor governance appointments, tenure dates, delegations and upcoming expiries.',variant:'register',noun:'role assignment',rows:[
 r('role-1701','State President · Tamil Nadu','Current term ends 31 Mar 2027','Governance Secretariat','Tamil Nadu','Active','20 Sep 2026','No action currently required.'),
 r('role-1702','Chapter Secretary · Chennai','Current term ends 31 Oct 2026','State Secretariat','Chennai Chapter','Expiry approaching','23 Sep 2026','Succession/renewal review should start before 01 Oct 2026.'),
 r('role-1703','Regional Event Coordinator · South','Delegated through 30 Sep 2026','Regional Secretariat','South Region','Temporary','22 Sep 2026','Delegation will expire automatically unless renewed through governance workflow.')
]},
63:{id:63,title:'Governance History',description:'Search the immutable history of decisions, policy changes and governance actions.',variant:'audit',noun:'history record',rows:[
 r('hist-1801','Decision dec-1201 approved','Management Board approved Q4 engagement plan','Board Secretariat','National','Recorded','20 Sep 2026, 17:42','Decision text, attendance and approved paper references are retained.'),
 r('hist-1802','Policy pol-1502 activated','Promotion & Sponsorship Policy v2.1 became effective','Policy Secretariat','National','Recorded','15 Aug 2026, 00:01','Superseded policy version remains available in historical view.'),
 r('hist-1803','Role delegation role-1703 created','Temporary Regional Event Coordinator delegation','Governance Secretariat','South Region','Recorded','01 Sep 2026, 09:10','Delegation includes start/end dates and approving authority.')
]},
65:{id:65,title:'Identity Administration',description:'Manage platform identities, account lifecycle and access status.',variant:'register',noun:'identity',createLabel:'Create identity',rows:[
 r('idn-1901','arun.prakash@example.in','Linked member: Arun Prakash','Identity Operations','Member','Active','23 Sep 2026','MFA available. Last successful sign-in: 23 Sep 2026 08:14.'),
 r('idn-1902','chapter.admin@example.in','Administrative account','Identity Operations','Chennai Chapter','Active','23 Sep 2026','Management workspace access with chapter scope.'),
 r('idn-1903','legacy.user@example.in','Legacy identity pending verification','Identity Operations','Member','Suspended','21 Sep 2026','Access suspended until email and member linkage are verified.')
]},
66:{id:66,title:'Organisation Hierarchy',description:'Maintain country, state, region and chapter structure used by scope and access controls.',variant:'hierarchy',noun:'organisation unit',createLabel:'Add unit',rows:[
 r('org-2001','India','Country','Platform Administration','Country','Active','23 Sep 2026','Root organisational unit for the current network.'),
 r('org-2002','Tamil Nadu','State under India','Platform Administration','State','Active','23 Sep 2026','Contains South Region chapters and state-level administration.'),
 r('org-2003','South Region','Region under Tamil Nadu','Platform Administration','Region','Active','23 Sep 2026','Contains Chennai, Hosur and Coimbatore chapters.'),
 r('org-2004','Chennai Chapter','Chapter under South Region','Platform Administration','Chapter','Active','23 Sep 2026','Chapter scope used by members, events, promotions and administrators.')
]},
67:{id:67,title:'Role Assignments',description:'Assign roles to identities with explicit organisational scope and effective dates.',variant:'register',noun:'role assignment',createLabel:'Assign role',rows:[
 r('asg-2101','Chapter Administrator','chapter.admin@example.in','Access Governance','Chennai Chapter','Active','23 Sep 2026','Effective 01 Apr 2026 through 31 Mar 2027.'),
 r('asg-2102','State Membership Manager','membership.tn@example.in','Access Governance','Tamil Nadu','Active','22 Sep 2026','Membership administration across Tamil Nadu chapters.'),
 r('asg-2103','Regional Event Coordinator','events.south@example.in','Access Governance','South Region','Temporary','22 Sep 2026','Temporary assignment expires 30 Sep 2026.')
]},
68:{id:68,title:'RBAC Matrix',description:'Control which roles may view or perform platform capabilities.',variant:'matrix',noun:'permission',rows:[],matrix:{rows:['Member','Chapter Administrator','State Manager','Governance Secretary','Platform Administrator'],columns:['View member data','Manage membership','Publish content','Manage governance','Platform configuration'],enabled:['0:0','1:0','1:1','1:2','2:0','2:1','2:2','3:0','3:3','4:0','4:1','4:2','4:3','4:4']}},
69:{id:69,title:'RACI Matrix',description:'Clarify accountable, responsible, consulted and informed roles for major operating processes.',variant:'matrix',noun:'responsibility',rows:[],matrix:{rows:['Member onboarding','Membership renewal','Event publishing','Policy approval','Platform release'],columns:['Chapter Admin','State Manager','Governance','Platform Admin','Member'],enabled:['0:0','0:1','1:0','1:1','2:0','2:1','3:2','3:3','4:3']}},
70:{id:70,title:'Workflow Designer',description:'Configure operational workflow stages, approvals and escalation paths.',variant:'builder',noun:'workflow',createLabel:'Create workflow',rows:[
 r('flow-2201','Member onboarding','Application → verification → approval → activation','Platform Operations','Membership','Published','22 Sep 2026','Includes missing-information loop and approval audit trail.'),
 r('flow-2202','Promotion approval','Draft → review → approved → scheduled/active','Platform Operations','Communications','Published','21 Sep 2026','National campaigns require policy approval before activation.'),
 r('flow-2203','Policy exception','Request → evidence → review → approval/rejection → expiry','Governance Operations','Governance','Draft','20 Sep 2026','Escalation timing is being reviewed before publication.')
]},
71:{id:71,title:'Lookups & Taxonomies',description:'Manage controlled categories and lookup values used across business discovery and operations.',variant:'builder',noun:'taxonomy',createLabel:'Add taxonomy',rows:[
 r('tax-2301','Business Categories','18 top-level categories · 76 subcategories','Data Steward','Platform','Published','23 Sep 2026','Used by business profiles, search, opportunity matching and promotions.'),
 r('tax-2302','Meeting Types','6 active values','Data Steward','Platform','Published','22 Sep 2026','Includes chapter meeting, one-to-one, governance and buyer–seller types.'),
 r('tax-2303','Opportunity Status','7 lifecycle values','Data Steward','Platform','Published','22 Sep 2026','Controls marketplace and response workflow status.')
]},
72:{id:72,title:'Form Builder',description:'Configure governed data-capture forms with validation and publishing lifecycle.',variant:'builder',noun:'form',createLabel:'Create form',rows:[
 r('frm-2401','Member Application','24 fields · 5 conditional sections','Platform Operations','Membership','Published','23 Sep 2026','Used for new member application and onboarding.'),
 r('frm-2402','Event Feedback','8 fields · anonymous response allowed','Events Team','Events','Published','22 Sep 2026','Available after eligible events are marked complete.'),
 r('frm-2403','Business Capability Update','12 fields · business owner approval','Data Steward','Member Business','Draft','21 Sep 2026','Pending validation rules for certification expiry dates.')
]},
73:{id:73,title:'Import Centre',description:'Stage, validate and reconcile bulk data imports before committing records.',variant:'integration',noun:'import batch',createLabel:'New import',rows:[
 r('imp-2501','Member profile refresh · Sep 2026','412 rows · 408 valid · 4 exceptions','Data Operations','Tamil Nadu','Ready to commit','23 Sep 2026','Four rows contain unknown chapter codes and are excluded until corrected.'),
 r('imp-2502','Legacy payment history','2,840 rows · validation running','Data Operations','National','Validating','23 Sep 2026','Duplicate payment reference and member mapping checks are in progress.'),
 r('imp-2503','Business taxonomy migration','1,126 rows · committed','Data Operations','National','Completed','21 Sep 2026','All records committed with audit reference retained.')
]},
74:{id:74,title:'Integration Administration',description:'Monitor external service connections, credentials, sync health and failure recovery.',variant:'integration',noun:'integration',rows:[
 r('int-2601','Email delivery service','Transactional email and notification delivery','Platform Operations','Platform','Healthy','23 Sep 2026, 09:18','Last health check succeeded. No delivery backlog.'),
 r('int-2602','Payment gateway','Membership payment initiation and status callbacks','Platform Operations','Platform','Healthy','23 Sep 2026, 09:16','Callback verification and reconciliation jobs are current.'),
 r('int-2603','Calendar integration','External calendar export/sync','Platform Operations','Platform','Attention','23 Sep 2026, 08:50','One credential is approaching expiry and should be rotated.')
]},
75:{id:75,title:'Moderation Queue',description:'Review reported member, business and community content with consistent disposition.',variant:'queue',noun:'moderation case',rows:[
 r('mod-2701','Business description report','Potentially misleading certification wording','Trust & Safety','Member Content','Pending review','23 Sep 2026','Compare the public business description with supporting certification data.'),
 r('mod-2702','Gallery image report','Participant requested image removal','Trust & Safety','Event Gallery','Priority','23 Sep 2026','Confirm requester identity and remove visibility while review is underway.'),
 r('mod-2703','Opportunity listing report','Duplicate opportunity suspected','Trust & Safety','Marketplace','Resolved','22 Sep 2026','Duplicate listing was merged and reporter notified.')
]},
76:{id:76,title:'Notification Administration',description:'Manage notification templates, channels and delivery health.',variant:'builder',noun:'notification template',createLabel:'Create template',rows:[
 r('ntf-2801','Connection accepted','In-app + email','Communications Platform','Member','Published','23 Sep 2026','Deep-links to the relevant member connection.'),
 r('ntf-2802','Membership renewal due','In-app + email','Communications Platform','Membership','Published','22 Sep 2026','Scheduled reminders at 30, 14 and 3 days before expiry.'),
 r('ntf-2803','Opportunity response received','In-app','Communications Platform','Marketplace','Published','22 Sep 2026','Deep-links to the exact opportunity response.')
]},
77:{id:77,title:'Promotion Policy',description:'Configure placement, approval, targeting and frequency rules for promotions.',variant:'settings',noun:'promotion policy',rows:[],settings:[
 {key:'local-priority',label:'Prioritise local relevance',description:'Rank chapter, city and region campaigns above broad campaigns when relevance is otherwise similar.',enabled:true},
 {key:'category-priority',label:'Use business category relevance',description:'Increase rank for campaigns matching member/business categories.',enabled:true},
 {key:'frequency-cap',label:'Apply frequency capping',description:'Avoid repeatedly showing the same promotion when eligible alternatives are available.',enabled:true},
 {key:'national-approval',label:'Require approval for national campaigns',description:'National-scope promotions must reach Approved status before scheduling.',enabled:true}
]},
78:{id:78,title:'Audit Explorer',description:'Search security, configuration and business-operation audit events.',variant:'audit',noun:'audit event',rows:[
 r('aud-2901','Role assignment changed','Chapter Administrator assigned to Chennai Chapter','Access Governance','Chennai Chapter','Recorded','23 Sep 2026, 09:01','Actor, previous value, new value and request context are retained.'),
 r('aud-2902','Promotion activated','Campaign promo-004 changed from Scheduled to Active','Communications','South Region','Recorded','23 Sep 2026, 08:30','Activation followed approved promotion workflow.'),
 r('aud-2903','Member profile updated','Business category and city changed by member','Member Service','Member','Recorded','22 Sep 2026, 19:42','Self-service change retained with before/after field values.')
]},
79:{id:79,title:'Data Quality Centre',description:'Identify incomplete, conflicting and stale data with actionable ownership.',variant:'queue',noun:'data quality issue',rows:[
 r('dq-3001','Member profiles missing category','17 active members have no primary business category','Data Steward','Tamil Nadu','Open','23 Sep 2026','These profiles receive lower-quality opportunity and directory matching.'),
 r('dq-3002','Duplicate business candidates','5 likely duplicate business records','Data Steward','National','Needs review','23 Sep 2026','Candidates are based on business name, phone and location similarity.'),
 r('dq-3003','Expired certification data','9 certification records passed expiry date','Data Steward','National','Open','22 Sep 2026','Business owners should confirm renewal or remove expired certification visibility.')
]},
80:{id:80,title:'Platform Settings',description:'Control safe platform-wide defaults without mixing them with member preferences.',variant:'settings',noun:'setting',rows:[],settings:[
 {key:'member-discovery',label:'Member discovery',description:'Allow eligible member and business records to appear in network discovery according to privacy settings.',enabled:true},
 {key:'opportunity-marketplace',label:'Opportunity marketplace',description:'Allow members to publish and respond to opportunities within their authorised scope.',enabled:true},
 {key:'event-rsvp',label:'Event RSVP',description:'Allow members to RSVP to published events and add them to their calendar.',enabled:true},
 {key:'maintenance-banner',label:'Maintenance notice',description:'Display an operational notice to signed-in users when planned maintenance is active.',enabled:false}
]}
};

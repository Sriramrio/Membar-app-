import type { Announcement, AttendanceRecord, Business, Category, CertificationRecord, Connection, Conversation, Event, FamilyEntry, Meeting, Member, MemberBusinessAffiliation, Message, NetworkNotification, Opportunity, OpportunityResponse, Payment, Promotion, Reference, Transaction } from './types';

// Reference data (not test data) – keep so category filters/dropdowns work
export const categories: Category[] = [
  ['cat-precision','Precision Manufacturing','CNC machining, turned parts, fixtures and high-tolerance components'],
  ['cat-sheet','Sheet Metal & Fabrication','Laser cutting, stamping, welding and fabricated assemblies'],
  ['cat-plastics','Plastics & Moulding','Injection moulding, tooling and engineered polymers'],
  ['cat-electrical','Electrical & Automation','Panels, switchgear, controls, sensors and industrial automation'],
  ['cat-auto','Automotive Components','Components and sub-assemblies for mobility and automotive OEMs'],
  ['cat-casting','Castings & Forgings','Aluminium die casting, ferrous castings and forged components'],
  ['cat-rubber','Rubber & Elastomers','Moulded rubber parts, hoses, seals and elastomer solutions'],
  ['cat-logistics','Logistics & Supply Chain','Freight, warehousing, 3PL, export and supply-chain services'],
  ['cat-it','Technology & Digital','ERP, MES, QMS, software engineering and industrial digitalisation'],
  ['cat-finance','Finance & Advisory','MSME finance, investment readiness, insurance and advisory'],
  ['cat-energy','Energy & Sustainability','Solar, energy efficiency, EV infrastructure and sustainability'],
  ['cat-packaging','Packaging','Industrial packaging, corrugated solutions and export packing'],
  ['cat-aerospace','Aerospace & Defence','Precision aerospace parts, special processes and assemblies'],
  ['cat-tooling','Tooling & Dies','Press tools, moulds, jigs, fixtures and cutting tools'],
  ['cat-safety','Industrial Safety','PPE, fire safety, EHS systems and workplace safety'],
  ['cat-services','Business Services','Compliance, HR, training, marketing and professional services'],
].map(([id,name,description])=>({id,name,description}));

export const businesses: Business[] = [];
export const members: Member[] = [];
export const affiliations: MemberBusinessAffiliation[] = [];
export const certificationRecords: CertificationRecord[] = [];
export const connections: Connection[] = [];
export const promotions: Promotion[] = [];
export const opportunities: Opportunity[] = [];
export const responses: OpportunityResponse[] = [];
export const conversations: Conversation[] = [];
export const messages: Message[] = [];
export const meetings: Meeting[] = [];
export const events: Event[] = [];
export const announcements: Announcement[] = [];
export const references: Reference[] = [];
export const transactions: Transaction[] = [];
export const interactionNotes: any[] = [];
export const notifications: NetworkNotification[] = [];
export const payments: Payment[] = [];
export const attendance: AttendanceRecord[] = [];
export const familyEntries: FamilyEntry[] = [];
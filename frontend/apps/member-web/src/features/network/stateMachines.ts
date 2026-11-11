import type { ConnectionStatus, MeetingStatus, OpportunityStatus, OpportunityResponse, PromotionStatus, Reference, Transaction } from './types';

type ResponseStatus=OpportunityResponse['status'];
type ReferenceStatus=NonNullable<Reference['status']>;
type TransactionStatus=Transaction['status'];

const allows=<T extends string>(table:Record<T,readonly T[]>,from:T,to:T)=>from===to||table[from]?.includes(to)===true;



export const canRequestConnection=(status:ConnectionStatus)=>['none','declined','cancelled','removed'].includes(status);
export const canRespondConnection=(status:ConnectionStatus)=>status==='sent'||status==='received';

export const promotionTransitions:Record<PromotionStatus,readonly PromotionStatus[]>={
  draft:['review','approved','scheduled','rejected'],
  review:['approved','rejected'],
  approved:['scheduled','active','rejected'],
  scheduled:['active','paused','completed'],
  active:['paused','completed'],
  paused:['active','completed'],
  completed:[],rejected:[],
};

export const opportunityTransitions:Record<OpportunityStatus,readonly OpportunityStatus[]>={
  draft:['pending-review','open','withdrawn'],
  'pending-review':['open','rejected','withdrawn'],
  open:['closed','expired','withdrawn'],
  closed:[],expired:[],withdrawn:[],rejected:[],
};
export const responseTransitions:Record<ResponseStatus,readonly ResponseStatus[]>={
  draft:['submitted','withdrawn'],
  submitted:['shortlisted','discussion','accepted','declined','withdrawn','won','not-selected'],
  shortlisted:['discussion','accepted','declined','withdrawn','won','not-selected'],
  discussion:['accepted','declined','withdrawn','won','not-selected'],
  accepted:['won','not-selected'],
  declined:[],withdrawn:[],won:[],'not-selected':[],
};
export const transactionTransitions:Record<TransactionStatus,readonly TransactionStatus[]>={
  proposed:['contacted','discussion','proposal','negotiation','confirmed','won','lost','closed-without-transaction','disputed','correction-requested'],
  contacted:['discussion','proposal','negotiation','confirmed','won','lost','closed-without-transaction','disputed','correction-requested'],
  discussion:['proposal','negotiation','confirmed','won','lost','closed-without-transaction','disputed','correction-requested'],
  proposal:['negotiation','confirmed','won','lost','closed-without-transaction','disputed','correction-requested'],
  negotiation:['confirmed','won','lost','closed-without-transaction','disputed','correction-requested'],
  confirmed:['closed','won','disputed','correction-requested'],
  'correction-requested':['proposed','contacted','discussion','proposal','negotiation','confirmed','disputed'],
  disputed:['correction-requested','confirmed','lost','closed-without-transaction'],
  won:['closed'],lost:[],closed:[],'closed-without-transaction':[],
};
export const meetingTransitions:Record<MeetingStatus,readonly MeetingStatus[]>={
  proposed:['alternate-proposed','confirmed','cancelled','declined'],
  'alternate-proposed':['proposed','confirmed','cancelled','declined'],
  confirmed:['alternate-proposed','completed','cancelled'],
  completed:[],cancelled:[],declined:[],
};
export const referenceTransitions:Record<ReferenceStatus,readonly ReferenceStatus[]>={
  Draft:['Sent'],
  Sent:['Acknowledged','Accepted','Declined','Closed'],
  Acknowledged:['Accepted','Declined','In Progress','Closed'],
  Accepted:['In Progress','Closed'],
  Declined:[],
  'In Progress':['Closed'],
  Closed:[],
};

export const canTransitionPromotion=(from:PromotionStatus,to:PromotionStatus)=>allows(promotionTransitions,from,to);
export const canTransitionOpportunity=(from:OpportunityStatus,to:OpportunityStatus)=>allows(opportunityTransitions,from,to);
export const canTransitionResponse=(from:ResponseStatus,to:ResponseStatus)=>allows(responseTransitions,from,to);
export const canTransitionTransaction=(from:TransactionStatus,to:TransactionStatus)=>allows(transactionTransitions,from,to);
export const canTransitionMeeting=(from:MeetingStatus,to:MeetingStatus)=>allows(meetingTransitions,from,to);
export const canTransitionReference=(from:ReferenceStatus,to:ReferenceStatus)=>allows(referenceTransitions,from,to);

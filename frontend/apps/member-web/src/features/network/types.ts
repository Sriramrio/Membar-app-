export type Id = string;
export type ConnectionStatus = 'none' | 'sent' | 'received' | 'connected' | 'declined' | 'cancelled' | 'removed' | 'blocked';
export type OpportunityStatus = 'draft' | 'pending-review' | 'open' | 'closed' | 'expired' | 'withdrawn' | 'rejected';
export type PromotionStatus = 'draft' | 'review' | 'approved' | 'scheduled' | 'active' | 'paused' | 'completed' | 'rejected';
export type MeetingStatus = 'proposed' | 'alternate-proposed' | 'confirmed' | 'completed' | 'cancelled' | 'declined';
export type FieldVisibility = 'private'|'admin'|'connections'|'chapter'|'network'|'public';

export interface Category { id:Id; name:string; parent?:string; description:string; }
export interface Business {
  id:Id; version?:string; name:string; categoryIds:Id[]; city:string; region:string; state:string; country:string; chapter:string;
  description:string; capabilities:string[]; products:string[]; services:string[]; website?:string;
  phone?:string; email?:string; logoText:string; featured?:boolean; visibility?:'public'|'network'|'hidden'; mediaImage?:string;
  legalName?:string; tradeName?:string; businessType?:string; establishedYear?:number; processes?:string[]; materials?:string[]; industries?:string[];
  functions?:string[]; serviceAreas?:string[]; capacity?:string; address?:string; catalogueUrl?:string; verified?:boolean; taxonomyRefs?:TaxonomyReference[];
  ownerMemberId?:Id; specialisationId?:Id;
}
export interface Member {
  id:Id; version?:string; name:string; designation:string; chapter:string; city:string; region:string; state:string; country:string;
  bio:string; expertise:string[]; email:string; phone:string; avatarText:string; profileCompleteness:number; status?:'active'|'inactive'|'suspended'|'expired';
  address?:string; dob?:string; professionalTitle?:string; verificationStatus?:'verified'|'pending'|'unverified';
}
export interface NotificationPreferenceGroup { inApp:boolean; email:boolean; push:boolean; }
export interface MemberNotificationPreferences {
  business:NotificationPreferenceGroup; network:NotificationPreferenceGroup; community:NotificationPreferenceGroup; account:NotificationPreferenceGroup;
}
export interface MemberPreferences {
  directoryVisibility:'network'|'connections'; emailNotifications:boolean; eventReminders:boolean; opportunityAlerts:boolean;
  fieldVisibility?:Partial<Record<'email'|'phone'|'address'|'dob'|'bio'|'designation'|'professionalTitle',FieldVisibility>>;
  notificationPreferences?:MemberNotificationPreferences;
}

export interface Connection { id:Id; version?:string; ownerId:Id; targetId:Id; status:Exclude<ConnectionStatus,'none'>; updatedAt:string; note?:string; purpose?:string; expiresAt?:string; blockedBy?:Id; }
export interface PromotionTarget { chapters:string[]; cities:string[]; regions:string[]; states:string[]; countries:string[]; categoryIds:Id[]; productServiceTerms?:string[]; }
export interface Promotion {
  id:Id; version?:string; campaignName:string; businessId:Id; headline:string; description:string; cta:string; startDate:string; endDate:string;
  priority:number; status:PromotionStatus; target:PromotionTarget; impressions:number; uniqueViewers:number; clicks:number;
  businessViews:number; connectionsInitiated:number; messagesInitiated:number; creativeImage?:string; destination?:'business'|'enquiry';
}
export interface Opportunity {
  id:Id; version?:string; ownerMemberId:Id; businessId:Id; title:string; description:string; categoryId:Id; location:string; closingDate:string;
  budget?:string; quantity?:string; uom?:string; timeline?:string; attachmentName?:string; responseRule?:string; status:OpportunityStatus; createdAt:string;
  visibility:'network'|'chapter'|'regional'; type?:'Requirement'|'Offering'|'Collaboration';
  customResponses?:Record<string,string|boolean|string[]>; formVersion?:string;
}
export interface OpportunityResponse { id:Id; version?:string; opportunityId:Id; memberId:Id; businessId:Id; summary:string; leadTime:string; commercialNote:string; solution?:string; capacity?:string; certificationIds?:Id[]; supportingNote?:string; status:'draft'|'submitted'|'shortlisted'|'accepted'|'declined'|'withdrawn'|'discussion'|'won'|'not-selected'; createdAt:string; }
export interface Message { id:Id; version?:string; conversationId:Id; senderMemberId:Id; body:string; createdAt:string; replyToId?:Id; }
export type ConversationKind = 'direct'|'chapter'|'chapter-group';
export interface Conversation { id:Id; version?:string; participantIds:Id[]; subject:string; context?:string; updatedAt:string; unreadBy:Id[]; kind?:ConversationKind; chapter?:string; groupName?:string; groupDescription?:string; managedByChapter?:boolean; createdByMemberId?:Id; pinnedBy?:Id[]; mutedBy?:Id[]; archivedBy?:Id[]; }
export interface Meeting {
  id:Id; version?:string; participantIds:Id[]; title:string; dateTime:string; alternateDateTime?:string; mode:'Online'|'In person'|'Phone'; location:string; agenda:string; status:MeetingStatus;
  requesterId?:Id; recipientId?:Id; outcome?:string; followUp?:string; participantNotes?:string; completionConfirmedBy?:Id[]; pollDeadline?:string;
  businessId?:Id; opportunityId?:Id; referenceId?:Id; eventId?:Id; conversationId?:Id;
  pollResponses?:Record<Id,'Yes'|'Maybe'|'No'>;
}
export interface Event {
  id:Id; version?:string; name:string; description:string; dateTime:string; endDateTime:string; venue:string; city:string; region:string; state:string; country:string; chapter:string; type:string;
  capacity:number; attendeeIds:Id[]; waitlistIds?:Id[]; registrationOpenAt?:string; registrationCloseAt?:string; terms?:string; attendeeVisibility?:'private'|'registered'|'members'; paymentRequired?:boolean; registrationResponses?:Record<Id,Record<string,string|boolean|string[]>>;
  registrationMeta?:Record<Id,{formVersion?:string;acceptedTermsAt?:string;registeredAt:string;status:'registered'|'waitlisted'}>;
}
export interface Announcement { id:Id; version?:string; title:string; body:string; scope:string; publishedAt:string; priority:'normal'|'important'|'urgent'; expiresAt?:string; pinned?:boolean; acknowledgementRequired?:boolean; acknowledgedBy?:Id[]; status?:'draft'|'scheduled'|'published'|'withdrawn'|'archived'; }
export interface Reference { id:Id; version?:string; fromMemberId:Id; toMemberId:Id; businessId:Id; text:string; createdAt:string; status?:'Draft'|'Sent'|'Acknowledged'|'Accepted'|'Declined'|'In Progress'|'Closed'; confidentiality?:'Private'|'Participants'|'Network'; consentConfirmed?:boolean; followUp?:string; }
export interface Transaction { id:Id; version?:string; memberId:Id; buyerBusinessId:Id; counterpartyBusinessId:Id; opportunityId?:Id; referenceId?:Id; description:string; value?:number; status:'proposed'|'confirmed'|'closed'|'contacted'|'discussion'|'proposal'|'negotiation'|'won'|'lost'|'closed-without-transaction'|'disputed'|'correction-requested'; createdAt:string; valueVisibility?:'private'|'participants'|'admin'; proofNote?:string; correctionReason?:string; }
export type InteractionNoteContext='General'|'Opportunity'|'Meeting'|'Transaction'|'Reference'|'Business';
export type InteractionNoteType='Observation'|'FollowUp'|'Opportunity'|'Meeting'|'Transaction'|'Reminder'|'Other';
export interface MemberInteractionNote { id:Id; version?:string; authorMemberId:Id; targetMemberId:Id; businessId?:Id; contextType:InteractionNoteContext; contextId?:Id; noteType:InteractionNoteType; text:string; visibility:'Private'|'Participants'; createdAt:string; updatedAt?:string; }
export interface NetworkNotification { id:Id; version?:string; memberId:Id; text:string; href:string; createdAt:string; read:boolean; deliveryMode?:'Immediate'|'Digest'; availableAt?:string; acknowledgementRequired?:boolean; acknowledgedAt?:string; routePolicyId?:string; templateVersion?:number; }
export interface Payment { id:Id; version?:string; memberId:Id; description:string; amount:number; status:'paid'|'due'|'failed'; dueDate:string; paidAt?:string; }
export interface AttendanceRecord { id:Id; version?:string; memberId:Id; eventId:Id; status:'present'|'absent'|'registered'|'excused'; finalised?:boolean; correctionStatus?:'none'|'requested'|'approved'|'rejected'; correctionReason?:string; priorStatus?:'present'|'absent'|'registered'|'excused'; }
export interface FamilyEntry { id:Id; version?:string; memberId:Id; name:string; relationship:string; phone?:string; }
export interface SupportRequest { id:Id; version?:string; memberId:Id; subject:string; body:string; status:'open'|'in-progress'|'resolved'; createdAt:string; reference?:string; topic?:'Membership'|'Business Profile'|'Opportunity'|'Payment'|'Event'|'Member'|'Business'|'Technical Issue'|'Report Content'|'Privacy'|'Other'; pageContext?:string; relatedId?:Id; }
export interface GalleryItem { id:Id; version?:string; title:string; caption:string; eventId?:Id; mediaLabel:string; published:boolean; createdAt:string; }


export interface MemberBusinessAffiliation {
  id:Id; version?:string; memberId:Id; businessId:Id; relationshipType:'Founder'|'Owner'|'Director'|'Employee'|'Consultant'|'Representative'|'Advisor'|'Unspecified';
  designation:string; primaryRepresentative:boolean; authorisedRepresentative:boolean; authorityLevel:'View'|'Represent'|'Administer';
  startsAt:string; endsAt?:string; endedReason?:string; verificationStatus:'Verified'|'Pending'|'Rejected'; visibility:'Private'|'Connections'|'Network'; active:boolean;
}
export interface BusinessRelationship { id:Id; version?:string; fromBusinessId:Id; toBusinessId:Id; type:'Supplier'|'Buyer'|'Customer'|'Partner'|'Referral'|'Prospect'|'Service Provider'|'Association Partner'; source?:string; status:'Active'|'Inactive'|'Proposed'; startedAt:string; updatedAt:string; }
export interface CertificationRecord { id:Id; version?:string; businessId:Id; standard:string; issuer?:string; certificateNumber?:string; issuedAt?:string; expiresAt?:string; evidenceName?:string; verificationStatus:'Verified'|'Pending'|'Expired'|'Rejected'; verifiedBy?:string; verifiedAt?:string; }
export interface TaxonomyReference { taxonomyId:string; source:'Declared'|'Verified'|'Imported'; evidence?:string; }
export interface ThankYouNote { id:Id; version?:string; fromMemberId:Id; toMemberId:Id; meetingId?:Id; referenceId?:Id; opportunityId?:Id; text:string; acknowledged:boolean; outcomeClass?:'Introduction'|'Opportunity'|'Transaction'|'Support'|'Other'; privateValue?:number; createdAt:string; }
export interface ImportApplicationLedger { batchId:string; type:'Attendance'|'Payment'|'Member'|'Visitor'|'Business'|'Taxonomy'; appliedIds:Id[]; appliedAt:string; reversedAt?:string; }
export interface OpportunityQuestion { id:Id; version?:string; opportunityId:Id; askedBy:Id; question:string; answer?:string; answeredBy?:Id; createdAt:string; answeredAt?:string; }

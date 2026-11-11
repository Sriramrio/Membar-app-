import { apiClient } from './apiClient';

export interface NewsArticleDto {
  id: string;
  title: string;
  summary: string;
  content: string;
  publishedAt: string;
  category: string;
  imageUrl?: string;
}

export interface GalleryPhotoDto {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  takenAt: string;
  chapterId?: string;
}

export interface PartnerDto {
  id: string;
  name: string;
  description: string;
  tier: string;
  logoUrl?: string;
  websiteUrl?: string;
}

export interface ResourceDto {
  id: string;
  title: string;
  category: string;
  fileUrl?: string;
  description?: string;
  updatedAt: string;
}

export interface SupportTicketDto {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
}

export interface FamilyMemberDto {
  id: string;
  name: string;
  relationship: string;
  phone?: string;
  notes?: string;
}

export interface AnnouncementDto {
  id: string;
  title: string;
  body: string;
  priority: string;
  scope: string;
  pinned: boolean;
  acknowledgementRequired: boolean;
  publishedAt: string;
  expiresAt?: string;
  acknowledged: boolean;
  version?: string;
}

export interface ThankYouNoteDto {
  id: string;
  recipientMemberId: string;
  recipientName: string;
  note: string;
  referenceId?: string;
  createdAt: string;
}

export interface CategorySectorDto {
  id: string;
  name: string;
  segments: {
    id: string;
    name: string;
    specialisations: {
      id: string;
      name: string;
    }[];
  }[];
}

export interface SavedItemDto {
  id: string;
  itemType: string;
  itemId: string;
  savedAt: string;
}

export const communityApi = {
  // News
  getNews: (signal?: AbortSignal) =>
    apiClient.get<NewsArticleDto[]>('/news', { signal, retry: 'safe' }),
  getNewsDetail: (id: string, signal?: AbortSignal) =>
    apiClient.get<NewsArticleDto>(`/news/${encodeURIComponent(id)}`, { signal, retry: 'safe' }),

  // Gallery
  getGallery: (signal?: AbortSignal) =>
    apiClient.get<GalleryPhotoDto[]>('/gallery', { signal, retry: 'safe' }),

  // Partners
  getPartners: (signal?: AbortSignal) =>
    apiClient.get<PartnerDto[]>('/partners', { signal, retry: 'safe' }),

  // Resources
  getResources: (signal?: AbortSignal) =>
    apiClient.get<ResourceDto[]>('/resources', { signal, retry: 'safe' }),

  // Support
  getSupportTickets: (signal?: AbortSignal) =>
    apiClient.get<SupportTicketDto[]>('/support/tickets', { signal, retry: 'safe' }),
  createSupportTicket: (ticket: { subject: string; description: string; category?: string }, idempotencyKey?: string) =>
    apiClient.post<SupportTicketDto>('/support/tickets', ticket, undefined, { idempotencyKey }),

  // Family
  getFamily: (signal?: AbortSignal) =>
    apiClient.get<FamilyMemberDto[]>('/members/me/family', { signal, retry: 'safe' }),
  saveFamily: (entries: FamilyMemberDto[], idempotencyKey?: string) =>
    apiClient.put<FamilyMemberDto[]>('/members/me/family', entries, undefined, { idempotencyKey }),

  // Settings
  getPrivacySettings: (signal?: AbortSignal) =>
    apiClient.get<Record<string, unknown>>('/settings/privacy', { signal, retry: 'safe' }),
  savePrivacySettings: (settings: Record<string, unknown>, idempotencyKey?: string) =>
    apiClient.put('/settings/privacy', settings, undefined, { idempotencyKey }),

  getNotificationSettings: (signal?: AbortSignal) =>
    apiClient.get<Record<string, unknown>>('/settings/notifications', { signal, retry: 'safe' }),
  saveNotificationSettings: (settings: Record<string, unknown>, idempotencyKey?: string) =>
    apiClient.put('/settings/notifications', settings, undefined, { idempotencyKey }),

  // Announcements
  getAnnouncements: (signal?: AbortSignal) =>
    apiClient.get<AnnouncementDto[]>('/announcements', { signal, retry: 'safe' }),
  acknowledgeAnnouncement: (id: string, idempotencyKey?: string) =>
    apiClient.post<{ success: boolean; id: string }>(
      `/announcements/${encodeURIComponent(id)}/acknowledge`,
      undefined,
      undefined,
      { idempotencyKey }
    ),

  // Thank You Notes
  getThankYouNotes: (signal?: AbortSignal) =>
    apiClient.get<ThankYouNoteDto[]>('/thank-you-notes', { signal, retry: 'safe' }),
  createThankYouNote: (note: { recipientMemberId: string; note: string; referenceId?: string }, idempotencyKey?: string) =>
    apiClient.post<ThankYouNoteDto>('/thank-you-notes', note, undefined, { idempotencyKey }),

  // Categories
  getCategories: (signal?: AbortSignal) =>
    apiClient.get<CategorySectorDto[]>('/categories', { signal, retry: 'safe' }),

  // Saved Items
  getSavedItems: (signal?: AbortSignal) =>
    apiClient.get<SavedItemDto[]>('/saved-items', { signal, retry: 'safe' }),
  toggleSavedItem: (itemType: string, itemId: string, idempotencyKey?: string) =>
    apiClient.post<{ isSaved: boolean; itemType: string; itemId: string }>(
      '/saved-items/toggle',
      { itemType, itemId },
      undefined,
      { idempotencyKey }
    ),

  // Promotions
  getPromotion: (id: string, signal?: AbortSignal) =>
    apiClient.get<Record<string, unknown>>(`/promotions/${encodeURIComponent(id)}`, { signal, retry: 'safe' }),
  recordPromotionEvent: (id: string, eventType: string, idempotencyKey?: string) =>
    apiClient.post<void>(
      `/promotions/${encodeURIComponent(id)}/events`,
      { eventType },
      undefined,
      { idempotencyKey }
    ),
};

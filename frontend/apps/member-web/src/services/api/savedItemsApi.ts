import { apiClient } from './apiClient';

export interface SavedItemRecord {
  id: string;
  tenantId: string;
  memberId: string;
  itemType: string; // 'business', 'opportunity', etc.
  itemId: string;
  savedAt: string;
}

export interface ToggleSavedResult {
  saved: boolean;
  itemId: string;
  savedId?: string;
  message: string;
}

export const savedItemsApi = {
  getSavedItems: (type?: string, signal?: AbortSignal) => {
    const q = type ? `?type=${encodeURIComponent(type)}` : '';
    return apiClient.get<SavedItemRecord[]>(`/saved-items${q}`, { signal, retry: 'safe' });
  },

  toggleSavedItem: (itemType: 'business' | 'opportunity' | string, itemId: string) => {
    return apiClient.post<ToggleSavedResult>('/saved-items/toggle', {
      itemType: itemType.toLowerCase(),
      itemId
    });
  }
};

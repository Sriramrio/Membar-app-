import { apiClient } from './apiClient';
import { toGuid } from './guidUtils';

export interface InteractionNoteRecord {
  id: string;
  authorMemberId: string;
  contextType?: string;
  subjectType?: string;
  contextId?: string;
  subjectId?: string;
  text: string;
  followUpAt?: string;
  createdAt: string;
}

export interface NoteActionResponse {
  accepted: boolean;
  message?: string;
}

export const notesApi = {
  getNotes: (page = 1, size = 20, signal?: AbortSignal) =>
    apiClient.get<InteractionNoteRecord[]>(`/notes?page=${page}&size=${size}`, { signal, retry: 'safe' }),

  createNote: (subjectType: string, subjectId: string, text: string, idempotencyKey?: string, followUpAt?: string | null) => {
    const key = idempotencyKey || crypto.randomUUID();
    return apiClient.post<InteractionNoteRecord>(
      '/notes',
      {
        contextType: subjectType || 'member',
        contextId: toGuid(subjectId),
        text,
        followUpAt: followUpAt ? new Date(followUpAt).toISOString() : null,
        idempotencyKey: key,
      },
      undefined,
      { idempotencyKey: key }
    );
  },

  changeNoteAction: (noteId: string, action: 'edit' | 'archive' | 'followup', text?: string, followUpAt?: string | null, idempotencyKey?: string) => {
    const key = idempotencyKey || crypto.randomUUID();
    return apiClient.post<NoteActionResponse>(
      '/notes/actions',
      {
        noteId: toGuid(noteId),
        action,
        idempotencyKey: key,
        text,
        followUpAt: followUpAt ? new Date(followUpAt).toISOString() : null,
      },
      undefined,
      { idempotencyKey: key }
    );
  },

  archiveNote: (noteId: string) => notesApi.changeNoteAction(noteId, 'archive'),

  editNote: (noteId: string, text: string) => notesApi.changeNoteAction(noteId, 'edit', text),
};


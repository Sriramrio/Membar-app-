import { apiClient } from './apiClient';
import { toGuid } from './guidUtils';

export interface ConversationDto {
  id: string;
  kind?: string;
  subject?: string;
  participantIds?: string[];
  otherMemberId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessageDto {
  id: string;
  conversationId: string;
  senderMemberId: string;
  text?: string;
  content?: string;
  createdAt: string;
}

export interface CreateConversationRequest {
  participantMemberIds?: string[];
  otherMemberId?: string;
  subject?: string;
  kind?: string;
  initialMessage?: string;
}

export interface SendMessageRequest {
  text?: string;
  content?: string;
}

export const messagesApi = {
  getConversations: (signal?: AbortSignal) =>
    apiClient.get<ConversationDto[]>('/messages/conversations', { signal, retry: 'safe' }),

  getMessages: (conversationId: string, signal?: AbortSignal) =>
    apiClient.get<ConversationMessageDto[]>(
      `/messages/conversations/${encodeURIComponent(toGuid(conversationId))}/messages`,
      { signal, retry: 'safe' }
    ),

  createConversation: (request: CreateConversationRequest, idempotencyKey?: string) => {
    const otherMemberId = toGuid(request.otherMemberId || request.participantMemberIds?.[0] || 'member:member');
    const payload = {
      otherMemberId,
      initialMessage: request.initialMessage || 'Hello',
    };
    return apiClient.post<ConversationDto>(
      '/messages/conversations',
      payload,
      undefined,
      { idempotencyKey }
    );
  },

  sendMessage: (conversationId: string, request: SendMessageRequest, idempotencyKey?: string) => {
    const payload = {
      content: request.content || request.text || '',
    };
    return apiClient.post<ConversationMessageDto>(
      `/messages/conversations/${encodeURIComponent(toGuid(conversationId))}/messages`,
      payload,
      undefined,
      { idempotencyKey }
    );
  },
};


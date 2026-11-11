import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  MessageSquare, 
  Search, 
  Send, 
  Plus, 
  X, 
  Users, 
  Building2, 
  CheckCheck, 
  User
} from 'lucide-react';
import { useOrg } from '@/state/OrgStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { useOrgCommandAction } from '@/hooks/useOrgCommandAction';
import { CommandFeedback } from '@/components/CommandFeedback';
import { AsyncState } from '@/components/AsyncState';
import { EmptyState } from '@/components/EmptyState';
import type { Conversation, Message } from '@/domain/types';

type ConverseFilter = 'ALL' | 'CHAPTER' | 'COMMITTEE' | 'DIRECT';

export default function ConversePage() {
  const s = useOrg();
  const cmd = useOrgCommandAction();
  const [params, setParams] = useSearchParams();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);
  const [filterType, setFilterType] = useState<ConverseFilter>('ALL');

  // Input & message sending state
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');

  // New Thread Modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadKind, setNewThreadKind] = useState<'chapter' | 'committee' | 'direct'>('direct');
  const [newThreadInitialMsg, setNewThreadInitialMsg] = useState('');
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [createThreadError, setCreateThreadError] = useState('');

  // Auto-scroll anchor
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch Conversations from Database via org.converse.inbox
  const inboxReq = useMemo(() => ({
    queryId: 'org.converse.inbox',
    search: debouncedSearch,
    organisationScope: s.scope.id,
    pageSize: 50
  }), [debouncedSearch, s.scope.id]);

  const inbox = useDomainCursorPage<Conversation>(inboxReq, s.conversations);
  useRealtimeRefresh(['org.converse.conversation.*', 'org.converse.*'], inbox.reload);

  interface RawConversationItem {
    id: string;
    type?: string;
    kind?: string;
    name?: string;
    title?: string;
    subject?: string;
    groupName?: string;
    participants?: string[];
    unread?: number;
    unreadCount?: number;
    muted?: boolean;
    closed?: boolean;
    lastActivity?: string;
    updatedAt?: string;
    createdAt?: string;
    contextId?: string;
  }

  // Sanitized conversation list
  const rawConversations = useMemo<Conversation[]>(() => {
    const list = (inbox.page?.items ?? s.conversations ?? []) as unknown as RawConversationItem[];
    return list.map(c => {
      const convName = c.name || c.title || c.subject || c.groupName || 'Leadership Discussion';
      const convType = (c.type || c.kind || 'CHAPTER').toUpperCase();
      const participants = Array.isArray(c.participants) && c.participants.length > 0
        ? c.participants
        : [s.actor.name || 'Leadership Team'];
      const lastAct = c.lastActivity || c.updatedAt || c.createdAt || new Date().toISOString();

      return {
        id: c.id,
        name: convName,
        type: convType,
        participants,
        unread: c.unread ?? c.unreadCount ?? 0,
        muted: Boolean(c.muted),
        closed: Boolean(c.closed),
        lastActivity: lastAct,
        contextId: c.contextId
      };
    });
  }, [inbox.page?.items, s.conversations]);

  // Filtered conversation list
  const filteredConversations = useMemo(() => {
    return rawConversations.filter(c => {
      // Category filter
      if (filterType !== 'ALL') {
        const k = (c.type || '').toUpperCase();
        if (filterType === 'CHAPTER' && !k.includes('CHAPTER')) return false;
        if (filterType === 'COMMITTEE' && !k.includes('COMMITTEE')) return false;
        if (filterType === 'DIRECT' && !k.includes('DIRECT')) return false;
      }
      // Search query
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase();
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesPart = c.participants?.some(p => p.toLowerCase().includes(q));
        if (!matchesName && !matchesPart) return false;
      }
      return true;
    });
  }, [rawConversations, filterType, debouncedSearch]);

  // Deep-link query parameters
  const requestedId = params.get('conversation');
  const requestedContextId = params.get('contextId');

  // Active Selected Conversation ID
  const [activeId, setActiveId] = useState<string | undefined>(() => {
    return requestedId || rawConversations[0]?.id;
  });

  // Sync active thread with URL & items
  useEffect(() => {
    if (requestedId && rawConversations.some(c => c.id === requestedId)) {
      setActiveId(requestedId);
      return;
    }
    if (requestedContextId) {
      const match = rawConversations.find(c => c.contextId === requestedContextId);
      if (match) {
        setActiveId(match.id);
        return;
      }
    }
    if (!activeId && filteredConversations.length > 0) {
      setActiveId(filteredConversations[0].id);
    }
  }, [requestedId, requestedContextId, rawConversations, activeId, filteredConversations]);

  const currentConv = useMemo(() => {
    return rawConversations.find(c => c.id === activeId) ?? filteredConversations[0];
  }, [rawConversations, filteredConversations, activeId]);

  // 2. Fetch Messages for Active Conversation from Database
  const messageReq = useMemo(() => ({
    queryId: 'org.converse.messages',
    organisationScope: s.scope.id,
    pageSize: 100,
    parameters: {
      conversationId: activeId ?? ''
    }
  }), [activeId, s.scope.id]);

  const messagesPage = useDomainCursorPage<Message>(
    messageReq, 
    [], 
    [activeId], 
    Boolean(activeId)
  );

  useRealtimeRefresh(
    ['org.converse.message.*'], 
    messagesPage.reload, 
    e => !activeId || !e.aggregateId || e.aggregateId === activeId
  );

  const messages = messagesPage.page?.items ?? [];

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeId]);

  // Select a conversation
  const handleSelectConv = (id: string) => {
    setActiveId(id);
    setParams({ conversation: id }, { replace: true });
    setSendError('');
  };

  // 3. Send Message to Database
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !activeId || isSending) return;

    const textToSend = messageText.trim();
    setIsSending(true);
    setSendError('');

    try {
      const res = await cmd.run({
        commandType: 'org.converse.message.send',
        aggregateType: 'Conversation',
        aggregateId: activeId,
        payload: {
          conversationId: activeId,
          text: textToSend
        },
        reason: 'Leadership chat message sent from Converse'
      });

      if (res.ok) {
        setMessageText('');
        messagesPage.reload();
        inbox.reload();
      } else {
        setSendError(res.error?.detail || res.error?.title || 'Failed to send message.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending message.';
      setSendError(msg);
    } finally {
      setIsSending(false);
    }
  };

  // 4. Create New Conversation Thread
  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || isCreatingThread) return;

    setIsCreatingThread(true);
    setCreateThreadError('');

    try {
      const res = await cmd.run({
        commandType: 'org.converse.conversation.create',
        aggregateType: 'Conversation',
        payload: {
          name: newThreadTitle.trim(),
          kind: newThreadKind,
          initialMessage: newThreadInitialMsg.trim()
        },
        reason: 'New leadership discussion thread started from Converse UI'
      });

      if (res.ok) {
        setIsNewModalOpen(false);
        setNewThreadTitle('');
        setNewThreadInitialMsg('');
        setCreateThreadError('');
        inbox.reload();
        if (res.result && typeof res.result === 'object' && 'aggregateId' in res.result) {
          const newId = (res.result as { aggregateId: string }).aggregateId;
          setActiveId(newId);
          setParams({ conversation: newId }, { replace: true });
        }
      } else {
        setCreateThreadError(res.error?.detail || res.error?.title || 'Failed to create discussion thread.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating discussion.';
      setCreateThreadError(msg);
    } finally {
      setIsCreatingThread(false);
    }
  };

  // Helper: Visual Avatar config
  const getAvatarConfig = (type?: string, name?: string) => {
    const upper = (type || '').toUpperCase();
    if (upper.includes('CHAPTER')) {
      return { bg: 'bg-blue-600 text-white', icon: Building2, text: 'CH' };
    }
    if (upper.includes('COMMITTEE')) {
      return { bg: 'bg-purple-600 text-white', icon: Users, text: 'CO' };
    }
    const safeName = (name || '').trim();
    const initials = safeName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('') || 'DM';
    return { bg: 'bg-emerald-600 text-white', icon: User, text: initials };
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Converse</h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {s.scope.name}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live DB
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Internal leadership channels and direct discussions for Chapter operations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Thread</span>
            </button>
          </div>
        </div>
      </div>

      <CommandFeedback busy={cmd.busy} slow={cmd.slow} error={cmd.error} onRetry={cmd.retry} />

      {/* 2. Main 2-Column Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-230px)] min-h-[580px]">
        
        {/* Left Column: Conversations Inbox */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          
          {/* Search Box */}
          <div className="p-3 border-b border-slate-100 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:bg-white focus:border-blue-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              {(['ALL', 'CHAPTER', 'COMMITTEE', 'DIRECT'] as ConverseFilter[]).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterType(tab)}
                  className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    filterType === tab
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab === 'ALL' ? 'All' : tab === 'CHAPTER' ? 'Chapter' : tab === 'COMMITTEE' ? 'Committees' : 'Direct'}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            <AsyncState
              loading={inbox.loading}
              refreshing={inbox.refreshing}
              stale={inbox.stale}
              error={inbox.error}
              onRetry={inbox.reload}
            >
              {filteredConversations.length > 0 ? (
                filteredConversations.map(c => {
                  const isSelected = c.id === currentConv?.id;
                  const av = getAvatarConfig(c.type, c.name);

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectConv(c.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-50/80 border border-blue-300/80 shadow-xs' 
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${av.bg} flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}>
                        {av.text}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                            {c.name}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {c.lastActivity ? new Date(c.lastActivity).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
                            c.type === 'CHAPTER' 
                              ? 'bg-blue-100 text-blue-700' 
                              : c.type === 'COMMITTEE' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {c.type}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate">
                            {c.participants?.length ? `${c.participants.length} members` : 'Direct discussion'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center">
                  <EmptyState title="No discussions found" />
                </div>
              )}
            </AsyncState>
          </div>
        </div>

        {/* Right Column: Chat Timeline & Message Composer */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          
          {currentConv ? (
            <>
              {/* Active Conversation Top Header */}
              <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {(() => {
                    const av = getAvatarConfig(currentConv.type, currentConv.name);
                    return (
                      <div className={`w-10 h-10 rounded-xl ${av.bg} flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}>
                        {av.text}
                      </div>
                    );
                  })()}

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900">{currentConv.name}</h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        {currentConv.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Active Channel
                      </span>
                      <span>·</span>
                      <span>{currentConv.participants?.join(', ') || 'Leadership'}</span>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500 px-2.5 py-1 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    Text-only discussion
                  </span>
                </div>
              </div>

              {/* Chat Messages Timeline */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                <AsyncState
                  loading={messagesPage.loading}
                  refreshing={messagesPage.refreshing}
                  stale={messagesPage.stale}
                  error={messagesPage.error}
                  onRetry={messagesPage.reload}
                >
                  {messages.length > 0 ? (
                    messages.map((m) => {
                      const isMe = Boolean(s.actor.name && m.sender?.toLowerCase() === s.actor.name?.toLowerCase());

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 shadow-2xs space-y-1 transition-all ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-br-xs'
                                : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs'
                            }`}
                          >
                            {!isMe && (
                              <div className="flex items-center gap-1.5 pb-0.5">
                                <span className="text-xs font-bold text-slate-900">{m.sender}</span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                                  {m.senderRole}
                                </span>
                              </div>
                            )}

                            <div className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                              {m.text}
                            </div>

                            <div
                              className={`flex items-center justify-end gap-1 text-[10px] pt-0.5 ${
                                isMe ? 'text-blue-100' : 'text-slate-400'
                              }`}
                            >
                              <span>
                                {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                              {isMe && <CheckCheck className="w-3.5 h-3.5 text-blue-200 inline" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">No messages in this channel yet</h3>
                      <p className="text-xs text-slate-500 max-w-xs mt-1">
                        Start the discussion by typing a message below. All messages persist in PostgreSQL.
                      </p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </AsyncState>
              </div>

              {/* Error Alert if Send Failed */}
              {sendError && (
                <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 text-rose-700 text-xs flex items-center justify-between">
                  <span>{sendError}</span>
                  <button type="button" onClick={() => setSendError('')} className="font-bold text-rose-900 cursor-pointer">
                    Dismiss
                  </button>
                </div>
              )}

              {/* Message Composer Footer */}
              <div className="p-3 border-t border-slate-200/80 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageText}
                    disabled={isSending}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessageText(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault?.();
                        void handleSendMessage();
                      }
                    }}
                    placeholder={`Message in ${currentConv.name}...`}
                    className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !messageText.trim()}
                    className="px-4 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {isSending ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Send</span>
                      </>
                    )}
                  </button>
                </form>
                <p className="text-[10px] text-slate-400 mt-1.5 px-1">
                  Supporting discussion only. Formal resolutions must be documented via Meetings &amp; MoM or Tasks.
                </p>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-700">Select a discussion</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Choose a conversation from the left inbox or start a new thread.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. New Discussion Thread Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Start New Discussion</h3>
                  <p className="text-[11px] text-slate-500">Creates a persisted conversation thread in PostgreSQL</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateThread} className="p-4 space-y-3">
              {createThreadError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {createThreadError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thread Title / Channel Name *
                </label>
                <input
                  type="text"
                  required
                  value={newThreadTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewThreadTitle(e.target.value)}
                  placeholder="e.g. Annual Conclave Planning / Direct: Secretary"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discussion Type
                </label>
                <select
                  value={newThreadKind}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewThreadKind(e.target.value as 'chapter' | 'committee' | 'direct')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="direct">Direct Message (1-on-1)</option>
                  <option value="committee">Working Committee Channel</option>
                  <option value="chapter">Parivar Official Discussion</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Message (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newThreadInitialMsg}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewThreadInitialMsg(e.target.value)}
                  placeholder="Kickstart the discussion with context..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isCreatingThread}
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingThread || !newThreadTitle.trim()}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isCreatingThread ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Start Discussion</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

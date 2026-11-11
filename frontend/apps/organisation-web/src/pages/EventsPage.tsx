import { useMemo, useState, useEffect, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { StatusPill } from '@/components/StatusPill';
import { CommandFeedback } from '@/components/CommandFeedback';
import { AsyncState } from '@/components/AsyncState';
import { CursorPager } from '@/components/CursorPager';
import { EmptyState } from '@/components/EmptyState';
import { useOrg } from '@/state/OrgStore';
import { useOrgCommandAction } from '@/hooks/useOrgCommandAction';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { businessDateOnly } from '@/utils/businessDate';
import type { EventItem } from '@/domain/types';
import { X, CalendarDays, CheckSquare, User, CheckCircle2, ArrowRight, ShieldCheck, Trash2, Filter, Building2 } from 'lucide-react';
import { authStorage } from '@/utils/authStorage';

function EditIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}

function PhotoIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

function UploadIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function TrashIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}

function PlusIcon({ className = 'size-4', stroke = 'currentColor' }: { className?: string; stroke?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function SparklesIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
    </svg>
  );
}

function MapPinIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function TagIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  );
}

function UsersIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

export default function EventsPage(){
  const s = useOrg();
  const org = s;
  const cmd = useOrgCommandAction();
  const isTrust = authStorage.isTrustUser();
  const isLeadershipTeam = authStorage.isLeadershipTeam();

  // Database Chapters state
  const [chapterOptions, setChapterOptions] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    fetch('/api/chapters')
      .then(r => r.json())
      .then(data => {
        const items = Array.isArray(data) ? data : (data?.value || []);
        if (items.length > 0) {
          const mapped = items.map((c: any) => ({ id: String(c.id), name: c.name || c.id }));
          setChapterOptions(mapped);
          const defaultCh = org.scope?.id && org.scope.id !== 'all' && mapped.some((m: { id: string; name: string }) => m.id === org.scope.id)
            ? org.scope.id
            : mapped[0].id;
          setTargetChapterId(prev => prev || defaultCh);
        }
      })
      .catch(() => {});
  }, [org.scope?.id]);

  // Quick Chapter Filter for Leadership Team / Trustee
  const [selectedFilterChapterId, setSelectedFilterChapterId] = useState<string>('all');

  // Sync filter with global active scope (e.g. from topbar Chapter Filter)
  useEffect(() => {
    if (org.scope?.id && org.scope.id !== 'all') {
      setSelectedFilterChapterId(org.scope.id);
    } else if (org.scope?.id === 'all') {
      setSelectedFilterChapterId('all');
    }
  }, [org.scope?.id]);

  // Create Event Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [type, setType] = useState('NETWORKING');
  const [location, setLocation] = useState('');
  const [targetChapterId, setTargetChapterId] = useState<string>('');

  // Edit Event Modal state
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editType, setEditType] = useState('NETWORKING');
  const [editLocation, setEditLocation] = useState('');
  const [editQuorum, setEditQuorum] = useState(1);
  const [editChapterId, setEditChapterId] = useState('');

  // Create Closure Work Modal state
  const [selectedClosureEvent, setSelectedClosureEvent] = useState<EventItem | null>(null);
  const [closureTitle, setClosureTitle] = useState('');
  const [closureOwner, setClosureOwner] = useState('');
  const [closureDue, setClosureDue] = useState('');
  const [closureSuccessMessage, setClosureSuccessMessage] = useState<string | null>(null);
  const [createdClosureIds, setCreatedClosureIds] = useState<Set<string>>(() => new Set());

  // Chapter Gallery state
  interface GalleryItem {
    id: string;
    title: string;
    caption?: string;
    mediaLabel?: string;
    imageUrl?: string;
    chapterId?: string;
    eventId?: string;
    published: boolean;
    createdAt: string;
  }
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoLabel, setPhotoLabel] = useState('Chapter Meeting');
  const [photoImageUrl, setPhotoImageUrl] = useState('');
  const [photoEventId, setPhotoEventId] = useState('');
  const [photoChapterId, setPhotoChapterId] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [gallerySuccess, setGallerySuccess] = useState<string | null>(null);

  // RSVP Summary Map & Modal State
  const [rsvpMap, setRsvpMap] = useState<Record<string, { attendingCount: number; notAvailableCount: number; substituteCount: number; totalResponses: number }>>({});
  const [selectedRsvpEvent, setSelectedRsvpEvent] = useState<EventItem | null>(null);
  const [rsvpModalData, setRsvpModalData] = useState<{
    attendingCount: number;
    notAvailableCount: number;
    substituteCount: number;
    totalResponses: number;
    responses: Array<{
      id: string;
      memberId: string;
      memberName: string;
      memberPhone?: string;
      chapterName?: string;
      status: string;
      substituteName?: string;
      substitutePhone?: string;
      notes?: string;
      updatedAt?: string;
    }>;
  } | null>(null);
  const [rsvpModalLoading, setRsvpModalLoading] = useState(false);
  const [rsvpFilterStatus, setRsvpFilterStatus] = useState<string>('ALL');
  const [rsvpSearchQuery, setRsvpSearchQuery] = useState<string>('');

  const loadAllRsvpSummaries = async () => {
    try {
      const res = await fetch('/api/events/rsvp-summary/all');
      if (res.ok) {
        const data = await res.json();
        setRsvpMap(data || {});
      }
    } catch (err) {
      console.warn('Failed to fetch rsvp summaries', err);
    }
  };

  const openRsvpDetailModal = async (event: EventItem) => {
    setSelectedRsvpEvent(event);
    setRsvpModalLoading(true);
    setRsvpFilterStatus('ALL');
    setRsvpSearchQuery('');
    try {
      const res = await fetch(`/api/events/${event.id}/rsvp-summary`);
      if (res.ok) {
        const data = await res.json();
        setRsvpModalData(data);
      } else {
        setRsvpModalData({
          attendingCount: 0,
          notAvailableCount: 0,
          substituteCount: 0,
          totalResponses: 0,
          responses: []
        });
      }
    } catch (err) {
      console.error('Error fetching event rsvp details', err);
    } finally {
      setRsvpModalLoading(false);
    }
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCreate) setShowCreate(false);
        if (editingEvent) setEditingEvent(null);
        if (selectedClosureEvent) setSelectedClosureEvent(null);
        if (showAddPhoto) setShowAddPhoto(false);
        if (selectedRsvpEvent) setSelectedRsvpEvent(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCreate, editingEvent, selectedClosureEvent, showAddPhoto, selectedRsvpEvent]);

  // Load chapter gallery items
  const loadGallery = async () => {
    setGalleryLoading(true);
    try {
      const token = authStorage.getToken();
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const chId = (isLeadershipTeam && selectedFilterChapterId !== 'all')
        ? selectedFilterChapterId
        : (s.scope?.id !== 'all' ? s.scope?.id : undefined);
      const url = chId ? `/api/gallery?chapterId=${encodeURIComponent(chId)}` : '/api/gallery';
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setGalleryItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load gallery items', err);
    } finally {
      setGalleryLoading(false);
    }
  };

  useEffect(() => {
    void loadGallery();
  }, [s.scope?.id, selectedFilterChapterId]);

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoTitle.trim() || !photoImageUrl.trim()) {
      setGalleryError('Title and an image are required.');
      return;
    }
    setPhotoBusy(true);
    setGalleryError(null);
    try {
      const token = authStorage.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const resolvedPhotoChapterId = photoChapterId || (isLeadershipTeam && selectedFilterChapterId !== 'all' ? selectedFilterChapterId : (s.scope?.id !== 'all' ? s.scope?.id : chapterOptions[0]?.id));
      const targetChapterObj = chapterOptions.find(c => c.id === resolvedPhotoChapterId);
      const resolvedLabel = photoLabel.trim() || targetChapterObj?.name || s.scope?.name || 'Chapter Gallery';

      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: photoTitle.trim(),
          caption: photoCaption.trim() || undefined,
          mediaLabel: resolvedLabel,
          imageUrl: photoImageUrl.trim(),
          chapterId: resolvedPhotoChapterId || undefined,
          eventId: photoEventId ? photoEventId : undefined
        })
      });

      if (res.ok) {
        setPhotoTitle('');
        setPhotoCaption('');
        setPhotoImageUrl('');
        setPhotoEventId('');
        setShowAddPhoto(false);
        setGallerySuccess('Photo published to chapter gallery successfully! Members can now view it.');
        await loadGallery();
      } else {
        const errData = await res.json().catch(() => null);
        setGalleryError(errData?.message || 'Failed to save photo.');
      }
    } catch (err: any) {
      setGalleryError(err?.message || 'Error occurred while saving photo.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this photo from the gallery?')) return;
    try {
      const token = authStorage.getToken();
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/gallery/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setGalleryItems(prev => prev.filter(p => p.id !== id));
        setGallerySuccess('Photo removed from gallery.');
      }
    } catch (err) {
      console.error('Failed to delete photo', err);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setGalleryError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setGalleryError('Image size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoImageUrl(reader.result);
        if (!photoTitle) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setPhotoTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const req = useMemo(() => ({ queryId: 'org.events.list', organisationScope: s.scope.id, pageSize: 50 }), [s.scope.id]);
  const page = useDomainCursorPage<EventItem>(req, s.events);
  useRealtimeRefresh(['org.event.*', 'org.attendance.*', 'org.meeting.*', 'org.task.*'], page.reload);

  useEffect(() => {
    void loadAllRsvpSummaries();
  }, [page.page?.items, s.events]);

  const createEvent = async () => {
    if (!title.trim() || !scheduledAt) return;

    const resolvedChId = (isLeadershipTeam && targetChapterId)
      ? targetChapterId
      : (s.scope.id !== 'all' ? s.scope.id : (chapterOptions[0]?.id || ''));
    const resolvedChName = resolvedChId
      ? (chapterOptions.find(c => c.id === resolvedChId)?.name || s.scope.name)
      : s.scope.name;

    const payload: any = {
      title: title.trim(),
      type,
      scheduledAt: new Date(scheduledAt).toISOString(),
      location: location.trim(),
      quorumRequired: 1,
      participants: [s.actor.id]
    };

    if (resolvedChId) {
      payload.scopeId = resolvedChId;
      payload.scopeName = resolvedChName;
      payload.scopeLevel = 'CHAPTER';
    }

    const result = await cmd.run({
      commandType: 'org.meeting.create',
      aggregateType: 'Meeting',
      payload,
      reason: 'Create chapter event'
    });
    if (result.ok) {
      setTitle('');
      setScheduledAt('');
      setLocation('');
      setShowCreate(false);
      page.reload();
    }
  };

  const openEditModal = (e: EventItem) => {
    setEditingEvent(e);
    setEditTitle(e.name || (e as any).title || '');
    const dateVal = (e as any).scheduledAt || e.date;
    try {
      const d = dateVal ? new Date(dateVal) : new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setEditScheduledAt(localIso);
    } catch {
      setEditScheduledAt('');
    }
    setEditType((e as any).type || 'NETWORKING');
    setEditLocation(e.location || '');
    setEditQuorum((e as any).quorumRequired || 1);
    setEditChapterId((e as any).chapterId || e.scope?.id || (chapterOptions[0]?.id || ''));
  };

  const saveEditEvent = async () => {
    if (!editingEvent || !editTitle.trim() || !editScheduledAt) return;
    const resolvedChId = editChapterId || (editingEvent as any).chapterId || editingEvent.scope?.id;
    const resolvedChName = chapterOptions.find(c => c.id === resolvedChId)?.name || (editingEvent as any).chapterName || editingEvent.scope?.name;

    const result = await cmd.run({
      commandType: 'org.meeting.update',
      aggregateType: 'Meeting',
      aggregateId: editingEvent.id,
      payload: {
        title: editTitle.trim(),
        scheduledAt: new Date(editScheduledAt).toISOString(),
        type: editType,
        location: editLocation.trim(),
        quorumRequired: Number(editQuorum) || 1,
        scopeId: resolvedChId,
        scopeName: resolvedChName
      },
      reason: 'Update event details'
    });

    if (result.ok) {
      setEditingEvent(null);
      page.reload();
    }
  };

  const deleteEvent = async (e: EventItem) => {
    const confirmMsg = `Are you sure you want to delete "${e.name}"? This action will permanently remove it from both Chapter Leadership and Member views.`;
    if (!window.confirm(confirmMsg)) return;

    const result = await cmd.run({
      commandType: 'org.meeting.delete',
      aggregateType: 'Meeting',
      aggregateId: e.id,
      payload: {},
      reason: 'Delete chapter meeting'
    });

    if (result.ok) {
      page.reload();
    }
  };

  // Filter items chapter-wise if Leadership Team / Trustee
  const displayedItems = useMemo(() => {
    const rawItems = page.page?.items || [];
    if (!isLeadershipTeam && !isTrust) return rawItems;
    if (selectedFilterChapterId === 'all') return rawItems;
    return rawItems.filter(e => {
      const eChId = (e as any).chapterId || e.scope?.id || '';
      const eChName = ((e as any).chapterName || e.scope?.name || '').toLowerCase();
      const targetOpt = chapterOptions.find(c => c.id === selectedFilterChapterId);
      const targetName = (targetOpt?.name || '').toLowerCase();
      return eChId === selectedFilterChapterId || (targetName && eChName.includes(targetName));
    });
  }, [page.page?.items, isLeadershipTeam, isTrust, selectedFilterChapterId, chapterOptions]);

  const updateStatus = async (e: EventItem, status: string) => {
    const result = await cmd.run({
      commandType: 'org.event.update',
      aggregateType: 'Event',
      aggregateId: e.id,
      expectedVersion: e.version,
      payload: { status },
      reason: `Event status to ${status}`
    });
    if (result.ok) page.reload();
  };

  const openClosureModal = (e: EventItem) => {
    setSelectedClosureEvent(e);
    setClosureTitle(`Close ${e.name}`);
    setClosureOwner(s.actor.name || e.owner || 'Chapter Coordinator');
    setClosureDue(e.date || businessDateOnly(7));
  };

  const confirmClosure = async () => {
    if (!selectedClosureEvent || !closureTitle.trim()) return;
    const task = {
      title: closureTitle.trim(),
      description: 'Complete attendance, outcome, feedback, follow-up and finance/media references.',
      owner: closureOwner.trim() || s.actor.name,
      sourceType: 'EVENT',
      sourceId: selectedClosureEvent.id,
      due: closureDue || selectedClosureEvent.date || businessDateOnly(7),
      priority: 'MEDIUM' as const,
      status: 'TODO' as const,
      scope: selectedClosureEvent.scope
    };

    const result = await cmd.run(
      {
        commandType: 'org.task.create',
        aggregateType: 'Task',
        payload: task,
        reason: 'Event closure follow-through'
      },
      () => s.dispatch({ type: 'ADD_TASK', payload: task })
    );

    if (result.ok) {
      const eventId = selectedClosureEvent.id;
      setCreatedClosureIds(prev => new Set(prev).add(eventId));
      setClosureSuccessMessage(`Closure work created for "${selectedClosureEvent.name}". Task added to Action Register!`);
      setSelectedClosureEvent(null);
      page.reload();
    }
  };

  const hasClosureTask = (e: EventItem) => {
    return createdClosureIds.has(e.id) || s.tasks.some(t => t.sourceType === 'EVENT' && (t.sourceId === e.id || t.title.toLowerCase().includes(e.name.toLowerCase())));
  };

  return (
    <>
      <PageHeader 
        title="Events & Attendance" 
        actions={
          isTrust ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-2xs">
              <ShieldCheck className="size-4 text-amber-600" />
              <span>Trustee Audit Mode (Read-Only)</span>
            </div>
          ) : isLeadershipTeam ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold shadow-2xs">
              <ShieldCheck className="size-4 text-indigo-600" />
              <span>Leadership Team Mode (Edit & Delete Access)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button 
                type="button"
                className="btn inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 font-bold text-xs min-h-[42px] text-slate-700 shadow-2xs hover:shadow transition-all cursor-pointer"
                onClick={() => {
                  setGalleryError(null);
                  setShowAddPhoto(true);
                }}
              >
                <PhotoIcon className="size-4 text-[#1b5fa7]" />
                <span>Add Photo to Gallery</span>
              </button>

              <button 
                type="button"
                className="btn primary inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1b5fa7] !text-white hover:bg-[#174f89] font-bold text-xs min-h-[42px] shadow-sm hover:shadow transition-all duration-150 cursor-pointer"
                style={{ color: '#ffffff' }}
                onClick={() => setShowCreate(true)}
              >
                <PlusIcon className="size-4 !text-white" />
                <span style={{ color: '#ffffff' }}>New Event</span>
              </button>
            </div>
          )
        }
      >
        Template-driven event execution, attendance oversight, correction and closure.
      </PageHeader>

      {isTrust && (
        <div className="mb-5 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-3 text-xs shadow-2xs">
          <ShieldCheck className="size-5 text-blue-600 shrink-0" />
          <div>
            <span className="font-bold">Trustee Read-Only Oversight: </span>
            <span>You have audit access to all chapter events and attendee records. Event creation, photo management, and closure actions are exclusively governed by Chapter Leadership (President, Treasurer, Secretary, Member Coordinator).</span>
          </div>
        </div>
      )}

      {isLeadershipTeam && (
        <div className="mb-5 p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-center gap-3 text-xs shadow-2xs">
          <ShieldCheck className="size-5 text-indigo-600 shrink-0" />
          <div>
            <span className="font-bold">Leadership Governance Mode: </span>
            <span>You have edit and delete governance access on existing chapter events across all chapters. Parivar officers initiate new events.</span>
          </div>
        </div>
      )}

      <CommandFeedback busy={cmd.busy} slow={cmd.slow} error={cmd.error} onRetry={cmd.retry}/>

      {/* Success Notification Banner for Closure Work */}
      {closureSuccessMessage && (
        <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-4.5" />
            </span>
            <div>
              <p className="text-sm font-bold">{closureSuccessMessage}</p>
              <p className="text-xs text-emerald-700">All closure tasks are visible and trackable in the Action Register.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/org/tasks"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors"
            >
              <span>View in Tasks</span>
              <ArrowRight className="size-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setClosureSuccessMessage(null)}
              className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Gallery Feedback Notification Banner */}
      {gallerySuccess && (
        <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-4.5" />
            </span>
            <p className="text-sm font-bold">{gallerySuccess}</p>
          </div>
          <button
            type="button"
            onClick={() => setGallerySuccess(null)}
            className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Modal Popup for Creating Event */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget) setShowCreate(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-event-title"
        >
          <div
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden transform transition-all"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-[#1b5fa7] shadow-2xs border border-sky-100">
                  <CalendarDays className="size-5 text-[#1b5fa7]" />
                </span>
                <div>
                  <h3 id="modal-event-title" className="text-base font-bold text-slate-900">
                    Create New Event
                  </h3>
                  <p className="text-xs text-slate-500">
                    Schedule a chapter event, networking meet, or training session
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="grid size-8 place-items-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
                title="Close popup"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Target Chapter Selection for Leadership Team / Multi-Chapter */}
              {chapterOptions.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-indigo-600" />
                    <span>Target Parivar</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 transition-all min-h-[44px]"
                    value={targetChapterId}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setTargetChapterId(e.target.value)}
                  >
                    {chapterOptions.map(c => (
                      <option key={c.id} value={c.id}>📍 {c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Event Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <SparklesIcon className="size-3.5 text-slate-400" />
                  <span>Event Title / Name</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1b5fa7] focus:ring-3 focus:ring-sky-100 transition-all min-h-[44px]"
                  placeholder="e.g. Annual Parivar Networking Conclave"
                  value={title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Schedule Date & Time */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 text-slate-400" />
                    <span>Schedule Date & Time</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#1b5fa7] focus:ring-3 focus:ring-sky-100 transition-all min-h-[44px]"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setScheduledAt(e.target.value)}
                  />
                </div>

                {/* Event Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <TagIcon className="size-3.5 text-slate-400" />
                    <span>Event Type</span>
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#1b5fa7] focus:ring-3 focus:ring-sky-100 transition-all min-h-[44px]"
                    value={type}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setType(e.target.value)}
                  >
                    <option value="NETWORKING">Networking Conclave</option>
                    <option value="TRAINING">Leadership / Skill Training</option>
                    <option value="BUSINESS_MEET">Parivar Business Meet</option>
                    <option value="SOCIAL">Community & Social Event</option>
                  </select>
                </div>
              </div>

              {/* Location / Venue */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPinIcon className="size-3.5 text-slate-400" />
                  <span>Location / Venue</span>
                </label>
                <input
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1b5fa7] focus:ring-3 focus:ring-sky-100 transition-all min-h-[44px]"
                  placeholder="e.g. Conference Hall or Online Meeting link"
                  value={location}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                />
              </div>

              {/* Visibility note */}
              <div className="text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span>Visible to <strong className="text-slate-900">{chapterOptions.find(c => c.id === targetChapterId)?.name || s.scope.name}</strong> members ({s.scope.level}).</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 min-h-[42px] transition-all cursor-pointer"
                onClick={() => setShowCreate(false)}
              >
                <span>Cancel</span>
              </button>

              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  className="btn primary inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1b5fa7] !text-white font-bold text-xs hover:bg-[#174f89] shadow-sm hover:shadow min-h-[42px] transition-all disabled:opacity-50 cursor-pointer"
                  style={{ color: '#ffffff' }}
                  disabled={cmd.busy || !title.trim() || !scheduledAt}
                  onClick={() => void createEvent()}
                >
                  <PlusIcon className="size-4 !text-white" />
                  <span style={{ color: '#ffffff' }}>Create Event</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Popup for Editing Event */}
      {editingEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget) setEditingEvent(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-edit-event-title"
        >
          <div
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden transform transition-all"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-indigo-50/50">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-indigo-100 text-indigo-700 shadow-2xs border border-indigo-200">
                  <EditIcon className="size-5 text-indigo-600" />
                </span>
                <div>
                  <h3 id="modal-edit-event-title" className="text-base font-bold text-slate-900">
                    Modify & Update Event Details
                  </h3>
                  <p className="text-xs text-slate-500">
                    Leadership Team governance: Real-time update across Chapter Leadership and Member portals
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="grid size-8 place-items-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
                title="Close popup"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Target Chapter Selection */}
              {chapterOptions.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-indigo-600" />
                    <span>Assigned Parivar</span>
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 transition-all min-h-[44px]"
                    value={editChapterId}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setEditChapterId(e.target.value)}
                  >
                    {chapterOptions.map(c => (
                      <option key={c.id} value={c.id}>📍 {c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Event Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <SparklesIcon className="size-3.5 text-slate-400" />
                  <span>Event Title / Name</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 transition-all min-h-[44px]"
                  value={editTitle}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEditTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Schedule Date & Time */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 text-slate-400" />
                    <span>Date & Time</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 transition-all min-h-[44px]"
                    type="datetime-local"
                    value={editScheduledAt}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEditScheduledAt(e.target.value)}
                  />
                </div>

                {/* Event Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <TagIcon className="size-3.5 text-slate-400" />
                    <span>Event Type</span>
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 transition-all min-h-[44px]"
                    value={editType}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setEditType(e.target.value)}
                  >
                    <option value="NETWORKING">Networking Conclave</option>
                    <option value="TRAINING">Leadership / Skill Training</option>
                    <option value="BUSINESS_MEET">Parivar Business Meet</option>
                    <option value="SOCIAL">Community & Social Event</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Location / Venue */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPinIcon className="size-3.5 text-slate-400" />
                    <span>Location / Venue</span>
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 transition-all min-h-[44px]"
                    placeholder="e.g. Conference Hall or Online link"
                    value={editLocation}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEditLocation(e.target.value)}
                  />
                </div>

                {/* Quorum Required */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <UsersIcon className="size-3.5 text-slate-400" />
                    <span>Quorum Required</span>
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 transition-all min-h-[44px]"
                    type="number"
                    min="1"
                    value={editQuorum}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEditQuorum(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 min-h-[42px] transition-all cursor-pointer"
                onClick={() => setEditingEvent(null)}
              >
                <span>Cancel</span>
              </button>

              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  className="btn primary inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 !text-white font-bold text-xs shadow-sm hover:shadow min-h-[42px] transition-all disabled:opacity-50 cursor-pointer"
                  style={{ color: '#ffffff' }}
                  disabled={cmd.busy || !editTitle.trim() || !editScheduledAt}
                  onClick={() => void saveEditEvent()}
                >
                  <CheckCircle2 className="size-4 !text-white" />
                  <span style={{ color: '#ffffff' }}>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Popup for Creating Event Closure Work */}
      {selectedClosureEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget) setSelectedClosureEvent(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-closure-title"
        >
          <div
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden transform transition-all"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-[#1b5fa7] shadow-2xs border border-sky-100">
                  <CheckSquare className="size-5 text-[#1b5fa7]" />
                </span>
                <div>
                  <h3 id="modal-closure-title" className="text-base font-bold text-slate-900">
                    Create Event Closure Work
                  </h3>
                  <p className="text-xs text-slate-500">
                    Establish official closure obligations in the Action Register for this event
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClosureEvent(null)}
                className="grid size-8 place-items-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
                title="Close popup"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Event Context Banner */}
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/70 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">Target Event</span>
                  <strong className="text-sm font-bold text-slate-900">{selectedClosureEvent.name}</strong>
                  <span className="text-xs text-slate-500 block mt-0.5">Date: {selectedClosureEvent.date} · Location: {selectedClosureEvent.location || 'Online'}</span>
                </div>
                <StatusPill value={selectedClosureEvent.status} />
              </div>

              {/* Obligation Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CheckSquare className="size-3.5 text-slate-400" />
                  <span>Closure Obligation Title</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1b5fa7] focus:ring-3 focus:ring-sky-100 transition-all min-h-[44px]"
                  value={closureTitle}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setClosureTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Closure Owner */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="size-3.5 text-slate-400" />
                    <span>Assigned Owner</span>
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#1b5fa7] focus:ring-3 focus:ring-sky-100 transition-all min-h-[44px]"
                    value={closureOwner}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setClosureOwner(e.target.value)}
                  />
                </div>

                {/* Due Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 text-slate-400" />
                    <span>Closure Due Date</span>
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#1b5fa7] focus:ring-3 focus:ring-sky-100 transition-all min-h-[44px]"
                    type="date"
                    value={closureDue}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setClosureDue(e.target.value)}
                  />
                </div>
              </div>

              {/* Closure Deliverables Checklist */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block mb-2">Standard Closure Scope:</span>
                <ul className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Verify Member Attendance</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Record Outcomes & MoM</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Assign Follow-up Actions</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Financial / Media References</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 min-h-[42px] transition-all cursor-pointer"
                onClick={() => setSelectedClosureEvent(null)}
              >
                <span>Cancel</span>
              </button>

              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  className="btn primary inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1b5fa7] !text-white font-bold text-xs hover:bg-[#174f89] shadow-sm hover:shadow min-h-[42px] transition-all disabled:opacity-50 cursor-pointer"
                  style={{ color: '#ffffff' }}
                  disabled={cmd.busy || !closureTitle.trim()}
                  onClick={() => void confirmClosure()}
                >
                  <CheckSquare className="size-4 !text-white" />
                  <span style={{ color: '#ffffff' }}>Create Closure Task</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chapter Filter Chips for Leadership Team & Trustee */}
      {(isLeadershipTeam || isTrust) && (
        <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-indigo-600" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">Filter By Parivar:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedFilterChapterId('all');
                org.setScope({ id: 'all', name: 'All Chapters (Network-Wide)', level: 'NATIONAL' });
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedFilterChapterId === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              🌟 All Chapters ({page.page?.items?.length ?? 0})
            </button>
            {chapterOptions.map(c => {
              const count = (page.page?.items || []).filter(e => {
                const eId = (e as any).chapterId || e.scope?.id;
                const eName = ((e as any).chapterName || e.scope?.name || '').toLowerCase();
                return eId === c.id || eName.includes(c.name.toLowerCase());
              }).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedFilterChapterId(c.id);
                    org.setScope({ id: c.id, name: c.name, level: 'CHAPTER' });
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedFilterChapterId === c.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  📍 {c.name} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Events List */}
      <AsyncState loading={page.loading} refreshing={page.refreshing} stale={page.stale} error={page.error} onRetry={page.reload}>
        {displayedItems.length ? (
          <div className="list space-y-3">
            {displayedItems.map(e => {
              const isActive = e.status === 'Active';
              const isCompleted = e.status === 'Completed' || e.status === 'Closed';
              const borderAccent = isActive
                ? 'border-l-4 border-l-emerald-500'
                : isCompleted
                ? 'border-l-4 border-l-blue-600'
                : 'border-l-4 border-l-[#1b5fa7]';

              const closureActive = hasClosureTask(e);
              const eventChapterName = (e as any).chapterName || e.scope?.name || 'Assigned Chapter';

              return (
                <div
                  key={e.id}
                  className={`p-4.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${borderAccent}`}
                >
                  {/* Event Information */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center gap-1 font-extrabold text-[11px] px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                        <Building2 className="size-3 text-indigo-600" />
                        <span>{eventChapterName}</span>
                      </span>

                      <Link
                        className="row-title font-bold text-base text-slate-900 hover:text-[#1b5fa7] transition-colors line-clamp-1 block"
                        to={`/org/events/${e.id}`}
                      >
                        {e.name}
                      </Link>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-2">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <CalendarDays className="size-3 text-slate-400" />
                        <span>{e.date}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <MapPinIcon className="size-3 text-slate-400" />
                        <span>{e.location || 'Online / Venue TBD'}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <User className="size-3 text-slate-400" />
                        <span>{e.owner}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 font-bold text-[#1b5fa7] bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                        <UsersIcon className="size-3 text-[#1b5fa7]" />
                        <span>Attendance: {e.attendance ?? 0}</span>
                      </span>
                    </div>

                    {/* Live Chapter Member RSVP Counts */}
                    {(() => {
                      const summary = rsvpMap[e.id];
                      const attCount = summary?.attendingCount ?? (e.attendance ?? 0);
                      const notAvailCount = summary?.notAvailableCount ?? 0;
                      const subCount = summary?.substituteCount ?? 0;
                      const totalCount = summary?.totalResponses ?? (e.attendance ?? 0);

                      return (
                        <div className="flex flex-wrap items-center gap-2 mt-2.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                            <span className="size-2 rounded-full bg-emerald-500"></span>
                            <span>Attending: {attCount}</span>
                          </span>

                          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
                            <span className="size-2 rounded-full bg-rose-500"></span>
                            <span>Not Available: {notAvailCount}</span>
                          </span>

                          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                            <span className="size-2 rounded-full bg-amber-500"></span>
                            <span>Substitute: {subCount}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => openRsvpDetailModal(e)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1b5fa7] hover:text-[#174f89] hover:underline px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100/80 border border-sky-200/80 cursor-pointer transition-all shadow-2xs"
                          >
                            <UsersIcon className="size-3.5 text-[#1b5fa7]" />
                            <span>View Member RSVPs ({totalCount})</span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Actions */}
                  <div className="row-actions flex flex-wrap items-center gap-2 shrink-0">
                    <StatusPill value={e.status} />

                    <Link
                      className="btn px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs min-h-[38px] inline-flex items-center transition-all shadow-2xs cursor-pointer"
                      to={`/org/events/${e.id}`}
                    >
                      Open event
                    </Link>

                    {!isTrust && (
                      <>
                        <button
                          type="button"
                          className="btn px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs min-h-[38px] inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                          onClick={() => openEditModal(e)}
                          title="Modify event details"
                        >
                          <EditIcon className="size-3.5 text-blue-600" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          className="btn px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs min-h-[38px] inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                          onClick={() => void deleteEvent(e)}
                          title="Delete this event from all views"
                        >
                          <Trash2 className="size-3.5 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}

                    {e.committeeId && (
                      <Link
                        className="btn px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs min-h-[38px] inline-flex items-center transition-all shadow-2xs"
                        to={`/org/committees/${e.committeeId}`}
                      >
                        Committee
                      </Link>
                    )}

                    {e.programmeId && (
                      <Link
                        className="btn px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs min-h-[38px] inline-flex items-center transition-all shadow-2xs"
                        to={`/org/programmes/${e.programmeId}`}
                      >
                        Programme
                      </Link>
                    )}

                    {!isActive && !isTrust && (
                      <button
                        type="button"
                        className="btn px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs min-h-[38px] transition-all disabled:opacity-40 cursor-pointer shadow-2xs"
                        disabled={cmd.busy}
                        onClick={() => void updateStatus(e, 'Active')}
                      >
                        Activate
                      </button>
                    )}

                    {closureActive ? (
                      <div className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                          <CheckCircle2 className="size-3.5 text-emerald-600" />
                          <span>Closure work active</span>
                        </span>
                        <Link
                          to="/org/tasks"
                          className="text-xs font-bold text-[#1b5fa7] hover:underline whitespace-nowrap"
                        >
                          View in Tasks →
                        </Link>
                      </div>
                    ) : (
                      !isTrust && (
                        <button
                          type="button"
                          className="btn primary inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#1b5fa7] !text-white font-bold text-xs hover:bg-[#174f89] shadow-xs min-h-[38px] transition-all disabled:opacity-40 cursor-pointer"
                          style={{ color: '#ffffff' }}
                          disabled={cmd.busy}
                          onClick={() => openClosureModal(e)}
                          title="Create closure work in Action Register"
                        >
                          <CheckSquare className="size-3.5 !text-white" />
                          <span style={{ color: '#ffffff' }}>Create closure work</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No Events in this scope" />
        )}
        <CursorPager canPrevious={page.canPrevious} canNext={page.canNext} onPrevious={page.previous} onNext={page.next} totalEstimate={page.page?.totalEstimate}/>
      </AsyncState>

      {/* Chapter Photo Gallery Section */}
      <div className="mt-10 p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-[#1b5fa7]">
              <PhotoIcon className="size-5 text-[#1b5fa7]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Parivar Gallery & Event Highlights</h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px]">
                  {galleryItems.length} {galleryItems.length === 1 ? 'photo' : 'photos'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Photos uploaded here are immediately visible to {s.scope?.name || 'chapter'} members in their Photo Gallery app.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setGalleryError(null);
              setShowAddPhoto(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1b5fa7] hover:bg-[#174f89] text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <UploadIcon className="size-3.5 text-white" />
            <span>Upload Photo</span>
          </button>
        </div>

        {galleryLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading gallery photos...</div>
        ) : galleryItems.length === 0 ? (
          <div className="py-10 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <PhotoIcon className="size-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No photos uploaded for this chapter yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Click "Upload Photo" or "Add Photo to Gallery" above to share meeting or event moments.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {galleryItems.map(item => (
              <div
                key={item.id}
                className="group relative rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden hover:shadow-md hover:border-slate-300 transition-all flex flex-col"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                      <PhotoIcon className="size-8" />
                    </div>
                  )}
                  {item.mediaLabel && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/70 backdrop-blur-xs text-[10px] font-bold text-white uppercase tracking-wider">
                      {item.mediaLabel}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleDeletePhoto(item.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 hover:bg-rose-50 text-slate-500 hover:text-rose-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Delete photo"
                  >
                    <TrashIcon className="size-3.5" />
                  </button>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.title}</h4>
                    {item.caption && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.caption}</p>
                    )}
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <span className="text-emerald-600 font-semibold">Published</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Popup for Uploading Photo to Gallery */}
      {showAddPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget) setShowAddPhoto(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden transform transition-all"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-[#1b5fa7] shadow-2xs border border-sky-100">
                  <UploadIcon className="size-5 text-[#1b5fa7]" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Photo to Parivar Gallery</h3>
                  <p className="text-xs text-slate-500">Publish high-resolution photos for chapter members to view</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPhoto(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePhoto} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {galleryError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {galleryError}
                </div>
              )}

              {/* Image Preview & Upload Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Photo <span className="text-rose-500">*</span>
                </label>
                {photoImageUrl ? (
                  <div className="relative aspect-[16/9] w-full rounded-xl border border-slate-200 overflow-hidden bg-slate-900 group">
                    <img src={photoImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold text-xs cursor-pointer shadow hover:bg-slate-100">
                        Change Photo
                        <input type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
                      </label>
                      <button
                        type="button"
                        onClick={() => setPhotoImageUrl('')}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs shadow hover:bg-rose-700 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-[#1b5fa7] rounded-xl p-6 bg-slate-50/50 hover:bg-sky-50/30 transition-all cursor-pointer">
                      <UploadIcon className="size-8 text-[#1b5fa7] mb-2" />
                      <span className="text-xs font-bold text-slate-800">Click to upload an image from your device</span>
                      <span className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, WebP up to 5MB</span>
                      <input type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
                    </label>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-400 font-medium">Or enter Image URL:</span>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={photoImageUrl}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setPhotoImageUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1b5fa7]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Photo Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Parivar Meet - Keynote Session"
                  value={photoTitle}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPhotoTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Caption / Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description of the moment, attendees, or achievements..."
                  value={photoCaption}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPhotoCaption(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Target Chapter for Photos */}
                {chapterOptions.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Target Chapter
                    </label>
                    <select
                      value={photoChapterId}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setPhotoChapterId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#1b5fa7]"
                    >
                      <option value="">-- Active Scope ({s.scope.name}) --</option>
                      {chapterOptions.map(c => (
                        <option key={c.id} value={c.id}>📍 {c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Category / Media Label */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Category Tag
                  </label>
                  <select
                    value={photoLabel}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setPhotoLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#1b5fa7]"
                  >
                    <option value="Chapter Meeting">Parivar Meeting</option>
                    <option value="Networking Gala">Networking Gala</option>
                    <option value="Award Ceremony">Award Ceremony</option>
                    <option value="Industrial Visit">Industrial Visit</option>
                    <option value="Delegation Meet">Delegation Meet</option>
                    <option value="CSR Initiative">CSR Initiative</option>
                    <option value="General">General</option>
                  </select>
                </div>

                {/* Related Event */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Link to Event <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    value={photoEventId}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setPhotoEventId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#1b5fa7]"
                  >
                    <option value="">-- No specific event --</option>
                    {page.page?.items.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddPhoto(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={photoBusy || !photoTitle.trim() || !photoImageUrl.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1b5fa7] hover:bg-[#174f89] text-white font-bold text-xs shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
                >
                  <UploadIcon className="size-3.5 text-white" />
                  <span>{photoBusy ? 'Publishing...' : 'Publish to Gallery'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member RSVPs Detail Modal */}
      {selectedRsvpEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget) setSelectedRsvpEvent(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all max-h-[90vh] flex flex-col"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700 shadow-2xs border border-indigo-100">
                  <UsersIcon className="size-5 text-indigo-600" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Member Attendance Responses (RSVP)
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {selectedRsvpEvent.name} · {selectedRsvpEvent.date}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRsvpEvent(null)}
                className="grid size-8 place-items-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Summary KPI Cards */}
            <div className="p-6 border-b border-slate-100 bg-white space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <div className="text-xs font-bold text-emerald-800">Attending</div>
                  <div className="text-2xl font-black text-emerald-700 mt-0.5">
                    {rsvpModalData?.attendingCount ?? 0}
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-0.5">Confirmed presence</div>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <div className="text-xs font-bold text-rose-800">Not Available</div>
                  <div className="text-2xl font-black text-rose-700 mt-0.5">
                    {rsvpModalData?.notAvailableCount ?? 0}
                  </div>
                  <div className="text-[11px] text-rose-600 mt-0.5">Excused absence</div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <div className="text-xs font-bold text-amber-800">Substitute</div>
                  <div className="text-2xl font-black text-amber-700 mt-0.5">
                    {rsvpModalData?.substituteCount ?? 0}
                  </div>
                  <div className="text-[11px] text-amber-600 mt-0.5">Representative sent</div>
                </div>
              </div>

              {/* Filter Tabs and Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                  {(['ALL', 'ATTENDING', 'NOT_AVAILABLE', 'SUBSTITUTE'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setRsvpFilterStatus(tab)}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        rsvpFilterStatus === tab
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab === 'ALL'
                        ? `All (${rsvpModalData?.totalResponses ?? 0})`
                        : tab === 'ATTENDING'
                        ? `Attending (${rsvpModalData?.attendingCount ?? 0})`
                        : tab === 'NOT_AVAILABLE'
                        ? `Not Available (${rsvpModalData?.notAvailableCount ?? 0})`
                        : `Substitute (${rsvpModalData?.substituteCount ?? 0})`}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Search member or substitute..."
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                  value={rsvpSearchQuery}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setRsvpSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Responses List */}
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {rsvpModalLoading ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  <div className="inline-block size-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p>Loading member responses...</p>
                </div>
              ) : !rsvpModalData?.responses || rsvpModalData.responses.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  <UsersIcon className="size-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No member responses received yet</p>
                  <p className="text-xs text-slate-500 mt-1">When chapter members select their attendance option, responses will appear here in real-time.</p>
                </div>
              ) : (
                (() => {
                  const filtered = rsvpModalData.responses.filter(r => {
                    if (rsvpFilterStatus !== 'ALL' && r.status !== rsvpFilterStatus) return false;
                    if (rsvpSearchQuery.trim()) {
                      const q = rsvpSearchQuery.toLowerCase();
                      const matchMember = (r.memberName || '').toLowerCase().includes(q);
                      const matchSub = (r.substituteName || '').toLowerCase().includes(q);
                      const matchPhone = (r.memberPhone || '').includes(q) || (r.substitutePhone || '').includes(q);
                      if (!matchMember && !matchSub && !matchPhone) return false;
                    }
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-8 text-center text-xs text-slate-500">
                        No responses matching "{rsvpSearchQuery}" in filter.
                      </div>
                    );
                  }

                  return filtered.map(item => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{item.memberName || 'Chapter Member'}</span>
                          {item.chapterName && (
                            <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                              {item.chapterName}
                            </span>
                          )}
                        </div>

                        {item.status === 'ATTENDING' && (
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                            <span>Attending In Person</span>
                          </div>
                        )}

                        {item.status === 'NOT_AVAILABLE' && (
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-md">
                            <X className="size-3.5 text-rose-600" />
                            <span>Not Available</span>
                          </div>
                        )}

                        {item.status === 'SUBSTITUTE' && (
                          <div className="space-y-1 mt-1">
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                              <span>Substitute: {item.substituteName}</span>
                            </div>
                            {item.substitutePhone && (
                              <div className="text-xs text-slate-600">
                                📞 Mobile: <strong>{item.substitutePhone}</strong>
                              </div>
                            )}
                            {item.notes && (
                              <div className="text-xs text-slate-500 italic">
                                "{item.notes}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right text-[11px] text-slate-400 shrink-0">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleString('en-IN', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : 'Recorded'}
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedRsvpEvent(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled Closure Standard Card */}
      <div className="card mt-10 p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3 mb-3">
          <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-[#1b5fa7]">
            <CheckSquare className="size-5 text-[#1b5fa7]" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">Standard Event Closure Lifecycle</h2>
            <p className="text-xs text-slate-500">Every concluded event must record authoritative closure artifacts.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Step 1</span>
            <strong className="text-xs font-bold text-slate-900 block">Attendance Check</strong>
            <p className="text-[11px] text-slate-500 mt-0.5">Validate participant count & attendance records</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Step 2</span>
            <strong className="text-xs font-bold text-slate-900 block">Outcomes & MoM</strong>
            <p className="text-[11px] text-slate-500 mt-0.5">Document meeting resolutions and outcomes</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Step 3</span>
            <strong className="text-xs font-bold text-slate-900 block">Open Actions</strong>
            <p className="text-[11px] text-slate-500 mt-0.5">Assign follow-up tasks to chapter members</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Step 4</span>
            <strong className="text-xs font-bold text-slate-900 block">Financial & Media</strong>
            <p className="text-[11px] text-slate-500 mt-0.5">Reconcile payments and upload references</p>
          </div>
        </div>
      </div>
    </>
  );
}

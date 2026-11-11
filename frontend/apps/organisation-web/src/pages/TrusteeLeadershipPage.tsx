import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Search,
  UserPlus,
  Clock,
  Building2,
  Lock,
  ChevronRight,
  AlertCircle,
  Award,
  Users,
  X,
  FileText
} from 'lucide-react';
import {
  chapterWorkflowApi,
  type TrusteeChapterItemDto,
  type TrusteeRegisteredMemberDto,
  type ChapterLeadershipMatrixDto,
  type ChapterLeaderItemDto,
} from '@/services/chapterWorkflowApi';
import { useOrg } from '@/state/OrgStore';
import { authStorage } from '@/utils/authStorage';

export default function TrusteeLeadershipPage() {
  const { actor } = useOrg();
  const isLeadershipTeam = authStorage.isLeadershipTeam();
  const isTrust = authStorage.isTrustUser();
  const isChapterLeader = authStorage.isChapterLeader();
  const isReadOnly = !isTrust; // Chapter Leaders (President, VP, Secretary, MC) & Leadership Team have Read-Only access
  const trusteeEmail = actor?.id || 'trust@dbn.network';

  // State
  const [chapters, setChapters] = useState<TrusteeChapterItemDto[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [matrix, setMatrix] = useState<ChapterLeadershipMatrixDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [registeredMembers, setRegisteredMembers] = useState<TrusteeRegisteredMemberDto[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warn'; message: string } | null>(null);

  // Modals state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetPosition, setTargetPosition] = useState<string>('President');
  const [selectedMember, setSelectedMember] = useState<TrusteeRegisteredMemberDto | null>(null);
  const [modalMemberSearch, setModalMemberSearch] = useState('');
  const [assignRemarks, setAssignRemarks] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Relieve Modal state
  const [relieveModalOpen, setRelieveModalOpen] = useState(false);
  const [targetLeaderToRelieve, setTargetLeaderToRelieve] = useState<ChapterLeaderItemDto | null>(null);
  const [relieveReason, setRelieveReason] = useState('');
  const [submittingRelieve, setSubmittingRelieve] = useState(false);

  // Suspend Modal state
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [targetLeaderToSuspend, setTargetLeaderToSuspend] = useState<ChapterLeaderItemDto | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendMembership, setSuspendMembership] = useState(false);
  const [submittingSuspend, setSubmittingSuspend] = useState(false);

  // Load Chapters
  const loadChapters = useCallback(async () => {
    try {
      setLoading(true);
      const data = await chapterWorkflowApi.getTrusteeChapters();
      setChapters(data);
      if (data.length > 0) {
        const sess = authStorage.getActiveSession();
        const leaderChapId = actor?.scope?.id || sess?.chapterId || sess?.scopeId;
        if (leaderChapId && data.some(c => c.id === leaderChapId)) {
          setSelectedChapterId(leaderChapId);
        } else if (!selectedChapterId) {
          setSelectedChapterId(data[0].id);
        }
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load chapters for Trustee governance.',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedChapterId]);

  useEffect(() => {
    loadChapters();
  }, [loadChapters]);

  // Load Leadership Matrix & Registered Members when Chapter changes
  const loadChapterData = useCallback(async (chapId: string) => {
    if (!chapId) return;
    try {
      setLoading(true);
      const [mat, members] = await Promise.all([
        chapterWorkflowApi.getChapterLeadershipMatrix(chapId),
        chapterWorkflowApi.getTrusteeRegisteredMembers(chapId),
      ]);
      setMatrix(mat);
      setRegisteredMembers(members);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load chapter leadership matrix.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChapterId) {
      loadChapterData(selectedChapterId);
    }
  }, [selectedChapterId, loadChapterData]);

  const selectedChapter = useMemo(() => {
    return chapters.find((c) => c.id === selectedChapterId) || null;
  }, [chapters, selectedChapterId]);

  // Overall summary metrics across all chapters
  const chapterSummaryStats = useMemo(() => {
    const totalChapters = chapters.length;
    const totalPositions = totalChapters * 4;
    let filledPositions = 0;
    chapters.forEach((c) => {
      const s = c.leadershipStatus;
      if (s) {
        if (s.president) filledPositions++;
        if (s.vicePresident) filledPositions++;
        if (s.secretary) filledPositions++;
        if (s.memberCoordinator) filledPositions++;
      }
    });
    return {
      totalChapters,
      totalPositions,
      filledPositions,
      vacantPositions: totalPositions - filledPositions,
    };
  }, [chapters]);

  // Filtered registered members in modal
  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return registeredMembers;
    const q = memberSearch.toLowerCase();
    return registeredMembers.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q)) ||
        (m.businessName && m.businessName.toLowerCase().includes(q))
    );
  }, [registeredMembers, memberSearch]);

  // Open Assign Modal
  const openAssignModal = (pos: string) => {
    if (isReadOnly) return;
    setTargetPosition(pos);
    setSelectedMember(null);
    setAssignRemarks(`Appointed by Trustee for active term`);
    setMemberSearch('');
    setModalMemberSearch('');
    setAssignModalOpen(true);
  };

  // Handle Submit Assign
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!selectedMember || !selectedChapterId) {
      setNotification({ type: 'warn', message: 'Please select an eligible registered member from the list.' });
      return;
    }

    setSubmittingAssign(true);
    try {
      const res = await chapterWorkflowApi.assignChapterLeadership({
        chapterId: selectedChapterId,
        memberIdentifier: selectedMember.email || selectedMember.memberIdentifier,
        position: targetPosition,
        remarks: assignRemarks.trim(),
        trusteeActor: trusteeEmail,
      });

      setNotification({ type: 'success', message: res.message });
      setAssignModalOpen(false);
      await loadChapterData(selectedChapterId);
      await loadChapters();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to assign leadership position.',
      });
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Open Relieve Modal
  const openRelieveModal = (leader: ChapterLeaderItemDto) => {
    if (isReadOnly) return;
    setTargetLeaderToRelieve(leader);
    setRelieveReason('');
    setRelieveModalOpen(true);
  };

  // Handle Submit Relieve
  const handleRelieveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!targetLeaderToRelieve || !selectedChapterId || !relieveReason.trim()) {
      setNotification({ type: 'warn', message: 'A justification reason must be specified.' });
      return;
    }

    setSubmittingRelieve(true);
    try {
      const res = await chapterWorkflowApi.relieveChapterLeadership({
        chapterId: selectedChapterId,
        leaderId: targetLeaderToRelieve.id,
        reason: relieveReason.trim(),
        trusteeActor: trusteeEmail,
      });

      setNotification({ type: 'success', message: res.message });
      setRelieveModalOpen(false);
      await loadChapterData(selectedChapterId);
      await loadChapters();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to relieve leadership position.',
      });
    } finally {
      setSubmittingRelieve(false);
    }
  };

  // Open Suspend Modal
  const openSuspendModal = (leader: ChapterLeaderItemDto) => {
    if (isReadOnly) return;
    setTargetLeaderToSuspend(leader);
    setSuspendReason('');
    setSuspendMembership(false);
    setSuspendModalOpen(true);
  };

  // Handle Submit Suspend
  const handleSuspendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!targetLeaderToSuspend || !selectedChapterId || !suspendReason.trim()) {
      setNotification({ type: 'warn', message: 'A justification reason for suspension is required.' });
      return;
    }

    setSubmittingSuspend(true);
    try {
      const res = await chapterWorkflowApi.suspendChapterLeadership({
        chapterId: selectedChapterId,
        leaderId: targetLeaderToSuspend.id,
        reason: suspendReason.trim(),
        suspendMembership,
        trusteeActor: trusteeEmail,
      });

      setNotification({ type: 'success', message: res.message });
      setSuspendModalOpen(false);
      await loadChapterData(selectedChapterId);
      await loadChapters();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to suspend leader.',
      });
    } finally {
      setSubmittingSuspend(false);
    }
  };

  // Handle Reinstate
  const handleReinstate = async (leader: ChapterLeaderItemDto) => {
    if (isReadOnly || !selectedChapterId) return;
    try {
      const res = await chapterWorkflowApi.reinstateChapterLeadership({
        chapterId: selectedChapterId,
        leaderId: leader.id,
        remarks: 'Reinstated by Trustee',
        trusteeActor: trusteeEmail,
      });
      setNotification({ type: 'success', message: res.message });
      await loadChapterData(selectedChapterId);
      await loadChapters();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to reinstate leader.',
      });
    }
  };

  return (
    <div className="w-full max-w-full min-w-0 box-border" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#ffffff',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              <ShieldCheck size={14} /> TRUSTEE GOVERNANCE OFFICE
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Scope: Tenant-Wide (All Parivars)</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Chapter Leadership Governance & Appointments
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', maxWidth: '720px', lineHeight: 1.5 }}>
            As Trustee, you hold sole governance authority to assign, relieve, and suspend Chapter Executives (President, Treasurer, Secretary, Member Coordinator). 
            <strong> Pre-requisite Enforced:</strong> Appointments can strictly only be given to verified, registered members.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '10px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logged in as Trustee</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>{trusteeEmail}</div>
          </div>
          <button
            onClick={() => selectedChapterId && loadChapterData(selectedChapterId)}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            title="Refresh Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            fontWeight: 500,
            background:
              notification.type === 'success'
                ? '#f0fdf4'
                : notification.type === 'error'
                ? '#fef2f2'
                : '#fffbeb',
            color:
              notification.type === 'success'
                ? '#166534'
                : notification.type === 'error'
                ? '#991b1b'
                : '#92400e',
            border: `1px solid ${
              notification.type === 'success'
                ? '#bbf7d0'
                : notification.type === 'error'
                ? '#fecaca'
                : '#fde68a'
            }`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {notification.type === 'success' && <CheckCircle2 size={16} />}
            {notification.type === 'error' && <AlertTriangle size={16} />}
            {notification.type === 'warn' && <AlertCircle size={16} />}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Governance Read-Only Notice Banner */}
      {isReadOnly && (
        <div
          style={{
            background: isChapterLeader ? '#f8fafc' : '#e0f2fe',
            border: isChapterLeader ? '1px solid #cbd5e1' : '1px solid #7dd3fc',
            borderRadius: '14px',
            padding: '14px 18px',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: isChapterLeader ? '#334155' : '#0369a1',
            fontSize: '13px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <ShieldCheck size={20} color={isChapterLeader ? '#475569' : '#0284c7'} style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ color: isChapterLeader ? '#0f172a' : '#0c4a6e' }}>
              {isChapterLeader ? 'Chapter Leader Read-Only Governance Mode:' : 'Leadership Team Read-Only Governance Mode:'}
            </strong>{' '}
            Chapter Executive appointments, reliefs, and suspensions are restricted exclusively to the DBN Trust Secretariat. 
            Chapter Leaders ({actor?.position || 'President, Treasurer, Secretary, Member Coordinator'}) have read-only visibility into appointed chapter positions.
          </div>
        </div>
      )}

      {/* Chapter Selection Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: 600, fontSize: '13px' }}>
            <Building2 size={18} color="#0284c7" /> Select Chapter:
          </div>
          <select
            value={selectedChapterId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedChapterId(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
              fontWeight: 600,
              color: '#0f172a',
              background: '#f8fafc',
              minWidth: '260px',
              cursor: 'pointer',
            }}
          >
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.memberCount} members {c.leadershipStatus.isFullyStaffed ? '· Staffed' : '· Vacancies'})
              </option>
            ))}
          </select>
        </div>

        {selectedChapter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Region: <strong style={{ color: '#0f172a' }}>{selectedChapter.regionId || 'Tamil Nadu West'}</strong>
            </div>
            <div style={{ width: '1px', height: '16px', background: '#cbd5e1' }} />
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              State: <strong style={{ color: '#0f172a' }}>{selectedChapter.stateId || 'Tamil Nadu'}</strong>
            </div>
            <div style={{ width: '1px', height: '16px', background: '#cbd5e1' }} />
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Registered Members: <strong style={{ color: '#0284c7' }}>{selectedChapter.memberCount}</strong>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* CHAPTER LEADERSHIP & VACANCY DIRECTORY OVERVIEW */}
      {/* ========================================================================= */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={20} color="#0284c7" />
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                All Chapters Leadership & Vacancies Directory ({chapters.length} Available Chapters)
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Live chapter matrix showing available executive positions (President, VP, Secretary, MC), who is holding the post, and which posts are vacant. Click any chapter card to manage.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ padding: '6px 12px', background: '#f1f5f9', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
              🏢 {chapterSummaryStats.totalChapters} Chapters Active
            </span>
            <span style={{ padding: '6px 12px', background: '#ecfdf5', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#059669', border: '1px solid #a7f3d0' }}>
              ✓ {chapterSummaryStats.filledPositions} Roles Appointed
            </span>
            <span style={{ padding: '6px 12px', background: '#fff1f2', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#e11d48', border: '1px solid #fecdd3' }}>
              ⚠ {chapterSummaryStats.vacantPositions} Positions Vacant
            </span>
          </div>
        </div>

        {/* Chapters Comparison Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '18px' }}>
          {chapters.map((chap) => {
            const isSelected = chap.id === selectedChapterId;
            const ls = chap.leadershipStatus;
            const roles = [
              { title: 'President', badgeColor: '#0284c7', person: ls?.president },
              { title: 'Treasurer (Trusser)', badgeColor: '#7c3aed', person: ls?.vicePresident || (ls as any)?.treasurer },
              { title: 'Secretary', badgeColor: '#059669', person: ls?.secretary },
              { title: 'Member Coordinator', badgeColor: '#d97706', person: ls?.memberCoordinator },
            ];
            const filledCount = roles.filter((r) => r.person !== null && r.person !== undefined).length;
            const vacantCount = 4 - filledCount;

            return (
              <div
                key={chap.id}
                onClick={() => setSelectedChapterId(chap.id)}
                style={{
                  background: isSelected ? '#f0f9ff' : '#ffffff',
                  border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px 18px',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 4px 14px rgba(2, 132, 199, 0.12)' : '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  {/* Chapter Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                          🏢 {chap.name}
                        </span>
                        {isSelected && (
                          <span style={{ fontSize: '10px', background: '#0284c7', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            ACTIVE VIEW
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {chap.regionId || 'Tamil Nadu West'} · {chap.stateId || 'Tamil Nadu'}
                      </div>
                    </div>

                    {/* Vacancy Status Pill */}
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: vacantCount === 0 ? '#dcfce7' : (filledCount > 0 ? '#fef3c7' : '#fee2e2'),
                        color: vacantCount === 0 ? '#15803d' : (filledCount > 0 ? '#b45309' : '#b91c1c'),
                        border: `1px solid ${vacantCount === 0 ? '#bbf7d0' : (filledCount > 0 ? '#fde68a' : '#fecaca')}`,
                      }}
                    >
                      {vacantCount === 0 ? '✓ 4/4 Staffed' : `${filledCount}/4 Filled · ${vacantCount} Vacant`}
                    </span>
                  </div>

                  {/* 4 Roles Summary List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                    {roles.map((r) => {
                      const isFilled = !!r.person;
                      return (
                        <div
                          key={r.title}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            background: isFilled ? '#ffffff' : '#fef2f2',
                            border: `1px solid ${isFilled ? '#e2e8f0' : '#fee2e2'}`,
                            borderRadius: '6px',
                            fontSize: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: r.badgeColor,
                                display: 'inline-block',
                              }}
                            />
                            <strong style={{ color: '#334155' }}>{r.title}:</strong>
                          </div>

                          <div>
                            {isFilled ? (
                              <span style={{ fontWeight: 600, color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={12} color="#059669" />
                                {r.person?.fullName}
                              </span>
                            ) : (
                              <span style={{ color: '#ef4444', fontStyle: 'italic', fontWeight: 500, fontSize: '11px' }}>
                                Vacant (Post unfilled)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer Action */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {vacantCount > 0 ? `${vacantCount} position${vacantCount === 1 ? '' : 's'} to assign` : 'All 4 seats assigned'}
                  </span>
                  <button
                    type="button"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setSelectedChapterId(chap.id);
                    }}
                    style={{
                      background: isSelected ? '#0284c7' : '#f8fafc',
                      color: isSelected ? '#ffffff' : '#0284c7',
                      border: isSelected ? '1px solid #0284c7' : '1px solid #cbd5e1',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {isSelected ? 'Managing Below ↓' : 'Select & Manage Chapter →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leadership Positions Grid (4 Key Positions) */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a' }}>
              Executive Chapter Leadership Matrix
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Manage officeholders for <strong>{selectedChapter?.name || 'Selected Chapter'}</strong>. Trustees can replace or relieve officeholders at any time.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
          {/* President Card */}
          <PositionCard
            positionTitle="President"
            positionDescription="Chief chapter executive responsible for executive meetings, member inductions, and governance."
            badgeTone="#0284c7"
            leader={matrix?.positions.president || null}
            readOnly={isReadOnly}
            onAssign={() => openAssignModal('President')}
            onRelieve={(l) => openRelieveModal(l)}
            onSuspend={(l) => openSuspendModal(l)}
          />

          {/* Treasurer (Trusser) Card */}
          <PositionCard
            positionTitle="Treasurer (Trusser)"
            positionDescription="Executive financial officer managing meeting fee collections, dues reconciliation, and chapter financial governance."
            badgeTone="#7c3aed"
            leader={matrix?.positions.vicePresident || (matrix?.positions as any)?.treasurer || null}
            readOnly={isReadOnly}
            onAssign={() => openAssignModal('Treasurer')}
            onRelieve={(l) => openRelieveModal(l)}
            onSuspend={(l) => openSuspendModal(l)}
          />

          {/* Secretary Card */}
          <PositionCard
            positionTitle="Secretary"
            positionDescription="Maintains chapter official records, meeting minutes (MoM), schedules, and compliance."
            badgeTone="#059669"
            leader={matrix?.positions.secretary || null}
            readOnly={isReadOnly}
            onAssign={() => openAssignModal('Secretary')}
            onRelieve={(l) => openRelieveModal(l)}
            onSuspend={(l) => openSuspendModal(l)}
          />

          {/* Member Coordinator Card */}
          <PositionCard
            positionTitle="Member Coordinator"
            positionDescription="Oversees member onboarding queue, document verification, induction vetting, and applicant communications."
            badgeTone="#d97706"
            leader={matrix?.positions.memberCoordinator || null}
            readOnly={isReadOnly}
            onAssign={() => openAssignModal('Member Coordinator')}
            onRelieve={(l) => openRelieveModal(l)}
            onSuspend={(l) => openSuspendModal(l)}
          />
        </div>
      </div>

      {/* Eligible Registered Members for this Chapter */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#0284c7" />
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Eligible Registered Members in {selectedChapter?.name || 'Chapter'} ({registeredMembers.length})
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Trustee pre-condition: Only approved, payment-verified members listed below can be elevated to leadership positions.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search registered members..."
                value={memberSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemberSearch(e.target.value)}
                style={{
                  padding: '7px 12px 7px 30px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  width: '240px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Member Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                <th style={{ padding: '10px 14px' }}>Member Name</th>
                <th style={{ padding: '10px 14px' }}>Business / Category</th>
                <th style={{ padding: '10px 14px' }}>Contact</th>
                <th style={{ padding: '10px 14px' }}>Current Role</th>
                <th style={{ padding: '10px 14px' }}>Registration Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((m) => (
                <tr key={m.memberIdentifier} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{m.fullName}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{m.email}</div>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#334155' }}>
                    {m.businessName || <span style={{ color: '#94a3b8' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#334155' }}>
                    {m.phone || <span style={{ color: '#94a3b8' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: m.isAlreadyLeader ? '#e0f2fe' : '#f1f5f9',
                        color: m.isAlreadyLeader ? '#0369a1' : '#475569',
                      }}
                    >
                      {m.currentPosition}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: '#dcfce7',
                        color: '#15803d',
                      }}
                    >
                      <CheckCircle2 size={12} /> {m.onboardingStatus}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <button
                      disabled={isReadOnly}
                      onClick={() => {
                        if (isReadOnly) return;
                        setSelectedMember(m);
                        setTargetPosition('President');
                        setAssignRemarks(`Appointed ${m.fullName} by Trustee`);
                        setAssignModalOpen(true);
                      }}
                      title={isReadOnly ? 'Restricted: Chapter leadership appointments require Trustee authority' : undefined}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: isReadOnly ? '1px solid #cbd5e1' : '1px solid #0284c7',
                        background: isReadOnly ? '#f1f5f9' : '#f0f9ff',
                        color: isReadOnly ? '#94a3b8' : '#0284c7',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: isReadOnly ? 'not-allowed' : 'pointer',
                        opacity: isReadOnly ? 0.7 : 1,
                      }}
                    >
                      {isReadOnly ? 'Read Only' : 'Assign Position'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                    No registered members matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leadership Past History / Audit Trail */}
      {matrix && matrix.history && matrix.history.length > 0 && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Clock size={18} color="#64748b" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Past Leadership Appointments & Relieve History
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '10px 14px' }}>Leader</th>
                  <th style={{ padding: '10px 14px' }}>Position Held</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                  <th style={{ padding: '10px 14px' }}>Reason / Remarks</th>
                  <th style={{ padding: '10px 14px' }}>Governed By (Trustee)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {matrix.history.map((h: ChapterLeaderItemDto) => (
                  <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{h.fullName}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{h.email}</div>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#334155' }}>{h.position}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: h.status === 'SUSPENDED' ? '#fee2e2' : '#f1f5f9',
                          color: h.status === 'SUSPENDED' ? '#b91c1c' : '#475569',
                        }}
                      >
                        {h.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b', maxWidth: '280px' }}>
                      {h.actionReason || '—'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>
                      {h.updatedBy || 'Trustee'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        disabled={isReadOnly}
                        onClick={() => {
                          if (isReadOnly) return;
                          handleReinstate(h);
                        }}
                        title={isReadOnly ? 'Restricted: Chapter leadership appointments require Trustee authority' : undefined}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: isReadOnly ? '#f1f5f9' : '#ffffff',
                          color: isReadOnly ? '#94a3b8' : '#0f172a',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: isReadOnly ? 'not-allowed' : 'pointer',
                          opacity: isReadOnly ? 0.6 : 1,
                        }}
                      >
                        {isReadOnly ? 'Read Only' : 'Reinstate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ASSIGN LEADERSHIP POSITION */}
      {/* ========================================================================= */}
      {assignModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Assign Chapter Position · {selectedChapter?.name}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  Governed appointment strictly limited to registered members.
                </p>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} style={{ padding: '20px 24px' }}>
              {/* Position selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Leadership Position to Assign *
                </label>
                <select
                  value={targetPosition}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTargetPosition(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#0f172a',
                  }}
                >
                  <option value="President">President</option>
                  <option value="Treasurer">Treasurer (Trusser)</option>
                  <option value="Secretary">Secretary</option>
                  <option value="Member Coordinator">Member Coordinator</option>
                </select>
              </div>

              {/* Strict pre-condition banner */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '12px',
                  color: '#166534',
                  marginBottom: '16px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start',
                }}
              >
                <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <strong>Registered Member Requirement:</strong>
                  <div>
                    The Trustee can only pick an individual who is already an approved, registered member of <strong>{selectedChapter?.name}</strong>.
                  </div>
                </div>
              </div>

              {/* Member Selection list */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                    Select Registered Member *
                  </label>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {registeredMembers.length} member{registeredMembers.length === 1 ? '' : 's'} available
                  </span>
                </div>

                {/* Real-time search inside modal */}
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search candidate by name or email (e.g. Saravanan)..."
                    value={modalMemberSearch}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModalMemberSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 12px 7px 32px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      background: '#f8fafc',
                    }}
                  />
                  {modalMemberSearch && (
                    <button
                      type="button"
                      onClick={() => setModalMemberSearch('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '8px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8',
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                  {registeredMembers
                    .filter((m) => {
                      if (!modalMemberSearch.trim()) return true;
                      const q = modalMemberSearch.trim().toLowerCase();
                      return (
                        m.fullName.toLowerCase().includes(q) ||
                        m.email.toLowerCase().includes(q) ||
                        (m.businessName && m.businessName.toLowerCase().includes(q)) ||
                        (m.phone && m.phone.includes(q))
                      );
                    })
                    .map((m) => {
                      const isSelected = selectedMember?.memberIdentifier === m.memberIdentifier;
                      return (
                        <div
                          key={m.memberIdentifier}
                          onClick={() => setSelectedMember(m)}
                          style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            background: isSelected ? '#f0f9ff' : '#ffffff',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'background 0.15s',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: isSelected ? '#0284c7' : '#0f172a' }}>
                              {m.fullName}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {m.email} · {m.businessName || 'Member'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#e2e8f0', color: '#334155' }}>
                              {m.currentPosition}
                            </span>
                            {isSelected && <CheckCircle2 size={16} color="#0284c7" />}
                          </div>
                        </div>
                      );
                    })}
                  {registeredMembers.filter((m) => {
                    if (!modalMemberSearch.trim()) return true;
                    const q = modalMemberSearch.trim().toLowerCase();
                    return (
                      m.fullName.toLowerCase().includes(q) ||
                      m.email.toLowerCase().includes(q) ||
                      (m.businessName && m.businessName.toLowerCase().includes(q)) ||
                      (m.phone && m.phone.includes(q))
                    );
                  }).length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                      No registered members found matching "{modalMemberSearch}".
                    </div>
                  )}
                </div>
                {selectedMember && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#0369a1', fontWeight: 500 }}>
                    Selected Candidate: <strong>{selectedMember.fullName}</strong> ({selectedMember.email})
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Appointment Remarks / Term Details
                </label>
                <textarea
                  value={assignRemarks}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAssignRemarks(e.target.value)}
                  placeholder="e.g. Appointed for 2026 tenure by Trustee"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    minHeight: '60px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssign || !selectedMember}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: submittingAssign || !selectedMember ? 'not-allowed' : 'pointer',
                    opacity: submittingAssign || !selectedMember ? 0.6 : 1,
                  }}
                >
                  {submittingAssign ? 'Assigning...' : `Confirm & Assign ${targetPosition}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RELIEVE LEADERSHIP POSITION */}
      {/* ========================================================================= */}
      {relieveModalOpen && targetLeaderToRelieve && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                    Relieve {targetLeaderToRelieve.fullName}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Position: <strong>{targetLeaderToRelieve.position}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRelieveModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRelieveSubmit} style={{ padding: '20px 24px' }}>
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '12px',
                  color: '#92400e',
                  marginBottom: '16px',
                  lineHeight: 1.5,
                }}
              >
                <strong>What happens when relieved?</strong>
                <div>
                  The leader steps down from the <strong>{targetLeaderToRelieve.position}</strong> role. 
                  Their executive leadership permissions will be revoked, the position will become <strong>Vacant</strong>, 
                  and the person will continue as an <strong>Active Regular Member</strong> in this chapter.
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Reason for Relieving Leader *
                </label>
                <textarea
                  value={relieveReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRelieveReason(e.target.value)}
                  placeholder="e.g. Tenure completed, voluntary step-down, or committee restructuring"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    minHeight: '80px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRelieveModalOpen(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRelieve || !relieveReason.trim()}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#d97706',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: submittingRelieve || !relieveReason.trim() ? 'not-allowed' : 'pointer',
                    opacity: submittingRelieve || !relieveReason.trim() ? 0.6 : 1,
                  }}
                >
                  {submittingRelieve ? 'Processing...' : 'Confirm Relieve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SUSPEND LEADERSHIP POSITION */}
      {/* ========================================================================= */}
      {suspendModalOpen && targetLeaderToSuspend && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#991b1b' }}>
                    Suspend Leadership · {targetLeaderToSuspend.fullName}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Position: <strong>{targetLeaderToSuspend.position}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSuspendModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSuspendSubmit} style={{ padding: '20px 24px' }}>
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '12px',
                  color: '#991b1b',
                  marginBottom: '16px',
                  lineHeight: 1.5,
                }}
              >
                <strong>Warning:</strong> Suspending this leader will immediately revoke login credentials, freeze chapter administration access, and lock leadership functions.
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Reason for Suspension *
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSuspendReason(e.target.value)}
                  placeholder="e.g. Code of conduct violation, non-compliance, or disciplinary investigation"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    minHeight: '80px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1e293b', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={suspendMembership}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSuspendMembership(e.target.checked)}
                    style={{ width: '16px', height: '16px', borderRadius: '4px' }}
                  />
                  <strong>Also freeze member portal access (suspend chapter membership)</strong>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSuspendModalOpen(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSuspend || !suspendReason.trim()}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: submittingSuspend || !suspendReason.trim() ? 'not-allowed' : 'pointer',
                    opacity: submittingSuspend || !suspendReason.trim() ? 0.6 : 1,
                  }}
                >
                  {submittingSuspend ? 'Suspending...' : 'Confirm Suspension'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// HELPER COMPONENT: POSITION CARD
// -----------------------------------------------------------------------------
interface PositionCardProps {
  positionTitle: string;
  positionDescription: string;
  badgeTone: string;
  leader: ChapterLeaderItemDto | null;
  readOnly?: boolean;
  onAssign: () => void;
  onRelieve: (leader: ChapterLeaderItemDto) => void;
  onSuspend: (leader: ChapterLeaderItemDto) => void;
}

function PositionCard({
  positionTitle,
  positionDescription,
  badgeTone,
  leader,
  readOnly = false,
  onAssign,
  onRelieve,
  onSuspend,
}: PositionCardProps) {
  const isFilled = leader && leader.isActive;

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '20px',
        border: `1px solid ${isFilled ? '#e2e8f0' : '#fecdd3'}`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        minHeight: '260px',
      }}
    >
      <div>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <span
              style={{
                display: 'inline-block',
                background: `${badgeTone}15`,
                color: badgeTone,
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
              }}
            >
              {positionTitle}
            </span>
            <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>{positionDescription}</div>
          </div>

          <span
            style={{
              padding: '3px 8px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 600,
              background: isFilled ? '#dcfce7' : '#fee2e2',
              color: isFilled ? '#15803d' : '#b91c1c',
            }}
          >
            {isFilled ? 'Active' : 'Vacant'}
          </span>
        </div>

        {/* Leader Info or Vacancy Notice */}
        {isFilled ? (
          <div
            style={{
              background: '#f8fafc',
              borderRadius: '10px',
              padding: '14px',
              border: '1px solid #e2e8f0',
              marginTop: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: `${badgeTone}20`,
                  color: badgeTone,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                {leader.fullName[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{leader.fullName}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{leader.email}</div>
              </div>
            </div>

            {leader.phone && (
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>
                Phone: <strong>{leader.phone}</strong>
              </div>
            )}

            {leader.actionReason && (
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>
                "{leader.actionReason}"
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              background: '#fff1f2',
              borderRadius: '10px',
              padding: '16px',
              border: '1px dashed #fda4af',
              marginTop: '10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#be123c', marginBottom: '4px' }}>
              Position is Vacant
            </div>
            <div style={{ fontSize: '11px', color: '#9f1239' }}>
              {readOnly ? 'Appointment restricted to DBN Trust Secretariat.' : 'Assign an eligible registered member to this chapter leadership seat.'}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
        {isFilled ? (
          <>
            <button
              disabled={readOnly}
              onClick={!readOnly ? () => onRelieve(leader) : undefined}
              title={readOnly ? 'Restricted: Relieving officeholders requires Trustee authority' : 'Relieve Leader'}
              style={{
                flex: 1,
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: readOnly ? '#f8fafc' : '#ffffff',
                color: readOnly ? '#94a3b8' : '#475569',
                fontSize: '12px',
                fontWeight: 600,
                cursor: readOnly ? 'not-allowed' : 'pointer',
                opacity: readOnly ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <UserCheck size={13} color={readOnly ? '#94a3b8' : '#d97706'} /> Relieve {readOnly ? '(Restricted)' : ''}
            </button>
            <button
              disabled={readOnly}
              onClick={!readOnly ? () => onSuspend(leader) : undefined}
              title={readOnly ? 'Restricted: Suspending officeholders requires Trustee authority' : 'Suspend Leader'}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: readOnly ? '1px solid #e2e8f0' : '1px solid #fecaca',
                background: readOnly ? '#f8fafc' : '#fff1f2',
                color: readOnly ? '#94a3b8' : '#be123c',
                fontSize: '12px',
                fontWeight: 600,
                cursor: readOnly ? 'not-allowed' : 'pointer',
                opacity: readOnly ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <AlertTriangle size={13} color={readOnly ? '#94a3b8' : '#be123c'} /> Suspend
            </button>
          </>
        ) : (
          <button
            disabled={readOnly}
            onClick={!readOnly ? onAssign : undefined}
            title={readOnly ? 'Restricted: Appointing chapter executives requires Trustee authority' : 'Assign Registered Member'}
            style={{
              width: '100%',
              padding: '8px 14px',
              borderRadius: '8px',
              border: readOnly ? '1px solid #cbd5e1' : 'none',
              background: readOnly ? '#f1f5f9' : '#0284c7',
              color: readOnly ? '#64748b' : '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: readOnly ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {readOnly ? <Lock size={13} /> : <UserPlus size={14} />}
            {readOnly ? 'Assign Restricted (Trustee Only)' : 'Assign Registered Member'}
          </button>
        )}
      </div>
    </div>
  );
}

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Card, Loading } from '@/components/Ui';
import { PERMISSIONS } from '@/contracts/catalogue';
import { useBootstrap } from '@/bootstrap/BootstrapContext';
import {
  trusteeLeadershipApi,
  type TrusteeChapterOverviewDto,
  type TrusteeRegisteredMemberDto,
} from '@/services/trusteeLeadershipApi';

export function OrganisationPage() {
  const { has } = useBootstrap();
  const navigate = useNavigate();

  // Role detection: Trustee vs Platform Admin
  const [operatorRole, setOperatorRole] = useState<'Trustee' | 'PlatformAdmin'>(() => {
    if (typeof window === 'undefined') return 'PlatformAdmin';
    const role = sessionStorage.getItem('sethu:role') || localStorage.getItem('sethu:role') || '';
    const op = sessionStorage.getItem('sethu:operator') || localStorage.getItem('sethu:operator') || '';
    return role.toLowerCase().includes('trustee') || op.toLowerCase().includes('trustee')
      ? 'Trustee'
      : 'PlatformAdmin';
  });

  const isTrustee = operatorRole === 'Trustee';

  const [chapters, setChapters] = useState<TrusteeChapterOverviewDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CHAPTER' | 'REGION' | 'STATE'>('ALL');
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Position Assignment Modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<
    'President' | 'Vice President' | 'Secretary' | 'Member Coordinator'
  >('President');
  const [registeredMembers, setRegisteredMembers] = useState<TrusteeRegisteredMemberDto[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMemberEmail, setSelectedMemberEmail] = useState<string>('');
  const [assignmentRemarks, setAssignmentRemarks] = useState<string>('Appointed under Trustee Authority');
  const [assigning, setAssigning] = useState(false);

  // Load chapters overview with leadership from DB API
  const fetchChapters = useCallback(async () => {
    setLoading(true);
    try {
      const data = await trusteeLeadershipApi.getChapters();
      setChapters(data);
    } catch (err) {
      console.error('Failed to load chapters from DB', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  // Load registered members for assignment modal
  const fetchMembersForChapter = useCallback(async (chapterId: string) => {
    if (!chapterId) return;
    setLoadingMembers(true);
    try {
      const list = await trusteeLeadershipApi.getRegisteredMembers(chapterId);
      setRegisteredMembers(list);
      if (list.length > 0 && !selectedMemberEmail) {
        setSelectedMemberEmail(list[0].email);
      }
    } catch (err) {
      console.error('Failed to fetch registered members for chapter', err);
    } finally {
      setLoadingMembers(false);
    }
  }, [selectedMemberEmail]);

  useEffect(() => {
    if (selectedChapterId && assignModalOpen) {
      fetchMembersForChapter(selectedChapterId);
    }
  }, [selectedChapterId, assignModalOpen, fetchMembersForChapter]);

  const handleOpenAssignModal = (chapterId?: string) => {
    const targetId = chapterId || (chapters.length > 0 ? chapters[0].id : '');
    setSelectedChapterId(targetId);
    setSelectedPosition('President');
    setSelectedMemberEmail('');
    setAssignModalOpen(true);
  };

  const handleAssignPositionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChapterId || !selectedMemberEmail || !selectedPosition) {
      alert('Please select Chapter, Position, and Member.');
      return;
    }

    setAssigning(true);
    try {
      const res = await trusteeLeadershipApi.assignLeadership({
        chapterId: selectedChapterId,
        memberIdentifier: selectedMemberEmail,
        position: selectedPosition,
        remarks: assignmentRemarks,
        trusteeActor: typeof window !== 'undefined' ? (sessionStorage.getItem('sethu:operator') || 'Trustee') : 'Trustee',
      });

      setToastMessage(res.message || 'Position appointed successfully in Database!');
      setAssignModalOpen(false);
      await fetchChapters();
      setTimeout(() => setToastMessage(null), 4500);
    } catch (err: any) {
      alert(err?.message || 'Failed to assign leadership position.');
    } finally {
      setAssigning(false);
    }
  };

  const filteredChapters = useMemo(() => {
    let result = [...chapters];
    if (typeFilter === 'REGION') {
      result = result.filter(u => (u.regionId || '').toLowerCase().includes('region') || u.name.toLowerCase().includes('region'));
    } else if (typeFilter === 'STATE') {
      result = result.filter(u => (u.stateId || '').toLowerCase().includes('state') || u.name.toLowerCase().includes('state'));
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        u =>
          u.name.toLowerCase().includes(s) ||
          (u.regionId || '').toLowerCase().includes(s) ||
          (u.stateId || '').toLowerCase().includes(s)
      );
    }
    return result;
  }, [chapters, typeFilter, search]);

  return (
    <div className="stack" style={{ paddingBottom: '32px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '14px 20px',
            borderRadius: '12px',
            backgroundColor: '#065f46',
            color: '#ecfdf5',
            fontWeight: 700,
            fontSize: '14px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid #10b981',
          }}
        >
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title={isTrustee ? 'Organisation Governance & Leadership' : 'Organisation Structure & Chapters'}
        description={
          isTrustee
            ? 'Governed Chapter Hierarchy: Assign leadership positions (President, VP, Secretary, Coordinator) to active members. Structural units remain read-only.'
            : 'Canonical structural hierarchy: National, State, Region, City/Cluster and Chapter.'
        }
        actions={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {/* Primary Action for Trustee: Assign Position */}
            {isTrustee ? (
              <button
                type="button"
                className="btn primary"
                style={{
                  backgroundColor: '#b45309',
                  borderColor: '#92400e',
                  color: '#ffffff',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(180, 83, 9, 0.3)',
                }}
                onClick={() => handleOpenAssignModal()}
              >
                <span>👑 Assign Leadership Position</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn"
                  onClick={() => navigate('/platform-admin/chapters')}
                >
                  Chapter Governance & Roles
                </button>
                {has(PERMISSIONS.organisationManage) && (
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => navigate('/platform-admin/chapters')}
                  >
                    + Create Chapter
                  </button>
                )}
              </>
            )}
          </div>
        }
      />

      {/* Trustee Governance Scope Banner */}
      {isTrustee ? (
        <div
          style={{
            borderRadius: '14px',
            border: '1px solid #fcd34d',
            backgroundColor: '#fffbeb',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🛡️</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#78350f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Trustee Authority · Governed Read Access
              </div>
              <div style={{ fontSize: '12px', color: '#92400e', marginTop: '2px' }}>
                Structural units, regions, and chapters are <strong>Read-Only</strong>. You have exclusive authorization to <strong>Assign Parivar Leadership Positions</strong>.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenAssignModal()}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              backgroundColor: '#d97706',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Assign Position Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => {
              setOperatorRole('Trustee');
              sessionStorage.setItem('sethu:role', 'Trustee');
              localStorage.setItem('sethu:role', 'Trustee');
            }}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            Switch to Trustee View ↗
          </button>
        </div>
      )}

      {/* Filter & Search Bar - Full Mobile Responsive */}
      <Card>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              type="button"
              className={`btn ${typeFilter === 'ALL' ? 'primary' : 'secondary'}`}
              onClick={() => setTypeFilter('ALL')}
              style={{ fontSize: '12px' }}
            >
              All Chapters ({chapters.length})
            </button>
            <button
              type="button"
              className={`btn ${typeFilter === 'REGION' ? 'primary' : 'secondary'}`}
              onClick={() => setTypeFilter('REGION')}
              style={{ fontSize: '12px' }}
            >
              Regions
            </button>
            <button
              type="button"
              className={`btn ${typeFilter === 'STATE' ? 'primary' : 'secondary'}`}
              onClick={() => setTypeFilter('STATE')}
              style={{ fontSize: '12px' }}
            >
              States
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px', maxWidth: '380px' }}>
            <input
              className="input text-xs"
              style={{ flex: 1, height: '38px', borderRadius: '10px' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search chapters or regions..."
            />
            <button type="button" className="btn secondary" style={{ height: '38px' }} onClick={fetchChapters}>
              Refresh
            </button>
          </div>
        </div>
      </Card>

      {/* Content Area */}
      {loading && chapters.length === 0 ? (
        <Loading label="Loading chapters and leadership matrix from database..." />
      ) : (
        <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))' }}>
          {filteredChapters.map(ch => {
            const ls = ch.leadershipStatus || { isFullyStaffed: false };
            return (
              <div
                key={ch.id}
                style={{
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  padding: '18px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: '#0369a1',
                          backgroundColor: '#e0f2fe',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {ch.regionId || 'Regional Cluster'}
                      </span>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', marginTop: '6px', lineHeight: 1.25 }}>
                        {ch.name}
                      </h3>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {ch.stateId || 'Tamil Nadu'} · {ch.memberCount || 15} Verified Members
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        backgroundColor: ch.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                        color: ch.status === 'ACTIVE' ? '#15803d' : '#64748b',
                      }}
                    >
                      {ch.status}
                    </span>
                  </div>

                  {/* 4 Governed Positions */}
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.05em' }}>
                      Leadership Staffing Matrix:
                    </div>

                    {/* President */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '8px', backgroundColor: ls.president ? '#f0fdf4' : '#f8fafc', border: ls.president ? '1px solid #bbf7d0' : '1px dashed #cbd5e1', fontSize: '12px' }}>
                      <span style={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>👑</span> President:
                      </span>
                      <span style={{ fontWeight: ls.president ? 700 : 500, color: ls.president ? '#15803d' : '#94a3b8' }}>
                        {ls.president ? ls.president.fullName : 'Vacant'}
                      </span>
                    </div>

                    {/* Vice President */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '8px', backgroundColor: ls.vicePresident ? '#f0fdf4' : '#f8fafc', border: ls.vicePresident ? '1px solid #bbf7d0' : '1px dashed #cbd5e1', fontSize: '12px' }}>
                      <span style={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🛡️</span> Vice President:
                      </span>
                      <span style={{ fontWeight: ls.vicePresident ? 700 : 500, color: ls.vicePresident ? '#15803d' : '#94a3b8' }}>
                        {ls.vicePresident ? ls.vicePresident.fullName : 'Vacant'}
                      </span>
                    </div>

                    {/* Secretary */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '8px', backgroundColor: ls.secretary ? '#f0fdf4' : '#f8fafc', border: ls.secretary ? '1px solid #bbf7d0' : '1px dashed #cbd5e1', fontSize: '12px' }}>
                      <span style={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>📝</span> Secretary:
                      </span>
                      <span style={{ fontWeight: ls.secretary ? 700 : 500, color: ls.secretary ? '#15803d' : '#94a3b8' }}>
                        {ls.secretary ? ls.secretary.fullName : 'Vacant'}
                      </span>
                    </div>

                    {/* Member Coordinator */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '8px', backgroundColor: ls.memberCoordinator ? '#f0fdf4' : '#f8fafc', border: ls.memberCoordinator ? '1px solid #bbf7d0' : '1px dashed #cbd5e1', fontSize: '12px' }}>
                      <span style={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🤝</span> Coordinator:
                      </span>
                      <span style={{ fontWeight: ls.memberCoordinator ? 700 : 500, color: ls.memberCoordinator ? '#15803d' : '#94a3b8' }}>
                        {ls.memberCoordinator ? ls.memberCoordinator.fullName : 'Vacant'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button: Assign Position */}
                <button
                  type="button"
                  onClick={() => handleOpenAssignModal(ch.id)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#0f172a',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1e293b')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0f172a')}
                >
                  <span>Assign / Change Position</span>
                  <span>&rarr;</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Position Assignment Modal / Bottom Sheet - 100% Mobile Responsive */}
      {assignModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(2, 6, 23, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '0',
            boxSizing: 'border-box',
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setAssignModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              backgroundColor: '#ffffff',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '24px 20px',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 -20px 40px rgba(0,0,0,0.3)',
              boxSizing: 'border-box',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#b45309', letterSpacing: '0.06em' }}>
                  Trustee Appointment Action
                </span>
                <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0' }}>
                  Assign Leadership Position
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: '#64748b',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignPositionSubmit} style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 1. Chapter Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
                  Target Chapter *
                </label>
                <select
                  value={selectedChapterId}
                  onChange={e => setSelectedChapterId(e.target.value)}
                  style={{
                    width: '100%',
                    height: '44px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    padding: '0 14px',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#0f172a',
                    backgroundColor: '#f8fafc',
                    outline: 'none',
                  }}
                >
                  {chapters.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.regionId || 'Regional'})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Position Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
                  Position to Assign *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {[
                    { key: 'President', label: '👑 President' },
                    { key: 'Vice President', label: '🛡️ Vice President' },
                    { key: 'Secretary', label: '📝 Secretary' },
                    { key: 'Member Coordinator', label: '🤝 Member Coordinator' },
                  ].map(p => {
                    const active = selectedPosition === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setSelectedPosition(p.key as any)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '10px',
                          border: active ? '2px solid #b45309' : '1px solid #e2e8f0',
                          backgroundColor: active ? '#fef3c7' : '#ffffff',
                          color: active ? '#92400e' : '#334155',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Member Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
                  Select Verified Member to Appoint *
                </label>
                {loadingMembers ? (
                  <div style={{ fontSize: '12px', color: '#64748b', padding: '10px' }}>Loading verified members for chapter...</div>
                ) : (
                  <select
                    value={selectedMemberEmail}
                    onChange={e => setSelectedMemberEmail(e.target.value)}
                    style={{
                      width: '100%',
                      height: '44px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      padding: '0 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0f172a',
                      backgroundColor: '#ffffff',
                      outline: 'none',
                    }}
                  >
                    {registeredMembers.map(m => (
                      <option key={m.email} value={m.email}>
                        {m.fullName} ({m.businessName}) — {m.email}
                      </option>
                    ))}
                  </select>
                )}
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  Candidate will be granted executive authority in Chapter Leadership and synchronized into database.
                </div>
              </div>

              {/* 4. Remarks */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
                  Appointment Remarks / Notes
                </label>
                <input
                  type="text"
                  value={assignmentRemarks}
                  onChange={e => setAssignmentRemarks(e.target.value)}
                  placeholder="e.g. Appointed by Board of Trustees"
                  style={{
                    width: '100%',
                    height: '40px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    padding: '0 12px',
                    fontSize: '13px',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#b45309',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(180, 83, 9, 0.35)',
                  }}
                >
                  {assigning ? 'Saving to Database…' : 'Confirm & Save Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

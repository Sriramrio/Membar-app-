import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, Loading, Card } from '@/components/Ui';
import { LucideIcon } from '@/components/LucideIcon';
import { QUERY_IDS } from '@/contracts/catalogue';
import { usePlatformQuery } from '@/query/usePlatformQuery';

interface ActionItem {
  id: string;
  title: string;
  why: string;
  status: string;
  owner: string;
  scope: string;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | string;
  deepLink?: string;
}

interface ActionCentreResponse {
  items: ActionItem[];
  page?: {
    totalEstimate?: number;
  };
}

export function ActionCentrePage() {
  const q = usePlatformQuery<ActionCentreResponse>({
    queryId: QUERY_IDS.actionCentre,
    pagination: { pageSize: 50 },
  });

  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const rawItems = useMemo(() => q.data?.items ?? [], [q.data?.items]);

  // Derived KPI counts
  const totalCount = rawItems.length;
  const criticalCount = useMemo(() => rawItems.filter((i) => i.priority === 'CRITICAL').length, [rawItems]);
  const kycCount = useMemo(() => rawItems.filter((i) => i.status === 'PENDING_REVIEW').length, [rawItems]);
  const vacantCount = useMemo(() => rawItems.filter((i) => i.status === 'VACANT_POSITION').length, [rawItems]);

  // Filtered items based on tab & search
  const filteredItems = useMemo(() => {
    return rawItems.filter((item) => {
      // Type filter
      if (filterType === 'CRITICAL' && item.priority !== 'CRITICAL') return false;
      if (filterType === 'KYC' && item.status !== 'PENDING_REVIEW') return false;
      if (filterType === 'APPROVAL' && item.status !== 'AWAITING_APPROVAL') return false;
      if (filterType === 'VACANCY' && item.status !== 'VACANT_POSITION') return false;

      // Text search
      if (search.trim()) {
        const s = search.toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(s);
        const matchWhy = (item.why || '').toLowerCase().includes(s);
        const matchScope = (item.scope || '').toLowerCase().includes(s);
        if (!matchTitle && !matchWhy && !matchScope) return false;
      }

      return true;
    });
  }, [rawItems, filterType, search]);

  return (
    <div className="stack" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Action Centre"
        description="Unified Command Inbox for Platform Administration obligations. Aggregates live chapter onboarding queues, executive approvals, and governance vacancies."
        actions={
          <button
            type="button"
            className="btn secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={q.refresh}
          >
            <LucideIcon name="refresh-cw" size={15} /> Refresh Tasks
          </button>
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-4" style={{ gap: '16px' }}>
        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Active Obligations</span>
            <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', color: '#334155' }}>
              <LucideIcon name="inbox" size={16} />
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>{totalCount}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Real-time database items</div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #fee2e2', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: 600 }}>Critical / Induction</span>
            <span style={{ background: '#fef2f2', padding: '4px 8px', borderRadius: '6px', color: '#dc2626' }}>
              <LucideIcon name="alert-triangle" size={16} />
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: criticalCount > 0 ? '#dc2626' : '#0f172a', marginTop: '8px' }}>
            {criticalCount}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Requires immediate decision</div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e0f2fe', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#0369a1', fontWeight: 600 }}>KYC Document Reviews</span>
            <span style={{ background: '#f0f9ff', padding: '4px 8px', borderRadius: '6px', color: '#0284c7' }}>
              <LucideIcon name="file-check" size={16} />
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: kycCount > 0 ? '#0284c7' : '#0f172a', marginTop: '8px' }}>
            {kycCount}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Coordinator queue pending</div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #f3e8ff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#7e22ce', fontWeight: 600 }}>Leadership Vacancies</span>
            <span style={{ background: '#faf5ff', padding: '4px 8px', borderRadius: '6px', color: '#9333ea' }}>
              <LucideIcon name="shield-alert" size={16} />
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: vacantCount > 0 ? '#9333ea' : '#0f172a', marginTop: '8px' }}>
            {vacantCount}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Chapters without President</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[
              { id: 'ALL', label: `All (${totalCount})` },
              { id: 'CRITICAL', label: `Critical (${criticalCount})` },
              { id: 'KYC', label: `KYC Reviews (${kycCount})` },
              { id: 'VACANCY', label: `Leadership Vacancies (${vacantCount})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                className={`btn ${filterType === t.id ? '' : 'secondary'}`}
                style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '20px' }}
                onClick={() => setFilterType(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ minWidth: '260px' }}>
            <input
              type="text"
              className="input"
              style={{ width: '100%', fontSize: '13px', padding: '7px 12px' }}
              placeholder="🔍 Search obligations, chapters, applicants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Action Items List or Clean Empty State */}
      {q.loading ? (
        <Loading label="Querying live governance obligations from database..." />
      ) : filteredItems.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            <LucideIcon name="check-circle-2" size={28} />
          </div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            All Governance Obligations Fulfilled
          </h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px', maxWidth: '520px' }}>
            There are currently no overdue KYC document reviews, pending executive inductions, or unassigned chapter leadership vacancies.
          </p>
          <div style={{ marginTop: '8px', display: 'flex', gap: '10px' }}>
            <Link to="/platform-admin/chapter-workflow" className="btn secondary" style={{ fontSize: '12px' }}>
              View Onboarding Pipeline
            </Link>
            <Link to="/platform-admin/chapters" className="btn secondary" style={{ fontSize: '12px' }}>
              View Chapters Hierarchy
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px 20px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background:
                        item.priority === 'CRITICAL'
                          ? '#fef2f2'
                          : item.priority === 'HIGH'
                          ? '#fffbeb'
                          : '#f1f5f9',
                      color:
                        item.priority === 'CRITICAL'
                          ? '#dc2626'
                          : item.priority === 'HIGH'
                          ? '#d97706'
                          : '#475569',
                      border: `1px solid ${
                        item.priority === 'CRITICAL'
                          ? '#fecaca'
                          : item.priority === 'HIGH'
                          ? '#fde68a'
                          : '#e2e8f0'
                      }`,
                    }}
                  >
                    {item.priority}
                  </span>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      color: '#64748b',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    {item.scope}
                  </span>
                </div>

                <h3 style={{ margin: '8px 0 4px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  {item.title}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{item.why}</p>

                <div style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>
                  Governed Owner: <strong style={{ color: '#475569' }}>{item.owner}</strong>
                </div>
              </div>

              <div>
                {item.deepLink ? (
                  <Link
                    to={item.deepLink}
                    className="btn"
                    style={{
                      fontSize: '13px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      background:
                        item.priority === 'CRITICAL'
                          ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                          : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#ffffff',
                      borderColor: item.priority === 'CRITICAL' ? '#b91c1c' : '#1d4ed8',
                    }}
                  >
                    <span>Resolve Task</span>
                    <LucideIcon name="arrow-right" size={14} />
                  </Link>
                ) : (
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Manual Resolution</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActionCentrePage;

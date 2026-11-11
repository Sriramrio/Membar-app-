import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Metric, Loading, ErrorNotice, Card, Pill } from '@/components/Ui';
import { LucideIcon } from '@/components/LucideIcon';
import { QUERY_IDS } from '@/contracts/catalogue';
import { usePlatformQuery } from '@/query/usePlatformQuery';
import { chapterWorkflowApi } from '@/services/chapterWorkflowApi';

interface Dashboard {
  pendingReview: number;
  openDataQuality: number;
  integrationAttention: number;
  failedJobs: number;
  pendingHandoffs: number;
  expiringOrPendingAssignments: number;
  serverTime: string;
  source: string;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const q = usePlatformQuery<Dashboard>({ queryId: QUERY_IDS.dashboard });
  const [chapterCount, setChapterCount] = useState<number>(0);
  const [coordQueueCount, setCoordQueueCount] = useState<number>(0);
  const [execQueueCount, setExecQueueCount] = useState<number>(0);

  useEffect(() => {
    chapterWorkflowApi.getChapters()
      .then((chs) => setChapterCount(chs.length))
      .catch(() => {});
    chapterWorkflowApi.getCoordinatorQueue()
      .then((q) => setCoordQueueCount(q.length))
      .catch(() => {});
    chapterWorkflowApi.getExecutiveQueue()
      .then((q) => setExecQueueCount(q.length))
      .catch(() => {});
  }, []);

  if (q.loading) return <Loading label="Loading Platform Administration dashboard…" />;
  const d = q.data;

  return (
    <div className="stack">
      {q.error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px', color: '#991b1b', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Notice: {q.error.message || 'Extended platform telemetry unavailable.'}</span>
          <button type="button" className="btn secondary" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={q.refresh}>Retry</button>
        </div>
      )}
      <PageHeader
        title="Platform Administration Dashboard"
        description="Enterprise SETHU Technical Control Plane & Parivar Governance Centre."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn"
              onClick={() => navigate('/platform-admin/chapters')}
            >
              <LucideIcon name="plus" size={16} /> Create & Manage Chapters
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={() => navigate('/platform-admin/chapter-workflow')}
            >
              <LucideIcon name="users" size={16} /> Onboarding Approval Queue
            </button>
          </div>
        }
      />

      {/* Chapter Governance Overview Banner */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LucideIcon name="network" size={20} /> Chapter Operations & Governance
            </h2>
            <p className="muted" style={{ marginTop: '4px' }}>
              Platform Administrator exclusively provisions new chapters, assigns leadership hierarchy (President, VP, Secretary, Coordinator), and oversees applicant approvals.
            </p>
          </div>
          <span className="pill good">
            <LucideIcon name="check" size={12} /> Active System
          </span>
        </div>

        <div className="grid grid-3" style={{ marginTop: '14px' }}>
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div className="label">Registered Parivars</div>
            <div className="metric">{chapterCount}</div>
            <div className="muted">Operational Parivars</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div className="label">Coordinator KYC Queue</div>
            <div className="metric" style={{ color: coordQueueCount > 0 ? '#d97706' : '#0f172a' }}>{coordQueueCount}</div>
            <div className="muted">Pending document reviews</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div className="label">Executive Approvals</div>
            <div className="metric" style={{ color: execQueueCount > 0 ? '#2563eb' : '#0f172a' }}>{execQueueCount}</div>
            <div className="muted">Pending presidential induction</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-3">
        <Metric label="Pending review" value={d?.pendingReview ?? 0} />
        <Metric label="Data quality attention" value={d?.openDataQuality ?? 0} />
        <Metric label="Integration attention" value={d?.integrationAttention ?? 0} />
        <Metric label="Failed jobs" value={d?.failedJobs ?? 0} />
        <Metric label="Pending handoffs" value={d?.pendingHandoffs ?? 0} />
        <Metric label="Assignments requiring attention" value={d?.expiringOrPendingAssignments ?? 0} />
      </div>

      <Card>
        <h2 className="section-title">Evidence & Authority Scope</h2>
        <p className="muted">
          Platform Admin acts as the ultimate authority for chapter boundaries and role hierarchy assignments across the DBN network.
        </p>
        <div className="row" style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="pill">{d?.source ?? 'Governed Standalone Control Plane'}</span>
          {d?.serverTime && <span className="code">{d.serverTime}</span>}
        </div>
      </Card>
    </div>
  );
}
export default DashboardPage;

import { useState, useMemo, useEffect } from 'react';
import { PageHeader, Card, DataTable, Loading, ErrorNotice, CommandFeedback, Pill } from '@/components/Ui';
import { QUERY_IDS, COMMAND_IDS, PERMISSIONS } from '@/contracts/catalogue';
import { usePlatformQuery } from '@/query/usePlatformQuery';
import { useGovernedCommand } from '@/command/useGovernedCommand';
import { useBootstrap } from '@/bootstrap/BootstrapContext';
import { chapterWorkflowApi, type ChapterDto } from '@/services/chapterWorkflowApi';

interface Paged {
  items: AssignmentRecord[];
}

interface AssignmentRecord {
  id: string;
  accountId: string;
  roleId: string;
  scopeId: string;
  status: string;
  effectiveFrom: string;
  effectiveTo?: string;
  delegatedBy?: string;
  delegatedTo?: string;
  actingAuthority?: string;
  version: number;
}

const id = () => crypto.randomUUID?.() ?? `cmd-${Date.now()}`;

export function AssignmentsPage() {
  const q = usePlatformQuery<Paged>({ queryId: QUERY_IDS.assignmentsList, pagination: { pageSize: 100 } });
  const c = useGovernedCommand();
  const { has } = useBootstrap();

  const [chapters, setChapters] = useState<ChapterDto[]>([]);
  const [accountId, setAccountId] = useState('');
  const [roleId, setRoleId] = useState('CHAPTER_PRESIDENT');
  const [scopeId, setScopeId] = useState('OU-CH-CENTRAL');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [effectiveTo, setEffectiveTo] = useState('2027-03-31');
  const [search, setSearch] = useState('');
  const [filterScope, setFilterScope] = useState('ALL');

  useEffect(() => {
    chapterWorkflowApi.getChapters()
      .then((chs) => {
        setChapters(chs);
        if (chs.length > 0) {
          setScopeId(chs[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const serverAssignments = useMemo(() => q.data?.items ?? [], [q.data?.items]);

  const filteredAssignments = useMemo(() => {
    return serverAssignments.filter((a) => {
      const matchesSearch =
        !search.trim() ||
        a.accountId.toLowerCase().includes(search.toLowerCase()) ||
        a.roleId.toLowerCase().includes(search.toLowerCase()) ||
        a.scopeId.toLowerCase().includes(search.toLowerCase());

      const matchesScope = filterScope === 'ALL' || a.scopeId === filterScope;
      return matchesSearch && matchesScope;
    });
  }, [serverAssignments, search, filterScope]);

  async function propose() {
    if (!accountId.trim()) return;

    const newAssignment = {
      accountId: accountId.trim(),
      roleId,
      scopeId,
      effectiveFrom,
      effectiveTo,
    };

    const r = await c.execute({
      commandId: id(),
      command: COMMAND_IDS.assignmentPropose,
      aggregateType: 'RoleAssignment',
      reason: 'Propose effective-dated Chapter access assignment',
      payload: newAssignment,
    });

    if (r) {
      setAccountId('');
      q.refresh();
    }
  }

  function quickSelectMember(name: string) {
    setAccountId(name);
  }

  const activeCount = serverAssignments.filter((a) => a.status === 'ACTIVE').length;

  return (
    <div className="stack">
      <PageHeader
        title="Role Assignments"
        description="Effective-dated access and Chapter leadership appointments. Assign Members to Chapter leadership roles (President, Vice President, Secretary, Treasurer, Member Coordinator) to govern operations on Organisation Web."
      />

      {/* KPI Cards */}
      <div className="grid cols-3">
        <Card>
          <div className="metric">
            <span className="value">{serverAssignments.length}</span>
            <span className="label">Total Assignments</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#16a34a' }}>{activeCount}</span>
            <span className="label">Active Leaders Appointed</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#2563eb' }}>{chapters.length}</span>
            <span className="label">Active Chapters Covered</span>
          </div>
        </Card>
      </div>

      <CommandFeedback busy={c.busy} result={c.result} error={c.error} onClear={c.clear} />

      {has(PERMISSIONS.assignmentsManage) && (
        <Card>
          <h2 className="section-title">Assign Member to Chapter Leadership Role</h2>
          <div className="form-grid">
            <div>
              <span className="label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>
                Quick Preset Leaders
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {['Sundaresan R', 'Vijay R', 'Meera S', 'Karthik N', 'Hari Krishnan'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className="btn secondary"
                    style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => quickSelectMember(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <input
                className="input"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="Type Member Name or Member ID (e.g. Vijay R, MEM-001)"
              />
            </div>

            <label className="field">
              <span className="label">Role Assignment</span>
              <select className="select" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
                <option value="CHAPTER_PRESIDENT">Chapter President</option>
                <option value="CHAPTER_VICE_PRESIDENT">Chapter Vice President</option>
                <option value="CHAPTER_SECRETARY">Chapter Secretary</option>
                <option value="CHAPTER_TREASURER">Chapter Treasurer</option>
                <option value="CHAPTER_COORDINATOR">Chapter Member Coordinator</option>
                <option value="ROLE_REVIEWER">Platform Reviewer</option>
              </select>
            </label>

            <label className="field">
              <span className="label">Target Chapter Scope</span>
              <select className="select" value={scopeId} onChange={(e) => setScopeId(e.target.value)}>
                <option value="OU-CH-CENTRAL">Central Platform Scope</option>
                {chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name} ({ch.code || 'Chapter'})
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="label">Effective From</span>
              <input
                type="date"
                className="input"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="label">Effective To</span>
              <input
                type="date"
                className="input"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
              />
            </label>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="button"
                className="btn primary"
                disabled={c.busy || !accountId.trim()}
                onClick={propose}
                style={{ width: '100%', height: '42px' }}
              >
                + Commit Appointment
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Filter and Search Bar */}
      <Card>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="search"
              placeholder="Search assignment by member, role or chapter…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`btn ${filterScope === 'ALL' ? 'primary' : 'secondary'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              onClick={() => setFilterScope('ALL')}
            >
              All Scopes ({serverAssignments.length})
            </button>
            <button
              type="button"
              className={`btn ${filterScope === 'ch-chennai-central' ? 'primary' : 'secondary'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              onClick={() => setFilterScope('ch-chennai-central')}
            >
              Chennai Central
            </button>
          </div>
        </div>
      </Card>

      {q.loading ? (
        <Loading label="Loading authoritative assignments from database…" />
      ) : q.error ? (
        <ErrorNotice error={q.error} onRetry={q.refresh} />
      ) : (
        <DataTable
          rows={filteredAssignments as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: 'accountId',
              label: 'Member Appointee',
              render: (r) => <strong>{String(r.accountId)}</strong>,
            },
            {
              key: 'roleId',
              label: 'Assigned Role',
              render: (r) => (
                <Pill tone={String(r.roleId).includes('PRESIDENT') ? 'accent' : 'good'}>
                  {String(r.roleId)}
                </Pill>
              ),
            },
            {
              key: 'scopeId',
              label: 'Chapter Scope',
              render: (r) => {
                const matched = chapters.find((c) => c.id === r.scopeId);
                return matched ? `${matched.name}` : String(r.scopeId);
              },
            },
            { key: 'effectiveFrom', label: 'From' },
            { key: 'effectiveTo', label: 'To', render: (r) => (r.effectiveTo ? String(r.effectiveTo) : 'Permanent') },
            {
              key: 'status',
              label: 'Status',
              render: (r) => (
                <Pill tone={r.status === 'ACTIVE' ? 'good' : 'warn'}>
                  {String(r.status)}
                </Pill>
              ),
            },
            { key: 'version', label: 'Version' },
          ]}
        />
      )}
    </div>
  );
}

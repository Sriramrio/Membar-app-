import { useState, useMemo } from 'react';
import { PageHeader, DataTable, Loading, ErrorNotice, CommandFeedback, Modal, Card, Pill } from '@/components/Ui';
import { QUERY_IDS, COMMAND_IDS, PERMISSIONS } from '@/contracts/catalogue';
import { usePlatformQuery } from '@/query/usePlatformQuery';
import { useGovernedCommand } from '@/command/useGovernedCommand';
import { useBootstrap } from '@/bootstrap/BootstrapContext';

interface Paged {
  items: RoleRecord[];
}

interface RoleRecord {
  id?: string;
  code: string;
  name: string;
  workspace: string;
  delegatable: boolean;
  status: string;
  version: number;
}

const id = () => crypto.randomUUID?.() ?? `cmd-${Date.now()}`;

export function RolesPage() {
  const q = usePlatformQuery<Paged>({ queryId: QUERY_IDS.rolesList, pagination: { pageSize: 100 } });
  const c = useGovernedCommand();
  const { has } = useBootstrap();

  const [showCreate, setShowCreate] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [workspace, setWorkspace] = useState('ORGANISATIONAL');
  const [search, setSearch] = useState('');
  const [filterWorkspace, setFilterWorkspace] = useState<'ALL' | 'ORGANISATIONAL' | 'PLATFORM_ADMIN'>('ALL');

  const serverRoles = useMemo(() => q.data?.items ?? [], [q.data?.items]);

  const filteredRoles = useMemo(() => {
    return serverRoles.filter((r) => {
      const matchesSearch =
        !search.trim() ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.code.toLowerCase().includes(search.toLowerCase());
      const matchesWorkspace = filterWorkspace === 'ALL' || r.workspace === filterWorkspace;
      return matchesSearch && matchesWorkspace;
    });
  }, [serverRoles, search, filterWorkspace]);

  async function create() {
    if (!code.trim() || !name.trim()) return;

    const newRole = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      workspace,
      delegatable: workspace === 'PLATFORM_ADMIN' || code.includes('COORDINATOR'),
      version: 1,
    };

    const r = await c.execute({
      commandId: id(),
      command: COMMAND_IDS.rolePropose,
      aggregateType: 'RoleDefinition',
      reason: 'Create governed role catalogue definition',
      payload: newRole,
    });

    if (r) {
      setCode('');
      setName('');
      setShowCreate(false);
      q.refresh();
    }
  }

  function applyTemplate(tplCode: string, tplName: string) {
    setCode(tplCode);
    setName(tplName);
    setWorkspace('ORGANISATIONAL');
  }

  const orgCount = serverRoles.filter((r) => r.workspace === 'ORGANISATIONAL').length;
  const paCount = serverRoles.filter((r) => r.workspace === 'PLATFORM_ADMIN').length;

  return (
    <div className="stack">
      <PageHeader
        title="Role Catalogue"
        description="Roles are governed data definitions for Chapter and Platform scopes. Role labels define access boundaries, RACI assignments, and Separation of Duties."
        actions={
          has(PERMISSIONS.rolesManage) && (
            <button type="button" className="btn primary" onClick={() => setShowCreate(true)}>
              + Propose Role
            </button>
          )
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid cols-3">
        <Card>
          <div className="metric">
            <span className="value">{serverRoles.length}</span>
            <span className="label">Registered Roles</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#2563eb' }}>{orgCount}</span>
            <span className="label">Chapter & Organisational</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#16a34a' }}>{paCount}</span>
            <span className="label">Platform Control Plane</span>
          </div>
        </Card>
      </div>

      <CommandFeedback busy={c.busy} result={c.result} error={c.error} onClear={c.clear} />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Propose Role Definition">
        <div className="form-grid">
          <div>
            <span className="label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>
              Quick Preset Templates
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <button
                type="button"
                className="btn secondary"
                style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                onClick={() => applyTemplate('CHAPTER_PRESIDENT', 'Chapter President')}
              >
                President
              </button>
              <button
                type="button"
                className="btn secondary"
                style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                onClick={() => applyTemplate('CHAPTER_VICE_PRESIDENT', 'Chapter Vice President')}
              >
                Vice President
              </button>
              <button
                type="button"
                className="btn secondary"
                style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                onClick={() => applyTemplate('CHAPTER_SECRETARY', 'Chapter Secretary')}
              >
                Secretary
              </button>
              <button
                type="button"
                className="btn secondary"
                style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                onClick={() => applyTemplate('CHAPTER_TREASURER', 'Chapter Treasurer')}
              >
                Treasurer
              </button>
              <button
                type="button"
                className="btn secondary"
                style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                onClick={() => applyTemplate('CHAPTER_COORDINATOR', 'Chapter Member Coordinator')}
              >
                Member Coordinator
              </button>
            </div>
          </div>

          <label className="field">
            <span className="label">Role Code</span>
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. CHAPTER_PRESIDENT, CHAPTER_COORDINATOR"
            />
          </label>
          <label className="field">
            <span className="label">Role Title</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chapter President"
            />
          </label>
          <label className="field">
            <span className="label">Target Workspace</span>
            <select className="select" value={workspace} onChange={(e) => setWorkspace(e.target.value)}>
              <option value="ORGANISATIONAL">ORGANISATIONAL (Chapter & Regional Operations)</option>
              <option value="PLATFORM_ADMIN">PLATFORM_ADMIN (Technical Control Plane)</option>
            </select>
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn secondary" onClick={() => setShowCreate(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={c.busy || !code.trim() || !name.trim()}
            onClick={create}
          >
            Create Role
          </button>
        </div>
      </Modal>

      {/* Filter and Search Bar */}
      <Card>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="search"
              placeholder="Search role by code or title…"
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
              className={`btn ${filterWorkspace === 'ALL' ? 'primary' : 'secondary'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              onClick={() => setFilterWorkspace('ALL')}
            >
              All Roles ({serverRoles.length})
            </button>
            <button
              type="button"
              className={`btn ${filterWorkspace === 'ORGANISATIONAL' ? 'primary' : 'secondary'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              onClick={() => setFilterWorkspace('ORGANISATIONAL')}
            >
              Chapter Roles ({orgCount})
            </button>
            <button
              type="button"
              className={`btn ${filterWorkspace === 'PLATFORM_ADMIN' ? 'primary' : 'secondary'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              onClick={() => setFilterWorkspace('PLATFORM_ADMIN')}
            >
              Platform Admin ({paCount})
            </button>
          </div>
        </div>
      </Card>

      {q.loading ? (
        <Loading label="Loading authoritative roles from database…" />
      ) : q.error ? (
        <ErrorNotice error={q.error} onRetry={q.refresh} />
      ) : (
        <DataTable
          rows={filteredRoles as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: 'code',
              label: 'Role Code',
              render: (r) => (
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{String(r.code)}</span>
              ),
            },
            { key: 'name', label: 'Role Title' },
            {
              key: 'workspace',
              label: 'Workspace',
              render: (r) => (
                <Pill tone={r.workspace === 'ORGANISATIONAL' ? 'accent' : 'good'}>
                  {String(r.workspace)}
                </Pill>
              ),
            },
            {
              key: 'delegatable',
              label: 'Delegatable',
              render: (r) => (r.delegatable ? 'Yes' : 'No'),
            },
            { key: 'version', label: 'Version' },
          ]}
        />
      )}
    </div>
  );
}

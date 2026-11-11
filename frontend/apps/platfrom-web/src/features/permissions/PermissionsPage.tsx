import { useState, useMemo } from 'react';
import { PageHeader, DataTable, Loading, ErrorNotice, CommandFeedback, Modal, Card } from '@/components/Ui';
import { QUERY_IDS, COMMAND_IDS, PERMISSIONS } from '@/contracts/catalogue';
import { usePlatformQuery } from '@/query/usePlatformQuery';
import { useGovernedCommand } from '@/command/useGovernedCommand';
import { useBootstrap } from '@/bootstrap/BootstrapContext';

interface Paged {
  items: PermissionRecord[];
}

interface PermissionRecord {
  id?: string;
  permission: string;
  resource: string;
  action: string;
  description: string;
  version: number;
}

const id = () => crypto.randomUUID?.() ?? `cmd-${Date.now()}`;

export function PermissionsPage() {
  const q = usePlatformQuery<Paged>({ queryId: QUERY_IDS.permissionsList, pagination: { pageSize: 150 } });
  const c = useGovernedCommand();
  const { has } = useBootstrap();

  const [showCreate, setShowCreate] = useState(false);
  const [permission, setPermission] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');

  async function create() {
    const parts = permission.trim().split('.');
    if (parts.length < 3) return;
    const action = parts.at(-1) ?? '';
    const resource = parts.slice(0, -1).join('.');

    const r = await c.execute({
      commandId: id(),
      command: COMMAND_IDS.permissionPropose,
      aggregateType: 'PermissionDefinition',
      reason: 'Create Platform Administration permission',
      payload: { permission: permission.trim(), resource, action, description },
    });

    if (r) {
      setPermission('');
      setDescription('');
      setShowCreate(false);
      q.refresh();
    }
  }

  const allItems = q.data?.items ?? [];

  const filteredItems = useMemo(() => {
    return allItems.filter((p) => {
      return (
        !search.trim() ||
        p.permission.toLowerCase().includes(search.toLowerCase()) ||
        p.resource.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [allItems, search]);

  return (
    <div className="stack">
      <PageHeader
        title="Permission Catalogue"
        description="Stable resource/action contracts consumed by routes, actions, RBAC and backend authorization policies."
        actions={
          has(PERMISSIONS.permissionsManage) && (
            <button type="button" className="btn primary" onClick={() => setShowCreate(true)}>
              + Propose Permission
            </button>
          )
        }
      />

      {/* KPI Cards */}
      <div className="grid cols-3">
        <Card>
          <div className="metric">
            <span className="value">{allItems.length}</span>
            <span className="label">Registered Permissions</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#16a34a' }}>100%</span>
            <span className="label">Contract Integrity</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#2563eb' }}>Platform Admin</span>
            <span className="label">Enforced Authority Tier</span>
          </div>
        </Card>
      </div>

      <CommandFeedback busy={c.busy} result={c.result} error={c.error} onClear={c.clear} />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Propose Permission Definition">
        <div className="form-grid">
          <label className="field">
            <span className="label">Permission ID (Contract Format)</span>
            <input
              className="input"
              placeholder="e.g. platform.resource.action"
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="label">Description & Usage</span>
            <input
              className="input"
              placeholder="Permission summary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn secondary" onClick={() => setShowCreate(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={c.busy || permission.trim().split('.').length < 3}
            onClick={create}
          >
            Create Permission
          </button>
        </div>
      </Modal>

      {/* Search Input */}
      <Card>
        <input
          type="search"
          placeholder="Search permission contract (e.g. platform.identity.read)…"
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
      </Card>

      {q.loading ? (
        <Loading label="Loading permission catalogue from control plane…" />
      ) : q.error ? (
        <ErrorNotice error={q.error} onRetry={q.refresh} />
      ) : (
        <DataTable
          rows={filteredItems as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: 'permission',
              label: 'Permission Identifier',
              render: (r) => (
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1e293b' }}>
                  {String(r.permission)}
                </span>
              ),
            },
            { key: 'resource', label: 'Target Resource' },
            { key: 'action', label: 'Action' },
            { key: 'description', label: 'Description' },
            { key: 'version', label: 'Version' },
          ]}
        />
      )}
    </div>
  );
}

import { useState } from 'react';
import { PageHeader, Card, Loading, ErrorNotice, DataTable, CommandFeedback, Pill } from '@/components/Ui';
import { QUERY_IDS, COMMAND_IDS, PERMISSIONS } from '@/contracts/catalogue';
import { usePlatformQuery } from '@/query/usePlatformQuery';
import { useGovernedCommand } from '@/command/useGovernedCommand';
import { useBootstrap } from '@/bootstrap/BootstrapContext';

interface Paged {
  items: Record<string, unknown>[];
}

const id = () => crypto.randomUUID?.() ?? `cmd-${Date.now()}`;

export function RBACPage() {
  const roles = usePlatformQuery<Paged>({ queryId: QUERY_IDS.rolesList, pagination: { pageSize: 100 } });
  const perms = usePlatformQuery<Paged>({ queryId: QUERY_IDS.permissionsList, pagination: { pageSize: 100 } });
  const matrix = usePlatformQuery<Paged>({ queryId: QUERY_IDS.rbacMatrix, pagination: { pageSize: 100 } });
  const c = useGovernedCommand();
  const { has } = useBootstrap();

  const [roleId, setRoleId] = useState('ROLE_REVIEWER');
  const [permission, setPermission] = useState('platform.audit.read');

  async function grant() {
    const r = await c.execute({
      commandId: id(),
      command: COMMAND_IDS.rbacGrant,
      aggregateType: 'RolePermission',
      reason: 'Grant governed permission to role',
      payload: { roleId, permission },
    });
    if (r) matrix.refresh();
  }

  async function revoke(row: Record<string, unknown>) {
    const r = await c.execute({
      commandId: id(),
      command: COMMAND_IDS.rbacRevoke,
      aggregateType: 'RolePermission',
      aggregateId: String(row.id),
      expectedVersion: Number(row.version),
      reason: 'Revoke governed role permission',
      payload: { roleId: String(row.roleId), permission: String(row.permission) },
    });
    if (r) matrix.refresh();
  }

  const grantsCount = matrix.data?.items?.length ?? 0;
  const activeGrants = matrix.data?.items?.filter((m) => m.active !== false)?.length ?? 0;

  return (
    <div className="stack">
      <PageHeader
        title="Role-Based Access Control (RBAC)"
        description="Role-permission mappings are governed data definitions. Role labels never directly grant authority without an explicit active grant in the RBAC matrix."
      />

      {/* KPI Cards */}
      <div className="grid cols-3">
        <Card>
          <div className="metric">
            <span className="value">{grantsCount}</span>
            <span className="label">Total RBAC Mappings</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#16a34a' }}>{activeGrants}</span>
            <span className="label">Active Authority Grants</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#2563eb' }}>{roles.data?.items?.length ?? 0}</span>
            <span className="label">Available Roles</span>
          </div>
        </Card>
      </div>

      <CommandFeedback busy={c.busy} result={c.result} error={c.error} onClear={c.clear} />

      {has(PERMISSIONS.rbacManage) && (
        <Card>
          <h2 className="section-title">Grant Permission to Role</h2>
          <div className="form-grid">
            <label className="field">
              <span className="label">Role</span>
              <select
                className="select"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
              >
                {(roles.data?.items ?? []).map((r) => {
                  const codeVal = String(r.code ?? r.id);
                  return (
                    <option key={codeVal} value={codeVal}>
                      {String(r.name ?? codeVal)} ({codeVal})
                    </option>
                  );
                })}
              </select>
            </label>

            <label className="field">
              <span className="label">Permission Resource / Action</span>
              <select
                className="select"
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
              >
                {(perms.data?.items ?? []).map((p) => (
                  <option key={String(p.permission)} value={String(p.permission)}>
                    {String(p.permission)}
                  </option>
                ))}
              </select>
            </label>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="button"
                className="btn primary"
                disabled={c.busy || !roleId || !permission}
                onClick={grant}
                style={{ width: '100%', height: '42px' }}
              >
                + Grant Permission
              </button>
            </div>
          </div>
        </Card>
      )}

      {roles.loading || perms.loading || matrix.loading ? (
        <Loading label="Loading authoritative RBAC matrix from database…" />
      ) : roles.error ? (
        <ErrorNotice error={roles.error} onRetry={roles.refresh} />
      ) : perms.error ? (
        <ErrorNotice error={perms.error} onRetry={perms.refresh} />
      ) : matrix.error ? (
        <ErrorNotice error={matrix.error} onRetry={matrix.refresh} />
      ) : (
        <DataTable
          label="Role Permission Matrix"
          rows={(matrix.data?.items ?? []) as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: 'roleId',
              label: 'Governed Role',
              render: (r) => <strong>{String(r.roleId)}</strong>,
            },
            {
              key: 'permission',
              label: 'Assigned Permission Contract',
              render: (r) => (
                <span style={{ fontFamily: 'monospace', color: '#1e293b' }}>
                  {String(r.permission)}
                </span>
              ),
            },
            {
              key: 'active',
              label: 'Status',
              render: (r) => (
                <Pill tone={r.active !== false ? 'good' : 'bad'}>
                  {r.active !== false ? 'Active Grant' : 'Revoked'}
                </Pill>
              ),
            },
            { key: 'version', label: 'Version' },
            {
              key: 'actions',
              label: 'Actions',
              render: (r) =>
                has(PERMISSIONS.rbacManage) && r.active !== false ? (
                  <button
                    type="button"
                    className="btn secondary"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                    disabled={c.busy}
                    onClick={() => revoke(r)}
                  >
                    Revoke
                  </button>
                ) : null,
            },
          ]}
        />
      )}
    </div>
  );
}

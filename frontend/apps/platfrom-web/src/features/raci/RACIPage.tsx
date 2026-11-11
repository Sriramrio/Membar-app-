import { useState } from 'react';
import { PageHeader, Card, Loading, ErrorNotice, DataTable, CommandFeedback, Modal, Pill } from '@/components/Ui';
import { QUERY_IDS, COMMAND_IDS, PERMISSIONS } from '@/contracts/catalogue';
import { usePlatformQuery } from '@/query/usePlatformQuery';
import { useGovernedCommand } from '@/command/useGovernedCommand';
import { useBootstrap } from '@/bootstrap/BootstrapContext';

interface Paged {
  items: Record<string, unknown>[];
}

const id = () => crypto.randomUUID?.() ?? `cmd-${Date.now()}`;

export function RACIPage() {
  const q = usePlatformQuery<Paged>({ queryId: QUERY_IDS.raciList, pagination: { pageSize: 100 } });
  const roles = usePlatformQuery<Paged>({ queryId: QUERY_IDS.rolesList, pagination: { pageSize: 100 } });
  const c = useGovernedCommand();
  const { has } = useBootstrap();

  const [showCreate, setShowCreate] = useState(false);
  const [domain, setDomain] = useState('Configuration');
  const [action, setAction] = useState('Review release');
  const [responsible, setResponsible] = useState('ROLE_REVIEWER');
  const [accountable, setAccountable] = useState('ROLE_PA');

  async function create() {
    const r = await c.execute({
      commandId: id(),
      command: COMMAND_IDS.raciPropose,
      aggregateType: 'RaciDefinition',
      reason: 'Create governed RACI definition',
      payload: { domain, action, responsible, accountable, resolver: 'ROLE', scope: 'PLATFORM' },
    });
    if (r) {
      setShowCreate(false);
      q.refresh();
    }
  }

  const items = q.data?.items ?? [];

  return (
    <div className="stack">
      <PageHeader
        title="RACI Governance Matrix"
        description="Responsibility definitions are configurable, version-aware and resolved independently from RBAC to ensure distinct accountability across processes."
        actions={
          has(PERMISSIONS.raciManage) && (
            <button type="button" className="btn primary" onClick={() => setShowCreate(true)}>
              + Create RACI Definition
            </button>
          )
        }
      />

      <div className="grid cols-3">
        <Card>
          <div className="metric">
            <span className="value">{items.length}</span>
            <span className="label">Governed Processes</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#16a34a' }}>{items.filter((i) => i.status === 'Active').length}</span>
            <span className="label">Active Definitions</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#2563eb' }}>{roles.data?.items?.length ?? 0}</span>
            <span className="label">Participating Roles</span>
          </div>
        </Card>
      </div>

      <CommandFeedback busy={c.busy} result={c.result} error={c.error} onClear={c.clear} />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create RACI Definition">
        <div className="form-grid">
          <label className="field">
            <span className="label">Process / Domain</span>
            <input
              className="input"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. Configuration, Membership, Finance"
            />
          </label>
          <label className="field">
            <span className="label">Action / Stage</span>
            <input
              className="input"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. Review release, Approve member induction"
            />
          </label>
          <label className="field">
            <span className="label">Responsible (Does the work)</span>
            <select className="select" value={responsible} onChange={(e) => setResponsible(e.target.value)}>
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
            <span className="label">Accountable (Approves & owns outcome)</span>
            <select className="select" value={accountable} onChange={(e) => setAccountable(e.target.value)}>
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
        </div>
        <div className="modal-footer">
          <button type="button" className="btn secondary" onClick={() => setShowCreate(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={c.busy || !domain || !action || !responsible || !accountable}
            onClick={create}
          >
            Create RACI
          </button>
        </div>
      </Modal>

      {q.loading || roles.loading ? (
        <Loading label="Loading RACI matrix from database…" />
      ) : q.error ? (
        <ErrorNotice error={q.error} onRetry={q.refresh} />
      ) : roles.error ? (
        <ErrorNotice error={roles.error} onRetry={roles.refresh} />
      ) : (
        <DataTable
          label="RACI Matrix"
          rows={items as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'domain', label: 'Domain', render: (r) => <strong>{String(r.domain)}</strong> },
            { key: 'action', label: 'Governed Process Action' },
            {
              key: 'responsible',
              label: 'Responsible (R)',
              render: (r) => <Pill tone="good">{String(r.responsible)}</Pill>,
            },
            {
              key: 'accountable',
              label: 'Accountable (A)',
              render: (r) => <Pill tone="accent">{String(r.accountable)}</Pill>,
            },
            { key: 'scope', label: 'Scope' },
            {
              key: 'status',
              label: 'Status',
              render: (r) => <Pill tone={r.status === 'Active' ? 'good' : 'warn'}>{String(r.status)}</Pill>,
            },
            { key: 'version', label: 'Version' },
          ]}
        />
      )}
    </div>
  );
}

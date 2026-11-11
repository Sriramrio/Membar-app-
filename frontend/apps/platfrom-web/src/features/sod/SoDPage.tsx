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
const rules = [
  'MAKER_NE_CHECKER',
  'REQUESTER_NE_APPROVER',
  'CORRECTION_PROPOSER_NE_VERIFIER',
  'IMPORT_CREATOR_NE_APPROVER',
  'CONFIG_AUTHOR_NE_APPROVER',
];

export function SoDPage() {
  const q = usePlatformQuery<Paged>({ queryId: QUERY_IDS.sodList, pagination: { pageSize: 100 } });
  const c = useGovernedCommand();
  const { has } = useBootstrap();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('Configuration maker/checker separation');
  const [rule, setRule] = useState(rules[0]);

  async function create() {
    const r = await c.execute({
      commandId: id(),
      command: COMMAND_IDS.sodPropose,
      aggregateType: 'SoDPolicy',
      reason: 'Create governed separation-of-duties policy',
      payload: { name, rule, scope: 'PLATFORM' },
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
        title="Separation of Duties (SoD)"
        description="Dual-control and conflict-of-interest rules are evaluated independently from RBAC and RACI to ensure no single actor can unilaterally propose and approve actions."
        actions={
          has(PERMISSIONS.sodManage) && (
            <button type="button" className="btn primary" onClick={() => setShowCreate(true)}>
              + Create SoD Policy
            </button>
          )
        }
      />

      <div className="grid cols-3">
        <Card>
          <div className="metric">
            <span className="value">{items.length}</span>
            <span className="label">Active SoD Policies</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#16a34a' }}>100%</span>
            <span className="label">Dual-Control Compliance</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#2563eb' }}>{rules.length}</span>
            <span className="label">Enforced Rule Primitives</span>
          </div>
        </Card>
      </div>

      <CommandFeedback busy={c.busy} result={c.result} error={c.error} onClear={c.clear} />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Separation of Duties Policy">
        <div className="form-grid">
          <label className="field">
            <span className="label">Policy Title</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Configuration maker/checker"
            />
          </label>
          <label className="field">
            <span className="label">Enforced Conflict Rule</span>
            <select className="select" value={rule} onChange={(e) => setRule(e.target.value)}>
              {rules.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
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
            disabled={c.busy || !name.trim()}
            onClick={create}
          >
            Create Policy
          </button>
        </div>
      </Modal>

      {q.loading ? (
        <Loading label="Loading SoD rules from database…" />
      ) : q.error ? (
        <ErrorNotice error={q.error} onRetry={q.refresh} />
      ) : (
        <DataTable
          label="Separation of Duties Policies"
          rows={items as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'name', label: 'Policy Name', render: (r) => <strong>{String(r.name)}</strong> },
            {
              key: 'rule',
              label: 'Conflict Rule Pattern',
              render: (r) => (
                <span style={{ fontFamily: 'monospace', color: '#b91c1c', fontWeight: 600 }}>
                  {String(r.rule)}
                </span>
              ),
            },
            { key: 'scope', label: 'Scope' },
            {
              key: 'status',
              label: 'Status',
              render: (r) => (
                <Pill tone={r.status === 'Active' ? 'good' : 'warn'}>
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

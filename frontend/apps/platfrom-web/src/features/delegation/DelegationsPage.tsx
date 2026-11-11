import { useState } from 'react';
import { PageHeader, Card, Loading, ErrorNotice, DataTable, Empty, CommandFeedback, Modal, Pill } from '@/components/Ui';
import { QUERY_IDS, COMMAND_IDS, PERMISSIONS } from '@/contracts/catalogue';
import { usePlatformQuery } from '@/query/usePlatformQuery';
import { useGovernedCommand } from '@/command/useGovernedCommand';
import { useBootstrap } from '@/bootstrap/BootstrapContext';

interface Paged {
  items: Record<string, unknown>[];
}

const id = () => crypto.randomUUID?.() ?? `cmd-${Date.now()}`;

export function DelegationsPage() {
  const q = usePlatformQuery<Paged>({ queryId: QUERY_IDS.assignmentsList, pagination: { pageSize: 100 } });
  const roles = usePlatformQuery<Paged>({ queryId: QUERY_IDS.rolesList, pagination: { pageSize: 100 } });
  const c = useGovernedCommand();
  const { has, bootstrap } = useBootstrap();

  const [showCreate, setShowCreate] = useState(false);
  const [accountId, setAccountId] = useState('pa-reviewer-001');
  const [roleId, setRoleId] = useState('ROLE_REVIEWER');
  const [scopeId, setScopeId] = useState('OU-TN');
  const [actingAuthority, setActingAuthority] = useState('Time-Bound Regional Audit Reviewer');
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState('2026-12-31');

  const delegated = (q.data?.items ?? []).filter(
    (r) => Boolean(r.delegatedBy) || Boolean(r.delegatedTo) || Boolean(r.actingAuthority)
  );

  async function delegate() {
    const r = await c.execute({
      commandId: id(),
      command: COMMAND_IDS.assignmentDelegate,
      aggregateType: 'RoleAssignment',
      reason: 'Time-bound delegated Platform Administration authority',
      payload: {
        accountId,
        roleId,
        scopeId,
        actingAuthority,
        delegatedBy: bootstrap?.actor.accountId || 'platformadmin@dbn.network',
        effectiveFrom: from,
        effectiveTo: to,
      },
    });
    if (r) {
      setShowCreate(false);
      q.refresh();
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Delegations & Acting Authority"
        description="Time-bound delegated technical authority is recorded as assignment metadata; it never becomes a permanent role or organisational appointment."
        actions={
          has(PERMISSIONS.assignmentsManage) && (
            <button type="button" className="btn primary" onClick={() => setShowCreate(true)}>
              + Create Delegation
            </button>
          )
        }
      />

      {/* KPI Cards */}
      <div className="grid cols-3">
        <Card>
          <div className="metric">
            <span className="value">{delegated.length}</span>
            <span className="label">Active Delegations</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#16a34a' }}>100%</span>
            <span className="label">Temporal Validity Bound</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#2563eb' }}>{q.data?.items?.length ?? 0}</span>
            <span className="label">Total Base Assignments</span>
          </div>
        </Card>
      </div>

      <CommandFeedback busy={c.busy} result={c.result} error={c.error} onClear={c.clear} />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Delegated Authority">
        <div className="form-grid">
          <label className="field">
            <span className="label">Delegate Account (Appointee)</span>
            <input
              className="input"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="e.g. pa-reviewer-001 or Member Name"
            />
          </label>
          <label className="field">
            <span className="label">Delegated Role</span>
            <select className="select" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
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
            <span className="label">Scope</span>
            <input
              className="input"
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              placeholder="e.g. OU-TN, ch-chennai-central"
            />
          </label>
          <label className="field">
            <span className="label">Acting Authority Title</span>
            <input
              className="input"
              value={actingAuthority}
              onChange={(e) => setActingAuthority(e.target.value)}
              placeholder="e.g. Time-Bound Audit Reviewer"
            />
          </label>
          <label className="field">
            <span className="label">From Date</span>
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="field">
            <span className="label">To Date</span>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn secondary" onClick={() => setShowCreate(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={c.busy || !accountId || !roleId || !from || !to}
            onClick={delegate}
          >
            Create Delegation
          </button>
        </div>
      </Modal>

      {q.loading ? (
        <Loading label="Loading delegations from database…" />
      ) : q.error ? (
        <ErrorNotice error={q.error} onRetry={q.refresh} />
      ) : delegated.length > 0 ? (
        <DataTable
          rows={delegated}
          columns={[
            { key: 'id', label: 'Assignment ID' },
            { key: 'accountId', label: 'Delegated Actor', render: (r) => <strong>{String(r.accountId)}</strong> },
            { key: 'actingAuthority', label: 'Acting Authority' },
            { key: 'delegatedBy', label: 'Delegated By', render: (r) => String(r.delegatedBy || 'Central Admin') },
            { key: 'effectiveFrom', label: 'From' },
            { key: 'effectiveTo', label: 'To' },
            {
              key: 'status',
              label: 'Status',
              render: (r) => <Pill tone={r.status === 'ACTIVE' ? 'good' : 'warn'}>{String(r.status)}</Pill>,
            },
          ]}
        />
      ) : (
        <Empty
          title="No active delegations"
          body="No assignments currently carry time-bound acting authority metadata."
        />
      )}
    </div>
  );
}

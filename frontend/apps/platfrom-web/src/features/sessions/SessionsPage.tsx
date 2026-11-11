import { useMemo, useState } from 'react';
import { PageHeader, Card, Loading, ErrorNotice, DataTable, Pill, CommandFeedback, Modal } from '@/components/Ui';
import { usePlatformQuery } from '@/query/usePlatformQuery';
import { useGovernedCommand } from '@/command/useGovernedCommand';
import { QUERY_IDS, COMMAND_IDS, PERMISSIONS } from '@/contracts/catalogue';
import { useBootstrap } from '@/bootstrap/BootstrapContext';

interface Paged {
  items: SessionRecord[];
}

interface SessionRecord {
  id: string;
  accountId: string;
  status: string;
  createdAt: string;
  lastActiveAt: string;
  version: number;
}

const id = () => crypto.randomUUID?.() ?? `cmd-${Date.now()}`;

export function SessionsPage() {
  const [search, setSearch] = useState('');
  const [targetSession, setTargetSession] = useState<SessionRecord | null>(null);
  const [revokeReason, setRevokeReason] = useState('Administrative session termination');

  const q = usePlatformQuery<Paged>({
    queryId: QUERY_IDS.sessionList,
    pagination: { pageSize: 50 },
  });

  const c = useGovernedCommand();
  const { has } = useBootstrap();

  const allItems = q.data?.items ?? [];

  const filteredItems = useMemo(() => {
    return allItems.filter((s) => {
      return (
        !search.trim() ||
        s.accountId.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [allItems, search]);

  const activeCount = allItems.filter((s) => s.status === 'Active').length;
  const revokedCount = allItems.filter((s) => s.status !== 'Active').length;

  async function revoke() {
    if (!targetSession) return;
    const r = await c.execute({
      commandId: id(),
      command: COMMAND_IDS.sessionRevoke,
      aggregateType: 'PlatformSession',
      aggregateId: targetSession.id,
      reason: revokeReason,
    });
    if (r) {
      setTargetSession(null);
      q.refresh();
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Active Sessions"
        description="Server-authoritative session inventory, security revision and revocation control plane."
      />

      {/* KPI Cards */}
      <div className="grid cols-3">
        <Card>
          <div className="metric">
            <span className="value">{allItems.length}</span>
            <span className="label">Total Monitored Sessions</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#16a34a' }}>{activeCount}</span>
            <span className="label">Active Sessions</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#dc2626' }}>{revokedCount}</span>
            <span className="label">Revoked Sessions</span>
          </div>
        </Card>
      </div>

      <CommandFeedback busy={c.busy} result={c.result} error={c.error} onClear={c.clear} />

      {/* Revocation Modal */}
      <Modal open={Boolean(targetSession)} onClose={() => setTargetSession(null)} title="Revoke Active Session">
        <div className="form-grid">
          <p style={{ fontSize: '0.9rem', color: '#475569' }}>
            Are you sure you want to terminate the active session for <strong>{targetSession?.accountId}</strong>?
            The user will be required to re-authenticate immediately.
          </p>
          <label className="field">
            <span className="label">Revocation Reason</span>
            <input
              className="input"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="e.g. Periodic security cycle or suspicious activity"
            />
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn secondary" onClick={() => setTargetSession(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn danger"
            disabled={c.busy || !revokeReason.trim()}
            onClick={revoke}
          >
            Revoke Session
          </button>
        </div>
      </Modal>

      {/* Search Bar */}
      <Card>
        <input
          type="search"
          placeholder="Search session by account name or session UUID…"
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
        <Loading label="Loading sessions from security control plane…" />
      ) : q.error ? (
        <ErrorNotice error={q.error} onRetry={q.refresh} />
      ) : (
        <DataTable
          rows={filteredItems as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: 'accountId',
              label: 'Authenticated Operator',
              render: (r) => <strong>{String(r.accountId)}</strong>,
            },
            {
              key: 'id',
              label: 'Session ID',
              render: (r) => (
                <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#475569' }}>
                  {String(r.id)}
                </span>
              ),
            },
            {
              key: 'status',
              label: 'Status',
              render: (r) => (
                <Pill tone={r.status === 'Active' ? 'good' : 'bad'}>
                  {String(r.status)}
                </Pill>
              ),
            },
            {
              key: 'lastActiveAt',
              label: 'Last Active',
              render: (r) => (r.lastActiveAt ? new Date(String(r.lastActiveAt)).toLocaleTimeString() : '—'),
            },
            {
              key: 'actions',
              label: 'Revocation Control',
              render: (r) =>
                has(PERMISSIONS.sessionManage) && r.status === 'Active' ? (
                  <button
                    type="button"
                    className="btn danger"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.78rem' }}
                    onClick={() => setTargetSession(r as unknown as SessionRecord)}
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

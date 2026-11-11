import { useMemo, useState } from 'react';
import { PageHeader, Card, Loading, ErrorNotice, DataTable, Pill } from '@/components/Ui';
import { usePlatformQuery } from '@/query/usePlatformQuery';
import { useGovernedCommand } from '@/command/useGovernedCommand';
import { useBootstrap } from '@/bootstrap/BootstrapContext';
import { QUERY_IDS, COMMAND_IDS, PERMISSIONS } from '@/contracts/catalogue';
import type { PlatformChangeSet } from '@/contracts/platform';

interface ChangeSetPage {
  items: PlatformChangeSet[];
}

const cmdId = () => globalThis.crypto?.randomUUID?.() ?? `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function ChangeSetsPage() {
  const q = usePlatformQuery<ChangeSetPage>({
    queryId: QUERY_IDS.changeSetList,
    pagination: { pageSize: 50 },
  });
  const [selectedId, setSelectedId] = useState<string>();
  const command = useGovernedCommand();
  const { has } = useBootstrap();
  const selected = useMemo(
    () => q.data?.items.find((x) => x.id === selectedId) ?? q.data?.items[0],
    [q.data, selectedId]
  );

  async function act(name: string, payload?: Record<string, unknown>) {
    if (!selected) return;
    try {
      await command.execute({
        commandId: cmdId(),
        command: name,
        aggregateType: 'PlatformChangeSet',
        aggregateId: selected.id,
        expectedVersion: selected.version,
        reason: `Platform Administration change-set action: ${name}`,
        payload,
      });
      q.refresh();
    } catch {
      /* command state renders structured error */
    }
  }

  const items = q.data?.items ?? [];
  const activeCount = items.filter((x) => x.status === 'Active').length;
  const pendingCount = items.filter((x) => x.status === 'Pending Review').length;
  const draftCount = items.filter((x) => x.status === 'Draft').length;

  return (
    <div className="stack">
      <PageHeader
        title="Change Sets"
        description="Atomic grouping of related technical changes. A change set is validated and impact-analysed as one unit before maker/checker review, scheduling and activation."
      />

      {/* KPI Cards */}
      <div className="grid cols-3">
        <Card>
          <div className="metric">
            <span className="value">{items.length}</span>
            <span className="label">Registered Change Sets</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#16a34a' }}>{activeCount}</span>
            <span className="label">Active In Production</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#d97706' }}>{pendingCount + draftCount}</span>
            <span className="label">Pending Governance Review</span>
          </div>
        </Card>
      </div>

      {command.error && <ErrorNotice error={command.error} onRetry={command.clear} />}
      {command.result && (
        <div className="notice">
          Change-set command accepted · Version {String(command.result.version ?? '—')} · Audit {command.result.auditId ?? '—'}
        </div>
      )}

      {q.loading ? (
        <Loading label="Loading change sets from database…" />
      ) : q.error ? (
        <ErrorNotice error={q.error} onRetry={q.refresh} />
      ) : (
        <>
          <DataTable
            label="Change Sets List"
            selectedId={selected?.id}
            rows={(q.data?.items ?? []) as unknown as Record<string, unknown>[]}
            columns={[
              {
                key: 'id',
                label: 'Change set',
                render: (r) => (
                  <button
                    type="button"
                    className={`table-code-btn ${selected?.id === r.id ? 'active' : ''}`}
                    onClick={() => setSelectedId(String(r.id))}
                  >
                    {String(r.id)}
                  </button>
                ),
              },
              { key: 'name', label: 'Name' },
              {
                key: 'status',
                label: 'Status',
                render: (r) => (
                  <Pill tone={r.status === 'Active' ? 'good' : r.status === 'Rejected' ? 'bad' : 'warn'}>
                    {String(r.status)}
                  </Pill>
                ),
              },
              { key: 'maker', label: 'Maker' },
              { key: 'version', label: 'Version' },
              {
                key: 'items',
                label: 'Items',
                render: (r) => (Array.isArray(r.items) ? String(r.items.length) : '0'),
              },
            ]}
          />

          {selected && (
            <section className="detail-card">
              <div className="detail-card-head">
                <div className="title">
                  <span>{selected.name}</span>
                  <Pill tone={selected.status === 'Active' ? 'good' : selected.status === 'Rejected' ? 'bad' : 'warn'}>
                    {selected.status}
                  </Pill>
                </div>
                <span className="muted">{selected.items?.length ?? 0} item(s) · v{selected.version} · {selected.id}</span>
              </div>

              {selected.description && (
                <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '0.75rem' }}>
                  {selected.description}
                </p>
              )}

              <DataTable
                label="Change set items"
                rows={(selected.items ?? []) as unknown as Record<string, unknown>[]}
                columns={[
                  { key: 'artifactType', label: 'Artifact type' },
                  { key: 'artifactId', label: 'Artifact' },
                  {
                    key: 'changeType',
                    label: 'Change',
                    render: (r) => (
                      <Pill tone={r.changeType === 'CREATE' ? 'good' : r.changeType === 'UPDATE' ? 'warn' : 'bad'}>
                        {String(r.changeType)}
                      </Pill>
                    ),
                  },
                  { key: 'expectedVersion', label: 'Expected version' },
                  { key: 'summary', label: 'Summary' },
                ]}
              />

              <div className="detail-card-actions">
                {selected.status === 'Draft' && has(PERMISSIONS.changeSetManage) && (
                  <>
                    <button type="button" className="btn secondary" disabled={command.busy} onClick={() => act(COMMAND_IDS.changeSetValidate)}>
                      Validate dependencies
                    </button>
                    <button type="button" className="btn secondary" disabled={command.busy} onClick={() => act(COMMAND_IDS.changeSetImpactAnalyse)}>
                      Impact analyse
                    </button>
                    <button type="button" className="btn primary" disabled={command.busy} onClick={() => act(COMMAND_IDS.changeSetSubmit)}>
                      Submit
                    </button>
                  </>
                )}
                {selected.status === 'Pending Review' && has(PERMISSIONS.changeSetReview) && (
                  <button type="button" className="btn primary" disabled={command.busy} onClick={() => act(COMMAND_IDS.changeSetApprove)}>
                    Approve
                  </button>
                )}
                {selected.status === 'Approved' && has(PERMISSIONS.changeSetPublish) && (
                  <>
                    <button
                      type="button"
                      className="btn secondary"
                      disabled={command.busy}
                      onClick={() => act(COMMAND_IDS.changeSetSchedule, { effectiveFrom: new Date(Date.now() + 86400000).toISOString() })}
                    >
                      Schedule +1 day
                    </button>
                    <button type="button" className="btn primary" disabled={command.busy} onClick={() => act(COMMAND_IDS.changeSetActivate)}>
                      Activate atomically
                    </button>
                  </>
                )}
                {selected.status === 'Scheduled' && has(PERMISSIONS.changeSetPublish) && (
                  <button type="button" className="btn primary" disabled={command.busy} onClick={() => act(COMMAND_IDS.changeSetActivate)}>
                    Activate scheduled set
                  </button>
                )}
                {!['Active', 'Cancelled', 'Rejected'].includes(selected.status) && has(PERMISSIONS.changeSetManage) && (
                  <button type="button" className="btn danger" disabled={command.busy} onClick={() => act(COMMAND_IDS.changeSetCancel)}>
                    Cancel
                  </button>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

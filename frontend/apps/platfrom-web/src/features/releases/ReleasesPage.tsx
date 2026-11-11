import { useMemo, useState } from 'react';
import { PageHeader, Card, Loading, ErrorNotice, DataTable, Pill } from '@/components/Ui';
import { usePlatformQuery } from '@/query/usePlatformQuery';
import { useGovernedCommand } from '@/command/useGovernedCommand';
import { useBootstrap } from '@/bootstrap/BootstrapContext';
import { QUERY_IDS, COMMAND_IDS, PERMISSIONS } from '@/contracts/catalogue';
import type { ConfigurationRelease } from '@/contracts/platform';

interface ReleasePage {
  items: ConfigurationRelease[];
}

const id = () => globalThis.crypto?.randomUUID?.() ?? `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function ReleasesPage() {
  const list = usePlatformQuery<ReleasePage>({
    queryId: QUERY_IDS.releaseList,
    pagination: { pageSize: 50 },
  });
  const [selectedId, setSelectedId] = useState<string>();
  const command = useGovernedCommand();
  const { has } = useBootstrap();
  const selected = useMemo(
    () => list.data?.items.find((x) => x.id === selectedId) ?? list.data?.items[0],
    [list.data, selectedId]
  );

  async function act(commandName: string, payload?: Record<string, unknown>) {
    if (!selected) return;
    try {
      await command.execute({
        commandId: id(),
        command: commandName,
        aggregateType: 'ConfigurationRelease',
        aggregateId: selected.id,
        expectedVersion: selected.version,
        reason: `Platform Administration release action: ${commandName}`,
        payload,
      });
      list.refresh();
    } catch {
      /* surfaced by governed command state */
    }
  }

  const canPropose = has(PERMISSIONS.configurationManage);
  const canReview = has(PERMISSIONS.releaseReview);
  const canPublish = has(PERMISSIONS.releasePublish);

  const items = list.data?.items ?? [];
  const activeCount = items.filter((x) => x.status === 'Active').length;
  const pendingCount = items.filter((x) => x.status === 'Pending Review').length;
  const approvedCount = items.filter((x) => x.status === 'Approved').length;
  const draftCount = items.filter((x) => x.status === 'Draft').length;

  return (
    <div className="stack">
      <PageHeader
        title="Configuration Releases"
        description="Governed maker/checker release lifecycle. Validation and impact analysis are mandatory before review; activation is versioned, auditable and never silently overwrites a concurrent change."
      />

      {/* KPI Cards */}
      <div className="grid cols-4">
        <Card>
          <div className="metric">
            <span className="value">{items.length}</span>
            <span className="label">Total Releases</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#16a34a' }}>{activeCount}</span>
            <span className="label">Active in Production</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#2563eb' }}>{approvedCount}</span>
            <span className="label">Approved / Scheduled</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#d97706' }}>{pendingCount + draftCount}</span>
            <span className="label">In Progress (Draft / Review)</span>
          </div>
        </Card>
      </div>

      {command.error && <ErrorNotice error={command.error} onRetry={command.clear} />}
      {command.result && (
        <div className="notice" role="status">
          Release command accepted · Version {String(command.result.version ?? '—')} · Audit {command.result.auditId ?? '—'}
        </div>
      )}

      {list.loading ? (
        <Loading label="Loading configuration releases from database…" />
      ) : list.error ? (
        <ErrorNotice error={list.error} onRetry={list.refresh} />
      ) : (
        <>
          <DataTable
            label="Releases List"
            selectedId={selected?.id}
            rows={(list.data?.items ?? []) as unknown as Record<string, unknown>[]}
            columns={[
              {
                key: 'id',
                label: 'Release',
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
              { key: 'changeSummary', label: 'Summary' },
              {
                key: 'status',
                label: 'Status',
                render: (r) => (
                  <Pill
                    tone={
                      r.status === 'Active'
                        ? 'good'
                        : r.status === 'Approved'
                        ? 'good'
                        : r.status === 'Rejected'
                        ? 'bad'
                        : 'warn'
                    }
                  >
                    {String(r.status)}
                  </Pill>
                ),
              },
              { key: 'maker', label: 'Maker' },
              { key: 'checker', label: 'Checker', render: (r) => (r.checker ? String(r.checker) : '—') },
              { key: 'version', label: 'Version' },
            ]}
          />

          {selected && (
            <section className="detail-card">
              <div className="detail-card-head">
                <div className="title">
                  <span>{selected.changeSummary}</span>
                  <Pill tone={selected.status === 'Active' ? 'good' : selected.status === 'Rejected' ? 'bad' : 'warn'}>
                    {selected.status}
                  </Pill>
                </div>
                <span className="muted">v{selected.version} · {selected.id}</span>
              </div>
              <p className="muted">
                Artifact <strong>{selected.artifactType}</strong> / <strong>{selected.artifactId}</strong>. Maker <strong>{selected.maker}</strong>
                {selected.checker ? <> · Checker <strong>{selected.checker}</strong></> : ''}.
              </p>
              {selected.reason && <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0.5rem 0' }}>{selected.reason}</p>}
              <div className="detail-card-actions">
                {selected.status === 'Draft' && canPropose && (
                  <>
                    <button type="button" className="btn secondary" disabled={command.busy} onClick={() => act('platform.configuration.validate')}>
                      Validate
                    </button>
                    <button type="button" className="btn secondary" disabled={command.busy} onClick={() => act('platform.configuration.impact-analyse')}>
                      Impact analyse
                    </button>
                    <button type="button" className="btn primary" disabled={command.busy} onClick={() => act(COMMAND_IDS.configurationSubmit)}>
                      Submit for review
                    </button>
                  </>
                )}
                {selected.status === 'Pending Review' && canReview && (
                  <>
                    <button type="button" className="btn primary" disabled={command.busy} onClick={() => act(COMMAND_IDS.configurationApprove)}>
                      Approve
                    </button>
                    <button type="button" className="btn secondary" disabled={command.busy} onClick={() => act('platform.configuration.return')}>
                      Return
                    </button>
                    <button type="button" className="btn danger" disabled={command.busy} onClick={() => act('platform.configuration.reject')}>
                      Reject
                    </button>
                  </>
                )}
                {selected.status === 'Approved' && canPublish && (
                  <>
                    <button
                      type="button"
                      className="btn secondary"
                      disabled={command.busy}
                      onClick={() => act(COMMAND_IDS.configurationSchedule, { effectiveFrom: new Date(Date.now() + 86400000).toISOString() })}
                    >
                      Schedule +1 day
                    </button>
                    <button type="button" className="btn primary" disabled={command.busy} onClick={() => act(COMMAND_IDS.configurationActivate)}>
                      Activate now
                    </button>
                  </>
                )}
                {selected.status === 'Scheduled' && canPublish && (
                  <button type="button" className="btn primary" disabled={command.busy} onClick={() => act(COMMAND_IDS.configurationActivate)}>
                    Activate scheduled release
                  </button>
                )}
                {['Active', 'Superseded'].includes(selected.status) && has('platform.configuration.rollback') && (
                  <button type="button" className="btn danger" disabled={command.busy} onClick={() => act('platform.configuration.rollback')}>
                    Create rollback version
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

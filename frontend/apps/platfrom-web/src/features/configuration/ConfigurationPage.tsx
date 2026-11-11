import { useMemo, useState, useEffect } from 'react';
import { PageHeader, Card, Loading, ErrorNotice, DataTable, CommandFeedback, Pill } from '@/components/Ui';
import { LucideIcon } from '@/components/LucideIcon';
import { QUERY_IDS, COMMAND_IDS, PERMISSIONS } from '@/contracts/catalogue';
import { usePlatformQuery } from '@/query/usePlatformQuery';
import { useGovernedCommand } from '@/command/useGovernedCommand';
import { useBootstrap } from '@/bootstrap/BootstrapContext';
import { chapterWorkflowApi, type ChapterDto } from '@/services/chapterWorkflowApi';
import type { EffectiveConfigurationResult } from '@/contracts/platform';

interface Paged {
  items: Array<{
    id: string;
    key: string;
    domain: string;
    scopeType: string;
    scopeId: string;
    inheritanceMode: string;
    status: string;
    version: number;
    currentValue?: string;
  }>;
}

const id = () => crypto.randomUUID?.() ?? `cmd-${Date.now()}`;

export function ConfigurationPage() {
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('');
  const [selectedKey, setSelectedKey] = useState('membership.review.slaHours');
  const [scopeId, setScopeId] = useState('OU-CH-CENTRAL');
  const [overrideValue, setOverrideValue] = useState('48');
  const [chapters, setChapters] = useState<ChapterDto[]>([]);

  // Load real chapters for target scope selection
  useEffect(() => {
    chapterWorkflowApi.getChapters()
      .then((chs) => setChapters(chs))
      .catch(() => {});
  }, []);

  const q = usePlatformQuery<Paged>({
    queryId: QUERY_IDS.configurationList,
    search,
    filters: domain ? [{ field: 'domain', operator: 'eq', value: domain }] : [],
    pagination: { pageSize: 100 },
  });

  const resolved = usePlatformQuery<EffectiveConfigurationResult>(
    {
      queryId: QUERY_IDS.configurationResolve,
      parameters: { key: selectedKey, scopeId },
    },
    Boolean(selectedKey)
  );

  const c = useGovernedCommand();
  const { has } = useBootstrap();

  const items = useMemo(() => q.data?.items ?? [], [q.data?.items]);
  const domains = useMemo(
    () => [...new Set(items.map((x) => String(x.domain ?? '')).filter(Boolean))],
    [items]
  );

  // When effective value is resolved, sync the default input value if empty
  useEffect(() => {
    if (resolved.data?.effectiveValue !== undefined) {
      setOverrideValue(String(resolved.data.effectiveValue));
    }
  }, [resolved.data?.effectiveValue, selectedKey, scopeId]);

  // Derived metrics
  const totalConfigs = items.length;
  const centralCount = useMemo(() => items.filter((x) => x.scopeId === 'OU-CH-CENTRAL').length, [items]);
  const overrideCount = useMemo(() => items.filter((x) => x.scopeId !== 'OU-CH-CENTRAL').length, [items]);

  async function propose() {
    let value: unknown = overrideValue;
    try {
      value = JSON.parse(overrideValue);
    } catch {
      value = overrideValue;
    }

    const r = await c.execute({
      commandId: id(),
      command: COMMAND_IDS.configurationPropose,
      aggregateType: 'Setting',
      reason: `Governed override of ${selectedKey} for ${scopeId}`,
      payload: {
        artifactType: 'Setting',
        artifactId: selectedKey,
        changeSummary: `Override ${selectedKey} for scope ${scopeId}`,
        draft: {
          key: selectedKey,
          scopeId,
          value,
        },
      },
    });

    if (r) {
      q.refresh();
      resolved.refresh();
    }
  }

  return (
    <div className="stack" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Configuration Registry"
        description="Enterprise Parameter Control Plane. Governed, scoped, and versioned runtime rules backed by PostgreSQL."
        actions={
          <button
            type="button"
            className="btn secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={() => {
              q.refresh();
              resolved.refresh();
            }}
          >
            <LucideIcon name="refresh-cw" size={15} /> Refresh Parameters
          </button>
        }
      />

      <CommandFeedback busy={c.busy} result={c.result} error={c.error} onClear={c.clear} />

      {/* KPI Metric Cards */}
      <div className="grid grid-3" style={{ gap: '16px' }}>
        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Governed Parameters</span>
            <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', color: '#334155' }}>
              <LucideIcon name="sliders" size={16} />
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>{totalConfigs}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Persisted in PostgreSQL</div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e0f2fe', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#0369a1', fontWeight: 600 }}>Central Baselines</span>
            <span style={{ background: '#f0f9ff', padding: '4px 8px', borderRadius: '6px', color: '#0284c7' }}>
              <LucideIcon name="shield-check" size={16} />
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0284c7', marginTop: '8px' }}>{centralCount}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>National default rules</div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #fef3c7', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#92400e', fontWeight: 600 }}>Chapter Overrides</span>
            <span style={{ background: '#fffbeb', padding: '4px 8px', borderRadius: '6px', color: '#d97706' }}>
              <LucideIcon name="git-branch" size={16} />
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: overrideCount > 0 ? '#d97706' : '#0f172a', marginTop: '8px' }}>
            {overrideCount}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Specific unit configurations</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div className="form-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <label className="field" style={{ flex: 1, minWidth: '220px' }}>
            <span className="label">Search Configuration</span>
            <input
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by key or domain (e.g. slaHours, finance, session)..."
            />
          </label>

          <label className="field" style={{ minWidth: '180px' }}>
            <span className="label">Domain</span>
            <select className="select" value={domain} onChange={(e) => setDomain(e.target.value)}>
              <option value="">All Domains</option>
              {domains.map((x) => (
                <option key={x} value={x}>
                  {x.toUpperCase()}
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="btn secondary" onClick={q.refresh}>
            Filter
          </button>
        </div>
      </Card>

      {/* Configuration Parameters Table */}
      {q.loading ? (
        <Loading label="Querying live configurations from database..." />
      ) : q.error ? (
        <ErrorNotice error={q.error} onRetry={q.refresh} />
      ) : (
        <DataTable
          rows={items as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: 'key',
              label: 'Configuration Key',
              render: (r) => (
                <button
                  type="button"
                  className="btn link"
                  style={{ fontWeight: 700, color: '#0284c7', textAlign: 'left' }}
                  onClick={() => {
                    setSelectedKey(String(r.key));
                    setScopeId(String(r.scopeId));
                  }}
                >
                  {String(r.key)}
                </button>
              ),
            },
            { key: 'domain', label: 'Domain' },
            {
              key: 'currentValue',
              label: 'Active Value',
              render: (r) => (
                <span className="code" style={{ fontWeight: 700, color: '#0f172a' }}>
                  {String(r.currentValue ?? '—')}
                </span>
              ),
            },
            { key: 'scopeType', label: 'Scope Type' },
            {
              key: 'scopeId',
              label: 'Scope Unit',
              render: (r) => (
                <span style={{ fontSize: '12px', color: '#475569' }}>
                  {String(r.scopeId) === 'OU-CH-CENTRAL' ? 'Central (National)' : String(r.scopeId)}
                </span>
              ),
            },
            {
              key: 'inheritanceMode',
              label: 'Inheritance',
              render: (r) => (
                <Pill tone={String(r.inheritanceMode) === 'OVERRIDDEN' ? 'warn' : 'good'}>
                  {String(r.inheritanceMode)}
                </Pill>
              ),
            },
            { key: 'status', label: 'Status' },
            { key: 'version', label: 'Version' },
          ]}
        />
      )}

      {/* Effective Value & Governed Override Inspector */}
      <Card>
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LucideIcon name="sliders-horizontal" size={18} /> Effective Value Resolution & Scope Override
        </h2>
        <p className="muted" style={{ marginTop: '2px', marginBottom: '16px' }}>
          Inspect how this parameter resolves through the central hierarchy, or propose an audited override for a specific chapter.
        </p>

        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <label className="field">
            <span className="label">Selected Key</span>
            <input
              className="input"
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              placeholder="e.g. membership.review.slaHours"
            />
          </label>

          <label className="field">
            <span className="label">Target Governance Scope</span>
            <select
              className="select"
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
            >
              <option value="OU-CH-CENTRAL">OU-CH-CENTRAL (Central Platform - Default)</option>
              {chapters.map((ch) => (
                <option key={ch.id} value={ch.name}>
                  {ch.name} (Chapter Scope)
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="label">Proposed Value (JSON / Number / Text)</span>
            <input
              className="input"
              value={overrideValue}
              onChange={(e) => setOverrideValue(e.target.value)}
              placeholder="e.g. 24, 70, 7..."
            />
          </label>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          {has(PERMISSIONS.configurationManage) && (
            <button
              type="button"
              className="btn primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              disabled={c.busy || !selectedKey || !scopeId || !overrideValue}
              onClick={propose}
            >
              <LucideIcon name="check" size={16} /> Propose Governed Override
            </button>
          )}
        </div>

        {/* Resolved Path Details */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
          {resolved.loading ? (
            <Loading label="Resolving effective configuration path..." />
          ) : resolved.error ? (
            <ErrorNotice error={resolved.error} onRetry={resolved.refresh} />
          ) : resolved.data ? (
            <div className="stack" style={{ gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Resolved Effective Value:</span>
                <span className="code" style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  {JSON.stringify(resolved.data.effectiveValue)}
                </span>
                <Pill tone={resolved.data.overridden ? 'warn' : 'good'}>
                  {resolved.data.overridden ? 'Custom Override Active' : 'Inherited from Central Baseline'}
                </Pill>
              </div>

              <div className="muted" style={{ fontSize: '12px' }}>
                Source Scope: <strong>{resolved.data.sourceScopeType}</strong> ({resolved.data.sourceScopeId}) · Version: {String(resolved.data.version)}
              </div>

              <DataTable
                label="Hierarchy Resolution Path"
                rows={resolved.data.path as unknown as Record<string, unknown>[]}
                columns={[
                  { key: 'scopeType', label: 'Hierarchy Level' },
                  { key: 'scopeId', label: 'Scope Identifier' },
                  {
                    key: 'value',
                    label: 'Configured Value',
                    render: (r) => <span className="code">{JSON.stringify(r.value)}</span>,
                  },
                  { key: 'version', label: 'Version' },
                ]}
              />
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

export default ConfigurationPage;

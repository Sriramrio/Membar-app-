import { useMemo, useState } from 'react';
import { PageHeader, Card, Loading, ErrorNotice, DataTable, Pill } from '@/components/Ui';
import { usePlatformQuery } from '@/query/usePlatformQuery';
import { QUERY_IDS } from '@/contracts/catalogue';
import type { FeatureDefinition } from '@/contracts/platform';

interface FeaturePageResult {
  items: FeatureDefinition[];
}

export function FeaturesPage() {
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'GLOBAL' | 'HIERARCHICAL'>('ALL');

  const q = usePlatformQuery<FeaturePageResult>({
    queryId: QUERY_IDS.featureList,
    pagination: { pageSize: 100 },
  });

  const allItems = q.data?.items ?? [];

  const filteredItems = useMemo(() => {
    return allItems.filter((f) => {
      const matchesSearch =
        !search.trim() ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.code.toLowerCase().includes(search.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(search.toLowerCase()));

      const matchesScope = scopeFilter === 'ALL' || f.scopePolicy === scopeFilter;

      return matchesSearch && matchesScope;
    });
  }, [allItems, search, scopeFilter]);

  const totalCount = allItems.length;
  const activeCount = allItems.filter((f) => f.status === 'Active').length;
  const hierarchicalCount = allItems.filter((f) => f.scopePolicy === 'HIERARCHICAL').length;
  const globalCount = allItems.filter((f) => f.scopePolicy === 'GLOBAL').length;

  return (
    <div className="stack">
      <PageHeader
        title="Features & Capabilities"
        description="Dynamic feature flag and platform capability governance. Flags enable capabilities per scope policy without granting unauthorized access."
      />

      {/* KPI Cards */}
      <div className="grid cols-4">
        <Card>
          <div className="metric">
            <span className="value">{totalCount}</span>
            <span className="label">Registered Features</span>
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
            <span className="value" style={{ color: '#2563eb' }}>{globalCount}</span>
            <span className="label">Global Policies</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#d97706' }}>{hierarchicalCount}</span>
            <span className="label">Chapter Hierarchical</span>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="search"
              placeholder="Search feature by code, name or description…"
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
              className={`btn ${scopeFilter === 'ALL' ? 'primary' : 'secondary'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              onClick={() => setScopeFilter('ALL')}
            >
              All Scopes ({totalCount})
            </button>
            <button
              type="button"
              className={`btn ${scopeFilter === 'GLOBAL' ? 'primary' : 'secondary'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              onClick={() => setScopeFilter('GLOBAL')}
            >
              Global ({globalCount})
            </button>
            <button
              type="button"
              className={`btn ${scopeFilter === 'HIERARCHICAL' ? 'primary' : 'secondary'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              onClick={() => setScopeFilter('HIERARCHICAL')}
            >
              Hierarchical ({hierarchicalCount})
            </button>
          </div>
        </div>
      </Card>

      {/* Features Table */}
      {q.loading ? (
        <Loading label="Loading authoritative feature flags from database…" />
      ) : q.error ? (
        <ErrorNotice error={q.error} onRetry={q.refresh} />
      ) : (
        <DataTable
          label="Features & Capabilities Registry"
          rows={filteredItems as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: 'code',
              label: 'Feature Code',
              render: (r) => (
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1e293b' }}>
                  {String(r.code)}
                </span>
              ),
            },
            {
              key: 'name',
              label: 'Name & Purpose',
              render: (r) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{String(r.name)}</div>
                  {Boolean(r.description) && (
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.15rem' }}>
                      {String(r.description)}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'scopePolicy',
              label: 'Scope Policy',
              render: (r) => (
                <Pill tone={r.scopePolicy === 'GLOBAL' ? 'good' : 'warn'}>
                  {String(r.scopePolicy)}
                </Pill>
              ),
            },
            {
              key: 'capabilities',
              label: 'Provided Capabilities',
              render: (r) => {
                const caps = Array.isArray(r.capabilities) ? r.capabilities : [];
                return (
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {caps.length === 0 ? (
                      <span className="muted">—</span>
                    ) : (
                      caps.map((c: string) => (
                        <span
                          key={c}
                          style={{
                            background: '#f1f5f9',
                            color: '#334155',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                          }}
                        >
                          {c}
                        </span>
                      ))
                    )}
                  </div>
                );
              },
            },
            {
              key: 'status',
              label: 'Status',
              render: (r) => (
                <Pill tone={r.status === 'Active' ? 'good' : r.status === 'Beta' ? 'warn' : 'bad'}>
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

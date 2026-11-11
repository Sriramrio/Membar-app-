import { useMemo, useState, useEffect } from 'react';
import { PageHeader, Card, Loading, ErrorNotice, DataTable, Pill } from '@/components/Ui';
import { usePlatformQuery } from '@/query/usePlatformQuery';
import { QUERY_IDS } from '@/contracts/catalogue';
import { chapterWorkflowApi, type ChapterDto } from '@/services/chapterWorkflowApi';
import type { ConfigurationProfile, EffectiveConfigurationProfileResult } from '@/contracts/platform';

interface ProfilesPage {
  items: ConfigurationProfile[];
}

export function ConfigurationProfilesPage() {
  const [scopeId, setScopeId] = useState('OU-CH-CENTRAL');
  const [chapters, setChapters] = useState<ChapterDto[]>([]);

  // Fetch registered chapters from API for authentic scope evaluation
  useEffect(() => {
    chapterWorkflowApi.getChapters()
      .then((chs) => setChapters(chs))
      .catch(() => {});
  }, []);

  const scopes = useMemo(() => {
    const list = [
      { id: 'OU-CH-CENTRAL', label: 'Central Platform (National Governance Baseline)' },
    ];
    chapters.forEach((c) => {
      list.push({
        id: c.id,
        label: `${c.name} (${c.code || 'Chapter'})`,
      });
    });
    return list;
  }, [chapters]);

  const list = usePlatformQuery<ProfilesPage>({
    queryId: QUERY_IDS.configurationProfileList,
    pagination: { pageSize: 50 },
  });

  const request = useMemo(
    () => ({
      queryId: QUERY_IDS.effectiveConfigurationProfile,
      parameters: { scopeId },
    }),
    [scopeId]
  );

  const effective = usePlatformQuery<EffectiveConfigurationProfileResult>(request);

  const profilesCount = list.data?.items?.length ?? 0;
  const activeProfiles = list.data?.items?.filter((x) => x.status === 'Active')?.length ?? 0;

  return (
    <div className="stack">
      <PageHeader
        title="Configuration Profiles"
        description="Reusable, versioned configuration bundles assigned to organisation scopes. Profiles eliminate repetitive local overrides while preserving explicit traceability."
      />

      <div className="grid cols-3">
        <Card>
          <div className="metric">
            <span className="value">{profilesCount}</span>
            <span className="label">Registered Profiles</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value">{activeProfiles}</span>
            <span className="label">Active In Production</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value">{scopes.length}</span>
            <span className="label">Evaluated Scopes</span>
          </div>
        </Card>
      </div>

      <Card>
        <div className="toolbar" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <label className="field" style={{ flex: 1 }}>
            <span className="label" style={{ fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>
              Evaluate profile for scope
            </span>
            <select
              className="select"
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              {scopes.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {effective.loading ? (
          <Loading label="Resolving effective profile from control plane…" />
        ) : effective.error ? (
          <ErrorNotice error={effective.error} onRetry={effective.refresh} />
        ) : effective.data ? (
          <div className="stack" style={{ gap: '1rem' }}>
            <div className="row" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Pill tone="good">{effective.data.profile?.name ?? 'No profile'}</Pill>
              <span className="muted">
                {effective.data.assignment?.status ?? 'Unassigned'} · evaluated{' '}
                {effective.data.evaluatedAt
                  ? new Date(effective.data.evaluatedAt).toLocaleString()
                  : 'N/A'}
              </span>
            </div>

            <DataTable
              label="Resolved Effective Parameters"
              rows={(effective.data.resolvedValues ?? []) as unknown as Record<string, unknown>[]}
              columns={[
                { key: 'key', label: 'Configuration key' },
                { key: 'value', label: 'Effective value' },
                {
                  key: 'source',
                  label: 'Source',
                  render: (r) => (
                    <Pill tone={r.source === 'LOCAL_OVERRIDE' ? 'warn' : 'good'}>
                      {String(r.source)}
                    </Pill>
                  ),
                },
                { key: 'sourceId', label: 'Source ID' },
              ]}
            />

            {(effective.data.conflicts ?? []).length > 0 && (
              <div className="notice error">
                {(effective.data.conflicts ?? []).length} profile conflict(s) require attention.
              </div>
            )}
            {(effective.data.shadowed ?? []).length > 0 && (
              <div className="notice">
                {(effective.data.shadowed ?? []).length} value(s) are shadowed by a more specific local chapter override.
              </div>
            )}
          </div>
        ) : null}
      </Card>

      <Card>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Catalog of Governed Profiles
        </h3>
        {list.loading ? (
          <Loading />
        ) : list.error ? (
          <ErrorNotice error={list.error} onRetry={list.refresh} />
        ) : (
          <DataTable
            label="Profiles List"
            rows={(list.data?.items ?? []) as unknown as Record<string, unknown>[]}
            columns={[
              { key: 'code', label: 'Code' },
              { key: 'name', label: 'Profile' },
              {
                key: 'applicableUnitTypes',
                label: 'Applicable unit types',
                render: (r) =>
                  Array.isArray(r.applicableUnitTypes) ? r.applicableUnitTypes.join(', ') : '—',
              },
              {
                key: 'status',
                label: 'Status',
                render: (r) => (
                  <Pill tone={r.status === 'Active' ? 'good' : 'warn'}>
                    {String(r.status)}
                  </Pill>
                ),
              },
              {
                key: 'effectiveFrom',
                label: 'Effective from',
                render: (r) => (r.effectiveFrom ? new Date(String(r.effectiveFrom)).toLocaleDateString() : '—'),
              },
              { key: 'version', label: 'Version' },
            ]}
          />
        )}
      </Card>
    </div>
  );
}

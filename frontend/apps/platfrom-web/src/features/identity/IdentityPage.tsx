import { useMemo, useState } from 'react';
import { PageHeader, Card, Loading, ErrorNotice, DataTable, Pill } from '@/components/Ui';
import { usePlatformQuery } from '@/query/usePlatformQuery';
import { QUERY_IDS } from '@/contracts/catalogue';

interface Paged {
  items: IdentityRecord[];
}

interface IdentityRecord {
  id: string;
  name: string;
  email?: string;
  status: string;
  mfaRequired: boolean;
  version: number;
}

export function IdentityPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Active' | 'Suspended'>('ALL');

  const q = usePlatformQuery<Paged>({
    queryId: QUERY_IDS.identityList,
    pagination: { pageSize: 100 },
  });

  const allItems = q.data?.items ?? [];

  const filteredItems = useMemo(() => {
    return allItems.filter((user) => {
      const matchesSearch =
        !search.trim() ||
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(search.toLowerCase())) ||
        user.id.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = filterStatus === 'ALL' || user.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [allItems, search, filterStatus]);

  const activeCount = allItems.filter((u) => u.status === 'Active').length;
  const suspendedCount = allItems.filter((u) => u.status !== 'Active').length;

  return (
    <div className="stack">
      <PageHeader
        title="Identity Administration"
        description="Technical user account and authentication identity administration. Governs active account credentials, lockouts and security policies."
      />

      {/* KPI Cards */}
      <div className="grid cols-3">
        <Card>
          <div className="metric">
            <span className="value">{allItems.length}</span>
            <span className="label">Registered Identities</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#16a34a' }}>{activeCount}</span>
            <span className="label">Active User Accounts</span>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <span className="value" style={{ color: '#dc2626' }}>{suspendedCount}</span>
            <span className="label">Suspended / Inactive</span>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="search"
              placeholder="Search user by name, email or UUID…"
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
              className={`btn ${filterStatus === 'ALL' ? 'primary' : 'secondary'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              onClick={() => setFilterStatus('ALL')}
            >
              All Users ({allItems.length})
            </button>
            <button
              type="button"
              className={`btn ${filterStatus === 'Active' ? 'primary' : 'secondary'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              onClick={() => setFilterStatus('Active')}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              className={`btn ${filterStatus === 'Suspended' ? 'primary' : 'secondary'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              onClick={() => setFilterStatus('Suspended')}
            >
              Suspended ({suspendedCount})
            </button>
          </div>
        </div>
      </Card>

      {q.loading ? (
        <Loading label="Loading identities from database…" />
      ) : q.error ? (
        <ErrorNotice error={q.error} onRetry={q.refresh} />
      ) : (
        <DataTable
          rows={filteredItems as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: 'name',
              label: 'Account Name',
              render: (r) => (
                <div>
                  <strong>{String(r.name)}</strong>
                  {Boolean(r.email) && (
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{String(r.email)}</div>
                  )}
                </div>
              ),
            },
            {
              key: 'id',
              label: 'Identity Identifier',
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
              key: 'mfaRequired',
              label: 'MFA Enforced',
              render: (r) => (r.mfaRequired ? 'Required' : 'Standard'),
            },
            { key: 'version', label: 'Version' },
          ]}
        />
      )}
    </div>
  );
}

import { useMemo, useState, type ReactNode } from 'react';
import { LucideIcon } from '@/components/LucideIcon';

type Row = Record<string, unknown>;
export interface EnterpriseColumn {
  key: string;
  label: string;
  render?: (row: Row) => ReactNode;
  sortable?: boolean;
  hideBelow?: 'sm' | 'md' | 'lg';
  searchable?: boolean;
  exportable?: boolean;
}
export interface EnterpriseDataTableProps {
  rows: Row[];
  columns: EnterpriseColumn[];
  label?: string;
  selectedId?: string;
  pageSize?: number;
  compact?: boolean;
  stickyHeader?: boolean;
  getRowId?: (row: Row, index: number) => string;
  onRowClick?: (row: Row) => void;
  searchable?: boolean;
  exportCsv?: boolean;
  pageSizes?: number[];
}

function valueFor(row: Row, key: string) {
  const v = row[key];
  return v === null || v === undefined ? '' : String(v);
}

function csvEscape(v: string) {
  return /[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v;
}

function renderCellContent(c: EnterpriseColumn, r: Row): ReactNode {
  if (c.render) return c.render(r);
  const raw = r[c.key];
  if (raw === null || raw === undefined || raw === '') {
    return <span className="cell-empty">—</span>;
  }

  const valStr = String(raw).trim();
  const keyLower = c.key.toLowerCase();
  const labelLower = c.label.toLowerCase();

  // 1. Status Column or Status-like value
  if (
    keyLower.includes('status') ||
    keyLower === 'result' ||
    keyLower === 'state' ||
    keyLower === 'decision' ||
    labelLower.includes('status')
  ) {
    const s = valStr.toUpperCase();
    if (
      ['ACTIVE', 'RUNNING', 'COMPLETED', 'PUBLISHED', 'SUCCESS', 'ALLOW', 'AVAILABLE', 'VERIFIED', 'CONFIGURED', 'HEALTHY', 'PASS'].some(
        (x) => s.includes(x)
      )
    ) {
      return (
        <span className="pill status-pill status-good">
          <span className="status-dot good" />
          {valStr}
        </span>
      );
    }
    if (
      ['FAILED', 'ERROR', 'DENY', 'DENIED', 'REVOKED', 'QUARANTINE', 'SUSPENDED', 'BLOCKED', 'FAIL'].some((x) =>
        s.includes(x)
      )
    ) {
      return (
        <span className="pill status-pill status-bad">
          <span className="status-dot bad" />
          {valStr}
        </span>
      );
    }
    if (
      [
        'PENDING',
        'DRAFT',
        'REVIEW',
        'IN_REVIEW',
        'RETRYING',
        'REQUESTED',
        'WAITING',
        'ACCEPTED',
        'ASSIGNED',
        'IN PROGRESS'
      ].some((x) => s.includes(x))
    ) {
      return (
        <span className="pill status-pill status-warn">
          <span className="status-dot warn" />
          {valStr}
        </span>
      );
    }
    return <span className="pill status-pill">{valStr}</span>;
  }

  // 2. Progress percentage
  if (keyLower.includes('progress') || labelLower.includes('progress')) {
    const num = Number(valStr.replace('%', ''));
    if (!isNaN(num)) {
      const pct = Math.min(100, Math.max(0, num));
      const tone = pct === 100 ? '#16a34a' : pct > 40 ? '#2563eb' : '#f59e0b';
      return (
        <div className="table-progress-wrap" title={`${pct}% complete`}>
          <div className="table-progress-bar">
            <div className="table-progress-fill" style={{ width: `${pct}%`, backgroundColor: tone }} />
          </div>
          <span className="table-progress-text">{pct}%</span>
        </div>
      );
    }
  }

  // 3. Technical identifier / code / correlation ID / command ID / scope
  if (
    (keyLower.includes('code') ||
      keyLower.includes('command') ||
      keyLower.includes('correlation') ||
      keyLower === 'id' ||
      keyLower === 'job') &&
    !valStr.includes(' ') &&
    valStr.length >= 3
  ) {
    return <span className="code-chip">{valStr}</span>;
  }

  // 4. Boolean values
  if (typeof raw === 'boolean' || valStr === 'true' || valStr === 'false') {
    const isTrue = raw === true || valStr === 'true';
    return (
      <span className={`pill status-pill ${isTrue ? 'status-good' : ''}`}>
        <span className={`status-dot ${isTrue ? 'good' : 'warn'}`} />
        {isTrue ? 'Yes' : 'No'}
      </span>
    );
  }

  return valStr;
}

export function EnterpriseDataTable({
  rows,
  columns,
  label = 'Results',
  selectedId,
  pageSize = 20,
  compact = false,
  stickyHeader = true,
  getRowId,
  onRowClick,
  searchable = true,
  exportCsv = true,
  pageSizes = [10, 20, 50, 100]
}: EnterpriseDataTableProps) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const [sortKey, setSortKey] = useState<string>('');
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [size, setSize] = useState(pageSize);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return safeRows;
    const searchableColumns = columns.filter((c) => c.searchable !== false);
    return safeRows.filter((r) =>
      searchableColumns.some((c) => valueFor(r, c.key).toLocaleLowerCase().includes(needle))
    );
  }, [safeRows, columns, query]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = valueFor(a, sortKey);
      const bv = valueFor(b, sortKey);
      const n = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
      return direction === 'asc' ? n : -n;
    });
  }, [filtered, sortKey, direction]);

  const pages = Math.max(1, Math.ceil(sorted.length / size));
  const safePage = Math.min(page, pages);
  const visible = sorted.slice((safePage - 1) * size, safePage * size);

  function sort(c: EnterpriseColumn) {
    if (c.sortable === false) return;
    if (sortKey === c.key) setDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(c.key);
      setDirection('asc');
    }
    setPage(1);
  }

  function downloadCsv() {
    const cols = columns.filter((c) => c.exportable !== false);
    const csv = [
      cols.map((c) => csvEscape(c.label)).join(','),
      ...sorted.map((r) => cols.map((c) => csvEscape(valueFor(r, c.key))).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${label.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!safeRows.length)
    return (
      <div className="card" role="status">
        <strong>No records</strong>
        <p className="muted">No records match the current query.</p>
      </div>
    );

  return (
    <section className={`enterprise-table${compact ? ' compact' : ''}`} aria-label={label}>
      <div className="enterprise-table-toolbar">
        <div className="enterprise-table-tools">
          {searchable ? (
            <label className="table-search">
              <span className="sr-only">Search {label}</span>
              <LucideIcon name="search" size={16} />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={`Filter ${label.toLocaleLowerCase()}…`}
                aria-label={`Filter ${label}`}
              />
            </label>
          ) : null}
          <label className="page-size">
            <span className="sr-only">Rows per page</span>
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Rows per page"
            >
              {pageSizes.map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </label>
          {exportCsv ? (
            <button type="button" className="btn secondary compact-btn" onClick={downloadCsv}>
              <LucideIcon name="download" size={16} />
              Export CSV
            </button>
          ) : null}
        </div>
        <div className="enterprise-table-meta">
          <span className="muted">
            {sorted.length.toLocaleString()} of {rows.length.toLocaleString()} record
            {rows.length === 1 ? '' : 's'} · page {safePage} of {pages}
          </span>
          <div className="row" aria-label="Table pagination">
            <button
              type="button"
              className="icon-btn"
              aria-label="Previous page"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <LucideIcon name="chevron-left" />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Next page"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={safePage >= pages}
            >
              <LucideIcon name="chevron-right" />
            </button>
          </div>
        </div>
      </div>
      {!sorted.length ? (
        <div className="card" role="status">
          <strong>No matching records</strong>
          <p className="muted">Clear or change the local table filter.</p>
        </div>
      ) : (
        <div className="table-wrap" role="region" aria-label={label} tabIndex={0}>
          <table className={`table${stickyHeader ? ' sticky-head' : ''}`}>
            <caption className="sr-only">{label}</caption>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th scope="col" key={c.key} className={c.hideBelow ? `hide-${c.hideBelow}` : ''}>
                    <button
                      type="button"
                      className="sort-head"
                      onClick={() => sort(c)}
                      disabled={c.sortable === false}
                      aria-sort={
                        sortKey === c.key ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'
                      }
                    >
                      {c.label}
                      {sortKey === c.key ? (
                        <LucideIcon name={direction === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} />
                      ) : null}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => {
                const globalIndex = (safePage - 1) * size + i;
                const rid = getRowId ? getRowId(r, globalIndex) : String(r.id ?? globalIndex);
                const selected = Boolean(selectedId && rid === String(selectedId));
                return (
                  <tr
                    key={rid}
                    className={`${selected ? 'selected-row ' : ''}${onRowClick ? 'clickable-row' : ''}`}
                    onClick={onRowClick ? () => onRowClick(r) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onRowClick(r);
                            }
                          }
                        : undefined
                    }
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={c.hideBelow ? `hide-${c.hideBelow}` : ''} data-label={c.label}>
                        {renderCellContent(c, r)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { useOrg } from '@/state/OrgStore';
import { navGroupsFor } from '@/config/navigation';

const buildDestination = (to: string) => to;

export default function MorePage() {
  const { scope, activeAssignment, permissions } = useOrg();
  const groups = navGroupsFor(scope.level, activeAssignment?.roleType, permissions);

  return (
    <>
      <PageHeader title="More">
        Complete permitted capability map. Role-priority items are surfaced first; scope and permission restrictions remain fail-closed and backend-authoritative.
      </PageHeader>
      {groups.map((g) => (
        <section key={g.title}>
          <div className="section-title flex items-center justify-between mt-6 mb-3">
            <h2 className="text-base font-bold text-slate-900">{g.title}</h2>
          </div>
          <div className="more-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {g.items.map((i) => (
              <Link
                key={i.to}
                to={buildDestination(i.to)}
                className={`p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs font-semibold text-xs text-slate-800 hover:border-slate-300 hover:shadow-xs min-h-[44px] flex items-center justify-between transition-all ${
                  i.locked ? 'locked opacity-60 bg-slate-50' : ''
                }`}
              >
                {i.label}
                {i.locked ? ` · needs ${i.minimumLevel?.toLowerCase()}-level scope` : ''}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

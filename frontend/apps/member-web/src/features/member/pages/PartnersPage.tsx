import { useMemo } from 'react';
import { Building2, GraduationCap, Landmark, ShieldCheck, Truck, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, PageHead, Tip } from '@/features/network/components/NetworkUI';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { QueryError, QueryLoading } from '@/components/data/QueryState';

const pathways = [
  { title: 'Finance & Growth', desc: 'Find network businesses and support pathways related to funding, working capital and growth readiness.', query: 'finance', Icon: Landmark },
  { title: 'Technology & Digital', desc: 'Discover technology providers, automation partners and digital transformation capabilities.', query: 'technology', Icon: Workflow },
  { title: 'Skilling & Capability', desc: 'Find training, workforce and leadership-development capability across the network.', query: 'training', Icon: GraduationCap },
  { title: 'Quality & Certification', desc: 'Discover quality-system, testing, certification and compliance capabilities.', query: 'quality', Icon: ShieldCheck },
  { title: 'Logistics & Export', desc: 'Find logistics, export-readiness and market-access capabilities.', query: 'logistics', Icon: Truck },
  { title: 'Industry Collaboration', desc: 'Explore businesses and members for cross-industry collaboration and association relationships.', query: 'association', Icon: Building2 },
];

export default function PartnersPage() {
  const { go } = useMemberNavigation();

  const queryRequest = useMemo(
    () => ({
      queryId: 'member.partners.list',
      domain: 'member' as const,
      pagination: { pageSize: 50 },
    }),
    []
  );

  const query = useDomainCursorPage<any>(queryRequest, pathways, []);
  useRealtimeRefresh(['partner.*'], query.reload);

  const serverPartners = query.page?.items?.map((item: any) => ({
    title: item.name ?? item.title,
    desc: item.description ?? item.desc,
    query: item.category ?? item.query ?? (item.name ?? '').toLowerCase(),
    Icon: Landmark,
  }));

  const items = serverPartners?.length ? serverPartners : pathways;

  return (
    <div>
      <PageHead
        title="Partner Ecosystem"
        description="Use structured network discovery to find trusted partners and Discover in network."
      />

      {query.loading && !query.page ? (
        <div className="mt-5">
          <QueryLoading label="Loading partners…" />
        </div>
      ) : query.error ? (
        <div className="mt-5">
          <QueryError error={query.error} onRetry={query.reload} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(({ title, desc, query, Icon }: any) => (
            <Card key={title} className="flex h-full flex-col">
              <span className="grid size-12 place-items-center rounded-xl bg-sky-50 text-sky-800">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-4 text-lg font-black">{title}</h2>
              <p className="mt-2 flex-1 text-base leading-7 text-slate-600">{desc}</p>
              <Button
                className="mt-4"
                variant="secondary"
                onClick={() => go(`/app/directory?q=${encodeURIComponent(query)}`, { label: 'Partners' })}
              >
                Discover in network
              </Button>
            </Card>
          ))}
        </div>
      )}

      {!items.length && !query.loading && (
        <div className="mt-5">
          <EmptyState title="No partners available" body="Partner information will appear here." />
        </div>
      )}

      <div className="mt-6">
        <Tip>
          Partner discovery follows normal member/business visibility and privacy policies. SETHU does not invent partner organisations that are not present in the governed network data.
        </Tip>
      </div>
    </div>
  );
}

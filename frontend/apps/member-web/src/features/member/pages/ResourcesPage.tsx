import { useMemo, useState } from 'react';
import { ChevronDown, Download, FileCheck2, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, PageHead, SearchField, StatusPill } from '@/features/network/components/NetworkUI';
import { toast } from '@/components/ui/Toast';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { QueryError, QueryLoading } from '@/components/data/QueryState';

const resources = [
  {
    title: 'Opportunity Response Checklist',
    type: 'Checklist',
    topic: 'Business',
    desc: 'A practical review before responding to a buyer or collaboration requirement.',
    sections: [
      'Confirm the requirement and closing date',
      'Validate your capability and capacity',
      'Reference relevant certifications',
      'State lead time and commercial assumptions',
      'Review before final submission',
    ],
  },
  {
    title: 'Business Profile Completeness Guide',
    type: 'Guide',
    topic: 'Profile',
    desc: 'Structure products, services, capabilities and trust evidence so members can understand your business quickly.',
    sections: [
      'Company overview',
      'Products and services',
      'Core capabilities and processes',
      'Industries served',
      'Certifications and verified representatives',
    ],
  },
  {
    title: 'One-to-One Meeting Preparation',
    type: 'Template',
    topic: 'Network',
    desc: 'Prepare a focused agenda, discussion outcome and next step for business meetings.',
    sections: [
      'Business purpose',
      'What you need to understand',
      'What you can offer',
      'Decisions made',
      'Follow-up owner and date',
    ],
  },
  {
    title: 'Business Reference Follow-up',
    type: 'Checklist',
    topic: 'Network',
    desc: 'Use consent-aware references and record the follow-up without exposing confidential information.',
    sections: [
      'Confirm consent',
      'State the business purpose',
      'Identify the relevant business',
      'Agree the next contact',
      'Record progress or closure',
    ],
  },
  {
    title: 'Export Readiness Starter Pack',
    type: 'Guide',
    topic: 'Growth',
    desc: 'A starter framework for members exploring export opportunities and partner discussions.',
    sections: [
      'Target market',
      'Product and certification readiness',
      'Commercial documentation',
      'Logistics and payment terms',
      'Partner and buyer follow-up',
    ],
  },
];

export default function ResourcesPage() {
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState('All');
  const [downloadStatus, setDownloadStatus] = useState('');

  const localRows = useMemo(
    () =>
      resources.filter(
        (r) =>
          (topic === 'All' || r.topic === topic) &&
          (!q || `${r.title} ${r.type} ${r.topic} ${r.desc}`.toLowerCase().includes(q.toLowerCase()))
      ),
    [q, topic]
  );

  const queryRequest = useMemo(
    () => ({
      queryId: 'member.resources.list',
      domain: 'member' as const,
      parameters: { topic: topic === 'All' ? undefined : topic, search: q || undefined },
      pagination: { pageSize: 50 },
    }),
    [topic, q]
  );

  const query = useDomainCursorPage<any>(queryRequest, localRows, [topic, q]);
  useRealtimeRefresh(['resource.*'], query.reload);

  const serverResources = query.page?.items?.map((item: any) => ({
    title: item.title,
    type: item.category ?? 'Guide',
    topic: item.topic ?? 'Business',
    desc: item.description ?? '',
    sections: item.sections ?? ['Review document', 'Apply guidelines'],
  }));

  const rows = serverResources ?? localRows;
  const topics = ['All', ...new Set(rows.map((r: any) => r.topic))];

  const download=(r:typeof resources[number])=>{
    setDownloadStatus('');
    try {
    const content=[r.title,'='.repeat(r.title.length),'',`Type: ${r.type}`,`Topic: ${r.topic}`,'',r.desc,'','Practical steps:',...r.sections.map((s,i)=>`${i+1}. ${s}`),'','SETHU Business Network Resource'].join('\n');
    const blob=new Blob([content],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=`${r.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    const status=`${r.title} downloaded.`;
    setDownloadStatus(status);
    toast.success(status, 'Resource Downloaded');
    } catch {
      setDownloadStatus(`${r.title} could not be downloaded. Please try again.`);
      toast.error(`${r.title} could not be downloaded.`, 'Download Failed');
    }
  };

  return <div>
    <PageHead title="Resources" description="Practical working guides and checklists that support the business-network journeys available in SETHU."/>
    {downloadStatus&&<div role="status" aria-live="polite" className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">{downloadStatus}</div>}
    
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
      <div className="flex-1">
        <SearchField value={q} onChange={setQ} placeholder="Search guides, templates, and checklists…" label="Search resources"/>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative min-w-[200px]">
          <Filter className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <select
            aria-label="Filter resources by topic"
            className="min-h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-10 pr-9 text-base font-semibold text-slate-700 outline-none transition focus:border-sky-600 focus:ring-3 focus:ring-sky-100 cursor-pointer"
            value={topic}
            onChange={e=>setTopic(e.target.value)}
          >
            {topics.map(t=><option key={t} value={t}>{t==='All'?'All Topics':t}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        </div>
        {(topic!=='All'||q)&&(
          <Button variant="ghost" onClick={()=>{setTopic('All');setQ('');}} className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50">
            Clear
          </Button>
        )}
      </div>
    </div>

    {query.loading && !query.page ? (
      <div className="mt-5">
        <QueryLoading label="Loading resources…" />
      </div>
    ) : query.error ? (
      <div className="mt-5">
        <QueryError error={query.error} onRetry={query.reload} />
      </div>
    ) : (
      <div className="grid gap-3">
        {rows.map(r=>(
        <Card key={r.title} className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-800">
            <FileCheck2 className="size-6"/>
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">{r.title}</h2>
              <StatusPill tone="info">{r.type}</StatusPill>
              <StatusPill>{r.topic}</StatusPill>
            </div>
            <p className="mt-1.5 text-base leading-7 text-slate-600">{r.desc}</p>
          </div>
          <Button variant="secondary" onClick={()=>download(r)} className="shrink-0">
            <Download className="size-4"/>Download
          </Button>
        </Card>
      ))}
      {!rows.length && !query.loading && <EmptyState title="No resources found" body="Try another search term or topic filter." action={<Button variant="secondary" onClick={()=>{setTopic('All');setQ('');}}>Show all resources</Button>}/>}
    </div>
    )}
  </div>;
}

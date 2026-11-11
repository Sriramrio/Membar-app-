import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/common/Input';
import { PageHead } from '@/features/network/components/NetworkUI';
import { visitorInvitationsApi, type VisitorInvitation, type InvitationSummary, type OfficialConversionPage } from '@/services/api/visitorInvitationsApi';

const emptyForm = { firstName: '', lastName: '', companyName: '', email: '', mobile: '' };
const newKey = () => globalThis.crypto?.randomUUID?.() ?? (() => { throw new Error('Secure browser identifier generation is unavailable.'); })();
function errorText(error: unknown): string { return error instanceof Error ? error.message : 'Unable to complete the request.'; }

export default function MemberVisitorInvitationsPage() {
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState<VisitorInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState<'month'|'quarter'|'halfYear'|'year'>('month');
  const [summary, setSummary] = useState<InvitationSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');
  const [conversionPage, setConversionPage] = useState(1);
  const [conversions, setConversions] = useState<OfficialConversionPage | null>(null);
  const [conversionError, setConversionError] = useState('');
  const [conversionLoading, setConversionLoading] = useState(true);
  const key = useRef('');
  const lock = useRef(false);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError('');
    try { const result = await visitorInvitationsApi.list(page, signal); if (!signal?.aborted) setItems(result.items ?? []); }
    catch (e) { if (!signal?.aborted) setError(errorText(e)); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [page]);
  useEffect(() => { const controller = new AbortController(); void refresh(controller.signal); return () => controller.abort(); }, [refresh]);
  const refreshSummary = useCallback(async (signal?: AbortSignal) => {
    setSummaryLoading(true); setSummaryError('');
    try {
      const start = new Date();
      start.setUTCHours(0, 0, 0, 0);
      if (period === 'month') start.setUTCDate(1);
      else if (period === 'quarter') { start.setUTCDate(1); start.setUTCMonth(Math.floor(start.getUTCMonth()/3)*3); }
      else if (period === 'halfYear') { start.setUTCDate(1); start.setUTCMonth(start.getUTCMonth()<6?0:6); }
      else { start.setUTCDate(1); start.setUTCMonth(0); }
      const end = new Date(); // exclusive current instant, UTC activity-date basis
      const result = await visitorInvitationsApi.summary(start.toISOString(), end.toISOString(), signal);
      if (!signal?.aborted) setSummary(result);
    } catch (e) { if (!signal?.aborted) {setSummary(null);setSummaryError(errorText(e));} }
    finally { if (!signal?.aborted) setSummaryLoading(false); }
  }, [period]);
  useEffect(() => { const controller = new AbortController(); void refreshSummary(controller.signal); return () => controller.abort(); }, [refreshSummary]);
  useEffect(() => {
    const controller = new AbortController();
    setConversionLoading(true); setConversionError(''); setConversions(null);
    const now = new Date();
    const from = new Date(Date.UTC(now.getUTCFullYear(),0,1)).toISOString();
    void visitorInvitationsApi.conversions(from,now.toISOString(),conversionPage,controller.signal)
      .then(result => { if (!controller.signal.aborted) setConversions(result); })
      .catch(e => { if (!controller.signal.aborted) setConversionError(errorText(e)); })
      .finally(() => { if (!controller.signal.aborted) setConversionLoading(false); });
    return () => controller.abort();
  }, [conversionPage]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    const values = Object.fromEntries(Object.entries(form).map(([k,v])=>[k,v.trim()]));
    if (Object.values(values).some(v=>!v)) { setError('All five Athithi fields are required.'); return; }
    if (!key.current) { try { key.current = newKey(); } catch (e) { setError(errorText(e)); return; } }
    lock.current = true; setSubmitting(true); setNotice(''); setError('');
    try {
      const response = await visitorInvitationsApi.create({ ...form, ...values, idempotencyKey: key.current });
      setNotice(`Invitation ${response.reference} recorded (${response.status}). Email delivery is not yet enabled.`);
      setForm(emptyForm); key.current = ''; setPage(1); await Promise.all([refresh(), refreshSummary()]);
    } catch (e) { setError(errorText(e)); }
    finally { lock.current = false; setSubmitting(false); }
  }
  async function cancelInvitation(item: VisitorInvitation) {
    if (lock.current || cancellingId || item.status !== 'DeliveryPending') return;
    setCancellingId(item.id); setError(''); setNotice('');
    try {
      await visitorInvitationsApi.cancel(item.id);
      setNotice(`Invitation ${item.reference} cancelled.`);
      await Promise.all([refresh(), refreshSummary()]);
    } catch (e) { setError(errorText(e)); }
    finally { setCancellingId(null); }
  }
  function change(field: keyof typeof emptyForm, value: string) { setForm(v=>({...v,[field]:value})); key.current=''; }
  return <div className="space-y-5">
    <PageHead title="Invite an Athithi" description="Record invitations with your verified Member and Parivar reference. Delivery and registration are tracked separately." />
    <Card><h2 className="mb-4 text-lg font-bold">New Athithi invitation</h2>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Input required label="First name" maxLength={100} value={form.firstName} onChange={e=>change('firstName',e.target.value)} />
        <Input required label="Last name" maxLength={100} value={form.lastName} onChange={e=>change('lastName',e.target.value)} />
        <Input required label="Company name" maxLength={200} value={form.companyName} onChange={e=>change('companyName',e.target.value)} />
        <Input required label="Email" type="email" maxLength={254} value={form.email} onChange={e=>change('email',e.target.value)} />
        <Input required label="Mobile number" maxLength={32} value={form.mobile} onChange={e=>change('mobile',e.target.value)} />
        <div className="flex items-end"><Button disabled={submitting} type="submit">{submitting ? 'Saving…' : 'Record invitation'}</Button></div>
      </form>
      <p className="mt-3 text-sm text-slate-600">Please invite only people you have a legitimate reason to contact. Recording an invitation does not send email until delivery is enabled.</p>
    </Card>
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Invitation activity</h2>
        <label className="text-sm">UTC reporting period{' '}
          <select className="rounded-md border border-slate-300 p-2" value={period}
            onChange={e => setPeriod(e.target.value as typeof period)}>
            <option value="month">Current month</option><option value="quarter">Current quarter</option>
            <option value="halfYear">Current half-year</option><option value="year">Current year</option>
          </select>
        </label>
      </div>
      {summaryLoading ? <p>Loading invitation totals…</p> : summaryError ?
        <p role="alert" className="text-red-800">Unable to load totals: {summaryError}</p> : summary ?
        <div className="grid gap-3 sm:grid-cols-3">
          <div><div className="text-2xl font-bold">{summary.invitationsCreated}</div><div>Invitations recorded</div></div>
          <div><div className="text-2xl font-bold">{summary.deliveryPending}</div><div>Delivery pending</div></div>
          <div><div className="text-2xl font-bold">{summary.cancelled}</div><div>Cancelled</div></div>
        </div> : <p>No reporting data available.</p>}
      <p className="mt-2 text-xs text-slate-600">Totals are fetched from PostgreSQL via the authenticated API. Registration, attendance and conversion figures are unavailable until their canonical workflows are connected.</p>
    </Card>
    <Card>
      <h2 className="mb-2 text-lg font-bold">Official membership conversions</h2>
      <p className="text-sm text-slate-600">Current calendar year (UTC), grouped by canonical activation date. Only official credits are shown; invitation and application counts are separate.</p>
      {conversionLoading ? <p>Loading official conversions…</p> : conversionError ?
        <p role="alert" className="text-red-800">{conversionError}</p> : conversions ? <>
        <p className="my-2 font-semibold">{conversions.total} credited conversions in this reporting period</p>
        {conversions.items.length === 0 ? <p>No credited conversions on this page.</p> :
          <ul className="space-y-2">{conversions.items.map(item => <li key={item.id} className="rounded-md border p-2">
            Invitation {item.invitationId} · Activated {new Date(item.activatedAt).toLocaleDateString()}
          </li>)}</ul>}
        <div className="mt-3 flex items-center gap-3"><Button variant="secondary" disabled={conversionLoading || conversionPage === 1} onClick={() => setConversionPage(p=>Math.max(1,p-1))}>Previous</Button>
          <span>Page {conversionPage}</span><Button variant="secondary" disabled={conversionLoading || conversionPage * 10 >= conversions.total} onClick={() => setConversionPage(p=>p+1)}>Next</Button></div>
      </> : <p>Official conversion history unavailable.</p>}
    </Card>
    {error && <p role="alert" className="rounded-lg border border-red-200 p-3 text-red-800">{error}</p>}
    {notice && <p role="status" className="rounded-lg border border-sky-200 p-3 text-sky-900">{notice}</p>}
    <Card><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">My invitations</h2><Button variant="secondary" disabled={loading} onClick={()=>void refresh()}>Refresh</Button></div>
      {loading ? <p>Loading invitations…</p> : items.length===0 ? <p>No invitations found for this page.</p> :
      <div className="space-y-2">{items.map(item=><div key={item.id} className="rounded-lg border border-slate-200 p-3">
        <div className="font-semibold">{item.firstName} {item.lastName} — {item.companyName}</div>
        <div className="text-sm text-slate-600">{item.reference} · {item.status} · {new Date(item.createdAt).toLocaleDateString()}</div>
        {item.status === 'DeliveryPending' && <Button variant="secondary" disabled={!!cancellingId || submitting} onClick={()=>void cancelInvitation(item)}>{cancellingId === item.id ? 'Cancelling…' : 'Cancel invitation'}</Button>}
      </div>)}</div>}
      <div className="mt-4 flex gap-2"><Button variant="secondary" disabled={loading||page===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Previous</Button><span className="self-center">Page {page}</span><Button variant="secondary" disabled={loading||items.length<20} onClick={()=>setPage(p=>p+1)}>Next</Button></div>
    </Card>
  </div>;
}

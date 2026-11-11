import { useState, type FormEvent, type ChangeEvent } from 'react';

type Outcome = { accepted?: boolean; code?: string; linkId?: string; reconciliation?: string; registrationId?: string | null };

/** Explicit, evidence-backed crosswalk. Reviewer never selects a privileged actor identity. */
export function RegistrationReconciliationPanel() {
  const [registrationId, setRegistrationId] = useState('');
  const [intakeId, setIntakeId] = useState('');
  const [applicantUserId, setApplicantUserId] = useState('');
  const [evidenceReference, setEvidenceReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Outcome | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    setStatus(null);
    try {
      const response = await fetch('/api/v6/membership-intakes/reconciliation/verified-link', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ registrationId, intakeId, applicantUserId, evidenceReference })
      });
      const body: Outcome = await response.json().catch(() => ({}));
      if (!response.ok || !body.accepted) throw new Error(body.code || `Reconciliation rejected (${response.status})`);
      const confirmed = await fetch(`/api/v6/membership-intakes/reconciliation/intakes/${encodeURIComponent(intakeId)}/status`, {
        credentials: 'include', headers: { Accept: 'application/json', 'Cache-Control': 'no-store' }
      });
      if (!confirmed.ok) throw new Error('Submission may have committed, but independent status read failed. Inspect the server before retrying.');
      const verified: Outcome = await confirmed.json();
      if (verified.reconciliation !== 'VERIFIED_LINK' || verified.registrationId?.toLowerCase() !== registrationId.toLowerCase())
        throw new Error('Server state does not match the submitted crosswalk. Escalate for review.');
      setStatus(verified);
      setMessage('Registration and intake link confirmed by the authoritative service.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to confirm reconciliation. Inspect the server before retrying.');
    } finally { setBusy(false); }
  }

  return <section aria-label="Verified legacy registration reconciliation" className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
    <h2 className="font-semibold text-slate-900">Verified registration-to-intake reconciliation</h2>
    <p className="text-xs text-slate-600">For authorised reviewers only. Match verified identity and Chapter records before submitting. The backend checks tenure, scope, self-review and duplicate links.</p>
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      {([
        ['Registration ID', registrationId, setRegistrationId],
        ['Canonical intake ID', intakeId, setIntakeId],
        ['Verified applicant account ID', applicantUserId, setApplicantUserId],
        ['Evidence reference', evidenceReference, setEvidenceReference]
      ] as const).map(([label, value, setter]) =>
        <label key={label} className="text-xs font-semibold text-slate-700">{label}
          <input required value={value} onChange={(event: ChangeEvent<HTMLInputElement>) => setter(event.target.value)}
            maxLength={label === 'Evidence reference' ? 512 : 36}
            className="mt-1 block w-full rounded border border-slate-300 p-2 font-normal" />
        </label>)}
      <button type="submit" disabled={busy} className="rounded-lg bg-indigo-700 p-2 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">
        {busy ? 'Checking authoritative records…' : 'Link verified records'}
      </button>
    </form>
    {message && <p role="status" className="text-sm text-slate-800">{message}</p>}
    {status && <p className="text-xs text-slate-600">Authoritative status: {status.reconciliation}</p>}
  </section>;
}

import { useEffect, useState } from 'react';
import { Eye, ShieldCheck } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHead, Tip } from '@/features/network/components/NetworkUI';
import { activeMemberId, selectActiveMember } from '@/features/network/selectors';
import { savePreferences } from '@/features/network/networkSlice';
import type { FieldVisibility, MemberPreferences } from '@/features/network/types';
import { clearDirtyGuard, setDirtyGuard } from '@/features/member/navigation/memberNavigationSlice';

const fields = [['email', 'Email'], ['phone', 'Phone'], ['address', 'Address'], ['dob', 'Date of birth'], ['bio', 'Biography'], ['designation', 'Designation'], ['professionalTitle', 'Professional title']] as const;
const visibility: Array<{ value: FieldVisibility; label: string; help: string }> = [{ value: 'private', label: 'Private', help: 'Only you' }, { value: 'admin', label: 'Admin only', help: 'Authorised administration only' }, { value: 'connections', label: 'Connections', help: 'Accepted connections' }, { value: 'chapter', label: 'Parivar', help: 'Your Parivar and connections' }, { value: 'network', label: 'DBN Members', help: 'Authenticated network members' }, { value: 'public', label: 'Public', help: 'Public where the field is permitted' }];

export default function PrivacySettingsPage() {
  const dispatch = useAppDispatch(); const memberId = useAppSelector(activeMemberId); const activeMember = useAppSelector(selectActiveMember); const member = useAppSelector(s => s.network.members.find(m => m.id === memberId)) ?? activeMember!; const stored = useAppSelector(s => s.network.preferencesByMember[memberId]);
  const base: MemberPreferences = stored ?? { directoryVisibility: 'network', emailNotifications: true, eventReminders: true, opportunityAlerts: true, fieldVisibility: { email: 'connections', phone: 'connections', address: 'private', dob: 'private', bio: 'network', designation: 'network', professionalTitle: 'network' } };
  const [prefs, setPrefs] = useState<MemberPreferences>(base); const [saved, setSaved] = useState(false);
  useEffect(() => {
    let active = true;
    void import('@/services/api/apiClient').then(({ apiClient }) => apiClient.get<any>('/settings')).then(res => {
      if (!active || !res?.privacySettingsJson) return;
      try {
        const parsed = JSON.parse(res.privacySettingsJson);
        if (parsed && typeof parsed === 'object') {
          setPrefs(prev => ({ ...prev, ...parsed }));
          dispatch(savePreferences({ memberId, preferences: parsed }));
        }
      } catch (err) { void err; }
    }).catch(() => { });
    return () => { active = false; };
  }, [memberId, dispatch]);
  useEffect(() => setPrefs(base), [stored]);
  const dirty = JSON.stringify(prefs) !== JSON.stringify(base); useEffect(() => { dispatch(setDirtyGuard({ dirty, label: 'Privacy settings', canSaveDraft: false })); return () => { dispatch(clearDirtyGuard()) } }, [dirty, dispatch]);
  const fieldVisibility = { ...base.fieldVisibility, ...prefs.fieldVisibility };
  const update = (key: string, value: FieldVisibility) => { setSaved(false); setPrefs({ ...prefs, fieldVisibility: { ...fieldVisibility, [key]: value } }) };
  const save = async () => {
    dispatch(savePreferences({ memberId, preferences: prefs }));
    try {
      const { apiClient } = await import('@/services/api/apiClient');
      await apiClient.put('/settings', { privacySettingsJson: JSON.stringify(prefs) });
    } catch (err) { void err; }
    setSaved(true);
    dispatch(clearDirtyGuard());
  };
  const visible = (field: string, relationship: 'chapter' | 'connection') => { const v = (fieldVisibility as Record<string, FieldVisibility>)[field] ?? 'private'; return v === 'public' || v === 'network' || v === 'chapter' && relationship === 'chapter' || v === 'connections' && relationship === 'connection' };
  return <div><PageHead title="Privacy Settings" description="Control who can see each protected profile field." />
    {saved && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Privacy preferences saved.</div>}
    <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><Card><label className="grid gap-2 text-sm font-bold">Directory profile visibility<select className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 font-normal" value={prefs.directoryVisibility} onChange={e => { setSaved(false); setPrefs({ ...prefs, directoryVisibility: e.target.value as 'network' | 'connections' }) }}><option value="network">Discoverable to network members under directory policy</option><option value="connections">Connections only</option></select></label>
      <div className="mt-6 grid gap-3">{fields.map(([key, label]) => { const selected = (fieldVisibility as Record<string, FieldVisibility>)[key] ?? 'private'; const meaning = visibility.find(v => v.value === selected)?.help; return <div key={key} className="rounded-xl border border-slate-200 p-3 sm:grid sm:grid-cols-[1fr_1fr] sm:items-center sm:gap-4"><div><div className="font-black">{label}</div><div className="mt-1 text-sm text-slate-500">{meaning}</div></div><label className="mt-3 grid gap-1 text-sm font-bold sm:mt-0"><span className="sr-only">{label} visibility</span><select className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 font-normal" value={selected} onChange={e => update(key, e.target.value as FieldVisibility)}>{visibility.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}</select></label></div> })}</div>
      <Button className="mt-5" onClick={save} disabled={!dirty}><ShieldCheck className="size-4" />Save privacy settings</Button></Card>
      <div className="grid content-start gap-4"><Card><div className="flex items-center gap-2 font-black"><Eye className="size-4" />Same-chapter preview</div><div className="mt-3 grid gap-2 text-sm">{fields.map(([key, label]) => <div key={key} className="flex justify-between gap-3"><span>{label}</span><strong className={visible(key, 'chapter') ? 'text-emerald-700' : 'text-slate-400'}>{visible(key, 'chapter') ? 'Visible' : 'Hidden'}</strong></div>)}</div></Card><Card><div className="flex items-center gap-2 font-black"><Eye className="size-4" />Connected-member preview</div><div className="mt-3 grid gap-2 text-sm">{fields.map(([key, label]) => <div key={key} className="flex justify-between gap-3"><span>{label}</span><strong className={visible(key, 'connection') ? 'text-emerald-700' : 'text-slate-400'}>{visible(key, 'connection') ? 'Visible' : 'Hidden'}</strong></div>)}</div></Card><Tip>Business-directory visibility is evaluated separately from personal contact visibility. For example, a discoverable business can remain contact-restricted.</Tip><div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Preview identity: {member.name} · {member.chapter}</div></div></div></div>;
}

import { useEffect, useState } from 'react';
import { Bell, BriefcaseBusiness, CalendarDays, Network, ShieldCheck } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHead, Tip } from '@/features/network/components/NetworkUI';
import { activeMemberId } from '@/features/network/selectors';
import { savePreferences } from '@/features/network/networkSlice';
import type { MemberNotificationPreferences, MemberPreferences, NotificationPreferenceGroup } from '@/features/network/types';
import { clearDirtyGuard, setDirtyGuard } from '@/features/member/navigation/memberNavigationSlice';
import { notificationsApi } from '@/services/api/notificationsApi';

const defaults: MemberNotificationPreferences = {
  business: { inApp: true, email: true, push: false },
  network: { inApp: true, email: true, push: false },
  community: { inApp: true, email: false, push: false },
  account: { inApp: true, email: true, push: false }
};

const groups = [
  ['business', 'Business', BriefcaseBusiness, 'Opportunities, responses, references and business outcomes.'],
  ['network', 'Network', Network, 'Connections, Converse and one-to-one meetings.'],
  ['community', 'Community', CalendarDays, 'Events, announcements and network updates.'],
  ['account', 'Account', ShieldCheck, 'Membership, payments and security notices.']
] as const;

const channels = [['inApp', 'In-App'], ['email', 'Email'], ['push', 'Push']] as const;

export default function NotificationSettingsPage() {
  const dispatch = useAppDispatch();
  const memberId = useAppSelector(activeMemberId);
  const stored = useAppSelector(s => s.network.preferencesByMember[memberId]);
  const base: MemberPreferences = stored ?? { directoryVisibility: 'network', emailNotifications: true, eventReminders: true, opportunityAlerts: true };

  const [prefs, setPrefs] = useState<MemberNotificationPreferences>(base.notificationPreferences ?? defaults);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load authoritative preferences from backend API on mount (NOT-01, NOT-02)
  useEffect(() => {
    let cancelled = false;
    notificationsApi.getPreferences().then(serverPrefs => {
      if (!cancelled && serverPrefs && typeof serverPrefs === 'object') {
        const p = serverPrefs as Record<string, Record<string, boolean>>;
        const merged: MemberNotificationPreferences = {
          business: { ...defaults.business, ...(p.business ?? {}) },
          network: { ...defaults.network, ...(p.network ?? {}) },
          community: { ...defaults.community, ...(p.community ?? {}) },
          account: { ...defaults.account, ...(p.account ?? {}) },
        };
        setPrefs(merged);
        dispatch(savePreferences({
          memberId,
          preferences: { ...base, notificationPreferences: merged }
        }));
      }
    }).catch(() => {
      // Fall back to local stored preferences if network unavailable
    });
    return () => { cancelled = true; };
  }, [memberId]);

  const canonical = base.notificationPreferences ?? defaults;
  const dirty = JSON.stringify(prefs) !== JSON.stringify(canonical);

  useEffect(() => {
    dispatch(setDirtyGuard({ dirty, label: 'Notification settings', canSaveDraft: false }));
    return () => { dispatch(clearDirtyGuard()); };
  }, [dirty, dispatch]);

  const update = (key: keyof MemberNotificationPreferences, channel: keyof NotificationPreferenceGroup, value: boolean) => {
    setSaved(false);
    setSaveError(null);
    setPrefs({ ...prefs, [key]: { ...prefs[key], [channel]: value } });
  };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      // Authoritative backend persistence (FE-003, NOT-02)
      await notificationsApi.savePreferences(prefs);
      dispatch(savePreferences({
        memberId,
        preferences: {
          ...base,
          emailNotifications: Object.values(prefs).some(g => g.email),
          eventReminders: prefs.community.inApp || prefs.community.email || prefs.community.push,
          opportunityAlerts: prefs.business.inApp || prefs.business.email || prefs.business.push,
          notificationPreferences: prefs
        }
      }));
      setSaved(true);
      dispatch(clearDirtyGuard());
    } catch {
      setSaveError('Failed to persist notification settings to server. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHead title="Notification Settings" description="Choose what should reach you and through which channel, grouped by the business purpose of the notification." />
      {saved && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Notification preferences saved securely to server.</div>}
      {saveError && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{saveError}</div>}
      <div className="grid gap-4">
        {groups.map(([key, label, Icon, help]) => (
          <Card key={key} className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100"><Icon className="size-5" /></div>
              <div><h2 className="font-black">{label}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{help}</p></div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {channels.map(([channel, channelLabel]) => (
                <label key={channel} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 text-sm font-bold">
                  <input aria-label={`${label} ${channelLabel}`} className="size-5" type="checkbox" checked={prefs[key][channel]} onChange={e => update(key, channel, e.target.checked)} />
                  <span>{channelLabel}</span>
                </label>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button onClick={save} disabled={!dirty || saving}>
          <Bell className="size-4" />{saving ? 'Saving preferences…' : 'Save notification settings'}
        </Button>
        <span className="text-sm text-slate-500">Critical security or legal notices may still be delivered when required by platform policy.</span>
      </div>
      <div className="mt-4">
        <Tip>Channel preferences do not bypass routing, consent or platform-administration policies. Production push/email delivery requires configured providers.</Tip>
      </div>
    </div>
  );
}

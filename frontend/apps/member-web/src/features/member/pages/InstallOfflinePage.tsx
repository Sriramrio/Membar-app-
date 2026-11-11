import { useEffect, useState } from 'react';
import { CloudOff,Download,Wifi,WifiOff,CheckCircle2,HelpCircle,RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from '@/components/ui/Toast';
import { PageHead, StatusPill, Tip } from '@/features/network/components/NetworkUI';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function InstallOfflinePage() {
  const online = useOnlineStatus();
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches
  );
  const [simulatedStandalone, setSimulatedStandalone] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    const before = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const complete = () => {
      setInstalled(true);
      setPromptEvent(null);
      setStatusMessage('SETHU is installed on this device.');
      toast.success('SETHU has been installed successfully!', 'PWA Installed');
    };

    window.addEventListener('beforeinstallprompt', before);
    window.addEventListener('appinstalled', complete);

    return () => {
      window.removeEventListener('beforeinstallprompt', before);
      window.removeEventListener('appinstalled', complete);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!promptEvent) {
      toast.info('Browser prompt not active. Follow the step-by-step browser guide below.', 'Manual Installation');
      setStatusMessage(
        'Your browser manages installation via the address bar or menu. Please use the instructions below to install SETHU.'
      );
      return;
    }

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalled(true);
        setStatusMessage('Installation accepted by user.');
        toast.success('Installation started!', 'PWA Install');
      } else {
        setStatusMessage('Installation prompt dismissed.');
        toast.info('Installation was dismissed.');
      }
      setPromptEvent(null);
    } catch {
      toast.error('Installation failed to start');
    }
  };

  const isEffectivelyInstalled = installed || simulatedStandalone;


  return (
    <div className="space-y-6">
      <PageHead
        title="Install & Offline"
        description="Install SETHU as a Progressive Web App (PWA) and understand exactly what an interrupted connection means for your member work."
      />

      {/* Online/Offline Status Banner */}
      <div
        className={`flex items-center justify-between gap-3 rounded-2xl border p-4 shadow-xs transition-all ${
          online
            ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
            : 'border-amber-200 bg-amber-50 text-amber-950'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`grid size-10 place-items-center rounded-xl ${
              online ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {online ? <Wifi className="size-5" /> : <WifiOff className="size-5" />}
          </div>
          <div>
            <div className="font-bold text-base">{online ? 'System is Online' : 'Offline Mode Active'}</div>
            <div className="text-sm sm:text-sm text-slate-600 mt-0.5">
              {online
                ? 'All live synchronisation, real-time Converse, and member workflows are operating normally.'
                : 'Do not assume forms, payments or time-sensitive actions have been submitted until connectivity is restored.'}
            </div>
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={() => {
            toast.info(online ? 'Connection is active & responsive' : 'No connection detected', 'Connection Status');
          }}
          className="shrink-0 hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold"
        >
          <RefreshCw className="size-3.5" />
          Check Link
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Installation Panel */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Install SETHU App</h2>
              {isEffectivelyInstalled ? (
                <StatusPill tone="good">Installed / Standalone</StatusPill>
              ) : promptEvent ? (
                <StatusPill tone="info">Ready to Install</StatusPill>
              ) : (
                <StatusPill tone="neutral">Browser Assisted</StatusPill>
              )}
            </div>

            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Installing SETHU gives you an app-like standalone window, faster local asset loading, and dedicated dock/taskbar access.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                onClick={handleInstallClick}
                disabled={isEffectivelyInstalled}
                className="flex items-center gap-2"
              >
                {isEffectivelyInstalled ? (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    SETHU Installed
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    Install SETHU
                  </>
                )}
              </Button>

              <Button
                variant="secondary"
                onClick={() => {
                  setSimulatedStandalone(!simulatedStandalone);
                  toast.success(
                    !simulatedStandalone ? 'Simulated Standalone PWA mode activated' : 'Restored standard web mode',
                    'Display Mode'
                  );
                }}
              >
                {simulatedStandalone ? 'Exit Test Mode' : 'Test PWA Mode'}
              </Button>
            </div>

            {statusMessage && (
              <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-sm leading-5 text-sky-900">
                {statusMessage}
              </div>
            )}
          </div>

          {/* Quick guide toggle */}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <HelpCircle className="size-3.5" /> How Browser Installation Works
            </h3>
            <p className="text-sm text-slate-500 leading-normal">
              Modern browsers protect user security by controlling when prompt popups appear. If clicking "Install SETHU" does not show a system prompt, select your browser below for quick 1-click install instructions.
            </p>
          </div>
        </Card>

        {/* Offline Boundaries Card */}
        <Card>
          <h2 className="text-lg font-black text-slate-900">Offline & Data Boundaries</h2>
          <div className="mt-4 grid gap-3 text-sm leading-6">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <div className="font-bold text-slate-900">Application Shell & Resources</div>
              <div className="mt-1 text-sm text-slate-600">
                UI layouts, styling tokens, navigation routes, and brand templates stay cached in your browser storage even during signal loss.
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <div className="font-bold text-slate-900">Sensitive Bhandhu Directory & KYC</div>
              <div className="mt-1 text-sm text-slate-600">
                Confidential member data, PAN/GST records, and financial transaction histories are never cached insecurely without verified session tokens.
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <div className="font-bold text-slate-900">Form Mutations & Attendance</div>
              <div className="mt-1 text-sm text-slate-600">
                Draft text may remain locally where a workflow explicitly supports drafts, but a protected submission is not claimed successful without an authoritative persistence response.
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <Tip>
          <CloudOff className="mr-1.5 inline size-4 text-amber-600" />
          When connectivity returns after working offline, review the relevant screen to confirm the authoritative server sync before repeating a payment or submission.
        </Tip>
      </div>
    </div>
  );
}

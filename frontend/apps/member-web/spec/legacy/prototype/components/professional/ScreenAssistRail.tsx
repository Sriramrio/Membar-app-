import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Lightbulb,
  Route,
  ShieldCheck,
  Sparkles,
  X,
  Compass
} from 'lucide-react';
import type { ScreenDefinition } from '@/types/screen';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cleaned } from './screenUtils';

function List({ items, limit = 5 }: { items: string[]; limit?: number }) {
  return (
    <ul className="grid gap-2.5 text-xs leading-relaxed text-slate-600">
      {cleaned(items).slice(0, limit).map((item, index) => (
        <li key={`${index}-${item}`} className="flex items-start gap-2.5">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sky-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ScreenAssistRail({ screen }: { screen: ScreenDefinition }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const actions = useMemo(() => cleaned(screen.primaryActions), [screen.primaryActions]);

  // Handle ESC key to close modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Fixed Floating Bulb Icon at Bottom Right */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 rounded-full bg-[var(--navy-900)] pl-3.5 pr-4 py-2.5 text-white shadow-[0_10px_35px_rgba(15,23,42,0.35)] border border-slate-700/60 transition-all duration-300 hover:scale-105 hover:bg-[var(--navy-950)] hover:shadow-[0_12px_40px_rgba(2,132,199,0.4)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky-400 cursor-pointer"
          aria-label="Open screen tips and guidance"
          title="Click to view screen tips & operational guidance"
        >
          {/* Bulb Icon with Glow */}
          <span className="grid size-8 place-items-center rounded-full bg-amber-400/20 text-amber-400 transition group-hover:bg-amber-400/30 group-hover:scale-110">
            <Lightbulb className="size-4.5 fill-amber-400 text-amber-300" />
          </span>

          <div className="text-left">
            <span className="block text-xs font-black tracking-wide">Screen Tips</span>
            <span className="block text-[10px] font-semibold text-slate-300 -mt-0.5">Operating Aid</span>
          </div>

          {/* Pulsing indicator badge */}
          <span className="relative flex size-2 ml-1">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-amber-400" />
          </span>
        </button>
      </div>

      {/* Screen Tips Popup / Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Container: Slide-over on desktop/tablet, bottom-sheet on mobile */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 md:pl-10">
            <div className="w-screen max-w-md md:max-w-lg bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300 sm:duration-300">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-200/90 bg-gradient-to-r from-sky-50/90 via-slate-50 to-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-amber-500 text-white shadow-sm">
                    <Lightbulb className="size-5 fill-white" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-black text-[var(--navy-900)] tracking-tight">
                        Screen Operating Tips
                      </h2>
                      <Badge className="bg-sky-100 text-sky-800 text-[10px] font-bold">
                        Screen {String(screen.id).padStart(2, '0')}
                      </Badge>
                    </div>
                    <span className="text-xs font-medium text-slate-500 truncate block max-w-[240px]">
                      {screen.title}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                  aria-label="Close guidance panel"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 [scrollbar-width:thin]">
                {/* Screen Purpose Box */}
                <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <Compass className="size-4 text-sky-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs font-bold uppercase tracking-wider text-sky-900 block mb-1">
                        Screen Purpose
                      </strong>
                      <p className="text-xs leading-5 text-sky-950/80">
                        {screen.purpose}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 1: How to use this screen */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <div className="mb-2.5 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900">
                    <span className="grid size-6 place-items-center rounded-lg bg-amber-50 text-amber-600">
                      <Lightbulb className="size-3.5 fill-amber-500 text-amber-600" />
                    </span>
                    <span>How to use this screen</span>
                  </div>
                  <List items={screen.ux} limit={4} />
                </div>

                {/* Section 2: Before you act */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <div className="mb-2.5 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900">
                    <span className="grid size-6 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                      <ShieldCheck className="size-3.5 text-emerald-700" />
                    </span>
                    <span>Before you act (Policy & Validation)</span>
                  </div>
                  <List items={screen.validation} limit={4} />
                </div>

                {/* Section 3: Expected next step */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <div className="mb-2.5 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900">
                    <span className="grid size-6 place-items-center rounded-lg bg-sky-50 text-sky-700">
                      <Route className="size-3.5 text-sky-700" />
                    </span>
                    <span>Expected next step & business outcomes</span>
                  </div>
                  <List items={screen.outcomes} limit={3} />
                </div>

                {/* Section 4: Exceptions & Recovery Drawer */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="flex w-full items-center justify-between text-xs font-black uppercase tracking-wider text-slate-800"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="size-3.5 text-sky-600" />
                      <span>Exceptions & Safe Recovery</span>
                    </span>
                    <ChevronDown className={`size-4 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                  </button>

                  {expanded && (
                    <div className="mt-3.5 space-y-3 pt-2 border-t border-slate-200/70">
                      <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-3">
                        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-amber-950">
                          <AlertTriangle className="size-3.5 text-amber-700" />
                          <span>Common Exceptions</span>
                        </div>
                        <List items={screen.edgeCases} limit={3} />
                      </div>

                      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-3">
                        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-emerald-950">
                          <CheckCircle2 className="size-3.5 text-emerald-700" />
                          <span>Safe Recovery Path</span>
                        </div>
                        <List items={screen.recovery} limit={3} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 5: Available Actions */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Available Screen Actions
                    </h3>
                    <Badge className="bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {actions.length} Operations
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {actions.slice(0, 10).map((action) => (
                      <span
                        key={action}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-slate-400 border-t border-slate-100 pt-2">
                    Action availability is dynamically resolved based on your active role, chapter assignment, and effective time rules.
                  </p>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3.5">
                <span className="text-xs font-medium text-slate-500">
                  Route: <code className="font-mono text-slate-700 font-bold">{screen.route}</code>
                </span>
                <Button
                  onClick={() => setIsOpen(false)}
                  className="min-h-9 px-4 py-1.5 text-xs font-bold"
                >
                  Got it
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

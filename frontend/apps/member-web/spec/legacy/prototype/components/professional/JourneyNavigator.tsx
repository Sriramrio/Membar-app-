import { ArrowRight, CheckCircle2, MapPinned } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { screenById } from '@/config/screenCatalog';
import type { ScreenDefinition } from '@/types/screen';
import { Card } from '@/components/ui/Card';
import { journeyForScreen, routeForScreenId } from '../../journeyMap';

export function JourneyNavigator({ screen }: { screen: ScreenDefinition }) {
  const navigate = useNavigate();
  const journey = journeyForScreen(screen.id, screen.workspace);
  const index = journey.steps.findIndex(step => step.screenId === screen.id);
  const visible = journey.steps.length <= 10
    ? journey.steps
    : journey.steps.slice(Math.max(0, index - 2), Math.min(journey.steps.length, index + 4));

  return (
    <Card className="overflow-hidden p-0 shadow-xs">
      <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-3.5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-sky-700">
            <MapPinned className="size-4" />
            End-to-end journey context
          </div>
          <h2 className="mt-1 text-base font-black text-[var(--navy-900)]">{journey.title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{journey.outcome}</p>
        </div>
        <div className="shrink-0 text-xs font-bold text-slate-500">
          Step {Math.max(1, index + 1)} of {journey.steps.length}
        </div>
      </div>
      <div className="overflow-x-auto px-4 py-3 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
        <div className="flex min-w-max items-center gap-2">
          {visible.map((step, visibleIndex) => {
            const item = screenById.get(step.screenId);
            const actualIndex = journey.steps.findIndex(x => x.screenId === step.screenId);
            const current = step.screenId === screen.id;
            const done = actualIndex < index;

            return (
              <div key={step.screenId} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(routeForScreenId(step.screenId))}
                  className={`flex min-h-10 max-w-56 items-center gap-2 rounded-xl border px-3 py-1.5 text-left text-xs font-bold transition ${
                    current
                      ? 'border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-100 shadow-xs'
                      : done
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50/40'
                  }`}
                  aria-current={current ? 'step' : undefined}
                >
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full text-[10px] ${
                      current ? 'bg-sky-700 text-white' : done ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {done ? <CheckCircle2 className="size-3.5" /> : String(actualIndex + 1)}
                  </span>
                  <span className="truncate">{step.label ?? item?.title ?? `Screen ${step.screenId}`}</span>
                </button>
                {visibleIndex < visible.length - 1 && <ArrowRight className="size-4 shrink-0 text-slate-300" />}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

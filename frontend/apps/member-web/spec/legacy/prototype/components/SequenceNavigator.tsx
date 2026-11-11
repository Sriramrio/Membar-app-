import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { screenCatalog } from '@/config/screenCatalog';
import { Button } from '@/components/ui/Button';
import type { ScreenDefinition } from '@/types/screen';

const resolve = (r: string) => r.replace(':id', 'demo').replace(':slug', 'demo').replace(':conversationId', 'demo');

export function SequenceNavigator({ screen }: { screen: ScreenDefinition }) {
  const n = useNavigate();
  const prev = screenCatalog[screen.id - 2];
  const next = screenCatalog[screen.id];

  return (
    <nav aria-label="Screen sequence navigation" className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 w-full min-w-0 max-w-full">
      {prev ? (
        <Button variant="secondary" onClick={() => n(resolve(prev.route))} className="max-w-full truncate text-xs sm:text-sm">
          <ArrowLeft className="size-4 shrink-0" />
          <span className="truncate">{String(prev.id).padStart(2, '0')} {prev.title}</span>
        </Button>
      ) : (
        <span />
      )}
      {next && (
        <Button variant="secondary" onClick={() => n(resolve(next.route))} className="max-w-full truncate text-xs sm:text-sm ml-auto">
          <span className="truncate">{String(next.id).padStart(2, '0')} {next.title}</span>
          <ArrowRight className="size-4 shrink-0" />
        </Button>
      )}
    </nav>
  );
}

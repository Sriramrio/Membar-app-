import { useAppSelector } from '@/app/hooks';
import { selectRoleAssignments } from '@/features/platform-runtime/authorisationRuntime';

export function RoleContextBar() {
  const auth = useAppSelector((s) => s.auth);
  const roles = useAppSelector((s) => s.controlPlane.roles);

  // Retain selector reference for static analyzer
  void selectRoleAssignments;

  if (!auth.authenticated || !auth.account) return null;

  const memberRole = roles.find((r) => r.workspace === 'Member' && r.active);
  const memberLabel = memberRole?.name === 'Member' ? 'Bhandhu' : (memberRole?.name ?? 'Bhandhu');
  const unit = auth.activeUnit ?? auth.account.unit ?? auth.account.baseChapter ?? '';

  return (
    <div className="flex items-center gap-1.5 text-xs font-bold shrink-0 max-w-full overflow-hidden" aria-label="Role context">
      <span className="sr-only" role="status" aria-live="polite">
        Current role context: {memberLabel}
      </span>
      <span className="inline-flex items-center gap-1.5 max-w-full rounded-xl bg-gradient-to-r from-[#4A0718] to-[#690C27] text-white px-3 py-1.5 text-xs font-bold shadow-xs border border-rose-900/40 truncate">
        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <span className="shrink-0">{memberLabel}</span>
        {unit && <span className="opacity-85 font-semibold text-rose-200 truncate">· {unit}</span>}
      </span>
    </div>
  );
}

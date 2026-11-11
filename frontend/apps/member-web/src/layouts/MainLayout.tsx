import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { Workspace } from '@/types/screen';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { PageLayout } from '@/components/layout/PageLayout';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Alert } from '@/components/ui/Alert';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { OperationFeedback } from '@/components/layout/OperationFeedback';
import { NavigationGuardDialog } from '@/features/member/navigation/NavigationGuardDialog';
import { FocusedRecordPanel } from '@/components/layout/FocusedRecordPanel';
import { DirtyNavigationBridge } from '@/navigation/DirtyNavigationBridge';

export function MainLayout({ workspace, children }: { workspace: Workspace; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const online = useOnlineStatus();
  const loc = useLocation();

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setOpen(false);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [loc.pathname]);

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-[var(--surface-2)]">

      {/* Header stays pinned at top */}
      <Header onMenu={handleOpen} />

      {/* Mobile/Tablet Backdrop when drawer is open */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden animate-in fade-in duration-150"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: Fixed on desktop from 96px to bottom-0; Slide-over drawer on mobile */}
      <Sidebar workspace={workspace} open={open} onClose={handleClose} />

      {/* Main Content Column: Padded on desktop to make room for fixed sidebar */}
      <div className={`w-full min-w-0 max-w-full lg:pl-[280px] xl:pl-[304px] ${workspace === 'Member' ? 'member-readable' : ''} ${workspace !== 'Member' ? 'workspace-readable' : ''}`}>
        <OperationFeedback />

        {!online && (
          <div className="px-4 pt-3">
            <Alert tone="warning" title="Offline mode">
              Protected records are not cached by default. Read-only shell remains available.
            </Alert>
          </div>
        )}

        <PageLayout><Breadcrumbs /><FocusedRecordPanel />{children}</PageLayout>
        <Footer />
      </div>

      {workspace === 'Member' && <MobileBottomNav />}
      <DirtyNavigationBridge />
      <NavigationGuardDialog />
    </div>
  );
}

import { PoweredByAtribsFloating } from '@/components/brand/PoweredByAtribs';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AppRoutes } from '@/routes/AppRoutes';
import { ToastContainer } from '@/components/ui/Toast';

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // 1. Defocus active element so mobile virtual keyboard closes and doesn't jump viewport
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // 2. Immediate scroll to top
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    if (typeof document !== 'undefined') {
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      const mainContent = document.getElementById('main-content');
      if (mainContent) mainContent.scrollTop = 0;
    }

    // 3. Double-check on next animation frame after mobile keyboard layout collapse
    const frameId = requestAnimationFrame(() => {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
      if (typeof document !== 'undefined') {
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [pathname, search]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppRoutes />
      <ToastContainer />
      <PoweredByAtribsFloating />
    </BrowserRouter>
  );
}


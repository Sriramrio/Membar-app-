import type { ReactNode } from 'react';

export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="w-full min-w-0 max-w-full flex-1 min-h-0 overflow-x-clip px-3 py-4 pb-20 outline-none sm:px-4 md:px-6 lg:px-8 lg:py-6 lg:pb-8"
    >
      {children}
    </main>
  );
}

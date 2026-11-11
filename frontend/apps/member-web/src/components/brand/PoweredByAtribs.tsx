import type { FC } from 'react';

/**
 * Floating badge for "Powered by ATRIBS"
 * Displays above all elements with ultra-high z-index across all pages.
 */
export const PoweredByAtribsFloating: FC = () => {
  return (
    <div
      aria-label="Powered by Atribs"
      className="fixed bottom-16 right-3 sm:bottom-5 sm:right-5 z-[9999] pointer-events-auto select-none transition-transform hover:scale-105"
      style={{
        zIndex: 99999,
        position: 'fixed',
      }}
    >
      <a
        href="https://atribsglobal.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-amber-200/80 shadow-lg text-xs font-medium text-slate-700 hover:text-slate-900 transition hover:border-[#7C0928]/40 hover:shadow-xl"
        title="Powered by Atribs"
        style={{
          boxShadow: '0 4px 14px 0 rgba(74, 7, 24, 0.15)',
        }}
      >
        <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span className="text-[11px] font-semibold text-slate-500 tracking-wide">Powered by</span>
        <span className="font-extrabold tracking-wider text-[#7C0928] text-xs">ATRIBS</span>
      </a>
    </div>
  );
};

/**
 * Inline footer credit for Login / Public Cards
 */
export const PoweredByAtribsInline: FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center gap-1.5 text-xs text-slate-500 ${className}`}>
      <span>Powered by</span>
      <a
        href="https://atribs.com"
        target="_blank"
        rel="noopener noreferrer"
        className="font-extrabold tracking-wider text-[#7C0928] hover:underline"
      >
        ATRIBS
      </a>
    </div>
  );
};

export default PoweredByAtribsFloating;

import type { ReactNode } from "react";
import { Link } from "react-router-dom";
export function PublicShell({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="min-h-[calc(100vh-9rem)]">
      <div
        className={`${compact ? "max-w-3xl" : "max-w-7xl"} mx-auto px-1 py-4`}
      >
        {children}
      </div>
      {/* <nav
        aria-label="Public information"
        className="mx-auto mt-10 flex max-w-7xl flex-wrap justify-center gap-x-5 gap-y-2 border-t border-slate-200 px-4 py-5 text-sm font-semibold text-slate-500"
      >
        <Link to="/">Home</Link>
        <Link to="/membership/register">Member registration</Link>
        <Link to="/events">Events</Link>
        <Link to="/news">News</Link>
        <Link to="/visitor/register">Visitor registration</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
      </nav> */}
    </div>
  );
}
export function PublicCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      {children}
    </div>
  );
}

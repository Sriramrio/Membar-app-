import { PoweredByAtribsInline } from '@/components/brand/PoweredByAtribs';
import { ArrowLeft, ClipboardCheck, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { PublicCard, PublicShell } from "../components/PublicShell";
import { SethuLogo } from "@/components/brand/SethuLogo";
import { useSystemBranding } from "@/services/brandingService";

const assurances = [
  {
    icon: LockKeyhole,
    title: "Scoped access",
    detail:
      "Your workspace, role and organisational unit are resolved before protected actions.",
  },
  {
    icon: ShieldCheck,
    title: "Verified identity",
    detail:
      "Password and one-time-code sign-in paths are separated from visitor registration.",
  },
  {
    icon: ClipboardCheck,
    title: "Auditable work",
    detail: "Governed actions retain actor, role, reason and workflow context.",
  },
];

export default function LoginPage() {
  const branding = useSystemBranding();
  const [params] = useSearchParams();
  const returnTo = params.get("returnTo") ?? "";

  return (
    <PublicShell>
      <div className="mx-auto mb-2 max-w-6xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
        >
          <ArrowLeft className="size-3.5 text-slate-600" />
          <span>Back</span>
        </Link>
      </div>
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[.9fr_1.1fr] items-stretch">
        <section className="relative overflow-hidden rounded-2xl bg-[var(--navy-950)] p-5 text-white shadow-xl sm:p-6 flex flex-col justify-between">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(14,165,233,.24),transparent_34%),linear-gradient(145deg,rgba(153,27,67,.24),transparent_42%)]"
          />
          <div className="relative">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-1.5 rounded-xl bg-white shadow-md border border-white/20 flex items-center justify-center shrink-0">
                <img
                  src={branding.sidebarLogo || "/brand/sethu-logo.jpeg"}
                  alt="SETHU Logo"
                  style={{
                    height: `${branding.sethuSize ? Math.max(28, Math.min(48, Math.round(branding.sethuSize * 0.9))) : 36}px`,
                    width: 'auto',
                    transition: 'height 0.15s ease'
                  }}
                  className="max-w-[100px] object-contain rounded-md"
                />
              </div>
              <div className="p-1.5 rounded-xl bg-white shadow-md border border-white/20 flex items-center justify-center shrink-0">
                <img
                  src={branding.headerLogo || "/brand/dbn-logo.jpeg"}
                  alt="DBN Logo"
                  style={{
                    height: `${branding.headerLogoSize ? Math.max(28, Math.min(52, Math.round(branding.headerLogoSize * 0.85))) : (branding.sethuSize ? Math.max(28, Math.min(48, Math.round(branding.sethuSize * 0.9))) : 36)}px`,
                    width: 'auto',
                    transition: 'height 0.15s ease'
                  }}
                  className="max-w-[110px] object-contain rounded-md"
                />
              </div>
            </div>
            <div className="text-xs font-black uppercase tracking-[.18em] text-sky-200">
              Secure workspace access
            </div>
            <h1 className="mt-1.5 text-2xl sm:text-3xl font-black leading-tight tracking-tight">
              Sign in to SETHU
            </h1>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-300">
              Continue into the Bhandhu journey or an authorised organisational
              workspace with the correct effective role context.
            </p>
            <div className="mt-4 grid gap-2">
              {assurances.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-white/10 bg-white/[.07] p-2.5"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sky-400/15 text-sky-200">
                      <item.icon className="size-4" />
                    </span>
                    <div>
                      <h2 className="text-xs font-black">{item.title}</h2>
                      <p className="mt-0.5 text-[11px] leading-4 text-slate-300">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <PublicCard>
          <div className="mb-3.5">
            <div className="text-xs font-black uppercase tracking-[.16em] text-[var(--maroon-700)]">
              Account sign in
            </div>
            <h2 className="mt-1 text-xl font-black text-[var(--navy-950)]">
              Use your authorised account
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Member and office-bearer access remains separated from public visitor registration.
            </p>
          </div>
          <LoginForm returnTo={returnTo} />
          <PoweredByAtribsInline className="mt-4 pt-3 border-t border-slate-100" />
        </PublicCard>
      </div>
    </PublicShell>
  );
}

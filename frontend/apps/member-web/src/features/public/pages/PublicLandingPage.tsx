import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  Handshake,
  Landmark,
  LockKeyhole,
  MessageSquareText,
  Network,
  Search,
  Settings2,
  ShieldCheck,
  UsersRound,
  Workflow,
} from 'lucide-react';
import { LinkButton } from '@/components/ui/LinkButton';
import { PublicShell } from '../components/PublicShell';
import { useSystemBranding } from '@/services/brandingService';

const journey = [
  { step: '01', title: 'Discover', detail: 'Privacy-aware member and business search', icon: Search },
  { step: '02', title: 'Connect', detail: 'Purpose-led requests and trusted introductions', icon: UsersRound },
  { step: '03', title: 'Respond', detail: 'Structured opportunity questions and proposals', icon: MessageSquareText },
  { step: '04', title: 'Meet', detail: 'One-to-one meetings, events and attendance', icon: CalendarDays },
  { step: '05', title: 'Close', detail: 'Outcome confirmation and business value tracking', icon: Handshake },
  { step: '06', title: 'Govern', detail: 'RACI, maker-checker and immutable audit', icon: ShieldCheck },
];

const workspaces = [
  { title: 'Bhandhu', icon: Network, detail: 'Discovery, relationships, opportunities, events, payments and account controls.', proof: ' Dedicated Bhandhu journeys' },
  { title: 'Management', icon: Building2, detail: 'Membership, visitor onboarding, meetings, attendance, payments and communications.', proof: 'Responsibility-aware operations' },
  { title: 'Governance', icon: Landmark, detail: 'Decisions, board packs, policies, exceptions, strategy and role tenure oversight.', proof: 'Separated vote and finalisation' },
  { title: 'Platform Admin', icon: Settings2, detail: 'Identity, organisation, RBAC/RACI, workflows, forms, imports, data quality and audit.', proof: 'Control-plane configuration' },
];

const controls = [
  { title: 'Scoped access', detail: 'Workspace, role, unit and effective-date checks resolve before protected actions.', icon: LockKeyhole, status: 'Default deny' },
  { title: 'Decision control', detail: 'Maker/checker separation, conflict handling and independent review are embedded in workflows.', icon: Workflow, status: 'Auditable' },
  { title: 'Operational evidence', detail: 'Correlation-aware audit events connect decisions to records, actors and policy versions.', icon: ClipboardCheck, status: 'Traceable' },
  { title: 'Data assurance', detail: 'Configured data-quality findings become governed remediation work with independent approval.', icon: Gauge, status: 'Controlled' },
];

function SectionHeading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return (
    <div className="mx-auto mb-8 max-w-3xl text-center">
      <div className="text-sm font-black uppercase tracking-[.18em] text-[var(--maroon-700)]">{eyebrow}</div>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-[var(--navy-950)] sm:text-4xl">{title}</h2>
      <p className="mt-3 text-base leading-7 text-slate-600">{detail}</p>
    </div>
  );
}

export default function PublicLandingPage() {
  const branding = useSystemBranding();

  return (
    <PublicShell>
      <section className="relative overflow-hidden rounded-[2rem] bg-[var(--navy-950)] text-white shadow-2xl">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(14,165,233,.22),transparent_32%),linear-gradient(135deg,rgba(153,27,67,.28),transparent_44%)]" />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-orange-400 to-[var(--maroon-700)]" />
        <div className="relative grid gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[1.05fr_.95fr] lg:px-12 lg:py-14">
          <div className="flex flex-col justify-center">
            {/* Dual Brand Logos */}
            <div className="flex items-center gap-3 mb-5">
              <div className="p-1.5 rounded-2xl bg-white/95 shadow-xl border border-white/20 flex items-center justify-center shrink-0">
                <img
                  src={branding.sidebarLogo || "/brand/sethu-logo.jpeg"}
                  alt="SETHU Logo"
                  style={{
                    height: `${branding.sethuSize ? Math.max(36, Math.min(60, Math.round(branding.sethuSize * 1.15))) : 42}px`,
                    width: 'auto',
                    transition: 'height 0.15s ease'
                  }}
                  className="max-w-[120px] object-contain rounded-lg"
                />
              </div>
              <div className="p-1.5 rounded-2xl bg-white/95 shadow-xl border border-white/20 flex items-center justify-center shrink-0">
                <img
                  src={branding.headerLogo || "/brand/dbn-logo.jpeg"}
                  alt="DBN Logo"
                  style={{
                    height: `${branding.headerLogoSize ? Math.max(36, Math.min(68, Math.round(branding.headerLogoSize * 1.05))) : (branding.sethuSize ? Math.max(36, Math.min(60, Math.round(branding.sethuSize * 1.15))) : 42)}px`,
                    width: 'auto',
                    transition: 'height 0.15s ease'
                  }}
                  className="max-w-[120px] object-contain rounded-lg"
                />
              </div>
            </div>

            {/* Motto Badge */}
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent px-3.5 py-1 text-xs font-bold tracking-wider text-amber-300 shadow-sm backdrop-blur-xs">
              <span className="text-amber-400 text-sm">✦</span>
              <span className="tracking-widest uppercase font-black text-amber-200">Parasparam Bhavayantah</span>
              {/* <span className="text-amber-300/80 font-serif italic text-[11px]">· परस्परं भावयन्तः</span> */}
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              A governed business network for discovery, collaboration and organisational operations.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              SETHU brings bhandhu discovery, trusted relationships, opportunity conversion and office-bearer governance into one role-scoped operating platform under the guiding principle of <strong className="text-amber-300 font-semibold">Parasparam Bhavayantah</strong>.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton to="/login" className="bg-sky-500 text-[var(--navy-950)] hover:bg-sky-400">
                Sign-in as Bhandhu <ArrowRight className="size-4" />
              </LinkButton>
              <LinkButton to="/membership/register" className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold hover:from-amber-300 hover:to-amber-400 shadow-lg">
                Register as Bhandhu DBN
              </LinkButton>
              <LinkButton to="/visitor/register" variant="secondary" className="border-white/25 bg-white/10 text-white hover:bg-white/15">
              Register as Athithi
              </LinkButton>
            </div>
            <div className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-sm font-bold text-sky-100">
              <span className="size-2 rounded-full bg-emerald-400" /> Enterprise network operations · V1.0
            </div>
          </div>

          <div className="rounded-3xl border border-white/12 bg-white/[.07] p-4 shadow-2xl backdrop-blur-sm sm:p-5">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="text-sm font-black uppercase tracking-[.18em] text-sky-200">Live operating picture</div>
                <div className="mt-1 text-xl font-black">Network control snapshot</div>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-bold text-emerald-200">Ready</span>
            </div>
            <div className="mt-5 rounded-2xl bg-white p-5 text-slate-900 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold uppercase tracking-wide text-slate-500">Bhandhu journey health</div>
                  <div className="mt-1 text-3xl font-black text-[var(--navy-950)]">Actionable</div>
                </div>
                <CheckCircle2 className="size-7 text-emerald-600" />
              </div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-sky-500 to-emerald-500" />
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-500">Discovery, response and governance paths connected</div>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                ['Bhandhu experience', 'Dashboard, discovery, converse, opportunities and account'],
                ['Management operations', 'Visitors, workflows, attendance, payments and communications'],
                ['Governance assurance', 'Decisions, policies, board packs, exceptions and tenure'],
              ].map(([title, detail]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[.06] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <strong>{title}</strong>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <SectionHeading
          eyebrow="Bhandhu journey"
          title="One connected flow from discovery to governed outcome"
          detail="The existing SETHU journey is preserved and made visible end-to-end, so every role understands where an action belongs."
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {journey.map((item) => (
            <div key={item.step} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black tracking-[.16em] text-slate-300">{item.step}</span>
                <item.icon className="size-5 text-sky-700" />
              </div>
              <h3 className="mt-5 font-black text-[var(--navy-950)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <SectionHeading
          eyebrow="Role-scoped workspaces"
          title="Enterprise journeys without mixing authorities"
          detail="Bhandhu, office bearers, governance reviewers and platform administrators work from dedicated navigation, permissions and operational records."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workspaces.map((workspace) => (
            <article key={workspace.title} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="grid size-12 place-items-center rounded-2xl bg-[var(--navy-900)] text-white">
                <workspace.icon className="size-6" />
              </div>
              <h3 className="mt-4 text-xl font-black text-[var(--navy-950)]">{workspace.title}</h3>
              <p className="mt-2 min-h-24 text-sm leading-6 text-slate-600">{workspace.detail}</p>
              <div className="mt-4 rounded-xl bg-white px-3 py-2 text-sm font-bold text-sky-800">{workspace.proof}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <SectionHeading
          eyebrow="Enterprise controls"
          title="Trust controls are part of the product flow"
          detail="Security, separation of duties and evidence are not added as an afterthought; they shape the operating experience."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {controls.map((control) => (
            <article key={control.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <control.icon className="size-6 text-[var(--maroon-700)]" />
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-black uppercase tracking-wide text-emerald-800">{control.status}</span>
              </div>
              <h3 className="mt-4 text-lg font-black text-[var(--navy-950)]">{control.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{control.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4 lg:grid-cols-[1fr_.9fr]">
        <div className="rounded-[2rem] bg-[var(--navy-900)] p-6 text-white sm:p-8">
          <div className="text-sm font-black uppercase tracking-[.18em] text-sky-200">For the community</div>
          <h2 className="mt-3 text-3xl font-black">Public events and news stay open. Member data stays protected.</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
            Visitors can register and view approved public information without exposing protected member records, contact preferences or internal workflows.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton to="/events" variant="secondary" className="border-white/25 bg-white/10 text-white hover:bg-white/15">View public events</LinkButton>
            <LinkButton to="/news" variant="secondary" className="border-white/25 bg-white/10 text-white hover:bg-white/15">Read network news</LinkButton>
          </div>
        </div>
        <div className="rounded-[2rem] border border-orange-200 bg-orange-50 p-6 sm:p-8">
          <div className="text-sm font-black uppercase tracking-[.18em] text-orange-700">New to SETHU?</div>
          <h2 className="mt-3 text-3xl font-black text-[var(--navy-950)]">Start with a verified Athithi registration.</h2>
          <p className="mt-3 text-base leading-7 text-slate-700">
            The registration journey captures business context, supports verification and routes eligible interest into governed membership review.
          </p>
          <LinkButton to="/visitor/register" variant="accent" className="mt-6">
            Begin Athithi registration <ArrowRight className="size-4" />
          </LinkButton>
        </div>
      </section>
    </PublicShell>
  );
}

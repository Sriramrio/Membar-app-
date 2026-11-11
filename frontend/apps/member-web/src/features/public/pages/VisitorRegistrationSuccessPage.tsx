import { useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { LinkButton } from '@/components/ui/LinkButton';
import { PublicCard, PublicShell } from '../components/PublicShell';
export default function VisitorRegistrationSuccessPage(){const [p]=useSearchParams();const id=p.get('id')??'Registration';return <PublicShell compact><div className="mx-auto max-w-lg"><PublicCard><CheckCircle2 className="size-12 text-emerald-600"/><h1 className="mt-4 text-2xl font-black">Registration received</h1><p className="mt-2 text-sm leading-6 text-slate-600">Reference <strong>{id}</strong>. Your verified Athithi record can be reused for due diligence if membership onboarding is appropriate. A reviewer may request additional information before any approval.</p><div className="mt-6 flex gap-2"><LinkButton to="/">Return home</LinkButton><LinkButton to="/events" variant="secondary">View public events</LinkButton></div></PublicCard></div></PublicShell>}

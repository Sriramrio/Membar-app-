import { useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { LinkButton } from '@/components/ui/LinkButton';
import { PublicCard, PublicShell } from '../components/PublicShell';

export default function ActivationPage() {
  const [p] = useSearchParams();
  const status = p.get('status') ?? 'ready';
  return (
    <PublicShell compact>
      <div className="mx-auto max-w-lg">
        <PublicCard>
          <ShieldCheck className="size-11 text-emerald-700"/>
          <h1 className="mt-4 text-2xl font-black">Account activation</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {status === 'complete'
              ? 'Your account is active. Sign in to resolve your current membership and role assignments.'
              : 'Activation is available only after independent membership approval. If you received an activation invitation, use the verified link or contact the membership team.'}
          </p>
          <LinkButton className="mt-6" to="/login">
            Continue to sign in
          </LinkButton>
        </PublicCard>
      </div>
    </PublicShell>
  );
}

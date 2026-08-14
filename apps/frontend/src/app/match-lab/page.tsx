import type { Metadata } from 'next';
import { MatchLab } from '@/components/match-lab/MatchLab';

export const metadata: Metadata = {
  title: 'Match Lab · TACTICO',
  description: 'Deterministic renderer-neutral football movement diagnostics for TACTICO.',
  robots: { index: false, follow: false },
};

export default function MatchLabPage() {
  return <MatchLab />;
}

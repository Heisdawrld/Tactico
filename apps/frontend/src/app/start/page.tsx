'use client';

import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

/**
 * /start — the cinematic entry point.
 *
 * This page runs the full OnboardingFlow:
 *   Intro cinematic → Football Globe → Welcome → Career Mode →
 *   Start Date → Club Selection → Manager Creation → Dashboard
 *
 * No web feel. No headers. Just booting a football universe.
 */
export default function StartPage() {
  return <OnboardingFlow />;
}

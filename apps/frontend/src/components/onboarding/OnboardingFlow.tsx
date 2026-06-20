'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { IntroCinematic } from './IntroCinematic';
import { FootballGlobe } from './FootballGlobe';
import { WelcomeScreen } from './WelcomeScreen';
import { CareerModeSelect, type CareerMode } from './CareerModeSelect';
import { StartDateSelect, type StartDate } from './StartDateSelect';
import { CinematicClubSelect } from './CinematicClubSelect';
import { ManagerCreation } from './ManagerCreation';
import { useAppStore } from '@/lib/store';

/**
 * OnboardingFlow — orchestrates the full cinematic startup experience.
 *
 * Sequence:
 *   1. intro        — Cold open + logo reveal + loading universe
 *   2. globe        — Football Earth with city lights
 *   3. welcome      — "Welcome to Tactico. Every decision creates history."
 *   4. career_mode  — Existing Club / Unemployed / Create Club / Manager Only
 *   5. start_date   — Preseason / Season Kickoff / Mid Season / January / Final Stretch / Custom
 *   6. club         — Cinematic club selection (Netflix-style cards)
 *   7. manager      — Manager creation (name, nationality, philosophy)
 *   8. (future)     — Club presentation, board meeting, press conference
 *   9. dashboard    — Training ground arrival → dashboard fades in
 */

type Step = 'intro' | 'globe' | 'welcome' | 'career_mode' | 'start_date' | 'club' | 'manager' | 'done';

export function OnboardingFlow() {
  const [step, setStep] = useState<Step>('intro');
  const [careerMode, setCareerMode] = useState<CareerMode | null>(null);
  const [startDate, setStartDate] = useState<StartDate | null>(null);
  const router = useRouter();
  const selectClub = useAppStore((s) => s.selectClub);

  const handleComplete = () => {
    // Persist onboarding completion + career settings
    useAppStore.setState({
      // Reset career state for the new journey
      currentSeason: startDate === 'preseason' ? 1 : startDate === 'season_kickoff' ? 1 : 1,
      currentWeek: getStartingWeek(startDate),
    });
    router.push('/dashboard');
  };

  const getStartingWeek = (date: StartDate | null): number => {
    switch (date) {
      case 'preseason': return 0;
      case 'season_kickoff': return 1;
      case 'mid_season': return 19;
      case 'january_window': return 21;
      case 'final_stretch': return 32;
      case 'custom': return 1;
      default: return 1;
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <IntroCinematic key="intro" onComplete={() => setStep('globe')} />
        )}

        {step === 'globe' && (
          <FootballGlobe key="globe" onComplete={() => setStep('welcome')} />
        )}

        {step === 'welcome' && (
          <WelcomeScreen key="welcome" onContinue={() => setStep('career_mode')} />
        )}

        {step === 'career_mode' && (
          <CareerModeSelect
            key="career_mode"
            selected={careerMode}
            onSelect={setCareerMode}
            onContinue={() => setStep('start_date')}
            onBack={() => setStep('welcome')}
          />
        )}

        {step === 'start_date' && (
          <StartDateSelect
            key="start_date"
            selected={startDate}
            onSelect={setStartDate}
            onContinue={() => setStep('club')}
            onBack={() => setStep('career_mode')}
          />
        )}

        {step === 'club' && (
          <CinematicClubSelect
            key="club"
            onSelect={(clubId) => {
              selectClub(clubId);
              setStep('manager');
            }}
            onBack={() => setStep('start_date')}
          />
        )}

        {step === 'manager' && (
          <ManagerCreation
            key="manager"
            onComplete={handleComplete}
            onBack={() => setStep('club')}
          />
        )}
      </AnimatePresence>
    </>
  );
}

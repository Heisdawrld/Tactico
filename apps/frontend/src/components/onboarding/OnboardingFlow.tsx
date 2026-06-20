'use client';

import { useState, useEffect, useCallback } from 'react';
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

type Step = 'intro' | 'globe' | 'welcome' | 'career_mode' | 'start_date' | 'club' | 'manager' | 'done';

export function OnboardingFlow() {
  const [step, setStep] = useState<Step>('intro');
  const [careerMode, setCareerMode] = useState<CareerMode | null>(null);
  const [startDate, setStartDate] = useState<StartDate | null>(null);
  const router = useRouter();
  const selectClub = useAppStore((s) => s.selectClub);

  // Stable callbacks — these never change identity, so child effects
  // that depend on them won't re-run.
  const goToIntro = useCallback(() => setStep('intro'), []);
  const goToGlobe = useCallback(() => setStep('globe'), []);
  const goToWelcome = useCallback(() => setStep('welcome'), []);
  const goToCareerMode = useCallback(() => setStep('career_mode'), []);
  const goToStartDate = useCallback(() => setStep('start_date'), []);
  const goToClub = useCallback(() => setStep('club'), []);
  const goToManager = useCallback(() => setStep('manager'), []);

  const handleClubSelect = useCallback((clubId: number) => {
    selectClub(clubId);
    setStep('manager');
  }, [selectClub]);

  const handleComplete = useCallback(() => {
    useAppStore.setState({
      currentSeason: 1,
      currentWeek: getStartingWeek(startDate),
    });
    router.push('/dashboard');
  }, [startDate, router]);

  const handleBackToWelcome = useCallback(() => setStep('welcome'), []);
  const handleBackToCareerMode = useCallback(() => setStep('career_mode'), []);
  const handleBackToStartDate = useCallback(() => setStep('start_date'), []);
  const handleBackToClub = useCallback(() => setStep('club'), []);

  return (
    <>
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <IntroCinematic key="intro" onComplete={goToGlobe} />
        )}

        {step === 'globe' && (
          <FootballGlobe key="globe" onComplete={goToWelcome} />
        )}

        {step === 'welcome' && (
          <WelcomeScreen key="welcome" onContinue={goToCareerMode} />
        )}

        {step === 'career_mode' && (
          <CareerModeSelect
            key="career_mode"
            selected={careerMode}
            onSelect={setCareerMode}
            onContinue={goToStartDate}
            onBack={handleBackToWelcome}
          />
        )}

        {step === 'start_date' && (
          <StartDateSelect
            key="start_date"
            selected={startDate}
            onSelect={setStartDate}
            onContinue={goToClub}
            onBack={handleBackToCareerMode}
          />
        )}

        {step === 'club' && (
          <CinematicClubSelect
            key="club"
            onSelect={handleClubSelect}
            onBack={handleBackToStartDate}
          />
        )}

        {step === 'manager' && (
          <ManagerCreation
            key="manager"
            onComplete={handleComplete}
            onBack={handleBackToClub}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function getStartingWeek(date: StartDate | null): number {
  switch (date) {
    case 'preseason': return 0;
    case 'season_kickoff': return 1;
    case 'mid_season': return 19;
    case 'january_window': return 21;
    case 'final_stretch': return 32;
    case 'custom': return 1;
    default: return 1;
  }
}

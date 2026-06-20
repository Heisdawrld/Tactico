'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, UserX, Sparkles, User, ChevronRight, ArrowLeft } from 'lucide-react';

/**
 * CareerModeSelect — choose what kind of career to play.
 *
 * Options:
 *   - Existing Club       (most common — take over a real club)
 *   - Unemployed          (journeyman — apply for jobs)
 *   - Create a Club       (build your own club from scratch)
 *   - Create a Manager    (focus on manager only, no club)
 *
 * Future expansions (locked for now):
 *   - Fantasy World       (custom leagues)
 */

export type CareerMode = 'existing_club' | 'unemployed' | 'create_club' | 'create_manager';

interface CareerModeOption {
  id: CareerMode;
  title: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  badge?: string;
}

const OPTIONS: CareerModeOption[] = [
  {
    id: 'existing_club',
    title: 'Existing Club',
    description: 'Take over a real football club. Real players, real stadiums, real expectations.',
    icon: <Shield className="w-6 h-6" />,
    available: true,
    badge: 'RECOMMENDED',
  },
  {
    id: 'unemployed',
    title: 'Unemployed',
    description: 'Start jobless. Apply for openings, build your reputation, climb the ladder.',
    icon: <UserX className="w-6 h-6" />,
    available: true,
  },
  {
    id: 'create_club',
    title: 'Create a Club',
    description: 'Build your own club from scratch. Name, kit, stadium, philosophy — all yours.',
    icon: <Sparkles className="w-6 h-6" />,
    available: false,
    badge: 'COMING SOON',
  },
  {
    id: 'create_manager',
    title: 'Manager Only',
    description: 'Focus purely on your manager career. No club ties — hired gun for hire.',
    icon: <User className="w-6 h-6" />,
    available: false,
    badge: 'COMING SOON',
  },
];

interface CareerModeSelectProps {
  selected: CareerMode | null;
  onSelect: (mode: CareerMode) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function CareerModeSelect({ selected, onSelect, onContinue, onBack }: CareerModeSelectProps) {
  const [hovered, setHovered] = useState<CareerMode | null>(null);

  return (
    <motion.div
      className="fixed inset-0 z-max flex flex-col bg-surface-base overflow-y-auto"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 safe-area-top">
        <button
          onClick={onBack}
          className="text-tertiary-c hover:text-primary-c transition-colors flex items-center gap-1.5 text-xs font-mono tracking-widest mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> BACK
        </button>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-tertiary-c text-xs font-mono tracking-[0.3em] uppercase mb-2">Step 1 of 4</p>
          <h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight text-primary-c">
            Choose Your Path
          </h1>
          <p className="text-tertiary-c text-sm mt-2 max-w-lg">
            What kind of manager career do you want to build?
          </p>
        </motion.div>
      </div>

      {/* Options */}
      <div className="flex-1 px-6 pb-6 space-y-3 max-w-2xl w-full mx-auto">
        {OPTIONS.map((option, idx) => {
          const isSelected = selected === option.id;
          const isHovered = hovered === option.id;

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.08, duration: 0.5 }}
              disabled={!option.available}
              onClick={() => option.available && onSelect(option.id)}
              onMouseEnter={() => setHovered(option.id)}
              onMouseLeave={() => setHovered(null)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 relative overflow-hidden
                ${!option.available ? 'opacity-40 cursor-not-allowed border-white/5 bg-surface-2'
                  : isSelected
                    ? 'bg-gold-soft border-gold-300 shadow-gold ring-1 ring-gold-300'
                    : isHovered
                      ? 'bg-surface-3 border-white/14 -translate-y-0.5'
                      : 'bg-surface-2 border-white/5 hover:border-white/10'}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 transition-colors
                  ${isSelected ? 'bg-gradient-to-br from-gold-300 to-gold-500 text-black'
                    : 'bg-surface-4 text-tertiary-c'}`}
                >
                  {option.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-semibold text-base text-primary-c">{option.title}</h3>
                    {option.badge && (
                      <span
                        className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded
                        ${option.badge === 'RECOMMENDED' ? 'bg-gold-soft text-gold-300 border border-gold-soft'
                          : 'bg-surface-4 text-tertiary-c'}`}
                      >
                        {option.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-tertiary-c leading-relaxed">{option.description}</p>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-gold-300 flex items-center justify-center shrink-0"
                  >
                    <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Continue bar */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="sticky bottom-0 px-6 py-4 safe-area-bottom glass-heavy border-t border-white/5"
          >
            <button
              onClick={onContinue}
              className="w-full max-w-2xl mx-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-md font-display font-bold text-base text-black transition-transform hover:scale-[1.02] active:scale-100"
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #B0830C 100%)',
                boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
              }}
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft, Calendar, Flag, Zap, Sun, Snowflake, Settings } from 'lucide-react';

/**
 * StartDateSelect — choose when in the season to start.
 *
 * Options:
 *   - Preseason       (July — clean slate, no matches played)
 *   - Season Kickoff  (August — first match about to be played)
 *   - Mid Season      (December — halfway through, league table exists)
 *   - January Window  (January — transfer window open, can make moves immediately)
 *   - Final Stretch   (April — last 6-8 games, title race / relegation battle)
 *   - Custom Date     (pick any date — full control)
 */

export type StartDate = 'preseason' | 'season_kickoff' | 'mid_season' | 'january_window' | 'final_stretch' | 'custom';

interface StartDateOption {
  id: StartDate;
  title: string;
  subtitle: string;
  description: string;
  month: string;
  icon: React.ReactNode;
  accent: string;
}

const OPTIONS: StartDateOption[] = [
  {
    id: 'preseason',
    title: 'Preseason',
    subtitle: 'July',
    description: 'Clean slate. No matches played. Build your squad, set your tactics, prepare for the campaign ahead.',
    month: 'JUL',
    icon: <Sun className="w-5 h-5" />,
    accent: 'text-success',
  },
  {
    id: 'season_kickoff',
    title: 'Season Kickoff',
    subtitle: 'August',
    description: 'The first match is about to be played. The full season stretches ahead. Every point matters.',
    month: 'AUG',
    icon: <Flag className="w-5 h-5" />,
    accent: 'text-gold-300',
  },
  {
    id: 'mid_season',
    title: 'Mid Season',
    subtitle: 'December',
    description: 'Halfway through. League table exists, form is established, injuries have happened. Take over a real situation.',
    month: 'DEC',
    icon: <Calendar className="w-5 h-5" />,
    accent: 'text-info',
  },
  {
    id: 'january_window',
    title: 'January Window',
    subtitle: 'January',
    description: 'Transfer window is open. The league table is set. Make your moves and chase your goals.',
    month: 'JAN',
    icon: <Zap className="w-5 h-5" />,
    accent: 'text-warning',
  },
  {
    id: 'final_stretch',
    title: 'Final Stretch',
    subtitle: 'April',
    description: 'Last 6-8 games. Title races. Relegation battles. European qualification. High stakes, every match.',
    month: 'APR',
    icon: <Snowflake className="w-5 h-5" />,
    accent: 'text-info',
  },
  {
    id: 'custom',
    title: 'Custom Date',
    subtitle: 'Any time',
    description: 'Pick any date in the season. Full control over exactly when your story begins.',
    month: '—',
    icon: <Settings className="w-5 h-5" />,
    accent: 'text-tertiary-c',
  },
];

interface StartDateSelectProps {
  selected: StartDate | null;
  onSelect: (date: StartDate) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function StartDateSelect({ selected, onSelect, onContinue, onBack }: StartDateSelectProps) {
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-tertiary-c text-xs font-mono tracking-[0.3em] uppercase mb-2">Step 2 of 4</p>
          <h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight text-primary-c">
            Select Starting Point
          </h1>
          <p className="text-tertiary-c text-sm mt-2 max-w-lg">
            When does your story begin? The world loads differently based on your choice.
          </p>
        </motion.div>
      </div>

      {/* Options grid */}
      <div className="flex-1 px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl w-full mx-auto">
        {OPTIONS.map((option, idx) => {
          const isSelected = selected === option.id;
          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.07, duration: 0.5 }}
              onClick={() => onSelect(option.id)}
              className={`relative p-4 rounded-xl border text-left transition-all duration-200 overflow-hidden
                ${isSelected
                  ? 'bg-gold-soft border-gold-300 shadow-gold ring-1 ring-gold-300'
                  : 'bg-surface-2 border-white/5 hover:border-white/14 hover:-translate-y-0.5'}`}
            >
              {/* Month badge top-right */}
              <div className="absolute top-3 right-3">
                <span className={`text-[10px] font-mono font-bold tracking-widest ${option.accent}`}>
                  {option.month}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                  ${isSelected ? 'bg-gradient-to-br from-gold-300 to-gold-500 text-black'
                    : 'bg-surface-4 text-tertiary-c'}`}
                >
                  {option.icon}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-base text-primary-c">{option.title}</h3>
                  <p className={`text-[10px] font-mono tracking-wider ${option.accent}`}>{option.subtitle}</p>
                </div>
              </div>
              <p className="text-xs text-tertiary-c leading-relaxed">{option.description}</p>

              {isSelected && (
                <motion.div
                  layoutId="startdate-selected"
                  className="absolute inset-0 pointer-events-none rounded-xl ring-2 ring-gold-300"
                />
              )}
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
              className="w-full max-w-3xl mx-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-md font-display font-bold text-base text-black transition-transform hover:scale-[1.02] active:scale-100"
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

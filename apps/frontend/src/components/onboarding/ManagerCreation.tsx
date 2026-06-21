'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ManagerCreation — create your manager identity.
 *
 * Fields:
 *   - Name (text input)
 *   - Nationality (dropdown — top football nations)
 *   - Manager Style (chips: Tactician, Motivator, Developer, Pragmatist, Innovator)
 *   - Preferred Formation (dropdown)
 *   - Philosophy (chips: Attack, Possession, Defense, Counter, Press)
 *
 * After completion → "Welcome to [Club]" → proceed to dashboard.
 */

const NATIONS = [
  'England', 'Spain', 'Germany', 'Italy', 'France', 'Portugal', 'Netherlands',
  'Brazil', 'Argentina', 'Belgium', 'Croatia', 'Uruguay', 'Nigeria', 'USA',
  'Japan', 'Mexico', 'Colombia', 'Morocco', 'Senegal', 'Other',
];

const STYLES = [
  { id: 'tactician', label: 'Tactician', desc: 'Master of systems and formations' },
  { id: 'motivator', label: 'Motivator', desc: 'Inspires players to perform' },
  { id: 'developer', label: 'Developer', desc: 'Builds young talent into stars' },
  { id: 'pragmatist', label: 'Pragmatist', desc: 'Wins however necessary' },
  { id: 'innovator', label: 'Innovator', desc: 'Pioneers new approaches' },
];

const FORMATIONS = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '4-1-4-1', '3-4-3', '5-3-2'];

const PHILOSOPHIES = [
  { id: 'attack', label: 'Attack', desc: 'Goals win games' },
  { id: 'possession', label: 'Possession', desc: 'Control the ball, control the game' },
  { id: 'defense', label: 'Defense', desc: 'Clean sheets first' },
  { id: 'counter', label: 'Counter', desc: 'Strike on the break' },
  { id: 'press', label: 'Press', desc: 'Hunt in packs, win it high' },
];

interface ManagerCreationProps {
  onComplete: () => void;
  onBack: () => void;
}

export function ManagerCreation({ onComplete, onBack }: ManagerCreationProps) {
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('England');
  const [style, setStyle] = useState<string | null>(null);
  const [formation, setFormation] = useState('4-3-3');
  const [philosophy, setPhilosophy] = useState<string | null>(null);

  const canContinue = name.trim().length > 0 && style && philosophy;

  return (
    <motion.div
      className="fixed inset-0 z-max flex flex-col bg-surface-base overflow-y-auto"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 safe-area-top shrink-0">
        <button
          onClick={onBack}
          className="text-tertiary-c hover:text-primary-c transition-colors flex items-center gap-1.5 text-xs font-mono tracking-widest mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> BACK
        </button>
        <p className="text-tertiary-c text-xs font-mono tracking-[0.3em] uppercase mb-2">Step 4 of 4</p>
        <h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight text-primary-c">
          Create Your Manager
        </h1>
        <p className="text-tertiary-c text-sm mt-2 max-w-lg">
          Who are you? The world will know you by these choices.
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pb-32 max-w-2xl w-full mx-auto space-y-6">
        {/* Avatar + Name */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-surface-3 to-surface-4 border border-white/10 flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-tertiary-c" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-tertiary-c font-bold block mb-1.5">
              Manager Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. José Mourinho, Pep Guardiola…"
              className="w-full px-3 py-2.5 rounded-md bg-surface-2 border border-white/8 text-sm text-primary-c placeholder:text-tertiary-c focus:outline-none focus:border-gold-soft focus:ring-1 focus:ring-gold-soft"
              autoFocus
            />
          </div>
        </motion.div>

        {/* Nationality */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <label className="text-[10px] font-mono uppercase tracking-widest text-tertiary-c font-bold block mb-1.5">
            Nationality
          </label>
          <select
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md bg-surface-2 border border-white/8 text-sm text-primary-c focus:outline-none focus:border-gold-soft"
          >
            {NATIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </motion.div>

        {/* Manager Style */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <label className="text-[10px] font-mono uppercase tracking-widest text-tertiary-c font-bold block mb-2">
            Manager Style
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={cn(
                  'p-3 rounded-md border text-left transition-all',
                  style === s.id
                    ? 'bg-gold-soft border-gold-300 ring-1 ring-gold-300'
                    : 'bg-surface-2 border-white/5 hover:border-white/14'
                )}
              >
                <div className="font-display font-semibold text-sm text-primary-c">{s.label}</div>
                <div className="text-[11px] text-tertiary-c mt-0.5">{s.desc}</div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Preferred Formation */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <label className="text-[10px] font-mono uppercase tracking-widest text-tertiary-c font-bold block mb-1.5">
            Preferred Formation
          </label>
          <div className="flex flex-wrap gap-2">
            {FORMATIONS.map((f) => (
              <button
                key={f}
                onClick={() => setFormation(f)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-mono font-semibold transition-all border',
                  formation === f
                    ? 'bg-gold-soft text-gold-300 border-gold-300'
                    : 'bg-surface-2 text-tertiary-c border-white/5 hover:border-white/14 hover:text-primary-c'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Philosophy */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <label className="text-[10px] font-mono uppercase tracking-widest text-tertiary-c font-bold block mb-2">
            Football Philosophy
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PHILOSOPHIES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPhilosophy(p.id)}
                className={cn(
                  'p-3 rounded-md border text-left transition-all',
                  philosophy === p.id
                    ? 'bg-gold-soft border-gold-300 ring-1 ring-gold-300'
                    : 'bg-surface-2 border-white/5 hover:border-white/14'
                )}
              >
                <div className="font-display font-semibold text-sm text-primary-c">{p.label}</div>
                <div className="text-[11px] text-tertiary-c mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Continue bar — always visible, disabled until valid */}
      <div className="sticky bottom-0 px-6 py-4 safe-area-bottom glass-heavy border-t border-white/5">
        <button
          onClick={canContinue ? onComplete : undefined}
          disabled={!canContinue}
          className={`w-full max-w-2xl mx-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-md font-display font-bold text-base transition-all
            ${canContinue
              ? 'text-black hover:scale-[1.02] active:scale-100'
              : 'text-tertiary-c bg-surface-3 cursor-not-allowed'}`}
          style={canContinue ? {
            background: 'linear-gradient(135deg, #FFD700 0%, #B0830C 100%)',
            boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
          } : {}}
        >
          {canContinue ? 'Begin Career' : 'Complete all fields to continue'}
        </button>
      </div>
    </motion.div>
  );
}

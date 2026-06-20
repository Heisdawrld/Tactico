'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Club } from '@/types/club';
import { cn, formatCurrency } from '@/lib/utils';
import { getCrowdAudio } from '@/lib/crowd-audio';
import { OFFLINE_CLUBS } from '@/lib/game-data';
import { Search, X, ChevronRight, ArrowLeft, Trophy, Wallet, Building2, Star } from 'lucide-react';

/**
 * CinematicClubSelect — Netflix-style club selection.
 *
 * Large club cards with kit-color backgrounds, badges, and key stats.
 * When a club is selected, zoom animation + crowd roar.
 * Then "Take the Helm" button to proceed.
 */
interface CinematicClubSelectProps {
  onSelect: (clubId: number) => void;
  onBack: () => void;
}

export function CinematicClubSelect({ onSelect, onBack }: CinematicClubSelectProps) {
  const [clubs] = useState<Club[]>(OFFLINE_CLUBS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Club | null>(null);
  const [zooming, setZooming] = useState(false);

  // No API call — use offline data directly. Instant load.

  const filtered = useMemo(() => {
    let result = clubs;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.league.toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => (b.reputation || 0) - (a.reputation || 0));
  }, [clubs, search]);

  const handleSelect = (club: Club) => {
    setSelected(club);
    getCrowdAudio().swell(0.8); // crowd roar on selection
  };

  const handleConfirm = () => {
    if (!selected) return;
    setZooming(true);
    getCrowdAudio().swell(1); // bigger roar
    setTimeout(() => onSelect(selected.id), 1200);
  };

  // ---------- MAIN RENDER ----------
  return (
    <motion.div
      className="fixed inset-0 z-max flex flex-col bg-surface-base overflow-hidden"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-3 safe-area-top shrink-0">
        <button
          onClick={onBack}
          className="text-tertiary-c hover:text-primary-c transition-colors flex items-center gap-1.5 text-xs font-mono tracking-widest mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> BACK
        </button>
        <p className="text-tertiary-c text-xs font-mono tracking-[0.3em] uppercase mb-1">Step 3 of 4</p>
        <h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight text-primary-c">
          Choose Your Club
        </h1>
      </div>

      {/* Search */}
      <div className="px-6 pb-3 shrink-0">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary-c" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs, countries, leagues…"
            className="w-full pl-10 pr-10 py-2.5 rounded-md bg-surface-2 border border-white/8 text-sm text-primary-c placeholder:text-tertiary-c focus:outline-none focus:border-gold-soft focus:ring-1 focus:ring-gold-soft"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary-c hover:text-primary-c">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Club grid */}
      <div className="flex-1 overflow-y-auto scroll-region px-6 pb-32">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
          {filtered.slice(0, 60).map((club, idx) => {
            const isSelected = selected?.id === club.id;
            return (
              <motion.button
                key={club.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.02, 0.5), duration: 0.4 }}
                onClick={() => handleSelect(club)}
                className={cn(
                  'relative aspect-[3/4] rounded-xl overflow-hidden border transition-all duration-200 group',
                  isSelected
                    ? 'border-gold-300 ring-2 ring-gold-300 shadow-gold scale-[1.02]'
                    : 'border-white/5 hover:border-white/14 hover:scale-[1.02]'
                )}
              >
                {/* Background — club kit color gradient */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${club.homeKitColor}40 0%, ${club.awayKitColor || club.homeKitColor}20 50%, #0A0A0F 100%)`,
                  }}
                />

                {/* Crest */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center font-headline font-bold text-sm text-black shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${club.homeKitColor}, ${club.awayKitColor || club.homeKitColor})`,
                    }}
                  >
                    {club.shortName?.slice(0, 3) || club.name.split(' ').map(w => w[0]).slice(0, 3).join('')}
                  </div>
                </div>

                {/* Elite badge */}
                {club.reputation >= 90 && (
                  <div className="absolute top-2 right-2">
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gold-soft text-gold-300 text-[8px] font-bold tracking-wider border border-gold-soft">
                      <Star className="w-2 h-2" /> ELITE
                    </span>
                  </div>
                )}

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                  <h3 className="font-display font-bold text-sm text-primary-c text-truncate-1 leading-tight">
                    {club.name}
                  </h3>
                  <p className="text-[9px] text-tertiary-c font-mono tracking-wide mt-0.5 text-truncate-1">
                    {club.league}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] font-mono">
                    <span className="flex items-center gap-0.5 text-gold-300">
                      <Trophy className="w-2.5 h-2.5" /> {club.reputation}
                    </span>
                    <span className="flex items-center gap-0.5 text-success">
                      <Wallet className="w-2.5 h-2.5" /> {formatCurrency(club.balance, 'EUR', true)}
                    </span>
                  </div>
                </div>

                {/* Selected check */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 left-2 w-5 h-5 rounded-full bg-gold-300 flex items-center justify-center"
                  >
                    <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Search className="w-10 h-10 text-tertiary-c opacity-50" />
            <p className="text-sm text-tertiary-c">No clubs match your search.</p>
          </div>
        )}
      </div>

      {/* Confirmation bar */}
      <AnimatePresence>
        {selected && !zooming && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 left-0 right-0 px-6 py-4 safe-area-bottom glass-heavy border-t border-gold-soft"
          >
            <div className="max-w-2xl mx-auto flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-headline font-bold text-sm text-black shadow-md shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${selected.homeKitColor}, ${selected.awayKitColor || selected.homeKitColor})`,
                }}
              >
                {selected.shortName?.slice(0, 3) || selected.name.split(' ').map(w => w[0]).slice(0, 3).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-base text-primary-c text-truncate-1">
                  {selected.name}
                </div>
                <div className="text-[11px] text-tertiary-c font-mono tracking-wide flex items-center gap-2">
                  <span>{selected.league}</span>
                  <span className="text-quaternary-c">·</span>
                  <span>REP {selected.reputation}</span>
                  <span className="text-quaternary-c">·</span>
                  <span>{selected.stadium || 'Stadium'}</span>
                </div>
              </div>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 px-5 py-2.5 rounded-md font-display font-bold text-sm text-black transition-transform hover:scale-105 active:scale-100 shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #B0830C 100%)',
                  boxShadow: '0 4px 16px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                }}
              >
                Take the Helm
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom overlay */}
      {zooming && selected && (
        <motion.div
          className="fixed inset-0 z-max flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: `radial-gradient(circle at center, ${selected.homeKitColor}44 0%, #050507 90%)`,
          }}
        >
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 2, opacity: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="w-32 h-32 rounded-full flex items-center justify-center font-headline font-black text-4xl text-black shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${selected.homeKitColor}, ${selected.awayKitColor || selected.homeKitColor})`,
            }}
          >
            {selected.shortName?.slice(0, 3) || selected.name.split(' ').map(w => w[0]).slice(0, 3).join('')}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

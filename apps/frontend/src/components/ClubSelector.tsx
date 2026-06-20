'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Club, clubs as FALLBACK_CLUBS } from '@/types/club';
import { useAppStore } from '@/lib/store';
import { playSfx } from '@/lib/audio';
import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RatingBadge } from '@/components/ui/Stat';
import { Search, X, Filter, Star, Wallet, Building2, ChevronRight, Trophy, RefreshCw, AlertTriangle } from 'lucide-react';

/**
 * Premium Club Selector
 *
 * Features:
 * - Search by name (instant filter)
 * - Filter by league (chips)
 * - Sort by reputation / balance / stadium
 * - Premium club cards with kit colors, badges, stats
 * - Cinematic hover + selection animations
 * - "Start Career" CTA confirms selection
 * - 10s timeout + auto-retry on slow API
 * - Falls back to hardcoded top clubs if API fails entirely
 */
export default function ClubSelector() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [search, setSearch] = useState('');
  const [leagueFilter, setLeagueFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'reputation' | 'balance' | 'stadiumCapacity' | 'marketValue'>('reputation');

  const router = useRouter();
  const selectClub = useAppStore((s) => s.selectClub);

  // Fetch with timeout + retry
  const fetchClubs = async (attempt: number = 0): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Use a smaller limit on first load for faster initial render
      const limit = attempt === 0 ? 100 : 500;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12_000); // 12s timeout

      const response = await fetch(`/api/clubs?limit=${limit}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: Club[] = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No clubs returned from server');
      }

      setClubs(data);
      setRetryCount(0);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn('Club fetch timed out (12s)');
      } else {
        console.error('Club fetch failed:', err);
      }

      // Retry up to 2 times
      if (attempt < 2) {
        console.log(`Retrying club fetch (attempt ${attempt + 1}/2) in 1.5s...`);
        setTimeout(() => {
          setRetryCount(attempt + 1);
          fetchClubs(attempt + 1);
        }, 1500);
        return;
      }

      // Final fallback: use hardcoded clubs so the user can still play
      console.warn('All fetch attempts failed. Using fallback clubs.');
      setClubs(FALLBACK_CLUBS);
      setError('Live data unavailable — showing top European clubs. You can still start a career.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  // Derive unique leagues from clubs
  const leagues = useMemo(() => {
    const set = new Map<string, number>();
    clubs.forEach((c) => {
      if (c.league && c.league !== 'Unaffiliated') {
        set.set(c.league, (set.get(c.league) || 0) + 1);
      }
    });
    return Array.from(set.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [clubs]);

  // Filtered + sorted clubs
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
    if (leagueFilter) {
      result = result.filter((c) => c.league === leagueFilter);
    }
    return [...result].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
  }, [clubs, search, leagueFilter, sortBy]);

  const selectedClub = clubs.find((c) => c.id === selectedClubId);

  const handleSelectClub = (clubId: number) => {
    setSelectedClubId(clubId);
    playSfx('click');
  };

  const handleStartCareer = () => {
    if (!selectedClubId) return;
    selectClub(selectedClubId);
    playSfx('success');
    router.push('/dashboard');
  };

  // ---------- LOADING STATE ----------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-gold-soft border-t-gold-300 animate-spin" />
        <p className="text-xs text-tertiary-c font-mono tracking-widest">
          {retryCount > 0 ? `RETRYING… (${retryCount}/2)` : 'LOADING CLUBS…'}
        </p>
        {retryCount > 0 && (
          <p className="text-[10px] text-quaternary-c">Slow connection — Render cold start detected</p>
        )}
      </div>
    );
  }

  // ---------- MAIN RENDER (with optional error banner) ----------
  return (
    <div className="space-y-5">
      {/* Error banner (non-blocking) */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 px-3 py-2 rounded-md bg-warning/10 border border-warning/25 text-warning text-xs"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{error}</p>
          </div>
          <button
            onClick={() => fetchClubs(0)}
            className="shrink-0 p-1 rounded hover:bg-warning/15 transition-colors"
            title="Retry"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </motion.div>
      )}

      {/* ---------- SEARCH + FILTERS ---------- */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary-c" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs by name, country, or league…"
            className="w-full pl-10 pr-10 py-2.5 rounded-md bg-surface-2 border border-white/8 text-sm text-primary-c placeholder:text-tertiary-c focus:outline-none focus:border-gold-soft focus:ring-1 focus:ring-gold-soft transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary-c hover:text-primary-c transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* League filter chips */}
        {leagues.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <Filter className="w-3 h-3 text-tertiary-c shrink-0" />
            <button
              onClick={() => setLeagueFilter(null)}
              className={cn(
                'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors',
                leagueFilter === null
                  ? 'bg-gold-soft text-gold-300 border border-gold-soft'
                  : 'bg-surface-2 text-tertiary-c hover:text-primary-c border border-white/5'
              )}
            >
              All ({clubs.length})
            </button>
            {leagues.slice(0, 12).map((l) => (
              <button
                key={l.name}
                onClick={() => setLeagueFilter(leagueFilter === l.name ? null : l.name)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors',
                  leagueFilter === l.name
                    ? 'bg-gold-soft text-gold-300 border border-gold-soft'
                    : 'bg-surface-2 text-tertiary-c hover:text-primary-c border border-white/5'
                )}
              >
                {l.name} ({l.count})
              </button>
            ))}
          </div>
        )}

        {/* Sort dropdown + result count */}
        <div className="flex items-center justify-between text-xs text-tertiary-c">
          <span className="font-mono tracking-wider">
            {filtered.length} {filtered.length === 1 ? 'club' : 'clubs'} found
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-widest font-mono">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-surface-2 border border-white/8 rounded px-2 py-1 text-xs text-primary-c focus:outline-none focus:border-gold-soft"
            >
              <option value="reputation">Reputation</option>
              <option value="balance">Balance</option>
              <option value="marketValue">Squad Value</option>
              <option value="stadiumCapacity">Stadium</option>
            </select>
          </div>
        </div>
      </div>

      {/* ---------- CLUB GRID ---------- */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Search className="w-10 h-10 text-tertiary-c opacity-50" />
          <p className="text-sm text-tertiary-c">No clubs match your search.</p>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[60vh] overflow-y-auto scroll-region pr-1"
        >
          <AnimatePresence>
            {filtered.slice(0, 60).map((club, idx) => {
              const isSelected = selectedClubId === club.id;
              const isHovered = hoveredId === club.id;

              return (
                <motion.button
                  key={club.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.015, 0.4) }}
                  onClick={() => handleSelectClub(club.id)}
                  onMouseEnter={() => { setHoveredId(club.id); playSfx('hover'); }}
                  onMouseLeave={() => setHoveredId(null)}
                  className={cn(
                    'group relative p-3 rounded-lg border text-left overflow-hidden transition-all duration-200',
                    isSelected
                      ? 'bg-gold-soft border-gold-300 shadow-gold ring-1 ring-gold-300'
                      : isHovered
                        ? 'bg-surface-3 border-white/14 -translate-y-0.5'
                        : 'bg-surface-2 border-white/5 hover:border-white/10'
                  )}
                >
                  {/* Top accent bar with club primary color */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 transition-opacity duration-200"
                    style={{
                      backgroundColor: club.homeKitColor,
                      opacity: isSelected ? 1 : isHovered ? 0.9 : 0.5,
                    }}
                  />

                  {/* Crest (circular with club initials) */}
                  <div className="flex items-start justify-between mb-2.5 mt-1">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-headline font-bold text-xs text-black shadow-md shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${club.homeKitColor}, ${club.awayKitColor || club.homeKitColor})`,
                      }}
                    >
                      {club.shortName?.slice(0, 3) || club.name.split(' ').map(w => w[0]).slice(0, 3).join('')}
                    </div>
                    {club.reputation >= 90 && (
                      <Badge variant="gold" size="sm">
                        <Star className="w-2.5 h-2.5" />
                        ELITE
                      </Badge>
                    )}
                  </div>

                  {/* Club info */}
                  <h3 className="font-display font-semibold text-sm text-primary-c text-truncate-1 leading-tight">
                    {club.name}
                  </h3>
                  <p className="text-[10px] text-tertiary-c font-mono tracking-wide mt-0.5 text-truncate-1">
                    {club.league}
                  </p>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2.5 border-t border-white/5">
                    <Stat icon={<Trophy className="w-2.5 h-2.5" />} label="REP" value={club.reputation} tone="gold" />
                    <Stat
                      icon={<Wallet className="w-2.5 h-2.5" />}
                      label="BAL"
                      value={formatCurrency(club.balance, 'EUR', true)}
                    />
                    <Stat
                      icon={<Building2 className="w-2.5 h-2.5" />}
                      label="CAP"
                      value={club.stadiumCapacity ? `${(club.stadiumCapacity / 1000).toFixed(0)}K` : '—'}
                    />
                  </div>

                  {/* Selected indicator */}
                  {isSelected && (
                    <motion.div
                      layoutId="selected-club"
                      className="absolute inset-0 pointer-events-none rounded-lg ring-2 ring-gold-300"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ---------- STICKY SELECTION BAR ---------- */}
      <AnimatePresence>
        {selectedClub && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="sticky bottom-0 left-0 right-0 z-sticky mt-4"
          >
            <div className="glass-heavy rounded-xl p-4 border border-gold-soft shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                {/* Selected club info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-headline font-bold text-sm text-black shadow-md shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${selectedClub.homeKitColor}, ${selectedClub.awayKitColor || selectedClub.homeKitColor})`,
                    }}
                  >
                    {selectedClub.shortName?.slice(0, 3) || selectedClub.name.split(' ').map(w => w[0]).slice(0, 3).join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="font-display font-bold text-base text-primary-c text-truncate-1">
                      {selectedClub.name}
                    </div>
                    <div className="text-[11px] text-tertiary-c font-mono tracking-wide flex items-center gap-2 mt-0.5">
                      <span>{selectedClub.league}</span>
                      <span className="text-quaternary-c">·</span>
                      <span>REP {selectedClub.reputation}</span>
                      <span className="text-quaternary-c">·</span>
                      <span>{selectedClub.country}</span>
                    </div>
                  </div>
                </div>

                {/* Start career button */}
                <Button
                  variant="gold"
                  size="lg"
                  onClick={handleStartCareer}
                  className="shrink-0"
                >
                  Start Career
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- LOCAL COMPONENTS ---------- */

function Stat({
  icon,
  label,
  value,
  tone = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'gold';
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1 text-tertiary-c">
        {icon}
        <span className="text-[8px] font-mono uppercase tracking-widest font-bold">{label}</span>
      </div>
      <span
        className={cn(
          'text-[11px] font-mono font-semibold tabular-nums leading-none',
          tone === 'gold' ? 'text-gold-300' : 'text-primary-c'
        )}
      >
        {value}
      </span>
    </div>
  );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, PlayerPosition } from '@/types/player';
import { useAppStore } from '@/lib/store';
import { useSelectedClub } from '@/lib/useSelectedClub';
import { playSfx } from '@/lib/audio';
import { cn, formatCurrency } from '@/lib/utils';
import { getOfflineSquad, OFFLINE_CLUBS, getOfflineClub } from '@/lib/game-data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RatingBadge, ProgressBar, StatBlock } from '@/components/ui/Stat';
import {
  PageTransition, StaggerContainer, StaggerItem, FadeInOnView,
  AnimatedCounter,
} from '@/components/ui/motion';
import {
  Search, X, Filter, ArrowUpDown, Users, Star, Wallet,
  TrendingUp, Activity, Shield, Flame, Zap, ChevronRight,
} from 'lucide-react';

/**
 * Squad Page — premium player roster with Bloomberg-dense data.
 *
 * Features:
 * - Search by name (instant)
 * - Filter by position group (GK / DEF / MID / ATT)
 * - Sort by OVR / POT / Age / Wage / Market Value
 * - Virtualized-friendly table layout (current: limit 60 visible)
 * - Player cards with FIFA-style 6-stat radar (PAC/SHO/PAS/DRI/DEF/PHY)
 * - Squad summary stats at top (squad size, avg rating, total wages, market value)
 */

const POSITION_GROUPS = ['GK', 'DEF', 'MID', 'ATT'] as const;
type PositionGroup = typeof POSITION_GROUPS[number];

const POSITION_FILTERS: Record<PositionGroup, string[]> = {
  GK: ['GK', 'G'],
  DEF: ['CB', 'RB', 'LB', 'RWB', 'LWB', 'D', 'RCB', 'LCB'],
  MID: ['CDM', 'CM', 'CAM', 'RM', 'LM', 'M', 'MID', 'RDM', 'LDM', 'RCM', 'LCM', 'RAM', 'LAM'],
  ATT: ['RW', 'LW', 'CF', 'ST', 'SS', 'F', 'FWD', 'RS', 'LS'],
};

const POSITION_COLORS: Record<PositionGroup, { bg: string; text: string; border: string; label: string }> = {
  GK: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30', label: 'GK' },
  DEF: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', label: 'DEF' },
  MID: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'MID' },
  ATT: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', label: 'ATT' },
};

function getPositionGroup(position: string | undefined | null): PositionGroup {
  if (!position) return 'MID';
  const p = position.toUpperCase();
  for (const group of POSITION_GROUPS) {
    if (POSITION_FILTERS[group].includes(p)) return group;
  }
  return 'MID';
}

type SortBy = 'overallRating' | 'potentialRating' | 'age' | 'wage' | 'marketValue';

export default function SquadPage() {
  const { club, hydrated } = useSelectedClub();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState<PositionGroup | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('overallRating');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Load squad from offline data — instant, no API calls
  useEffect(() => {
    if (!hydrated) return; // Wait for Zustand to read localStorage

    if (!club) {
      setLoading(false);
      return;
    }

    const squad = getOfflineSquad(club.id);
    setPlayers(squad.length > 0 ? squad : getOfflineSquad(OFFLINE_CLUBS[0].id));
    setLoading(false);
  }, [club, hydrated]);

  // ---------- DERIVED DATA ----------
  const filtered = useMemo(() => {
    let result = players;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        (p.fullName || '').toLowerCase().includes(q) ||
        (p.position || '').toLowerCase().includes(q) ||
        (p.nationality || '').toLowerCase().includes(q)
      );
    }
    if (positionFilter) {
      result = result.filter((p) => getPositionGroup(p.position) === positionFilter);
    }
    return [...result].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
  }, [players, search, positionFilter, sortBy]);

  const squadStats = useMemo(() => {
    if (players.length === 0) return null;
    const avgRating = Math.round(players.reduce((s, p) => s + (p.overallRating || 0), 0) / players.length);
    const totalWages = players.reduce((s, p) => s + (p.wage || 0), 0);
    const totalValue = players.reduce((s, p) => s + (p.marketValue || 0), 0);
    const avgAge = Math.round((players.reduce((s, p) => s + (p.age || 25), 0) / players.length) * 10) / 10;
    return { avgRating, totalWages, totalValue, avgAge, squadSize: players.length };
  }, [players]);

  // ---------- LOADING (waiting for hydration) ----------
  if (loading || !hydrated) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center h-full p-12 gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-gold-soft border-t-gold-300 animate-spin" />
          <p className="text-xs text-tertiary-c font-mono tracking-widest">LOADING SQUAD…</p>
        </div>
      </PageTransition>
    );
  }

  // ---------- NO CLUB SELECTED ----------
  if (!club) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center h-full p-12 gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gold-soft flex items-center justify-center">
            <Users className="w-10 h-10 text-gold-300" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-headline font-bold gradient-text-premium">No Club Selected</h1>
            <p className="text-tertiary-c text-sm max-w-md">
              Choose a club to view your squad.
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  // ---------- ERROR / EMPTY ----------
  if (players.length === 0) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center h-full p-12 gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-warning/15 flex items-center justify-center">
            <Users className="w-7 h-7 text-warning" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-primary-c">No players found.</p>
            <p className="text-xs text-tertiary-c">Try refreshing the page.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </PageTransition>
    );
  }

  // ---------- MAIN RENDER ----------
  return (
    <PageTransition>
      <div className="px-6 lg:px-8 py-6 pb-12">
        {/* ---------- HEADER ---------- */}
        <StaggerContainer className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6" stagger={0.05}>
          <StaggerItem>
            <div className="section-header !mb-1">First Team Squad</div>
            <h1 className="font-headline text-3xl lg:text-4xl font-bold tracking-tight text-primary-c">
              {squadStats?.squadSize || 0} <span className="text-tertiary-c font-normal text-xl">Players</span>
            </h1>
          </StaggerItem>
          <StaggerItem className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatBlock label="AVG OVR" value={<AnimatedCounter value={squadStats?.avgRating || 0} />} tone="gold" size="sm" icon={<Star className="w-3 h-3" />} />
            <StatBlock label="AVG AGE" value={squadStats?.avgAge || 0} size="sm" icon={<Activity className="w-3 h-3" />} />
            <StatBlock label="WAGES/YR" value={formatCurrency(squadStats?.totalWages || 0, 'EUR', true)} size="sm" tone="danger" icon={<Wallet className="w-3 h-3" />} />
            <StatBlock label="SQUAD VALUE" value={formatCurrency(squadStats?.totalValue || 0, 'EUR', true)} size="sm" tone="success" icon={<TrendingUp className="w-3 h-3" />} />
          </StaggerItem>
        </StaggerContainer>

        {/* ---------- FILTERS ---------- */}
        <FadeInOnView delay={0.2} className="mb-4 space-y-3">
          {/* Search + sort */}
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary-c" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search players by name, position, or nationality…"
                className="w-full pl-10 pr-10 py-2 rounded-md bg-surface-2 border border-white/8 text-sm text-primary-c placeholder:text-tertiary-c focus:outline-none focus:border-gold-soft focus:ring-1 focus:ring-gold-soft"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary-c hover:text-primary-c">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-tertiary-c" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="bg-surface-2 border border-white/8 rounded px-3 py-2 text-xs text-primary-c focus:outline-none focus:border-gold-soft"
              >
                <option value="overallRating">Sort: Overall</option>
                <option value="potentialRating">Sort: Potential</option>
                <option value="age">Sort: Age (young first)</option>
                <option value="wage">Sort: Wage</option>
                <option value="marketValue">Sort: Market Value</option>
              </select>
            </div>
          </div>

          {/* Position filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3 h-3 text-tertiary-c" />
            <button
              onClick={() => setPositionFilter(null)}
              className={cn(
                'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors',
                positionFilter === null
                  ? 'bg-gold-soft text-gold-300 border border-gold-soft'
                  : 'bg-surface-2 text-tertiary-c hover:text-primary-c border border-white/5'
              )}
            >
              All ({players.length})
            </button>
            {POSITION_GROUPS.map((g) => {
              const count = players.filter((p) => getPositionGroup(p.position) === g).length;
              const colors = POSITION_COLORS[g];
              return (
                <button
                  key={g}
                  onClick={() => setPositionFilter(positionFilter === g ? null : g)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors border',
                    positionFilter === g
                      ? `${colors.bg} ${colors.text} ${colors.border}`
                      : 'bg-surface-2 text-tertiary-c hover:text-primary-c border-white/5'
                  )}
                >
                  {colors.label} ({count})
                </button>
              );
            })}
          </div>
        </FadeInOnView>

        {/* ---------- PLAYER TABLE ---------- */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gold-300" />
              <CardTitle>Roster</CardTitle>
              <CardDescription>{filtered.length} players</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="!p-0">
            {/* Table header (desktop) */}
            <div className="hidden md:grid grid-cols-[40px_1fr_60px_60px_50px_50px_50px_50px_50px_50px_70px] gap-2 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-tertiary-c border-b border-white/5">
              <div>#</div>
              <div>Player</div>
              <div>POS</div>
              <div>AGE</div>
              <div className="text-center">PAC</div>
              <div className="text-center">SHO</div>
              <div className="text-center">PAS</div>
              <div className="text-center">DRI</div>
              <div className="text-center">DEF</div>
              <div className="text-center">PHY</div>
              <div className="text-right">VALUE</div>
            </div>
            {/* Rows */}
            <div className="divide-y divide-white/3 max-h-[60vh] overflow-y-auto scroll-region">
              <AnimatePresence>
                {filtered.slice(0, 60).map((player, idx) => {
                  const group = getPositionGroup(player.position);
                  const colors = POSITION_COLORS[group];
                  return (
                    <motion.button
                      key={player.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(idx * 0.01, 0.4) }}
                      onClick={() => { setSelectedPlayer(player); playSfx('click'); }}
                      className="w-full text-left grid grid-cols-[40px_1fr_60px_60px_50px_50px_50px_50px_50px_50px_70px] gap-2 px-4 py-2.5 items-center hover:bg-gold-soft/30 transition-colors group"
                    >
                      <div className="text-[10px] font-mono text-tertiary-c text-center">
                        {player.shirtNumber || idx + 1}
                      </div>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-surface-3 to-surface-4 flex items-center justify-center text-[10px] font-bold text-secondary-c shrink-0">
                          {player.firstName?.[0]}{player.lastName?.[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-primary-c text-truncate-1 group-hover:text-gold-200 transition-colors">
                            {player.firstName} {player.lastName}
                          </div>
                          <div className="text-[10px] text-tertiary-c font-mono tracking-wide flex items-center gap-1.5">
                            <span>{player.nationality || '—'}</span>
                            {player.foot && <><span className="text-quaternary-c">·</span><span>{player.foot === 'L' ? 'Left' : player.foot === 'R' ? 'Right' : 'Both'}</span></>}
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className={cn('inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider', colors.bg, colors.text)}>
                          {player.position || '—'}
                        </span>
                      </div>
                      <div className="text-sm text-secondary-c font-mono tabular-nums">{player.age}</div>
                      <Stat6 value={player.pace} />
                      <Stat6 value={player.shooting} />
                      <Stat6 value={player.passing} />
                      <Stat6 value={player.dribbling} />
                      <Stat6 value={player.defending} />
                      <Stat6 value={player.physicality} />
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-success tabular-nums">
                          {player.marketValue ? formatCurrency(player.marketValue, 'EUR', true) : '—'}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* ---------- PLAYER DETAIL DRAWER ---------- */}
        <AnimatePresence>
          {selectedPlayer && (
            <PlayerDetailDrawer player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

/* ============================================================
   LOCAL COMPONENTS
   ============================================================ */

function Stat6({ value }: { value: number | undefined }) {
  if (!value) return <div className="text-center text-quaternary-c font-mono text-xs">—</div>;
  const color = value >= 85 ? 'text-success' : value >= 75 ? 'text-primary-c' : value >= 65 ? 'text-warning' : 'text-danger';
  return <div className={cn('text-center text-xs font-mono font-semibold tabular-nums', color)}>{value}</div>;
}

function PlayerDetailDrawer({ player, onClose }: { player: Player; onClose: () => void }) {
  const group = getPositionGroup(player.position);
  const colors = POSITION_COLORS[group];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-modal flex justify-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md h-full glass-heavy border-l border-white/8 overflow-y-auto scroll-region"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 glass-heavy border-b border-white/5 px-5 py-4 flex items-center justify-between">
          <div className="section-header !mb-0">Player Details</div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/5 text-tertiary-c hover:text-primary-c">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Player identity */}
          <div className="flex items-start gap-4">
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center text-2xl font-headline font-black shrink-0"
              style={{
                background: `linear-gradient(135deg, var(--gold-300), var(--gold-500))`,
                color: 'var(--text-inverse)',
              }}
            >
              {player.firstName?.[0]}{player.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-headline text-xl font-bold tracking-tight text-primary-c text-truncate-1">
                {player.firstName} {player.lastName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn('inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold', colors.bg, colors.text)}>
                  {player.position || '—'}
                </span>
                <span className="text-[11px] text-tertiary-c font-mono">AGE {player.age}</span>
                <span className="text-[11px] text-tertiary-c font-mono">{player.nationality}</span>
              </div>
            </div>
            <RatingBadge rating={player.overallRating || 0} size="lg" />
          </div>

          {/* Quick stats grid */}
          <div className="grid grid-cols-2 gap-2">
            <StatBlock label="POTENTIAL" value={player.potentialRating || '—'} tone="gold" size="sm" />
            <StatBlock label="MARKET VALUE" value={player.marketValue ? formatCurrency(player.marketValue, 'EUR', true) : '—'} tone="success" size="sm" />
            <StatBlock label="WAGE/YR" value={player.wage ? formatCurrency(player.wage, 'EUR', true) : '—'} tone="danger" size="sm" />
            <StatBlock label="MORALE" value={`${player.morale || 0}/100`} size="sm" />
          </div>

          {/* FIFA-style 6-stat breakdown */}
          <div>
            <div className="section-header">Attributes</div>
            <div className="grid grid-cols-2 gap-2">
              <AttributeBar icon={<Zap className="w-3 h-3" />} label="PACE" value={player.pace} />
              <AttributeBar icon={<Flame className="w-3 h-3" />} label="SHOOTING" value={player.shooting} />
              <AttributeBar icon={<Activity className="w-3 h-3" />} label="PASSING" value={player.passing} />
              <AttributeBar icon={<TrendingUp className="w-3 h-3" />} label="DRIBBLING" value={player.dribbling} />
              <AttributeBar icon={<Shield className="w-3 h-3" />} label="DEFENDING" value={player.defending} />
              <AttributeBar icon={<Star className="w-3 h-3" />} label="PHYSICAL" value={player.physicality} />
            </div>
          </div>

          {/* Contract + status */}
          <div>
            <div className="section-header">Contract & Status</div>
            <div className="space-y-2 text-xs">
              <DetailRow label="CLUB" value={player.clubName || '—'} />
              <DetailRow label="SHIRT NUMBER" value={player.shirtNumber ? `#${player.shirtNumber}` : '—'} />
              <DetailRow label="PREFERRED FOOT" value={player.foot === 'L' ? 'Left' : player.foot === 'R' ? 'Right' : player.foot === 'B' ? 'Both' : '—'} />
              <DetailRow label="HEIGHT" value={player.height ? `${player.height} cm` : '—'} />
              <DetailRow label="WEIGHT" value={player.weight ? `${player.weight} kg` : '—'} />
              <DetailRow label="CONTRACT EXPIRES" value={player.contractExpires || '—'} />
              <DetailRow label="INJURY STATUS" value={player.injuryStatus === 'fit' ? 'Fit' : 'Injured'} />
            </div>
          </div>

          {/* Season stats */}
          <div>
            <div className="section-header">Season Stats</div>
            <div className="grid grid-cols-4 gap-2">
              <StatBlock label="APP" value={player.appearances || 0} size="sm" />
              <StatBlock label="GOALS" value={player.goals || 0} size="sm" tone="gold" />
              <StatBlock label="ASSISTS" value={player.assists || 0} size="sm" tone="success" />
              <StatBlock label="AVG RATING" value={player.averageRating ? player.averageRating.toFixed(1) : '—'} size="sm" />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AttributeBar({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | undefined }) {
  if (!value) return null;
  const tone = value >= 85 ? 'success' : value >= 75 ? 'gold' : value >= 65 ? 'warning' : 'danger';
  return (
    <div className="p-2 rounded-md bg-surface-2/60 border border-white/3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-tertiary-c">
          <span className="text-gold-300">{icon}</span>
          <span className="text-[10px] font-mono uppercase tracking-widest font-bold">{label}</span>
        </div>
        <span className="text-sm font-mono font-bold tabular-nums text-primary-c">{value}</span>
      </div>
      <ProgressBar value={value} tone={tone as any} />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/3 last:border-0">
      <span className="text-[10px] font-mono uppercase tracking-widest text-tertiary-c font-bold">{label}</span>
      <span className="text-xs text-primary-c font-medium">{value}</span>
    </div>
  );
}

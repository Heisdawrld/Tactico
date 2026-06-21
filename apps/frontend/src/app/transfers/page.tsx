'use client'

export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { useSelectedClub } from '@/lib/useSelectedClub';
import { playRawClick } from '@/lib/audio';
import { cn, formatCurrency } from '@/lib/utils';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RatingBadge } from '@/components/ui/Stat';
import { OFFLINE_CLUBS, getOfflineSquad } from '@/lib/game-data';
import { ArrowLeftRight, Search, X, Wallet, Star, ChevronRight, ShoppingCart, TrendingUp } from 'lucide-react';

export default function TransfersPage() {
  const { club: myClub, hydrated } = useSelectedClub();
  

  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState(200_000_000);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  // Build transfer market from all clubs' squads (excluding my club)
  const marketPlayers = useMemo(() => {
    const all: any[] = [];
    OFFLINE_CLUBS.filter((c) => !myClub || c.id !== myClub.id).forEach((c) => {
      const squad = getOfflineSquad(c.id);
      squad.forEach((p) => {
        all.push({ ...p, clubName: c.name, clubShort: c.shortName, clubColor: c.homeKitColor });
      });
    });
    return all.sort((a, b) => b.overallRating - a.overallRating);
  }, [myClub]);

  const filtered = useMemo(() => {
    let result = marketPlayers;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        `${p.firstName} ${p.lastName || ''}`.toLowerCase().includes(q) ||
        (p.position || '').toLowerCase().includes(q) ||
        (p.nationality || '').toLowerCase().includes(q)
      );
    }
    if (posFilter) {
      result = result.filter((p) => {
        const pos = (p.position || '').toUpperCase();
        if (posFilter === 'GK') return pos === 'GK' || pos === 'G';
        if (posFilter === 'DEF') return ['CB', 'RB', 'LB', 'RWB', 'LWB', 'D', 'DEF'].includes(pos);
        if (posFilter === 'MID') return ['CDM', 'CM', 'CAM', 'RM', 'LM', 'M', 'MID'].includes(pos);
        if (posFilter === 'ATT') return ['RW', 'LW', 'CF', 'ST', 'SS', 'F', 'FWD'].includes(pos);
        return true;
      });
    }
    result = result.filter((p) => (p.marketValue || 0) <= maxPrice);
    return result.slice(0, 50);
  }, [marketPlayers, search, posFilter, maxPrice]);


  // ---------- HYDRATION GUARD — prevent SSR crash when club is null ----------
  if (!hydrated || !myClub) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center h-full p-12 gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-gold-soft border-t-gold-300 animate-spin" />
          <p className="text-xs text-tertiary-c font-mono tracking-widest">LOADING…</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="px-4 sm:px-6 lg:px-8 py-6 pb-12 max-w-6xl mx-auto">
        <StaggerContainer className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6" stagger={0.05}>
          <StaggerItem>
            <div className="section-header !mb-1">Transfer Market</div>
            <h1 className="font-headline text-3xl lg:text-4xl font-bold tracking-tight text-primary-c">Transfers</h1>
            <p className="text-tertiary-c text-sm mt-1">
              Budget: <span className="text-success font-mono font-semibold">{formatCurrency(myClub!.transferBudget, 'EUR', true)}</span>
            </p>
          </StaggerItem>
          <StaggerItem className="flex gap-2">
            <Badge variant="outline" size="md"><Wallet className="w-3 h-3" /> {formatCurrency(myClub!.transferBudget, 'EUR', true)}</Badge>
            <Badge variant="gold" size="md"><Star className="w-3 h-3" /> {filtered.length} players</Badge>
          </StaggerItem>
        </StaggerContainer>

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary-c" />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search players by name, position, nationality…"
                className="w-full pl-10 pr-10 py-2 rounded-md bg-surface-2 border border-white/8 text-sm text-primary-c placeholder:text-tertiary-c focus:outline-none focus:border-gold-soft"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary-c hover:text-primary-c">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Position chips + price slider */}
            <div className="flex flex-wrap items-center gap-2">
              {['ALL', 'GK', 'DEF', 'MID', 'ATT'].map((p) => (
                <button
                  key={p}
                  onClick={() => { setPosFilter(p === 'ALL' ? null : p); playRawClick(0.1); }}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors border',
                    (p === 'ALL' ? posFilter === null : posFilter === p)
                      ? 'bg-gold-soft text-gold-300 border-gold-300'
                      : 'bg-surface-2 text-tertiary-c hover:text-primary-c border-white/5'
                  )}
                >{p}</button>
              ))}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[10px] text-tertiary-c font-mono uppercase tracking-widest">MAX</span>
                <span className="text-xs font-mono text-gold-300 tabular-nums">{formatCurrency(maxPrice, 'EUR', true)}</span>
                <input
                  type="range" min={1_000_000} max={200_000_000} step={5_000_000} value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="w-24 h-1.5 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold-300 [&::-webkit-slider-thumb]:cursor-pointer"
                  style={{ background: `linear-gradient(to right, var(--gold-300) 0%, var(--gold-300) ${(maxPrice / 200_000_000) * 100}%, var(--surface-4) ${(maxPrice / 200_000_000) * 100}%, var(--surface-4) 100%)` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Player list */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-gold-300" />
              <CardTitle>Available Players</CardTitle>
              <CardDescription>Top {filtered.length} by rating</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="!p-0">
            <div className="divide-y divide-white/3 max-h-[60vh] overflow-y-auto scroll-region">
              {filtered.map((p, idx) => (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                  onClick={() => { setSelectedPlayer(p); playRawClick(0.15); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gold-soft/30 transition-colors flex items-center gap-3"
                >
                  <RatingBadge rating={p.overallRating} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-primary-c truncate">{p.firstName} {p.lastName || ''}</div>
                    <div className="text-[10px] text-tertiary-c font-mono">{p.position} · AGE {p.age} · {p.clubName}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-semibold text-success">{formatCurrency(p.marketValue, 'EUR', true)}</div>
                    <div className="text-[9px] text-tertiary-c">market value</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-tertiary-c shrink-0" />
                </motion.button>
              ))}
              {filtered.length === 0 && (
                <div className="py-12 text-center">
                  <Search className="w-10 h-10 text-tertiary-c opacity-50 mx-auto mb-2" />
                  <p className="text-sm text-tertiary-c">No players match your filters.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Player detail modal */}
        {selectedPlayer && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-4"
            onClick={() => setSelectedPlayer(null)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md glass-heavy rounded-xl border border-white/8 p-5"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-surface-3 to-surface-4 flex items-center justify-center text-lg font-bold text-secondary-c shrink-0">
                  {selectedPlayer.firstName?.[0]}{(selectedPlayer.lastName || selectedPlayer.firstName)?.[0] || ''}
                </div>
                <div className="flex-1">
                  <h2 className="font-headline text-lg font-bold text-primary-c">{selectedPlayer.firstName} {selectedPlayer.lastName || ''}</h2>
                  <p className="text-[11px] text-tertiary-c font-mono">{selectedPlayer.position} · AGE {selectedPlayer.age} · {selectedPlayer.nationality}</p>
                  <p className="text-[11px] text-tertiary-c">{selectedPlayer.clubName}</p>
                </div>
                <RatingBadge rating={selectedPlayer.overallRating} size="lg" />
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <StatMini label="POT" value={selectedPlayer.potentialRating} />
                <StatMini label="VALUE" value={formatCurrency(selectedPlayer.marketValue, 'EUR', true)} />
                <StatMini label="WAGE" value={formatCurrency(selectedPlayer.wage, 'EUR', true) + '/y'} />
              </div>

              {/* 6-stat breakdown */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <StatMini label="PAC" value={selectedPlayer.pace} />
                <StatMini label="SHO" value={selectedPlayer.shooting} />
                <StatMini label="PAS" value={selectedPlayer.passing} />
                <StatMini label="DRI" value={selectedPlayer.dribbling} />
                <StatMini label="DEF" value={selectedPlayer.defending} />
                <StatMini label="PHY" value={selectedPlayer.physicality} />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant="gold" size="md" className="flex-1"
                  onClick={() => { playRawClick(0.2); setSelectedPlayer(null); }}
                  disabled={selectedPlayer.marketValue > myClub!.transferBudget}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {selectedPlayer.marketValue > myClub!.transferBudget ? 'Insufficient Budget' : 'Make Offer'}
                </Button>
                <Button variant="secondary" size="md" onClick={() => setSelectedPlayer(null)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}

function StatMini({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-2 rounded-md bg-surface-2/60 border border-white/3 text-center">
      <div className="text-[9px] text-tertiary-c font-mono uppercase tracking-widest font-bold">{label}</div>
      <div className="text-sm font-mono font-semibold text-primary-c tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

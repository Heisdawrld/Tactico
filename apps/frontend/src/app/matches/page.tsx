'use client'

export const dynamic = 'force-dynamic';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { useSelectedClub } from '@/lib/useSelectedClub';
import { playRawClick } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getOfflineClub, OFFLINE_CLUBS } from '@/lib/game-data';
import { Calendar, ChevronRight, PlayCircle, Trophy, MapPin, Clock } from 'lucide-react';

export default function MatchesPage() {
  const { club, hydrated } = useSelectedClub();
  const fixtures = useAppStore((s) => s.fixtures);
  const currentWeek = useAppStore((s) => s.currentWeek);

  const clubFixtures = useMemo(() => {
    if (!club) return [];
    return fixtures.filter((f) => f.homeClubId === club.id || f.awayClubId === club.id);
  }, [club, fixtures]);

  const played = clubFixtures.filter((f) => f.status === 'finished');
  const upcoming = clubFixtures.filter((f) => f.status !== 'finished');
  const wins = played.filter((f) => {
    const isHome = f.homeClubId === club!.id;
    return (isHome && (f.homeScore || 0) > (f.awayScore || 0)) || (!isHome && (f.awayScore || 0) > (f.homeScore || 0));
  }).length;
  const draws = played.filter((f) => f.homeScore === f.awayScore).length;
  const losses = played.length - wins - draws;


  if (!club) return null;

  return (
    <div className="relative z-10">
      <div className="page-mobile px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto">
        <StaggerContainer className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6" stagger={0.05}>
          <StaggerItem>
            <div className="section-header !mb-1">Fixtures & Results</div>
            <h1 className="font-headline text-3xl lg:text-4xl font-bold tracking-tight text-primary-c">Matches</h1>
            <p className="text-tertiary-c text-sm mt-1">{club!.name} · Season 2026 · Week {currentWeek}</p>
          </StaggerItem>
          <StaggerItem className="grid grid-cols-3 gap-2">
            <RecordPill label="W" value={wins} tone="success" />
            <RecordPill label="D" value={draws} tone="warning" />
            <RecordPill label="L" value={losses} tone="danger" />
          </StaggerItem>
        </StaggerContainer>

        {/* Upcoming */}
        <div className="mb-6">
          <div className="section-header">Upcoming Fixtures</div>
          <div className="space-y-2">
            {upcoming.map((m, idx) => {
              const isHome = m.homeClubId === club!.id;
              const opp = OFFLINE_CLUBS.find((c) => c.id === (isHome ? m.awayClubId : m.homeClubId));
              if (!opp) return null;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card hover>
                    <CardContent className="!p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        {/* Competition badge */}
                        <div className="shrink-0 w-12 text-center">
                          <Badge variant={m.status === 'live' ? 'danger' : 'outline'} size="sm">
                            {m.status === 'live' ? 'LIVE' : `W${m.week}`}
                          </Badge>
                        </div>

                        {/* Match info */}
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                          <div className="flex min-w-0 flex-1 items-start gap-2 sm:items-center">
                            <span className={cn('text-[10px] font-mono font-bold uppercase tracking-wider', isHome ? 'text-success' : 'text-warning')}>
                              {isHome ? 'HOME' : 'AWAY'}
                            </span>
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-black shrink-0"
                              style={{ background: `linear-gradient(135deg, ${opp.homeKitColor}, ${opp.awayKitColor || opp.homeKitColor})` }}
                            >
                              {opp.shortName?.slice(0, 3)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-display font-semibold text-sm text-primary-c truncate">{opp.name}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-tertiary-c font-mono">
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="w-2.5 h-2.5" /> {m.matchDate}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5" /> {isHome ? club!.stadium : opp.stadium}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Play button */}
                        {m.status === 'live' || m.status === 'scheduled' ? (
                          <Link href="/match-simulation" onClick={() => playRawClick(0.15)} className="sm:ml-auto">
                            <Button variant={m.status === 'live' ? 'gold' : 'secondary'} size="sm" className="shrink-0">
                              <PlayCircle className="w-3.5 h-3.5" />
                              {m.status === 'live' ? 'Resume' : 'Play'}
                            </Button>
                          </Link>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="section-header">Recent Results</div>
          <div className="space-y-2">
            {played.slice().reverse().map((m, idx) => {
              const isHome = m.homeClubId === club!.id;
              const opp = OFFLINE_CLUBS.find((c) => c.id === (isHome ? m.awayClubId : m.homeClubId));
              if (!opp) return null;
              const ourScore = isHome ? m.homeScore : m.awayScore;
              const oppScore = isHome ? m.awayScore : m.homeScore;
              const result = ourScore! > oppScore! ? 'W' : ourScore === oppScore ? 'D' : 'L';

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card>
                    <CardContent className="!p-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm shrink-0',
                          result === 'W' ? 'bg-success/20 text-success' : result === 'D' ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'
                        )}>
                          {result}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-display font-medium text-sm text-primary-c truncate">
                            {isHome ? 'vs' : '@'} {opp.name}
                          </div>
                          <div className="text-[10px] text-tertiary-c font-mono">
                            {m.competition} · Week {m.week}
                          </div>
                        </div>
                        <div className="text-center shrink-0">
                          <div className="font-mono font-bold text-lg text-primary-c tabular-nums">
                            {ourScore} - {oppScore}
                          </div>
                          <div className="text-[9px] text-tertiary-c uppercase tracking-wider">
                            {isHome ? 'Home' : 'Away'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecordPill({ label, value, tone }: { label: string; value: number; tone: 'success' | 'warning' | 'danger' }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-md bg-surface-2/60 border border-white/5">
      <span className={cn(
        'text-xs font-bold',
        tone === 'success' && 'text-success',
        tone === 'warning' && 'text-warning',
        tone === 'danger' && 'text-danger',
      )}>{label}</span>
      <span className="text-lg font-mono font-bold text-primary-c tabular-nums">{value}</span>
    </div>
  );
}

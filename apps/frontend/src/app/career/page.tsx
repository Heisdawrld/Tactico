'use client'


import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { useSelectedClub } from '@/lib/useSelectedClub';
import { playRawClick } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { StaggerContainer, StaggerItem, AnimatedCounter } from '@/components/ui/motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Stat';
import { getOfflineClub, OFFLINE_CLUBS } from '@/lib/game-data';
import { standingToTableRow } from '@/lib/career-engine';
import { Trophy, TrendingUp, Target, ChevronRight, Award, Star } from 'lucide-react';

export default function CareerPage() {
  const { club, hydrated } = useSelectedClub();
  const currentWeek = useAppStore((s) => s.currentWeek);
  const currentSeason = useAppStore((s) => s.currentSeason);
  const seasonHistory = useAppStore((s) => s.seasonHistory);
  const squadMorale = useAppStore((s) => s.squadMorale);
  const fixtures = useAppStore((s) => s.fixtures);
  const continueGame = useAppStore((s) => s.continueGame);
  const leagueStandings = useAppStore((s) => s.leagueStandings);
  const boardConfidence = useAppStore((s) => s.boardConfidence);
  const leagueTable = useMemo(() => {
    if (!club) return [];
    const leagueId = club.leagueId || 1;
    const standings = leagueStandings[leagueId] ?? [];
    return standings.map((s, i) => standingToTableRow(s, i + 1));
  }, [club, leagueStandings]);
  const myRow = leagueTable.find((r) => club && r.clubId === club.id);

  const played = fixtures.filter(f => f.status === 'finished').length;
  const indicators = [
    { label: 'Season completed', value: fixtures.length ? Math.round(played / fixtures.length * 100) : 0,
      detail: `${played} of ${fixtures.length} matches played` },
    { label: 'Board confidence', value: boardConfidence, detail: 'Changes with your results' },
    { label: 'Squad morale', value: squadMorale, detail: 'Current dressing-room mood' },
  ];


  if (!club) return null;

  return (
    <div className="relative z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-6 pb-12 max-w-5xl mx-auto">
        <StaggerContainer className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6" stagger={0.05}>
          <StaggerItem>
            <div className="section-header !mb-1">Career Mode</div>
            <h1 className="font-headline text-3xl lg:text-4xl font-bold tracking-tight text-primary-c">Season {2025 + currentSeason}</h1>
            <p className="text-tertiary-c text-sm mt-1">{club!.name} · Week {currentWeek}</p>
          </StaggerItem>
          <StaggerItem>
            <Button variant="gold" size="md" onClick={() => { continueGame(); playRawClick(0.2); }}>
              <ChevronRight className="w-4 h-4" /> Continue
            </Button>
          </StaggerItem>
        </StaggerContainer>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* League position */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-gold-300" /><CardTitle>League Position</CardTitle></div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-headline font-bold text-gold-300">
                  <AnimatedCounter value={myRow?.position || 0} />
                </span>
                <span className="text-tertiary-c text-sm">of {leagueTable.length}</span>
              </div>
              <div className="text-[11px] text-tertiary-c font-mono mt-1">
                {myRow?.won}W {myRow?.drawn}D {myRow?.lost}L · {myRow?.points} pts
              </div>
              <div className="mt-3">
                <Badge variant={myRow && myRow.position <= 4 ? 'gold' : myRow && myRow.position <= 6 ? 'success' : 'default'} size="sm">
                  {myRow?.played === 0 ? 'SEASON START' : myRow?.position === 1 ? 'LEAGUE LEADERS' : `POSITION ${myRow?.position ?? '—'}`}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-gold-300" /><CardTitle>Recent Form</CardTitle></div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1.5 mb-3">
                {myRow?.form.map((r, i) => (
                  <div key={i} className={cn(
                    'w-7 h-7 rounded flex items-center justify-center text-xs font-bold',
                    r === 'W' ? 'bg-success/20 text-success' : r === 'D' ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'
                  )}>{r}</div>
                ))}
              </div>
              <div className="text-[11px] text-tertiary-c font-mono">
                Goals: {myRow?.goalsFor}F {myRow?.goalsAgainst}A ({(myRow?.goalDifference || 0) > 0 ? '+' : ''}{myRow?.goalDifference})
              </div>
            </CardContent>
          </Card>

          {/* Board confidence */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><Star className="w-4 h-4 text-gold-300" /><CardTitle>Board Confidence</CardTitle></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-headline font-bold text-gold-300 mb-2">
                <AnimatedCounter value={boardConfidence} />%
              </div>
              <ProgressBar value={boardConfidence} tone="gold" />
              <div className="text-[11px] text-tertiary-c mt-2">
                Job security: {boardConfidence >= 70 ? 'Secure' : boardConfidence >= 50 ? 'Under review' : 'At risk'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* League Table */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-gold-300" /><CardTitle>{club!.league} Table</CardTitle></div>
            <CardDescription>{leagueTable.length} clubs in this offline competition · Home and away schedule</CardDescription>
          </CardHeader>
          <CardContent className="!p-0">
            <div className="divide-y divide-white/3">
              {leagueTable.map((row, idx) => {
                const isMe = row.clubId === club!.id;
                return (
                  <motion.div
                    key={row.clubId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                      isMe ? 'bg-gold-soft/40 border-l-2 border-gold-300' : 'hover:bg-white/3'
                    )}
                  >
                    <span className={cn(
                      'w-6 text-center font-mono font-bold',
                      row.position <= 4 ? 'text-gold-300' : row.position <= 6 ? 'text-success' : 'text-tertiary-c'
                    )}>{row.position}</span>
                    <span className={cn('flex-1 font-medium text-truncate-1', isMe ? 'text-gold-300' : 'text-primary-c')}>{row.clubName}</span>
                    <span className="text-tertiary-c font-mono text-xs w-8 text-center">{row.played}</span>
                    <span className="text-tertiary-c font-mono text-xs w-8 text-center hidden sm:block">{row.won}-{row.drawn}-{row.lost}</span>
                    <span className="text-tertiary-c font-mono text-xs w-12 text-right hidden sm:block">{row.goalsFor}:{row.goalsAgainst}</span>
                    <span className="text-primary-c font-mono font-bold tabular-nums w-8 text-right">{row.points}</span>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {seasonHistory.length > 0 && <Card className="mb-6">
          <CardHeader><CardTitle>Season archive</CardTitle><CardDescription>Final tables from your career</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {[...seasonHistory].reverse().map(season => <details key={season.season} className="rounded-lg border border-white/10 p-3">
              <summary className="cursor-pointer text-sm font-semibold">{2025 + season.season} · Champions: {season.standings[0]?.clubName ?? '—'}</summary>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="text-tertiary-c"><th scope="col">Pos</th><th scope="col">Club</th><th scope="col">P</th><th scope="col">GD</th><th scope="col">Pts</th></tr></thead>
                  <tbody>{season.standings.map((row, index) => <tr key={row.clubId} className={row.clubId === club.id ? 'text-gold-300' : 'text-primary-c'}>
                    <td className="py-2">{index + 1}</td><td>{row.clubName}</td><td>{row.played}</td><td>{row.goalDifference}</td><td>{row.points}</td>
                  </tr>)}</tbody>
                </table>
              </div>
            </details>)}
          </CardContent>
        </Card>}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><Target className="w-4 h-4 text-gold-300" /><CardTitle>Season progress</CardTitle></div>
            <CardDescription>From your current career</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {indicators.map((indicator) => (
              <div key={indicator.label} className="p-3 rounded-md bg-surface-2/50 border border-white/3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-primary-c">{indicator.label}</span>
                    <div className="text-xs text-tertiary-c mt-1">{indicator.detail}</div>
                  </div>
                  <span className="text-sm font-mono font-bold text-gold-300 tabular-nums">{indicator.value}%</span>
                </div>
                <ProgressBar value={indicator.value} tone={indicator.value >= 75 ? 'success' : indicator.value >= 50 ? 'gold' : 'warning'} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

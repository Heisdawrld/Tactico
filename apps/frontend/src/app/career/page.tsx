'use client'

export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
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
import { getOfflineClub, getOfflineLeagueTable, OFFLINE_CLUBS } from '@/lib/game-data';
import { Trophy, TrendingUp, Target, ChevronRight, Award, Star } from 'lucide-react';

export default function CareerPage() {
  const { club, hydrated } = useSelectedClub();
  const currentWeek = useAppStore((s) => s.currentWeek);
  const advanceWeek = useAppStore((s) => s.advanceWeek);
  const leagueTable = useMemo(() => club ? getOfflineLeagueTable(club.leagueId || 1) : [], [club]);
  const myRow = leagueTable.find((r) => club && r.clubId === club.id);

  const [objectives] = useState([
    { id: 1, label: 'Qualify for Champions League', target: 'Top 4', progress: 75, priority: 'high', deadline: 'End of Season' },
    { id: 2, label: 'Reach FA Cup Quarterfinal', target: 'QF', progress: 60, priority: 'medium', deadline: 'March' },
    { id: 3, label: 'Develop Youth Player', target: '1 player to 80+ OVR', progress: 40, priority: 'medium', deadline: 'End of Season' },
    { id: 4, label: 'Maintain Wage Structure', target: 'Wages < €80M/yr', progress: 90, priority: 'low', deadline: 'Ongoing' },
  ]);


  if (!club) return null;

  return (
    <div className="relative z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-6 pb-12 max-w-5xl mx-auto">
        <StaggerContainer className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6" stagger={0.05}>
          <StaggerItem>
            <div className="section-header !mb-1">Career Mode</div>
            <h1 className="font-headline text-3xl lg:text-4xl font-bold tracking-tight text-primary-c">Season 2026</h1>
            <p className="text-tertiary-c text-sm mt-1">{club!.name} · Week {currentWeek}</p>
          </StaggerItem>
          <StaggerItem>
            <Button variant="gold" size="md" onClick={() => { advanceWeek(); playRawClick(0.2); }}>
              <ChevronRight className="w-4 h-4" /> Advance Week
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
                  {myRow && myRow.position <= 4 ? 'CHAMPIONS LEAGUE' : myRow && myRow.position <= 6 ? 'EUROPA LEAGUE' : 'MID-TABLE'}
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
                <AnimatedCounter value={78} />%
              </div>
              <ProgressBar value={78} tone="gold" />
              <div className="text-[11px] text-tertiary-c mt-2">Job security: Secure</div>
            </CardContent>
          </Card>
        </div>

        {/* League Table */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-gold-300" /><CardTitle>{club!.league} Table</CardTitle></div>
            <CardDescription>Updated through Week {currentWeek}</CardDescription>
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

        {/* Board Objectives */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><Target className="w-4 h-4 text-gold-300" /><CardTitle>Season Objectives</CardTitle></div>
            <CardDescription>Set by the board · Failure may result in sacking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {objectives.map((obj) => (
              <div key={obj.id} className="p-3 rounded-md bg-surface-2/50 border border-white/3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary-c">{obj.label}</span>
                      <Badge variant={obj.priority === 'high' ? 'danger' : obj.priority === 'medium' ? 'warning' : 'default'} size="sm">
                        {obj.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-tertiary-c mt-0.5">Target: {obj.target} · Deadline: {obj.deadline}</div>
                  </div>
                  <span className="text-sm font-mono font-bold text-gold-300 tabular-nums">{obj.progress}%</span>
                </div>
                <ProgressBar value={obj.progress} tone={obj.progress >= 75 ? 'success' : obj.progress >= 50 ? 'gold' : 'warning'} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

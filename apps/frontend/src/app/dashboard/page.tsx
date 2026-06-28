'use client';

export const dynamic = 'force-dynamic';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ChevronRight,
  Clock3,
  Mic,
  Newspaper,
  PlayCircle,
  Shield,
  Star,
  Target,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react';
import { useAppStore, type InboxItem } from '@/lib/store';
import { useSelectedClub } from '@/lib/useSelectedClub';
import { getOfflineClub } from '@/lib/game-data';
import { getNextUserFixture } from '@/lib/career-engine';
import { playSfx } from '@/lib/audio';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar, RatingBadge } from '@/components/ui/Stat';

function diffDays(currentDate: string, targetDate: string): number {
  const current = new Date(`${currentDate}T12:00:00Z`);
  const target = new Date(`${targetDate}T12:00:00Z`);
  return Math.round((target.getTime() - current.getTime()) / 86_400_000);
}

function getPhaseLabel(phase: string): string {
  switch (phase) {
    case 'match_eve':
      return 'Match Eve';
    case 'matchday':
      return 'Matchday';
    case 'post_match':
      return 'Post Match';
    case 'recovery_day':
      return 'Recovery Day';
    default:
      return 'Normal Day';
  }
}

function getPriorityVariant(priority: InboxItem['priority']) {
  if (priority === 'high') return 'gold';
  if (priority === 'medium') return 'info';
  return 'outline';
}

function getCategoryIcon(category: InboxItem['category']) {
  if (category === 'match') return Calendar;
  if (category === 'media') return Mic;
  if (category === 'board') return Shield;
  if (category === 'world') return Newspaper;
  return Users;
}

export default function DashboardPage() {
  const { club } = useSelectedClub();
  const currentSeason = useAppStore((state) => state.currentSeason);
  const currentWeek = useAppStore((state) => state.currentWeek);
  const currentDate = useAppStore((state) => state.currentDate);
  const currentPhase = useAppStore((state) => state.currentPhase);
  const continueGame = useAppStore((state) => state.continueGame);
  const fixtures = useAppStore((state) => state.fixtures);
  const inbox = useAppStore((state) => state.inbox);
  const pressEvents = useAppStore((state) => state.pressEvents);
  const boardConfidence = useAppStore((state) => state.boardConfidence);
  const squadMorale = useAppStore((state) => state.squadMorale);
  const fanSentiment = useAppStore((state) => state.fanSentiment);
  const clubBudgets = useAppStore((state) => state.clubBudgets);
  const leagueStandings = useAppStore((state) => state.leagueStandings);
  const getSquad = useAppStore((state) => state.getSquad);

  const squad = useMemo(() => (club ? getSquad(club.id) : []), [club, getSquad]);
  const topPlayers = useMemo(
    () => [...squad].sort((a, b) => b.overallRating - a.overallRating).slice(0, 5),
    [squad],
  );
  const nextFixture = useMemo(
    () => (club ? getNextUserFixture(fixtures, club.id) : null),
    [club, fixtures],
  );
  const nextOpponent = useMemo(() => {
    if (!club || !nextFixture) return null;
    const opponentId = nextFixture.homeClubId === club.id ? nextFixture.awayClubId : nextFixture.homeClubId;
    return getOfflineClub(opponentId);
  }, [club, nextFixture]);
  const daysUntilMatch = nextFixture && currentDate ? diffDays(currentDate, nextFixture.matchDate) : null;
  const standings = club ? leagueStandings[club.leagueId || 1] ?? [] : [];
  const topStandings = useMemo(() => {
    if (!club) return [];
    const top = standings.slice(0, 5);
    const userRow = standings.find((row) => row.clubId === club.id);
    const inTop = top.some((row) => row.clubId === club.id);
    return userRow && !inTop ? [...top, userRow] : top;
  }, [club, standings]);
  const transferBudget = club ? clubBudgets[club.id] ?? club.transferBudget : 0;

  if (!club) {
    return (
      <div className="relative z-10 flex min-h-[70vh] items-center justify-center px-6">
        <Card className="max-w-xl text-center">
          <CardContent className="space-y-5 py-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold-soft">
              <Trophy className="h-10 w-10 text-gold-300" />
            </div>
            <div>
              <h1 className="font-headline text-3xl font-bold text-primary-c">No Club Selected</h1>
              <p className="mt-2 text-sm text-tertiary-c">
                Start a career to unlock the dashboard, inbox flow, and matchday buildup.
              </p>
            </div>
            <Link href="/start">
              <Button size="lg">
                Select a Club
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative z-10 px-4 py-6 pb-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-white/8 bg-surface-1/70 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl shadow-2xl"
                style={{ background: `linear-gradient(135deg, ${club.homeKitColor}, ${club.awayKitColor})` }}
              >
                <span className="font-headline text-3xl font-black text-black/75">
                  {club.shortName.slice(0, 3)}
                </span>
              </div>
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="gold" size="sm">{club.league.toUpperCase()}</Badge>
                  <Badge variant="outline" size="sm">{club.country.toUpperCase()}</Badge>
                  <Badge variant={currentPhase === 'matchday' ? 'danger' : 'info'} size="sm">
                    {getPhaseLabel(currentPhase).toUpperCase()}
                  </Badge>
                </div>
                <h1 className="font-headline text-3xl font-bold text-primary-c lg:text-4xl">{club.name}</h1>
                <p className="mt-1 text-xs font-mono tracking-widest text-tertiary-c">
                  SEASON {currentSeason} · WEEK {currentWeek} · DATE {currentDate || '2026-08-13'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <HeroStat icon={<Star className="h-3.5 w-3.5" />} label="REP" value={club.reputation} tone="gold" />
              <HeroStat icon={<Users className="h-3.5 w-3.5" />} label="SQUAD" value={squad.length} />
              <HeroStat icon={<Wallet className="h-3.5 w-3.5" />} label="BUDGET" value={formatCurrency(transferBudget)} />
              <HeroStat
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="NEXT"
                value={
                  daysUntilMatch == null
                    ? '—'
                    : daysUntilMatch <= 0
                      ? 'TODAY'
                      : `${daysUntilMatch}D`
                }
                tone={daysUntilMatch != null && daysUntilMatch <= 1 ? 'gold' : 'default'}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-white/6 pt-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-tertiary-c">Command Center</p>
              <p className="mt-1 text-sm text-secondary-c">
                {currentPhase === 'matchday'
                  ? `Everything points to ${nextOpponent?.name ?? 'your next fixture'}. The buildup is done.`
                  : currentPhase === 'match_eve'
                    ? `The noise is rising ahead of ${nextOpponent?.name ?? 'the next match'}. One more day and it is kickoff.`
                    : `Use Continue to move the world one meaningful day at a time until the next match becomes the story.`}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/tactics">
                <Button variant="secondary">
                  <Target className="h-4 w-4" />
                  Tactics
                </Button>
              </Link>
              {currentPhase === 'matchday' ? (
                <Link href="/match-simulation" onClick={() => playSfx('whistle')}>
                  <Button variant="gold">
                    <PlayCircle className="h-4 w-4" />
                    Play Match
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="gold"
                  onClick={() => {
                    continueGame();
                    playSfx('advance-week');
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                  Continue
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-gold-300" />
                <CardTitle>Inbox</CardTitle>
                <CardDescription>What needs your attention right now</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="!p-0">
              <div className="divide-y divide-white/4">
                {inbox.slice(0, 6).map((item) => {
                  const Icon = getCategoryIcon(item.category);
                  return (
                    <div key={item.id} className="px-4 py-3 transition-colors hover:bg-white/3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-md bg-surface-2 p-2 text-gold-300">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <Badge variant={getPriorityVariant(item.priority)} size="sm">
                              {item.priority.toUpperCase()}
                            </Badge>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-tertiary-c">
                              {item.category}
                            </span>
                            <span className="text-[10px] font-mono text-tertiary-c">{item.createdAt}</span>
                          </div>
                          <p className="text-sm font-medium text-primary-c">{item.title}</p>
                          <p className="mt-1 text-sm text-secondary-c">{item.body}</p>
                          {item.actionPath && item.actionLabel ? (
                            <div className="mt-2">
                              <Link href={item.actionPath} className="text-xs font-semibold text-gold-300 hover:text-gold-200">
                                {item.actionLabel} <ChevronRight className="inline h-3 w-3" />
                              </Link>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gold-300" />
                <CardTitle>Next Match</CardTitle>
                <CardDescription>The next thing the world cares about</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {nextFixture && nextOpponent ? (
                <>
                  <div className="rounded-xl border border-white/6 bg-surface-2/50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <Badge variant={nextFixture.homeClubId === club.id ? 'success' : 'warning'} size="sm">
                        {nextFixture.homeClubId === club.id ? 'HOME' : 'AWAY'}
                      </Badge>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-tertiary-c">
                        {nextFixture.competition}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-primary-c">{nextOpponent.name}</div>
                    <div className="mt-1 text-xs font-mono tracking-wide text-tertiary-c">
                      {nextFixture.matchDate} · {nextFixture.homeClubId === club.id ? club.stadium : nextOpponent.stadium}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MiniStat label="COUNTDOWN" value={daysUntilMatch == null ? '—' : daysUntilMatch <= 0 ? 'TODAY' : `${daysUntilMatch} DAYS`} />
                      <MiniStat label="MATCH STATUS" value={currentPhase === 'matchday' ? 'READY' : currentPhase === 'match_eve' ? 'EVE' : 'BUILDUP'} />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-secondary-c">
                    <p>
                      {daysUntilMatch != null && daysUntilMatch > 1
                        ? `The media expect this one to test your shape and patience.`
                        : daysUntilMatch === 1
                          ? `Press day is here. Pundits want to know whether your setup can tilt the game.`
                          : `The tunnel is waiting. This is where your week turns into a result.`}
                    </p>
                    <div className="flex gap-2">
                      <Link href="/matches">
                        <Button variant="secondary" size="sm">Fixture List</Button>
                      </Link>
                      {currentPhase === 'matchday' ? (
                        <Link href="/match-simulation">
                          <Button variant="gold" size="sm">
                            <PlayCircle className="h-4 w-4" />
                            Kick Off
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/press">
                          <Button variant="secondary" size="sm">
                            <Mic className="h-4 w-4" />
                            Media Room
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-secondary-c">No upcoming fixture is loaded yet.</p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gold-300" />
                <CardTitle>Club Pulse</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <MetricRow label="Board Confidence" value={boardConfidence} tone="gold" />
              <MetricRow label="Squad Morale" value={squadMorale} tone="success" />
              <MetricRow label="Fan Sentiment" value={fanSentiment} tone="warning" />
              <div className="rounded-lg border border-white/6 bg-surface-2/50 p-3">
                <div className="text-[10px] font-mono uppercase tracking-widest text-tertiary-c">Transfer Budget</div>
                <div className="mt-1 text-2xl font-bold text-primary-c">{formatCurrency(transferBudget)}</div>
                <div className="mt-1 text-xs text-tertiary-c">Stadium cap {formatNumber(club.stadiumCapacity)}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-gold-300" />
                <CardTitle>League Snapshot</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="!p-0">
              <div className="divide-y divide-white/4">
                {topStandings.map((row, index) => {
                  const isUserClub = row.clubId === club.id;
                  const position = standings.findIndex((item) => item.clubId === row.clubId) + 1;
                  return (
                    <div
                      key={row.clubId}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3',
                        isUserClub && 'bg-gold-soft/10',
                      )}
                    >
                      <div className="w-6 text-center font-mono text-sm text-tertiary-c">{position || index + 1}</div>
                      <div className="min-w-0 flex-1">
                        <div className={cn('text-sm font-medium', isUserClub ? 'text-gold-200' : 'text-primary-c')}>
                          {row.clubName}
                        </div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-tertiary-c">
                          P {row.played} · GD {row.goalDifference >= 0 ? `+${row.goalDifference}` : row.goalDifference}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-lg font-bold text-primary-c">{row.points}</div>
                        <div className="text-[10px] font-mono text-tertiary-c">PTS</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-gold-300" />
                <CardTitle>Top Players</CardTitle>
                <CardDescription>Who can decide the next match</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="!p-0">
              <div className="divide-y divide-white/4">
                {topPlayers.map((player) => (
                  <div key={player.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-secondary-c">
                      {player.firstName[0]}{player.lastName[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-primary-c">
                        {player.firstName} {player.lastName}
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-tertiary-c">
                        {player.position} · AGE {player.age}
                      </div>
                    </div>
                    <RatingBadge rating={player.overallRating} size="sm" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-gold-300" />
                <CardTitle>Media Buzz</CardTitle>
                <CardDescription>How the world is framing your club</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="!p-0">
              <div className="divide-y divide-white/4">
                {pressEvents.length === 0 ? (
                  <div className="px-4 py-5 text-sm text-secondary-c">
                    The media room is quiet for now. Hit Continue and the world will start talking.
                  </div>
                ) : (
                  pressEvents.slice(0, 5).map((story) => (
                    <div key={story.id} className="px-4 py-3">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant="outline" size="sm">TACTICO WIRE</Badge>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-tertiary-c">{story.time}</span>
                      </div>
                      <p className="text-sm text-primary-c">{story.headline}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gold-300" />
                <CardTitle>Manager Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-secondary-c">
              <p>
                The dashboard now tracks your football week live: inbox items, public mood, next fixture pressure,
                and the growing matchday narrative around {club.name}.
              </p>
              <p>
                The current goal is to make Continue the heartbeat of the save, so every click moves the world one
                step closer to kickoff instead of just skipping screens.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/career">
                  <Button variant="secondary" size="sm">Career</Button>
                </Link>
                <Link href="/matches">
                  <Button variant="secondary" size="sm">Matches</Button>
                </Link>
                <Link href="/press">
                  <Button variant="secondary" size="sm">Press</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function HeroStat({
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
    <div className="rounded-xl border border-white/6 bg-surface-2/50 px-4 py-3">
      <div className="mb-1 flex items-center gap-1.5 text-tertiary-c">
        {icon}
        <span className="text-[9px] font-mono uppercase tracking-widest">{label}</span>
      </div>
      <div className={cn('font-headline text-lg font-bold text-primary-c', tone === 'gold' && 'text-gold-300')}>
        {value}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/6 bg-surface-3/50 p-3">
      <div className="text-[9px] font-mono uppercase tracking-widest text-tertiary-c">{label}</div>
      <div className="mt-1 text-sm font-semibold text-primary-c">{value}</div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'gold' | 'success' | 'warning';
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-mono uppercase tracking-widest text-tertiary-c">{label}</span>
        <span className="font-mono text-primary-c">{value}%</span>
      </div>
      <ProgressBar value={value} tone={tone} />
    </div>
  );
}

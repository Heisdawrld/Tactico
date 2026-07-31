'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  Calendar,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  Mic,
  Newspaper,
  PlayCircle,
  Shield,
  Trophy,
  Users,
} from 'lucide-react';
import { useAppStore, type InboxItem } from '@/lib/store';
import { useSelectedClub } from '@/lib/useSelectedClub';
import { getOfflineClub } from '@/lib/game-data';
import { getNextUserFixture } from '@/lib/career-engine';
import { playSfx } from '@/lib/audio';
import { formatCurrency } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar, RatingBadge } from '@/components/ui/Stat';
import { PageWrapper } from '@/components/shell/PageWrapper';

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
  if (priority === 'high') return 'gold' as const;
  if (priority === 'medium') return 'info' as const;
  return 'outline' as const;
}

function getCategoryIcon(category: InboxItem['category']) {
  if (category === 'match') return Calendar;
  if (category === 'media') return Mic;
  if (category === 'board') return Shield;
  if (category === 'world') return Newspaper;
  return Users;
}

function DashboardContent() {
  const { club } = useSelectedClub();
  const currentSeason = useAppStore((state) => state.currentSeason);
  const currentWeek = useAppStore((state) => state.currentWeek);
  const currentDate = useAppStore((state) => state.currentDate);
  const currentPhase = useAppStore((state) => state.currentPhase);
  const continueGame = useAppStore((state) => state.continueGame);
  const fixtures = useAppStore((state) => state.fixtures);
  const inbox = useAppStore((state) => state.inbox);
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
    const opponentId = nextFixture.homeClubId === club.id
      ? nextFixture.awayClubId
      : nextFixture.homeClubId;
    return getOfflineClub(opponentId);
  }, [club, nextFixture]);

  if (!club) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
            <Trophy className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">No Club Selected</h2>
            <p className="text-muted-foreground">Start your managerial career by selecting a club.</p>
          </div>
          <Button asChild>
            <Link href="/start">Select Club</Link>
          </Button>
        </div>
      </div>
    );
  }

  const daysUntilMatch = nextFixture && currentDate
    ? diffDays(currentDate, nextFixture.matchDate)
    : null;
  const standings = leagueStandings[club.leagueId || 1] ?? [];
  const userStanding = standings.find((row) => row.clubId === club.id);
  const sortedStandings = [...standings].sort((a, b) =>
    b.points - a.points || b.goalDifference - a.goalDifference,
  );
  const leaguePosition = sortedStandings.findIndex((row) => row.clubId === club.id) + 1;
  const transferBudget = clubBudgets[club.id] ?? club.transferBudget ?? 0;

  const handleContinue = () => {
    continueGame();
    playSfx('click');
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Welcome back, Manager</h1>
          <p className="text-sm text-muted-foreground">
            {getPhaseLabel(currentPhase)} — Season {currentSeason}, Week {currentWeek}
          </p>
        </div>
        {nextFixture && (
          <Button onClick={handleContinue} className="gap-2">
            <PlayCircle className="h-4 w-4" />
            Continue
          </Button>
        )}
      </div>

      {nextFixture && nextOpponent && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>Next Fixture</CardTitle>
              {daysUntilMatch !== null && (
                <Badge variant={daysUntilMatch === 0 ? 'gold' : 'outline'}>
                  {daysUntilMatch === 0 ? 'TODAY' : `${daysUntilMatch} days`}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-sm font-semibold">{club.shortName || club.name.slice(0, 3)}</div>
                  <div className="text-xs text-muted-foreground">HOME</div>
                </div>
                <span className="text-muted-foreground">vs</span>
                <div className="text-center">
                  <div className="text-sm font-semibold">
                    {nextOpponent.shortName || nextOpponent.name.slice(0, 3)}
                  </div>
                  <div className="text-xs text-muted-foreground">AWAY</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{nextFixture.competition}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(nextFixture.matchDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/tactics">Set Tactics</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/squad">View Squad</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatusCard title="Board Confidence" value={boardConfidence} label="Confidence" />
        <StatusCard title="Squad Morale" value={squadMorale} label="Morale" />
        <StatusCard title="Fan Sentiment" value={fanSentiment} label="Sentiment" />
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Transfer Budget</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold-300">{formatCurrency(transferBudget)}</div>
          </CardContent>
        </Card>
      </div>

      {topPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Your strongest players</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPlayers.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-lg bg-surface-2/50 p-3 transition-colors hover:bg-surface-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 font-mono text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {player.fullName || `${player.firstName} ${player.lastName}`}
                    </div>
                    <div className="text-xs text-muted-foreground">{player.position}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RatingBadge rating={player.overallRating} size="sm" />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {userStanding && (
        <Card>
          <CardHeader>
            <CardTitle>League Position</CardTitle>
            <CardDescription>Your current campaign standing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg bg-gold-soft/50 p-3">
              <div>
                <div className="font-medium">{club.name}</div>
                <div className="text-xs text-muted-foreground">Position {leaguePosition || '—'}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{userStanding.points} pts</div>
                <div className="text-xs text-muted-foreground">
                  {userStanding.won}W — {userStanding.drawn}D — {userStanding.lost}L
                </div>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link href="/career">View Full Table</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {inbox.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inbox</CardTitle>
            <CardDescription>Latest club updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {inbox.slice(0, 3).map((item) => {
              const Icon = getCategoryIcon(item.category);
              return (
                <Link
                  key={item.id}
                  href={item.actionPath || '/inbox'}
                  className="flex items-start gap-3 rounded-lg bg-surface-2/50 p-3 transition-colors hover:bg-surface-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/50">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{item.title}</div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">{item.body}</div>
                    <Badge variant={getPriorityVariant(item.priority)} size="sm" className="mt-2">
                      {item.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/inbox">Open Inbox</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <QuickAction href="/squad" label="Squad" icon={<Users className="h-5 w-5" />} />
            <QuickAction href="/tactics" label="Tactics" icon={<ClipboardList className="h-5 w-5" />} />
            <QuickAction href="/training" label="Training" icon={<Dumbbell className="h-5 w-5" />} />
            <QuickAction href="/transfers" label="Transfers" icon={<ArrowLeftRight className="h-5 w-5" />} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusCard({ title, value, label }: { title: string; value: number; label: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <RatingBadge rating={value} label={label} />
          <ProgressBar value={value} max={100} />
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Button asChild variant="outline" size="sm" className="h-auto p-4">
      <Link href={href} className="flex flex-col items-center gap-2">
        {icon}
        <span className="text-xs">{label}</span>
      </Link>
    </Button>
  );
}

export default function DashboardPage() {
  return (
    <PageWrapper requireClub loadingMessage="Loading dashboard...">
      <DashboardContent />
    </PageWrapper>
  );
}

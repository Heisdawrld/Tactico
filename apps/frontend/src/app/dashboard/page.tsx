'use client';


import { useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  Calendar,
  ChevronRight,
  ClipboardList,
  Clock3,
  Dumbbell,
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

function DashboardContent() {
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
    return [...standings].sort((a, b) => b.points - a.points).slice(0, 5);
  }, [standings]);

  const userStanding = useMemo(() => {
    return standings.find((s) => s.clubId === club?.id);
  }, [standings, club]);

  const handleContinue = () => {
    continueGame();
    playSfx('click');
  };

  if (!club) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
              <Trophy className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">No Club Selected</h2>
              <p className="text-muted-foreground">
                Start your managerial career by selecting a club
              </p>
            </div>
            <Button asChild>
              <Link href="/start">Select Club</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Welcome back, Manager
            </h1>
            <p className="text-muted-foreground text-sm">
              {getPhaseLabel(currentPhase)}  Season {currentSeason}, Week {currentWeek}
            </p>
          </div>
          {nextFixture && (
            <Button
              onClick={handleContinue}
              className="gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Continue
            </Button>
          )}
        </div>
      </div>

      {/* Next Fixture Card */}
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="font-semibold text-sm">{club.shortName || club.name.slice(0, 3)}
                  </div>
                  <div className="text-xs text-muted-foreground">HOME</div>
                </div>
                <span className="text-muted-foreground">vs</span>
                <div className="text-center">
                  <div className="font-semibold text-sm">{nextOpponent.shortName || nextOpponent.name.slice(0, 3)}
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

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Board Confidence</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <RatingBadge value={boardConfidence} max={100} label="Confidence" />
              <ProgressBar value={boardConfidence} max={100} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Squad Morale</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <RatingBadge value={squadMorale} max={100} label="Morale" />
              <ProgressBar value={squadMorale} max={100} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fan Sentiment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <RatingBadge value={fanSentiment} max={100} label="Sentiment" />
              <ProgressBar value={fanSentiment} max={100} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Transfer Budget</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold-300">
              {formatCurrency(clubBudgets.transferBudget || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Players */}
      {topPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Your best players this season</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-2/50 hover:bg-surface-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center font-mono text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{player.fullName || `${player.firstName} ${player.lastName}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {player.position}  Rating: {player.overallRating}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RatingBadge value={player.overallRating} max={99} size="sm" />
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* League Standings */}
      {userStanding && (
        <Card>
          <CardHeader>
            <CardTitle>League Standings</CardTitle>
            <CardDescription>Your current position</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gold-soft/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold-soft flex items-center justify-center font-bold text-gold-500">
                    {userStanding?.points}
                  </div>
                  <div>
                    <div className="font-medium">{club.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Position: {topStandings.findIndex(s => s.clubId === club.id) + 1 || userStanding?.points}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {userStanding.won}W - {userStanding.drawn}D - {userStanding.lost}L
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {userStanding.goalsFor} - {userStanding.goalsAgainst} ({userStanding.goalDifference})
                  </div>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/career">View Full Table</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inbox */}
      {inbox.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inbox</CardTitle>
            <CardDescription>Latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inbox.slice(0, 3).map((item) => {
                const Icon = getCategoryIcon(item.category);
                return (
                  <Link
                    key={item.id}
                    href={item.actionPath || '#'}
                    className="flex items-start gap-3 p-3 rounded-lg bg-surface-2/50 hover:bg-surface-3 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{item.body}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant={getPriorityVariant(item.priority)} size="sm">
                          {item.priority.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                  </Link>
                );
              })}
            </div>
            {inbox.length > 3 && (
              <Button asChild variant="outline" size="sm" className="w-full mt-4">
                <Link href="#">View All Notifications</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button asChild variant="outline" size="sm" className="h-auto p-4">
              <Link href="/squad" className="flex flex-col items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="text-xs">Squad</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-auto p-4">
              <Link href="/tactics" className="flex flex-col items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                <span className="text-xs">Tactics</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-auto p-4">
              <Link href="/training" className="flex flex-col items-center gap-2">
                <Dumbbell className="w-5 h-5" />
                <span className="text-xs">Training</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-auto p-4">
              <Link href="/transfers" className="flex flex-col items-center gap-2">
                <ArrowLeftRight className="w-5 h-5" />
                <span className="text-xs">Transfers</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <PageWrapper requireClub={true} loadingMessage="Loading dashboard...">
      <DashboardContent />
    </PageWrapper>
  );
}

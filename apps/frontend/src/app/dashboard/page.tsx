'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Trophy, Users, Wallet, Building2, TrendingUp, Activity,
  ArrowUpRight, ArrowDownRight, ChevronRight, Star,
  Calendar, Target, Shield, Flame, Zap, Eye, Quote,
} from 'lucide-react';
import { Club } from '@/types/club';
import { Player } from '@/types/player';
import { apiFetch } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { playSfx } from '@/lib/audio';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatBlock, RatingBadge, ProgressBar, Sparkline } from '@/components/ui/Stat';
import {
  PageTransition, StaggerContainer, StaggerItem,
  AnimatedCounter, FadeInOnView, GlowOrb, ParticleField,
  ShimmerText, ScaleIn,
} from '@/components/ui/motion';

/**
 * Dashboard — the showcase page.
 *
 * Layout (Bloomberg-dense, multi-column):
 *
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │  HERO: Club crest + name + season/week + quick stats       │
 *  ├──────────────┬───────────────────┬─────────────────────────┤
 *  │ Squad morale │ Form (last 5)     │ Board confidence        │
 *  ├──────────────┴───────────────────┴─────────────────────────┤
 *  │  KPI ROW: 6 metric tiles with sparklines + deltas         │
 *  ├──────────────────────────┬────────────────────────────────┤
 *  │  TOP PERFORMERS (table)   │  UPCOMING FIXTURES            │
 *  │  Rating · Goals · Assists │  Next 3 matches               │
 *  ├──────────────────────────┼────────────────────────────────┤
 *  │  INJURY REPORT            │  MEDIA BUZZ (latest stories)  │
 *  │  Player · Status · ETA    │  Source · Headline · Time     │
 *  ├──────────────────────────┴────────────────────────────────┤
 *  │  FINANCE OVERVIEW (income vs expenses + sparkline)        │
 *  └───────────────────────────────────────────────────────────┘
 */
export default function DashboardPage() {
  const selectedClubId = useAppStore((s) => s.selectedClubId);
  const currentSeason = useAppStore((s) => s.currentSeason);
  const currentWeek = useAppStore((s) => s.currentWeek);
  const advanceWeek = useAppStore((s) => s.advanceWeek);

  const [club, setClub] = useState<Club | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedClubId) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const clubs: Club[] = await apiFetch('/api/clubs');
        const c = clubs.find((x) => x.id === selectedClubId);
        setClub(c || null);
        const allPlayers: Player[] = await apiFetch('/api/players');
        setPlayers(allPlayers.filter((p) => p.clubId === selectedClubId));
      } catch (e) {
        console.error('Dashboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedClubId]);

  // ---------- DERIVED DATA ----------
  const topPlayers = useMemo(
    () => [...players].sort((a, b) => b.overallRating - a.overallRating).slice(0, 5),
    [players]
  );
  const avgRating = useMemo(
    () => (players.length ? Math.round(players.reduce((s, p) => s + p.overallRating, 0) / players.length) : 0),
    [players]
  );
  const totalWages = useMemo(
    () => players.reduce((s, p) => s + (p.wage || 0), 0),
    [players]
  );

  // ---------- LOADING STATE ----------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-gold-soft border-t-gold-300 animate-spin" />
          <p className="text-sm text-tertiary-c font-mono tracking-widest">LOADING DASHBOARD…</p>
        </div>
      </div>
    );
  }

  // ---------- NO CLUB SELECTED ----------
  if (!club) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center h-full p-12 gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gold-soft flex items-center justify-center">
            <Trophy className="w-10 h-10 text-gold-300" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-headline font-bold gradient-text-premium">No Club Selected</h1>
            <p className="text-tertiary-c text-sm max-w-md">
              Choose a club to begin your managerial career. Every decision will define your legacy.
            </p>
          </div>
          <Link href="/start">
            <Button size="lg">
              Select a Club
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </PageTransition>
    );
  }

  // ---------- MAIN DASHBOARD ----------
  return (
    <PageTransition>
      <div className="relative">
        {/* Decorative background */}
        <GlowOrb size={500} position="top-right" opacity={0.08} />
        <GlowOrb size={400} position="bottom-left" opacity={0.06} />

        {/* ============ HERO ============ */}
        <section className="relative px-6 lg:px-8 pt-6 pb-4">
          <StaggerContainer className="flex flex-col lg:flex-row lg:items-center gap-6" stagger={0.08}>
            {/* Club identity */}
            <StaggerItem className="flex items-center gap-5 flex-1 min-w-0">
              <div
                className="relative w-20 h-20 rounded-xl shrink-0 flex items-center justify-center shadow-2xl overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${club.homeKitColor || '#FFD700'}, ${(club.homeKitColor || '#FFD700')}88)`,
                }}
              >
                <span className="font-headline font-black text-3xl text-black/80 tracking-tighter">
                  {club.name.split(' ').map(w => w[0]).slice(0, 3).join('')}
                </span>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="gold" size="sm">{club.league?.toUpperCase() || 'LEAGUE'}</Badge>
                  <Badge variant="outline" size="sm">{club.country?.toUpperCase() || '—'}</Badge>
                </div>
                <h1 className="font-headline text-3xl lg:text-4xl font-bold tracking-tight text-primary-c text-truncate-1">
                  {club.name}
                </h1>
                <p className="text-xs text-tertiary-c font-mono tracking-wider mt-1">
                  SEASON {currentSeason} · WEEK {currentWeek} · CAP {formatNumber(club.stadiumCapacity)}
                </p>
              </div>
            </StaggerItem>

            {/* Quick stats */}
            <StaggerItem className="grid grid-cols-3 gap-3 lg:gap-4 shrink-0">
              <HeroStat icon={<Star className="w-3.5 h-3.5" />} label="REP" value={club.reputation} tone="gold" />
              <HeroStat icon={<Users className="w-3.5 h-3.5" />} label="SQUAD" value={players.length} />
              <HeroStat icon={<Activity className="w-3.5 h-3.5" />} label="AVG" value={avgRating} tone="success" />
            </StaggerItem>

            {/* Action buttons */}
            <StaggerItem className="flex gap-2 shrink-0">
              <Link href="/tactics">
                <Button variant="gold" size="md" className="w-full lg:w-auto">
                  <Target className="w-4 h-4" /> Set Tactics
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="md"
                onClick={() => { advanceWeek(); playSfx('advance-week'); }}
              >
                <ChevronRight className="w-4 h-4" /> Advance Week
              </Button>
            </StaggerItem>
          </StaggerContainer>
        </section>

        {/* ============ KPI ROW (Bloomberg-dense, 6 tiles) ============ */}
        <section className="px-6 lg:px-8 pb-4">
          <div className="section-header">Key Performance Indicators</div>
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2" stagger={0.04}>
            <KpiTile
              icon={<Trophy className="w-3.5 h-3.5" />}
              label="LEAGUE POS"
              value="2nd"
              delta={1}
              spark={[5, 4, 4, 3, 3, 2, 2]}
              tone="gold"
            />
            <KpiTile
              icon={<Target className="w-3.5 h-3.5" />}
              label="GOALS"
              value={<AnimatedCounter value={58} />}
              delta={4}
              spark={[3, 2, 4, 3, 5, 2, 4]}
              tone="success"
            />
            <KpiTile
              icon={<Shield className="w-3.5 h-3.5" />}
              label="CONCEDED"
              value={<AnimatedCounter value={21} />}
              delta={-2}
              spark={[2, 1, 3, 2, 1, 2, 1]}
              tone="danger"
            />
            <KpiTile
              icon={<Activity className="w-3.5 h-3.5" />}
              label="POSSESSION"
              value={<><AnimatedCounter value={62.4} decimals={1} suffix="%" /></>}
              delta={1}
              spark={[58, 60, 61, 59, 62, 61, 62]}
              tone="gold"
            />
            <KpiTile
              icon={<Flame className="w-3.5 h-3.5" />}
              label="MORALE"
              value="HIGH"
              delta={1}
              spark={[70, 75, 80, 78, 82, 85, 88]}
              tone="success"
            />
            <KpiTile
              icon={<Zap className="w-3.5 h-3.5" />}
              label="FATIGUE"
              value="MED"
              delta={-1}
              spark={[40, 45, 50, 55, 48, 52, 55]}
              tone="warning"
            />
          </StaggerContainer>
        </section>

        {/* ============ TWO-COLUMN ROW ============ */}
        <section className="px-6 lg:px-8 pb-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT (2/3): Top Performers */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-gold-300" />
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Best-rated players this season</CardDescription>
              </div>
              <Link href="/squad" className="text-xs text-gold-300 hover:text-gold-200 flex items-center gap-1">
                View Squad <ChevronRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="!p-0">
              {topPlayers.length === 0 ? (
                <div className="p-8 text-center text-tertiary-c text-sm">
                  No players loaded. Run <code className="text-gold-300">pnpm db:seed</code> to populate.
                </div>
              ) : (
                <div className="divide-y divide-white/3">
                  {topPlayers.map((player, idx) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-4 px-4 py-2.5 hover:bg-gold-soft/40 transition-colors group cursor-pointer"
                    >
                      <span className="w-5 text-center text-[10px] font-mono text-tertiary-c">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-surface-3 to-surface-4 flex items-center justify-center text-xs font-bold text-secondary-c shrink-0">
                        {player.firstName?.[0]}{player.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-primary-c text-truncate-1">
                          {player.firstName} {player.lastName}
                        </div>
                        <div className="text-[10px] text-tertiary-c font-mono tracking-wide">
                          {player.position} · AGE {player.age}
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-3 text-xs font-mono">
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] text-tertiary-c tracking-widest">PAC</span>
                          <span className="text-secondary-c tabular-nums">{player.pace || '—'}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] text-tertiary-c tracking-widest">SHO</span>
                          <span className="text-secondary-c tabular-nums">{player.shooting || '—'}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] text-tertiary-c tracking-widest">PAS</span>
                          <span className="text-secondary-c tabular-nums">{player.passing || '—'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <RatingBadge rating={player.overallRating} size="sm" />
                        <div className="hidden md:flex flex-col items-end ml-1">
                          <span className="text-[9px] text-tertiary-c tracking-widest">POT</span>
                          <span className="text-gold-300 font-mono font-bold text-xs tabular-nums">{player.potentialRating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* RIGHT (1/3): Upcoming Fixtures */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold-300" />
                <CardTitle>Upcoming</CardTitle>
              </div>
              <Link href="/matches" className="text-xs text-gold-300 hover:text-gold-200 flex items-center gap-1">
                All <ChevronRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="!p-0">
              <div className="divide-y divide-white/3">
                {[
                  { opp: 'ARS', home: true, comp: 'PL', week: 'W29', date: 'SAT' },
                  { opp: 'CHE', home: false, comp: 'PL', week: 'W30', date: 'NEXT' },
                  { opp: 'LIV', home: true, comp: 'UCL', week: 'QF', date: 'TUE' },
                ].map((m, i) => (
                  <div key={i} className="px-4 py-3 hover:bg-white/3 transition-colors group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={m.home ? 'success' : 'warning'} size="sm">
                          {m.home ? 'HOME' : 'AWAY'}
                        </Badge>
                        <span className="font-display font-bold text-base text-primary-c">{m.opp}</span>
                      </div>
                      <span className="text-[9px] text-tertiary-c font-mono">{m.date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-tertiary-c font-mono tracking-wide">
                        {m.comp} · {m.week}
                      </span>
                      <Link
                        href="/match-simulation"
                        onClick={() => playSfx('whistle')}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-gold-300 font-semibold flex items-center gap-1"
                      >
                        PLAY <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ============ THREE-COLUMN ROW ============ */}
        <section className="px-6 lg:px-8 pb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Form guide */}
          <Card hover>
            <CardHeader>
              <CardTitle>Form (Last 5)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1.5 mb-3">
                {['W', 'W', 'D', 'W', 'W'].map((r, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 h-9 rounded-md flex items-center justify-center font-bold text-sm',
                      r === 'W' && 'bg-success/20 text-success border border-success/30',
                      r === 'D' && 'bg-warning/20 text-warning border border-warning/30',
                      r === 'L' && 'bg-danger/20 text-danger border border-danger/30'
                    )}
                  >
                    {r}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-tertiary-c font-mono tracking-wide">POINTS PER GAME</span>
                  <span className="font-mono font-bold text-success tabular-nums">2.20</span>
                </div>
                <ProgressBar value={73} tone="success" showLabel />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-tertiary-c font-mono tracking-wide">VS LAST 5</span>
                  <span className="font-mono text-success flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" /> +18%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Board confidence */}
          <Card hover>
            <CardHeader>
              <CardTitle>Board Confidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-headline font-bold text-gold-300">82%</span>
                <span className="text-xs text-success flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> 4%
                </span>
              </div>
              <ProgressBar value={82} tone="gold" />
              <div className="space-y-1.5 pt-1">
                {[
                  { label: 'League Position', value: 90, tone: 'success' as const },
                  { label: 'Cup Progress', value: 75, tone: 'gold' as const },
                  { label: 'Finances', value: 85, tone: 'success' as const },
                  { label: 'Fan Mood', value: 70, tone: 'warning' as const },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3 text-xs">
                    <span className="text-tertiary-c w-24 text-truncate-1">{row.label}</span>
                    <div className="flex-1"><ProgressBar value={row.value} tone={row.tone} /></div>
                    <span className="font-mono text-secondary-c tabular-nums w-8 text-right">{row.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Injury report */}
          <Card hover>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-danger" />
                <CardTitle>Injury Report</CardTitle>
              </div>
              <Badge variant="danger" size="sm">2 ACTIVE</Badge>
            </CardHeader>
            <CardContent className="!p-0">
              <div className="divide-y divide-white/3">
                {[
                  { name: 'M. Salah', injury: 'Hamstring', eta: '3 weeks', severity: 'med' },
                  { name: 'V. Dijk', injury: 'Knock', eta: '1 week', severity: 'low' },
                ].map((inj, i) => (
                  <div key={i} className="px-4 py-2.5 hover:bg-white/3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-primary-c">{inj.name}</div>
                        <div className="text-[10px] text-tertiary-c font-mono">{inj.injury} · ETA {inj.eta}</div>
                      </div>
                      <Badge variant={inj.severity === 'low' ? 'warning' : 'danger'} size="sm">
                        {inj.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ============ FINANCE OVERVIEW ============ */}
        <section className="px-6 lg:px-8 pb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-gold-300" />
                <CardTitle>Finance Overview</CardTitle>
                <CardDescription>Weekly cash flow</CardDescription>
              </div>
              <Badge variant="success" size="sm">+12% WoW</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatBlock
                  label="BALANCE"
                  value={<AnimatedCounter value={club.finances || 0} format="currency" />}
                  tone="gold"
                  delta={2}
                  deltaSuffix="M"
                />
                <StatBlock
                  label="WEEKLY WAGES"
                  value={<AnimatedCounter value={totalWages} format="currency" />}
                  delta={-1}
                  deltaSuffix="K"
                  tone="danger"
                />
                <StatBlock
                  label="TRANSFER BUDGET"
                  value={formatCurrency(Math.round((club.finances || 50_000_000) * 0.4))}
                  tone="success"
                />
                <StatBlock
                  label="WEEKLY REVENUE"
                  value={formatCurrency(2_400_000)}
                  delta={8}
                  deltaSuffix="%"
                  tone="success"
                />
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-md bg-surface-2/50 border border-white/3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-tertiary-c font-mono tracking-widest">INCOME TREND (12W)</span>
                    <Sparkline data={[2.1, 2.3, 2.0, 2.4, 2.5, 2.3, 2.6, 2.4, 2.5, 2.7, 2.6, 2.4]} tone="success" width={120} height={28} />
                  </div>
                  <ProgressBar value={78} tone="success" showLabel />
                </div>
                <div className="p-3 rounded-md bg-surface-2/50 border border-white/3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-tertiary-c font-mono tracking-widest">EXPENSE TREND (12W)</span>
                    <Sparkline data={[1.8, 1.9, 2.0, 1.9, 2.1, 2.0, 1.9, 1.8, 2.0, 1.9, 1.8, 1.9]} tone="danger" width={120} height={28} />
                  </div>
                  <ProgressBar value={62} tone="danger" showLabel />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ============ MEDIA BUZZ (footer) ============ */}
        <section className="px-6 lg:px-8 pb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Quote className="w-4 h-4 text-gold-300" />
                <CardTitle>Media Buzz</CardTitle>
                <CardDescription>Latest stories about your club</CardDescription>
              </div>
              <Badge variant="outline" size="sm">LIVE</Badge>
            </CardHeader>
            <CardContent className="!p-0">
              <div className="divide-y divide-white/3">
                {[
                  { source: 'BBC Sport', headline: 'Title race heats up as City edge past rivals', time: '2h', tone: 'gold' },
                  { source: 'The Athletic', headline: 'Tactical analysis: How the 4-3-3 is finally clicking', time: '4h', tone: 'info' },
                  { source: 'Sky Sports', headline: 'Transfer insider: €80M bid prepared for summer window', time: '6h', tone: 'warning' },
                ].map((story, i) => (
                  <div key={i} className="px-4 py-3 hover:bg-white/3 cursor-pointer group">
                    <div className="flex items-start gap-3">
                      <Badge variant={story.tone as 'gold' | 'info' | 'warning'} size="sm">{story.source}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-primary-c group-hover:text-gold-200 transition-colors text-truncate-1">
                          {story.headline}
                        </p>
                        <p className="text-[10px] text-tertiary-c font-mono mt-0.5">{story.time} ago</p>
                      </div>
                      <Eye className="w-3.5 h-3.5 text-tertiary-c opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </PageTransition>
  );
}

/* ============================================================
   LOCAL COMPONENTS
   ============================================================ */

function HeroStat({
  icon,
  label,
  value,
  tone = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'gold' | 'success';
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg bg-surface-2/50 border border-white/5 min-w-[80px]">
      <div className="flex items-center gap-1.5 text-tertiary-c">
        {icon}
        <span className="text-[9px] font-mono uppercase tracking-widest font-bold">{label}</span>
      </div>
      <span className={cn(
        'font-headline font-bold text-xl tabular-nums leading-none',
        tone === 'gold' && 'text-gold-300',
        tone === 'success' && 'text-success',
        tone === 'default' && 'text-primary-c'
      )}>
        {value}
      </span>
    </div>
  );
}

function KpiTile({
  icon,
  label,
  value,
  delta,
  spark,
  tone = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  delta?: number;
  spark: number[];
  tone?: 'default' | 'gold' | 'success' | 'danger' | 'warning';
}) {
  const toneColor = {
    default: 'text-primary-c',
    gold: 'text-gold-300',
    success: 'text-success',
    danger: 'text-danger',
    warning: 'text-warning',
  };
  const sparkTone = tone === 'danger' ? 'danger' : tone === 'success' || tone === 'gold' ? 'gold' : 'gold';

  return (
    <StaggerItem>
      <div className="relative p-3 rounded-md bg-gradient-to-b from-surface-2 to-surface-3 border border-white/5 hover:border-gold-soft transition-all duration-300 hover:-translate-y-0.5 group">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-tertiary-c">
            <span className={cn('transition-colors group-hover:text-gold-300', toneColor[tone])}>{icon}</span>
            <span className="text-[9px] font-mono uppercase tracking-widest font-bold">{label}</span>
          </div>
          {delta !== undefined && (
            <span
              className={cn(
                'text-[9px] font-mono font-bold tabular-nums flex items-center gap-0.5',
                delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-tertiary-c'
              )}
            >
              {delta > 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : delta < 0 ? <ArrowDownRight className="w-2.5 h-2.5" /> : null}
              {Math.abs(delta)}
            </span>
          )}
        </div>
        <div className="flex items-end justify-between gap-2">
          <span className={cn('font-headline font-bold text-xl leading-none tabular-nums', toneColor[tone])}>
            {value}
          </span>
          <Sparkline data={spark} tone={sparkTone as 'gold' | 'success' | 'danger'} width={56} height={20} />
        </div>
      </div>
    </StaggerItem>
  );
}

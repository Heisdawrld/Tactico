'use client'

export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { useSelectedClub } from '@/lib/useSelectedClub';
import { playRawClick } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Stat';
import { getOfflineClub, getOfflineSquad, OFFLINE_CLUBS } from '@/lib/game-data';
import { Dumbbell, Zap, Brain, Shield, Heart, Star, ChevronRight, Plus } from 'lucide-react';

const TRAINING_CATEGORIES = [
  { id: 'technical', label: 'Technical', icon: <Star className="w-3.5 h-3.5" />, color: 'text-gold-300', attrs: ['Finishing', 'Passing', 'Dribbling', 'Crossing'] },
  { id: 'physical', label: 'Physical', icon: <Zap className="w-3.5 h-3.5" />, color: 'text-success', attrs: ['Pace', 'Stamina', 'Strength', 'Agility'] },
  { id: 'tactical', label: 'Tactical', icon: <Brain className="w-3.5 h-3.5" />, color: 'text-info', attrs: ['Positioning', 'Vision', 'Decisions', 'Anticipation'] },
  { id: 'mental', label: 'Mental', icon: <Shield className="w-3.5 h-3.5" />, color: 'text-warning', attrs: ['Composure', 'Leadership', 'Determination', 'Aggression'] },
];

export default function TrainingPage() {
  const { club, hydrated } = useSelectedClub();
  const squad = useMemo(() => club ? getOfflineSquad(club.id) : [], [club]);

  const [intensity, setIntensity] = useState<Record<string, number>>({
    technical: 60,
    physical: 50,
    tactical: 55,
    mental: 45,
  });

  const topTalents = useMemo(() => {
    return [...squad]
      .filter((p) => p.age <= 23)
      .sort((a, b) => (b.potentialRating - b.overallRating) - (a.potentialRating - a.overallRating))
      .slice(0, 5);
  }, [squad]);


  // ---------- HYDRATION GUARD — prevent SSR crash when club is null ----------
  if (!hydrated || !club) {
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
      <div className="px-4 sm:px-6 lg:px-8 py-6 pb-12 max-w-5xl mx-auto">
        <StaggerContainer className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6" stagger={0.05}>
          <StaggerItem>
            <div className="section-header !mb-1">Weekly Schedule</div>
            <h1 className="font-headline text-3xl lg:text-4xl font-bold tracking-tight text-primary-c">Training</h1>
            <p className="text-tertiary-c text-sm mt-1">{club!.name} · {club!.trainingFacilities}/5 Facilities</p>
          </StaggerItem>
          <StaggerItem>
            <Button variant="gold" size="sm" onClick={() => playRawClick(0.2)}>
              <ChevronRight className="w-3.5 h-3.5" /> Apply Schedule
            </Button>
          </StaggerItem>
        </StaggerContainer>

        {/* Training Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {TRAINING_CATEGORIES.map((cat) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={cat.color}>{cat.icon}</span>
                      <span className="font-display font-semibold text-sm text-primary-c">{cat.label}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-gold-300 tabular-nums">{intensity[cat.id]}%</span>
                  </div>
                  <input
                    type="range" min={0} max={100} step={5} value={intensity[cat.id]}
                    onChange={(e) => { setIntensity({ ...intensity, [cat.id]: parseInt(e.target.value) }); playRawClick(0.08); }}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer mb-3
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold-300 [&::-webkit-slider-thumb]:cursor-pointer"
                    style={{ background: `linear-gradient(to right, var(--gold-300) 0%, var(--gold-300) ${intensity[cat.id]}%, var(--surface-4) ${intensity[cat.id]}%, var(--surface-4) 100%)` }}
                  />
                  <div className="flex flex-wrap gap-1">
                    {cat.attrs.map((attr) => (
                      <span key={attr} className="text-[9px] px-1.5 py-0.5 rounded bg-surface-3 text-tertiary-c font-mono">{attr}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Youth Talents */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-gold-300" />
              <CardTitle>Youth Talents</CardTitle>
              <CardDescription>High-potential players to develop</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="!p-0">
            <div className="divide-y divide-white/3">
              {topTalents.map((p, idx) => {
                const growth = p.potentialRating - p.overallRating;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-white/3"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-surface-3 to-surface-4 flex items-center justify-center text-xs font-bold text-secondary-c shrink-0">
                      {p.firstName?.[0]}{p.lastName?.[0] || p.firstName?.[1] || ''}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-primary-c truncate">{p.firstName} {p.lastName || ''}</div>
                      <div className="text-[10px] text-tertiary-c font-mono">{p.position} · AGE {p.age} · {p.nationality}</div>
                    </div>
                    <div className="text-center shrink-0">
                      <div className="font-mono font-bold text-sm text-primary-c">{p.overallRating}</div>
                      <div className="text-[9px] text-tertiary-c">OVR</div>
                    </div>
                    <div className="text-center shrink-0">
                      <div className="font-mono font-bold text-sm text-gold-300">{p.potentialRating}</div>
                      <div className="text-[9px] text-tertiary-c">POT</div>
                    </div>
                    <Badge variant={growth >= 15 ? 'gold' : growth >= 8 ? 'success' : 'default'} size="sm">
                      +{growth}
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Squad Condition */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-3.5 h-3.5 text-success" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-tertiary-c font-bold">Morale</span>
              </div>
              <div className="text-2xl font-mono font-bold text-success">78%</div>
              <ProgressBar value={78} tone="success" />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5 text-warning" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-tertiary-c font-bold">Fatigue</span>
              </div>
              <div className="text-2xl font-mono font-bold text-warning">32%</div>
              <ProgressBar value={32} tone="warning" />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-3.5 h-3.5 text-gold-300" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-tertiary-c font-bold">Sharpness</span>
              </div>
              <div className="text-2xl font-mono font-bold text-gold-300">85%</div>
              <ProgressBar value={85} tone="gold" />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}

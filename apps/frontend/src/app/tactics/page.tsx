'use client'

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { useSelectedClub } from '@/lib/useSelectedClub';
import { playRawClick } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getOfflineClub, getOfflineSquad } from '@/lib/game-data';
import { ArrowLeft, Target, Shield, Zap, Activity, ChevronRight, RotateCcw, Save } from 'lucide-react';

const FORMATIONS: Record<string, { x: number; y: number; pos: string }[]> = {
  '4-3-3': [
    { x: 50, y: 92, pos: 'GK' },
    { x: 15, y: 75, pos: 'LB' }, { x: 38, y: 78, pos: 'CB' }, { x: 62, y: 78, pos: 'CB' }, { x: 85, y: 75, pos: 'RB' },
    { x: 25, y: 55, pos: 'CM' }, { x: 50, y: 50, pos: 'CDM' }, { x: 75, y: 55, pos: 'CM' },
    { x: 20, y: 25, pos: 'LW' }, { x: 50, y: 18, pos: 'ST' }, { x: 80, y: 25, pos: 'RW' },
  ],
  '4-4-2': [
    { x: 50, y: 92, pos: 'GK' },
    { x: 15, y: 75, pos: 'LB' }, { x: 38, y: 78, pos: 'CB' }, { x: 62, y: 78, pos: 'CB' }, { x: 85, y: 75, pos: 'RB' },
    { x: 15, y: 50, pos: 'LM' }, { x: 38, y: 52, pos: 'CM' }, { x: 62, y: 52, pos: 'CM' }, { x: 85, y: 50, pos: 'RM' },
    { x: 35, y: 22, pos: 'ST' }, { x: 65, y: 22, pos: 'ST' },
  ],
  '4-2-3-1': [
    { x: 50, y: 92, pos: 'GK' },
    { x: 15, y: 75, pos: 'LB' }, { x: 38, y: 78, pos: 'CB' }, { x: 62, y: 78, pos: 'CB' }, { x: 85, y: 75, pos: 'RB' },
    { x: 38, y: 60, pos: 'CDM' }, { x: 62, y: 60, pos: 'CDM' },
    { x: 20, y: 35, pos: 'LM' }, { x: 50, y: 32, pos: 'CAM' }, { x: 80, y: 35, pos: 'RM' },
    { x: 50, y: 15, pos: 'ST' },
  ],
  '3-5-2': [
    { x: 50, y: 92, pos: 'GK' },
    { x: 25, y: 78, pos: 'CB' }, { x: 50, y: 80, pos: 'CB' }, { x: 75, y: 78, pos: 'CB' },
    { x: 10, y: 55, pos: 'LWB' }, { x: 35, y: 55, pos: 'CM' }, { x: 50, y: 50, pos: 'CDM' }, { x: 65, y: 55, pos: 'CM' }, { x: 90, y: 55, pos: 'RWB' },
    { x: 35, y: 22, pos: 'ST' }, { x: 65, y: 22, pos: 'ST' },
  ],
  '5-3-2': [
    { x: 50, y: 92, pos: 'GK' },
    { x: 10, y: 72, pos: 'LWB' }, { x: 30, y: 78, pos: 'CB' }, { x: 50, y: 80, pos: 'CB' }, { x: 70, y: 78, pos: 'CB' }, { x: 90, y: 72, pos: 'RWB' },
    { x: 30, y: 50, pos: 'CM' }, { x: 50, y: 48, pos: 'CDM' }, { x: 70, y: 50, pos: 'CM' },
    { x: 35, y: 22, pos: 'ST' }, { x: 65, y: 22, pos: 'ST' },
  ],
};

const TACTICAL_STYLES = [
  { id: 'possession', label: 'Possession', desc: 'Control the ball, control the game', icon: <Activity className="w-3.5 h-3.5" /> },
  { id: 'gegenpress', label: 'Gegenpress', desc: 'Hunt in packs, win it high', icon: <Zap className="w-3.5 h-3.5" /> },
  { id: 'counter', label: 'Counter Attack', desc: 'Strike on the break', icon: <Target className="w-3.5 h-3.5" /> },
  { id: 'defensive', label: 'Low Block', desc: 'Park the bus, absorb pressure', icon: <Shield className="w-3.5 h-3.5" /> },
];

export default function TacticsPage() {
  const { club, hydrated } = useSelectedClub();
  const squad = useMemo(() => (club ? getOfflineSquad(club.id) : []), [club]);
  const [formation, setFormation] = useState('4-3-3');
  const [style, setStyle] = useState('possession');
  const [pressing, setPressing] = useState(60);
  const [defensiveLine, setDefensiveLine] = useState(50);
  const [tempo, setTempo] = useState(55);

  const startingXI = useMemo(() => {
    const sorted = [...squad].sort((a, b) => b.overallRating - a.overallRating);
    return sorted.slice(0, 11);
  }, [squad]);

  if (!club) return null;

  return (
    <div className="relative z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-6 pb-12 max-w-6xl mx-auto">
        <StaggerContainer className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6" stagger={0.05}>
          <StaggerItem>
            <div className="section-header !mb-1">Tactical Setup</div>
            <h1 className="font-headline text-3xl lg:text-4xl font-bold tracking-tight text-primary-c">Tactics</h1>
            <p className="text-tertiary-c text-sm mt-1">{club!.name} · {formation}</p>
          </StaggerItem>
          <StaggerItem className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => { playRawClick(0.15); }}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
            <Button variant="gold" size="sm" onClick={() => { playRawClick(0.2); }}>
              <Save className="w-3.5 h-3.5" /> Save Tactics
            </Button>
          </StaggerItem>
        </StaggerContainer>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* PITCH */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Formation</CardTitle>
              <CardDescription>Drag players to reposition (coming soon)</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Formation selector */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {Object.keys(FORMATIONS).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFormation(f); playRawClick(0.1); }}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-mono font-semibold transition-all border',
                      formation === f
                        ? 'bg-gold-soft text-gold-300 border-gold-300'
                        : 'bg-surface-2 text-tertiary-c border-white/5 hover:border-white/14 hover:text-primary-c'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Pitch */}
              <div
                className="relative w-full rounded-lg overflow-hidden border border-white/8"
                style={{
                  aspectRatio: '3 / 4',
                  background: 'linear-gradient(180deg, #0d2818 0%, #0a1f12 50%, #0d2818 100%)',
                }}
              >
                {/* Pitch lines */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 133" preserveAspectRatio="none">
                  <rect x="2" y="2" width="96" height="129" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                  <line x1="2" y1="66.5" x2="98" y2="66.5" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                  <circle cx="50" cy="66.5" r="12" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                  <circle cx="50" cy="66.5" r="0.8" fill="rgba(255,255,255,0.4)" />
                  {/* Penalty areas */}
                  <rect x="20" y="2" width="60" height="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                  <rect x="35" y="2" width="30" height="7" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                  <rect x="20" y="115" width="60" height="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                  <rect x="35" y="124" width="30" height="7" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                </svg>

                {/* Players */}
                {FORMATIONS[formation].map((slot, idx) => {
                  const player = startingXI[idx];
                  if (!player) return null;
                  const isGK = slot.pos === 'GK';
                  return (
                    <motion.div
                      key={idx}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: idx * 0.05, type: 'spring', stiffness: 200 }}
                      whileHover={{ scale: 1.15 }}
                      onClick={() => playRawClick(0.1)}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-mono font-bold text-[10px] sm:text-xs border-2 shadow-lg',
                          isGK
                            ? 'bg-yellow-500/30 border-yellow-400 text-yellow-300'
                            : 'bg-surface-2 border-gold-300 text-primary-c'
                        )}
                        style={{
                          boxShadow: `0 0 12px ${club!.homeKitColor}40`,
                        }}
                      >
                        {player.shirtNumber || idx + 1}
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap">
                        <div className="text-[8px] sm:text-[10px] font-medium text-primary-c bg-black/60 px-1.5 py-0.5 rounded text-center">
                          {player.firstName?.split(' ')[0] || 'Player'}
                        </div>
                        <div className="text-[7px] sm:text-[8px] text-tertiary-c text-center font-mono">{slot.pos}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* INSTRUCTIONS */}
          <div className="space-y-4">
            {/* Tactical Style */}
            <Card>
              <CardHeader><CardTitle>Playing Style</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {TACTICAL_STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setStyle(s.id); playRawClick(0.1); }}
                    className={cn(
                      'w-full p-2.5 rounded-md border text-left transition-all flex items-start gap-2',
                      style === s.id
                        ? 'bg-gold-soft border-gold-300 ring-1 ring-gold-300'
                        : 'bg-surface-2 border-white/5 hover:border-white/14'
                    )}
                  >
                    <span className={cn('mt-0.5', style === s.id ? 'text-gold-300' : 'text-tertiary-c')}>{s.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-primary-c">{s.label}</div>
                      <div className="text-[10px] text-tertiary-c">{s.desc}</div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Sliders */}
            <Card>
              <CardHeader><CardTitle>Team Instructions</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Slider label="Pressing Intensity" value={pressing} onChange={setPressing} />
                <Slider label="Defensive Line" value={defensiveLine} onChange={setDefensiveLine} />
                <Slider label="Tempo" value={tempo} onChange={setTempo} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-secondary-c">{label}</span>
        <span className="text-xs font-mono text-gold-300 tabular-nums">{value}%</span>
      </div>
      <input
        type="range" min={0} max={100} step={5} value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold-300 [&::-webkit-slider-thumb]:cursor-pointer"
        style={{ background: `linear-gradient(to right, var(--gold-300) 0%, var(--gold-300) ${value}%, var(--surface-4) ${value}%, var(--surface-4) 100%)` }}
      />
    </div>
  );
}

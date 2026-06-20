'use client';

import ClubSelector from '@/components/ClubSelector';
import { TacticoLogo, TacticoLogoLockup } from '@/components/ui/TacticoLogo';
import { ParticleField, GlowOrb, ScaleIn, FadeInOnView } from '@/components/ui/motion';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, Zap, Trophy, Activity } from 'lucide-react';

/**
 * Start Page — the cinematic entry point.
 *
 * Layout:
 *   ┌──────────────────────────────────────────┐
 *   │  ParticleField background (animated)     │
 *   │  GlowOrb (top-right + bottom-left)       │
 *   │                                          │
 *   │  [TacticoLogoLockup — animated]          │
 *   │  [Tagline: "The Football Intelligence"]  │
 *   │                                          │
 *   │  [3 feature pills: Physics, Real Data,   │
 *   │   Living World]                          │
 *   │                                          │
 *   │  ┌──────────────────────────────────┐    │
 *   │  │ ClubSelector (search + filter +  │    │
 *   │  │  grid + sticky selection bar)    │    │
 *   │  └──────────────────────────────────┘    │
 *   │                                          │
 *   │  [Footer: version + tech credits]        │
 *   └──────────────────────────────────────────┘
 */
export default function StartPage() {
  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      {/* ---------- BACKGROUND LAYERS ---------- */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-1 via-surface-2 to-surface-base" />
      <div className="absolute inset-0 bg-premium-radial opacity-50" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Decorative gold glow orbs */}
      <GlowOrb size={600} position="top-right" opacity={0.10} />
      <GlowOrb size={500} position="bottom-left" opacity={0.08} />

      {/* Animated gold particle field */}
      <ParticleField count={25} className="opacity-60" />

      {/* ---------- CONTENT ---------- */}
      <div className="start-hero-compact relative z-10 flex flex-col items-center w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12 flex-1 safe-area-top">
        {/* Brand lockup */}
        <ScaleIn delay={0.1}>
          <div className="flex flex-col items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
            <div className="tactico-logo">
              <TacticoLogo size={88} variant="mark" animated />
            </div>
            <div className="text-center">
              <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter leading-none">
                <span className="gradient-text-premium">TACTICO</span>
              </h1>
              <p className="start-tagline text-tertiary-c text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.35em] font-mono font-semibold mt-1.5 sm:mt-2">
                The Football Intelligence
              </p>
            </div>
            <div className="h-px w-24 sm:w-32 bg-gradient-to-r from-transparent via-gold-300 to-transparent mt-0.5 sm:mt-1" />
          </div>
        </ScaleIn>

        {/* Feature pills */}
        <FadeInOnView delay={0.3} y={12} className="start-feature-pills w-full">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4 sm:mb-6 lg:mb-8">
            <FeaturePill icon={<Zap className="w-3 h-3" />} label="Physics-Based Matches" />
            <FeaturePill icon={<Activity className="w-3 h-3" />} label="Real Player Data" />
            <FeaturePill icon={<Trophy className="w-3 h-3" />} label="Living World" />
            <FeaturePill icon={<Sparkles className="w-3 h-3" />} label="AI Adapts to You" />
          </div>
        </FadeInOnView>

        {/* Club selector */}
        <FadeInOnView delay={0.5} y={16} className="w-full flex-1 flex flex-col">
          <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-2xl border-white/8 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <h2 className="font-headline text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-primary-c">
                  Choose Your Club
                </h2>
                <p className="text-[11px] sm:text-xs text-tertiary-c mt-0.5 sm:mt-1">
                  Select a club to begin your managerial career
                </p>
              </div>
              <Badge variant="outline" size="sm" className="hidden sm:flex">
                <span className="live-dot !w-1.5 !h-1.5 mr-1" />
                {new Date().getFullYear()} SEASON
              </Badge>
            </div>
            <div className="flex-1 min-h-0">
              <ClubSelector />
            </div>
          </div>
        </FadeInOnView>

        {/* Footer */}
        <div className="mt-auto pt-4 sm:pt-6 lg:pt-8 text-center">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] text-quaternary-c font-mono tracking-widest">
            <span>v0.4.0</span>
            <span className="text-quaternary-c/50">·</span>
            <span className="hidden sm:inline">BUILT WITH REAL FOOTBALL DATA</span>
            <span className="sm:hidden">REAL FOOTBALL DATA</span>
            <span className="text-quaternary-c/50">·</span>
            <span className="hidden sm:inline">POWERED BY TURSO + BUZZOIRO</span>
            <span className="sm:hidden">TURSO + BUZZOIRO</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2/70 backdrop-blur-md border border-white/5 text-xs text-secondary-c">
      <span className="text-gold-300">{icon}</span>
      <span className="font-medium tracking-tight">{label}</span>
    </div>
  );
}

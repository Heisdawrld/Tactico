'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { playRawClick } from '@/lib/audio';
import { getCrowdAudio } from '@/lib/crowd-audio';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/components/ui/motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Volume2, VolumeX, Music, Zap, Sun, Moon, Globe,
  RotateCcw, Info, ChevronRight, Bell, Palette,
} from 'lucide-react';

export default function SettingsPage() {
  const audioEnabled = useAppStore((s) => s.audioEnabled);
  const toggleAudio = useAppStore((s) => s.toggleAudio);
  const masterVolume = useAppStore((s) => s.masterVolume);
  const ambienceVolume = useAppStore((s) => s.ambienceVolume);
  const sfxVolume = useAppStore((s) => s.sfxVolume);
  const setMasterVolume = useAppStore((s) => s.setMasterVolume);
  const setAmbienceVolume = useAppStore((s) => s.setAmbienceVolume);
  const setSfxVolume = useAppStore((s) => s.setSfxVolume);
  const resetApp = useAppStore((s) => s.resetApp);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleVolumeChange = (setter: (v: number) => void, value: number) => {
    setter(value);
    playRawClick(value * 0.15);
  };

  const handleToggleAudio = () => {
    toggleAudio();
    if (!audioEnabled) {
      getCrowdAudio().start().catch(() => {});
    } else {
      getCrowdAudio().stop();
    }
    playRawClick(0.15);
  };

  const handleReset = () => {
    resetApp();
    localStorage.removeItem('tactico-app-state');
    window.location.href = '/start';
  };

  return (
    <PageTransition>
      <div className="px-6 lg:px-8 py-6 pb-12 max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="section-header !mb-1">Configuration</div>
          <h1 className="font-headline text-3xl lg:text-4xl font-bold tracking-tight text-primary-c">
            Settings
          </h1>
          <p className="text-tertiary-c text-sm mt-1">Customize your Tactico experience.</p>
        </div>

        {/* AUDIO */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              {audioEnabled ? <Volume2 className="w-4 h-4 text-gold-300" /> : <VolumeX className="w-4 h-4 text-tertiary-c" />}
              <CardTitle>Audio</CardTitle>
              <CardDescription>Sound effects & ambience</CardDescription>
            </div>
            <Badge variant={audioEnabled ? 'gold' : 'default'} size="sm">
              {audioEnabled ? 'ON' : 'OFF'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between p-3 rounded-md bg-surface-2/50 border border-white/3">
              <div>
                <div className="font-display font-semibold text-sm text-primary-c">Enable Audio</div>
                <div className="text-[11px] text-tertiary-c mt-0.5">
                  Turn on crowd ambience, UI clicks, and match sounds
                </div>
              </div>
              <button
                onClick={handleToggleAudio}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors shrink-0',
                  audioEnabled ? 'bg-gold-300' : 'bg-surface-4'
                )}
              >
                <motion.div
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                  animate={{ left: audioEnabled ? '26px' : '2px' }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                />
              </button>
            </div>

            {audioEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <VolumeSlider icon={<Volume2 className="w-3.5 h-3.5" />} label="Master Volume" value={masterVolume} onChange={(v) => handleVolumeChange(setMasterVolume, v)} />
                <VolumeSlider icon={<Zap className="w-3.5 h-3.5" />} label="Sound Effects" description="UI clicks, button presses, notifications" value={sfxVolume} onChange={(v) => handleVolumeChange(setSfxVolume, v)} />
                <VolumeSlider icon={<Music className="w-3.5 h-3.5" />} label="Crowd Ambience" description="Stadium background atmosphere" value={ambienceVolume} onChange={(v) => handleVolumeChange(setAmbienceVolume, v)} />
                <Button variant="secondary" size="sm" onClick={() => playRawClick(sfxVolume * 0.3)} className="w-full">
                  <Zap className="w-3.5 h-3.5" /> Test Sound
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* DISPLAY */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-gold-300" />
              <CardTitle>Display</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingRow icon={<Moon className="w-3.5 h-3.5" />} label="Theme" value="Dark Premium" />
            <SettingRow icon={<Globe className="w-3.5 h-3.5" />} label="Language" value="English" />
            <SettingRow icon={<Sun className="w-3.5 h-3.5" />} label="Density" value="Bloomberg Dense" />
          </CardContent>
        </Card>

        {/* NOTIFICATIONS */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gold-300" />
              <CardTitle>Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingToggle icon={<Bell className="w-3.5 h-3.5" />} label="Match Results" defaultOn />
            <SettingToggle icon={<Zap className="w-3.5 h-3.5" />} label="Transfer Offers" defaultOn />
            <SettingToggle icon={<Info className="w-3.5 h-3.5" />} label="Injury Updates" defaultOn />
            <SettingToggle icon={<Music className="w-3.5 h-3.5" />} label="Press Conference" defaultOn={false} />
          </CardContent>
        </Card>

        {/* GAME DATA */}
        <Card className="mb-4 border-danger/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-danger" />
              <CardTitle>Game Data</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {!showResetConfirm ? (
              <Button variant="danger" size="sm" onClick={() => setShowResetConfirm(true)} className="w-full">
                <RotateCcw className="w-3.5 h-3.5" /> Reset Career
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-md bg-danger/10 border border-danger/25 space-y-3"
              >
                <p className="text-xs text-danger font-medium">
                  ⚠️ This will reset your career, club selection, and all progress. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button variant="danger" size="sm" onClick={handleReset} className="flex-1">
                    Yes, Reset Everything
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setShowResetConfirm(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* ABOUT */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-gold-300" />
              <CardTitle>About</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingRow icon={<Info className="w-3.5 h-3.5" />} label="Version" value="0.4.0" />
            <SettingRow icon={<Globe className="w-3.5 h-3.5" />} label="Data Source" value="Real Football + Tactico Engine" />
            <SettingRow icon={<Zap className="w-3.5 h-3.5" />} label="Engine" value="Physics-Based Match Sim" />
            <div className="pt-3 border-t border-white/5">
              <p className="text-[10px] text-quaternary-c font-mono tracking-widest text-center">
                TACTICO — THE FOOTBALL INTELLIGENCE
              </p>
              <p className="text-[9px] text-quaternary-c/60 font-mono tracking-wider text-center mt-1">
                Built with real football data · Powered by Turso + Bzzoiro
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

function VolumeSlider({ icon, label, description, value, onChange }: { icon: React.ReactNode; label: string; description?: string; value: number; onChange: (v: number) => void; }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-gold-300">{icon}</span>
          <div>
            <div className="text-sm font-medium text-primary-c">{label}</div>
            {description && <div className="text-[10px] text-tertiary-c">{description}</div>}
          </div>
        </div>
        <span className="text-xs font-mono text-gold-300 tabular-nums">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range" min={0} max={1} step={0.05} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold-300 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gold-300 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
        style={{ background: `linear-gradient(to right, var(--gold-300) 0%, var(--gold-300) ${value * 100}%, var(--surface-4) ${value * 100}%, var(--surface-4) 100%)` }}
      />
    </div>
  );
}

function SettingRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/3 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-tertiary-c">{icon}</span>
        <span className="text-sm text-secondary-c">{label}</span>
      </div>
      <span className="text-sm text-primary-c font-medium">{value}</span>
    </div>
  );
}

function SettingToggle({ icon, label, defaultOn = true }: { icon: React.ReactNode; label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/3 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-tertiary-c">{icon}</span>
        <span className="text-sm text-secondary-c">{label}</span>
      </div>
      <button
        onClick={() => { setOn(!on); playRawClick(0.1); }}
        className={cn('relative w-10 h-5 rounded-full transition-colors shrink-0', on ? 'bg-gold-300' : 'bg-surface-4')}
      >
        <motion.div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md"
          animate={{ left: on ? '22px' : '2px' }}
          transition={{ duration: 0.2 }}
        />
      </button>
    </div>
  );
}

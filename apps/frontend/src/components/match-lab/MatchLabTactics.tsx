'use client';

import { useEffect, useState } from 'react';
import { defaultRoleDuty } from '@tactico/simulation-engine/spatial';
import {
  DEFAULT_FOOTBALL_TACTICS, type FootballTactics, type MatchManifest,
  type MatchParticipant, type RoleDuty, type WideMovement,
} from '@tactico/simulation-engine/protocol';
import { Button } from '@/components/ui/Button';

const PRESETS: Record<string, FootballTactics> = {
  Balanced: DEFAULT_FOOTBALL_TACTICS,
  'High press': { width: 65, defensiveLine: 80, pressing: 90, tempo: 80, directness: 55, counterpress: true, counterattack: true },
  'Patient possession': { width: 75, defensiveLine: 65, pressing: 60, tempo: 30, directness: 15, counterpress: true, counterattack: false },
  'Low block': { width: 40, defensiveLine: 15, pressing: 20, tempo: 70, directness: 85, counterpress: false, counterattack: true },
};
const SLIDERS = [
  ['width', 'Width', 'Narrow', 'Wide'],
  ['defensiveLine', 'Defensive line', 'Deep', 'High'],
  ['pressing', 'Pressing', 'Hold off', 'Close down'],
  ['tempo', 'Tempo', 'Patient', 'Quick'],
  ['directness', 'Passing', 'Short', 'Direct'],
] as const;

export function MatchLabTactics({ manifest, onApply, selectedPlayer }: {
  manifest: MatchManifest;
  onApply: (manifest: MatchManifest) => void;
  selectedPlayer: MatchParticipant | null;
}) {
  const [team, setTeam] = useState<'home' | 'away'>('home');
  const [tactics, setTactics] = useState(manifest.home.tactics ?? DEFAULT_FOOTBALL_TACTICS);
  const [seed, setSeed] = useState(String(manifest.seed));
  const [duty, setDuty] = useState<RoleDuty>('support');
  const [wideMovement, setWideMovement] = useState<WideMovement>('hold_width');
  useEffect(() => {
    if (selectedPlayer?.kind !== 'player') return;
    setDuty(selectedPlayer.instructions?.duty ?? defaultRoleDuty(selectedPlayer.role as import('@tactico/simulation-engine/protocol').PlayerRole));
    setWideMovement(selectedPlayer.instructions?.wideMovement ?? 'hold_width');
  }, [selectedPlayer]);
  const validSeed = /^\d+$/.test(seed) && Number.isSafeInteger(Number(seed));
  const canEditPlayer = selectedPlayer?.kind === 'player' && selectedPlayer.teamId === manifest[team].teamId;
  const canEditWideMovement = selectedPlayer && ['LB', 'RB', 'LWB', 'RWB', 'LW', 'RW', 'AML', 'AMR'].includes(selectedPlayer.role);
  const selectClass = 'w-full rounded-md border border-white/20 bg-[#121c29] px-2 py-2 text-xs text-white focus:ring-2 focus:ring-gold-300';
  return (
    <details className="shrink-0 rounded-xl border border-gold-300/25 bg-[#0a1018] p-3" open>
      <summary className="cursor-pointer text-sm font-bold text-gold-300">Team instructions</summary>
      <div className="mt-3 max-h-[350px] space-y-3 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-white/65">Team
            <select aria-label="Tactics team" className={selectClass} value={team} onChange={e => {
              const next = e.target.value as 'home' | 'away'; setTeam(next);
              setTactics(manifest[next].tactics ?? DEFAULT_FOOTBALL_TACTICS);
            }}><option value="home">Tactico Blue</option><option value="away">Tactico Red</option></select>
          </label>
          <label className="text-xs text-white/65">Style
            <select aria-label="Tactical preset" className={selectClass} value="" onChange={e => setTactics({ ...PRESETS[e.target.value] })}>
              <option value="" disabled>Choose a style</option>
              {Object.keys(PRESETS).map(p => <option key={p}>{p}</option>)}
            </select>
          </label>
        </div>
        {SLIDERS.map(([key, label, low, high]) => (
          <label key={key} className="block text-xs text-white/80">
            <span className="flex justify-between"><span>{label}</span><output className="font-mono text-gold-300">{tactics[key]}</output></span>
            <input aria-label={label} type="range" min="0" max="100" step="5" value={tactics[key]}
              onChange={e => setTactics({ ...tactics, [key]: Number(e.target.value) })} className="mt-1 w-full accent-[#d4b36a]" />
            <span className="flex justify-between text-[11px] text-white/45"><span>{low}</span><span>{high}</span></span>
          </label>
        ))}
        <div className="flex flex-wrap gap-3 text-xs">
          <label className="flex items-center gap-2"><input type="checkbox" checked={tactics.counterpress} onChange={e => setTactics({ ...tactics, counterpress: e.target.checked })} />Counterpress</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={tactics.counterattack} onChange={e => setTactics({ ...tactics, counterattack: e.target.checked })} />Counterattack</label>
        </div>
        <label className="block text-xs text-white/65">Replay seed
          <input aria-label="Replay seed" className={selectClass} inputMode="numeric" value={seed} onChange={e => setSeed(e.target.value)} />
        </label>
        <p className="text-xs leading-5 text-white/55">Keep the seed to compare your instructions. Applying restarts the sequence; coordinated play begins after the 12-second opening.</p>
        <Button className="w-full" variant="gold" silent disabled={!validSeed} onClick={() => onApply({
          ...manifest, seed: Number(seed), [team]: { ...manifest[team], tactics: { ...tactics } },
        })}>Apply &amp; restart</Button>
        {canEditPlayer && (
          <div className="space-y-2 border-t border-white/10 pt-3">
            <div className="text-xs font-semibold">{selectedPlayer.displayName} · {selectedPlayer.role}</div>
            <div className="text-xs text-white/55">Current: {selectedPlayer.instructions?.duty ?? 'Role default'} · {selectedPlayer.instructions?.wideMovement?.replaceAll('_', ' ') ?? 'Hold width'}</div>
            <div className="grid grid-cols-2 gap-2">
              <select aria-label="Player duty" className={selectClass} value={duty} onChange={e => setDuty(e.target.value as RoleDuty)}>
                <option value="defend">Defend</option><option value="support">Support</option><option value="attack">Attack</option>
              </select>
              <select aria-label="Player wide movement" disabled={!canEditWideMovement} className={selectClass} value={wideMovement} onChange={e => setWideMovement(e.target.value as WideMovement)}>
                <option value="hold_width">Hold width</option><option value="cut_inside">Cut inside</option><option value="overlap">Overlap</option><option value="underlap">Underlap</option>
              </select>
            </div>
            <Button className="w-full" variant="outline" silent onClick={() => onApply({ ...manifest,
              participants: manifest.participants.map(p => p.id === selectedPlayer.id ? { ...p, instructions: { ...p.instructions, duty, wideMovement } } : p),
            })}>Apply player role &amp; restart</Button>
          </div>
        )}
      </div>
    </details>
  );
}

'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bug,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
} from 'lucide-react';
import { SeededKickoffSimulation } from '@tactico/simulation-engine/spatial';
import type {
  EntityId,
  MatchActorFrame,
  MatchEventDelta,
  MatchFrame,
  MatchManifest,
  MatchParticipant,
} from '@tactico/simulation-engine/protocol';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { MatchLabTactics } from './MatchLabTactics';
import {
  MATCH_LAB_END_TICK,
  MATCH_LAB_STABLE_END_TICK,
  createMatchLabManifest,
} from './match-lab-fixture';
import {
  MatchLabPitch,
  type DiagnosticLayers,
} from './MatchLabPitch';

type PlaybackSpeed = 1 | 2 | 4;

const isCompleteFrame = (frame: MatchFrame): boolean =>
  frame.playState === 'dead_ball' ||
  frame.tick >= MATCH_LAB_END_TICK ||
  (frame.tick >= MATCH_LAB_STABLE_END_TICK && frame.ball.state === 'controlled');

const DEFAULT_LAYERS: DiagnosticLayers = {
  decisions: true,
  labels: true,
  motion: false,
  offside: false,
  pressure: true,
  shape: false,
};

const LAYER_LABELS: Record<keyof DiagnosticLayers, string> = {
  decisions: 'Decisions',
  labels: 'Roles',
  motion: 'Motion',
  offside: 'Offside',
  pressure: 'Pressure',
  shape: 'Shape',
};

const planarSpeed = (actor: MatchActorFrame): number =>
  Math.hypot(actor.velocity.x, actor.velocity.y);

const formatClock = (milliseconds: number): string => {
  const seconds = milliseconds / 1000;
  return `00:${seconds.toFixed(2).padStart(5, '0')}`;
};

const titleCase = (value: string): string =>
  value.replaceAll('_', ' ').replace(/\b\w/g, character => character.toUpperCase());

const eventSummary = (
  event: MatchEventDelta,
  participants: ReadonlyMap<EntityId, MatchParticipant>,
): string => {
  const actors = event.actorIds
    .map(id => participants.get(id)?.displayName ?? String(id))
    .join(' → ');
  return `${titleCase(event.type)}${actors ? ` · ${actors}` : ''}`;
};

const planarDistance = (
  left: { x: number; y: number },
  right: { x: number; y: number },
): number => Math.hypot(left.x - right.x, left.y - right.y);

const eventAccent = (type: string): string => {
  if (type === 'goal' || type === 'goal_line_crossed') return 'border-l-success';
  if (type === 'shot_saved') return 'border-l-[#54a8ff]';
  if (type === 'shot_missed') return 'border-l-white/45';
  if (type === 'shot_woodwork') return 'border-l-gold-300';
  if (type.includes('interception') || type.includes('possession_changed')) {
    return 'border-l-[#ff596d]';
  }
  if (type.includes('receive')) return 'border-l-[#42e8e0]';
  if (type === 'whistle') return 'border-l-[#ddff3f]';
  return 'border-l-gold-300';
};

interface MetricProps {
  label: string;
  value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-lg border border-white/7 bg-white/[0.025] px-3 py-2">
      <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">{label}</div>
      <div className="mt-1 truncate font-mono text-[10px] font-semibold tabular-nums text-white/90" title={value}>{value}</div>
    </div>
  );
}

function TruthFact({ label, value }: MetricProps) {
  return (
    <div className="min-w-0 px-3 py-2">
      <div className="text-[8px] font-extrabold uppercase tracking-[0.16em] text-white/32">{label}</div>
      <div className="mt-0.5 truncate text-[10px] font-semibold text-white/78">{value}</div>
    </div>
  );
}

export function MatchLab() {
  const router = useRouter();
  const [manifest, setManifest] = useState<MatchManifest>(() => createMatchLabManifest());
  const simulationRef = useRef<SeededKickoffSimulation | null>(null);
  if (!simulationRef.current) simulationRef.current = new SeededKickoffSimulation(manifest);

  const [frame, setFrame] = useState<MatchFrame>(() => simulationRef.current!.getFrame());
  const frameRef = useRef(frame);
  const [events, setEvents] = useState<readonly MatchEventDelta[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [layers, setLayers] = useState<DiagnosticLayers>(DEFAULT_LAYERS);
  const [selectedActorId, setSelectedActorId] = useState<EntityId | null>(frame.ball.ownerId);
  const accumulatorRef = useRef(0);

  const participants = useMemo(
    () => new Map(manifest.participants.map(participant => [participant.id, participant])),
    [manifest],
  );
  const selectedActor = frame.actors.find(actor => actor.id === selectedActorId) ?? null;
  const selectedParticipant = selectedActor
    ? participants.get(selectedActor.id) ?? null
    : null;
  const possessionOwner = frame.ball.ownerId === null
    ? null
    : participants.get(frame.ball.ownerId) ?? null;
  const possessionTeam = frame.possession.teamId === manifest.home.teamId
    ? 'HOME'
    : frame.possession.teamId === manifest.away.teamId
      ? 'AWAY'
      : 'NONE';
  const passActor = frame.actors.find(actor => actor.intent?.kind === 'pass') ?? null;
  const shotActor = frame.actors.find(actor => actor.intent?.kind === 'shoot') ?? null;
  const passTargetId = frame.ball.flight?.intendedTargetActorId ??
    passActor?.intent?.targetActorId;
  const passTarget = passTargetId === undefined
    ? null
    : participants.get(passTargetId) ?? null;
  const pressureActor = frame.actors.find(actor => actor.intent?.kind === 'intercept') ??
    frame.actors.find(actor => actor.intent?.kind === 'press') ?? null;
  const pressureParticipant = pressureActor
    ? participants.get(pressureActor.id) ?? null
    : null;
  const pressureTargetId = pressureActor?.intent?.targetActorId;
  const pressureTarget = pressureTargetId === undefined
    ? null
    : participants.get(pressureTargetId) ?? null;
  const possessionFact = frame.possession.phase === 'controlled'
    ? `${possessionTeam} · ${possessionOwner?.displayName ?? 'Unknown owner'}`
    : `${possessionTeam} · ${titleCase(frame.possession.phase)}`;
  const awardedGoal = frame.events.find(event => event.type === 'goal') ?? null;
  const scorer = awardedGoal
    ? participants.get(awardedGoal.actorIds[0]) ?? null
    : null;
  const decisionFact = awardedGoal
    ? `${scorer?.displayName ?? 'Scorer'} · Goal awarded`
    : frame.ball.flight
    ? frame.ball.flight.kind === 'shot'
      ? `${participants.get(frame.ball.flight.fromActorId)?.displayName ?? 'Shooter'} → goal · Shot`
      : `${participants.get(frame.ball.flight.fromActorId)?.displayName ?? 'Passer'} → ${passTarget?.displayName ?? 'space'}`
    : shotActor
      ? `${participants.get(shotActor.id)?.displayName ?? 'Shooter'} → goal · Windup`
    : passActor
      ? `${participants.get(passActor.id)?.displayName ?? 'Passer'} → ${passTarget?.displayName ?? 'space'}`
      : 'No active decision';
  const pressureFact = pressureActor && pressureParticipant
    ? `${pressureParticipant.displayName} → ${pressureTarget?.displayName ?? 'ball'} · ${titleCase(pressureActor.intent?.kind ?? 'press')}`
    : 'No designated pressure';
  const selectedIntentTarget = selectedActor?.intent?.targetActorId === undefined
    ? null
    : participants.get(selectedActor.intent.targetActorId) ?? null;
  const selectedTargetPosition = selectedActor?.intent?.targetPosition;
  const selectedTargetDistance = selectedActor && selectedTargetPosition
    ? planarDistance(selectedActor.position, selectedTargetPosition)
    : null;
  const selectedBallDistance = selectedActor
    ? planarDistance(selectedActor.position, frame.ball.position)
    : null;
  const isFinished = isCompleteFrame(frame);
  const labStatus = isPlaying
    ? 'Running'
    : isFinished
      ? 'Tape complete'
      : frame.tick === 0
        ? 'Ready'
        : 'Paused';
  const durationMs = isFinished
    ? frame.simTimeMs
    : MATCH_LAB_END_TICK * (1000 / manifest.tickRateHz);
  const progress = isFinished
    ? 100
    : Math.min(100, frame.tick / MATCH_LAB_END_TICK * 100);

  const commitFrames = useCallback((frames: readonly MatchFrame[]) => {
    if (frames.length === 0) return;
    const latest = frames[frames.length - 1];
    frameRef.current = latest;
    setFrame(latest);

    const nextEvents = frames.flatMap(nextFrame => nextFrame.events);
    if (nextEvents.length > 0) {
      setEvents(previous => [...previous, ...nextEvents].slice(-40));
    }
  }, []);

  const reset = useCallback(() => {
    const simulation = new SeededKickoffSimulation(manifest);
    simulationRef.current = simulation;
    const initialFrame = simulation.getFrame();
    frameRef.current = initialFrame;
    accumulatorRef.current = 0;
    setFrame(initialFrame);
    setEvents([]);
    setIsPlaying(false);
    setSelectedActorId(previous => initialFrame.actors.some(actor => actor.id === previous) ? previous : initialFrame.ball.ownerId);
  }, [manifest]);

  useEffect(() => { reset(); }, [reset]);

  const stepOnce = useCallback(() => {
    if (isCompleteFrame(frameRef.current)) return;
    const simulation = simulationRef.current;
    if (!simulation) return;
    commitFrames([simulation.step()]);
  }, [commitFrames]);

  const togglePlayback = useCallback(() => {
    if (isCompleteFrame(frameRef.current)) return;
    setIsPlaying(previous => !previous);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const tickDurationMs = 1000 / manifest.tickRateHz;
    let animationFrame = 0;
    let lastTimestamp = performance.now();

    const run = (timestamp: number) => {
      const elapsedMs = Math.min(100, Math.max(0, timestamp - lastTimestamp));
      lastTimestamp = timestamp;
      accumulatorRef.current += elapsedMs * playbackSpeed;

      const produced: MatchFrame[] = [];
      const simulation = simulationRef.current;
      let safety = 0;
      while (
        simulation &&
        accumulatorRef.current >= tickDurationMs &&
        !isCompleteFrame(simulation.getFrame()) &&
        safety < 12
      ) {
        produced.push(simulation.step());
        accumulatorRef.current -= tickDurationMs;
        safety += 1;
      }
      commitFrames(produced);

      if (simulation && isCompleteFrame(simulation.getFrame())) {
        accumulatorRef.current = 0;
        setIsPlaying(false);
        return;
      }

      animationFrame = requestAnimationFrame(run);
    };

    animationFrame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(animationFrame);
  }, [commitFrames, isPlaying, manifest.tickRateHz, playbackSpeed]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, button, summary') || target?.isContentEditable) {
        return;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        togglePlayback();
      } else if (event.code === 'ArrowRight' && !isPlaying) {
        event.preventDefault();
        stepOnce();
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        reset();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPlaying, reset, stepOnce, togglePlayback]);

  const toggleLayer = (layer: keyof DiagnosticLayers) => {
    setLayers(previous => ({ ...previous, [layer]: !previous[layer] }));
  };

  const selectActor = (id: EntityId) => setSelectedActorId(id);
  const lastEvent = events[events.length - 1];

  return (
    <div className="min-h-[100dvh] bg-[#06090e] text-white">
      <div className="flex min-h-[100dvh] flex-col lg:h-[100dvh] lg:min-h-[680px] lg:overflow-hidden">
        <header className="flex min-h-[68px] shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/8 bg-[#090e15]/95 px-4 py-2 backdrop-blur-xl lg:h-[68px] lg:flex-nowrap">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              aria-label="Return to matches"
              onClick={() => router.push('/matches')}
              silent
              size="icon"
              variant="ghost"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold-300/25 bg-gold-soft text-gold-300">
              <Bug className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-sm font-extrabold tracking-[0.14em]">TACTICO MATCH LAB</h1>
                <Badge variant="gold">Deterministic</Badge>
              </div>
              <p className="mt-0.5 hidden text-[10px] font-medium uppercase tracking-[0.12em] text-white/40 xl:block">
                Roles · Team instructions · Causal scoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/25 px-3 py-2 xl:gap-6 xl:px-5">
            <div className="text-right">
              <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#54a8ff]">Home 4-3-3</div>
              <div className="whitespace-nowrap text-xs font-extrabold xl:text-sm">TACTICO BLUE</div>
            </div>
            <div className="min-w-[110px] text-center">
              <div className="font-mono text-lg font-black tabular-nums">{frame.score.home} – {frame.score.away}</div>
              <div className="font-mono text-[10px] tabular-nums text-white/55">{formatClock(frame.simTimeMs)}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#ff596d]">Away 4-2-3-1</div>
              <div className="whitespace-nowrap text-xs font-extrabold xl:text-sm">TACTICO RED</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="font-mono text-[10px] font-bold text-white/85 xl:text-xs">SEED {manifest.seed}</div>
              <div className="text-[9px] uppercase tracking-[0.15em] text-white/35">Protocol v{manifest.version}</div>
            </div>
            <Badge variant={isPlaying ? 'success' : isFinished ? 'gold' : 'outline'}>
              {labStatus}
            </Badge>
          </div>
        </header>

        <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_330px] lg:overflow-hidden">
          <section className="flex min-h-0 flex-col gap-2" aria-label="Match visualization">
            <div className="shrink-0 overflow-hidden rounded-lg border border-white/7 bg-[#0a1018]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/6 px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_10px_rgba(34,197,94,0.7)]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/65">
                    Authoritative football state
                  </span>
                  <span className="font-mono text-[10px] text-white/35">20 ticks/sec</span>
                </div>
                <div className="flex items-center gap-4 font-mono text-[10px] tabular-nums text-white/55">
                  <span>Tick <strong className="text-white" data-testid="match-lab-tick">{frame.tick}</strong></span>
                  <span>Sequence <strong className="text-white" data-testid="match-lab-sequence">{frame.sequence}</strong></span>
                  <span>Phase <strong className="text-gold-300">{titleCase(frame.phase)}</strong></span>
                  <span>Ball <strong className="text-white">{titleCase(frame.ball.state)}</strong></span>
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-white/6">
                <TruthFact label="Possession" value={possessionFact} />
                <TruthFact label="Decision / Flight" value={decisionFact} />
                <TruthFact label="Pressure / Contest" value={pressureFact} />
              </div>
            </div>

            {awardedGoal && (
              <div
                aria-live="assertive"
                className="flex shrink-0 items-center justify-between rounded-lg border border-success/35 bg-success/10 px-4 py-2 text-success shadow-[0_0_24px_rgba(34,197,94,0.12)]"
                role="status"
              >
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.2em]">Goal</span>
                  <span className="ml-3 text-xs font-semibold text-white/85">
                    {scorer?.displayName ?? 'Unknown scorer'} · {titleCase(awardedGoal.outcome ?? 'awarded')}
                  </span>
                </div>
                <span className="font-mono text-sm font-black tabular-nums text-white">
                  {frame.score.home} – {frame.score.away}
                </span>
              </div>
            )}

            <MatchLabPitch
              frame={frame}
              layers={layers}
              manifest={manifest}
              onSelectActor={selectActor}
              selectedActorId={selectedActorId}
            />
          </section>

          <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto" aria-label="Match diagnostics">
            <MatchLabTactics manifest={manifest} onApply={setManifest} selectedPlayer={selectedParticipant} />
            <section className="shrink-0 rounded-xl border border-white/8 bg-[#0a1018] p-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/70">Diagnostic Layers</h2>
                <span className="font-mono text-[9px] text-white/35">LIVE</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.keys(LAYER_LABELS) as (keyof DiagnosticLayers)[]).map(layer => (
                  <button
                    aria-pressed={layers[layer]}
                    className={cn(
                      'h-8 rounded-md border px-2 text-[9px] font-bold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300',
                      layers[layer]
                        ? 'border-gold-300/30 bg-gold-soft text-gold-300'
                        : 'border-white/7 bg-white/[0.025] text-white/40 hover:text-white/70',
                    )}
                    key={layer}
                    onClick={() => toggleLayer(layer)}
                    type="button"
                  >
                    {LAYER_LABELS[layer]}
                  </button>
                ))}
              </div>
            </section>

            <section className="shrink-0 rounded-xl border border-white/8 bg-[#0a1018] p-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/70">Actor Inspector</h2>
                {selectedParticipant && <Badge variant={selectedActor?.hasPossession ? 'gold' : 'outline'}>{String(selectedParticipant.role)}</Badge>}
              </div>

              {selectedActor && selectedParticipant ? (
                <>
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      aria-hidden="true"
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-black text-[#071018]',
                        selectedParticipant.kind !== 'player' && 'rotate-45 rounded-md',
                      )}
                      style={{
                        backgroundColor: selectedParticipant.kind === 'referee'
                          ? '#ddff3f'
                          : selectedParticipant.kind === 'assistant_referee'
                            ? '#42e8e0'
                            : selectedParticipant.role === 'GK'
                              ? '#f8c84a'
                              : selectedParticipant.teamId === 'home' ? '#54a8ff' : '#ff596d',
                        borderColor: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      <span className={cn(selectedParticipant.kind !== 'player' && '-rotate-45')}>
                        {selectedParticipant.kind === 'player' ? selectedParticipant.shirtNumber : 'O'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold">{selectedParticipant.displayName}</div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-white/45">
                        {titleCase(selectedParticipant.kind)} · {titleCase(String(selectedParticipant.role))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedActor.footballDecision && <>
                      <Metric label="Team phase" value={titleCase(selectedActor.footballDecision.phase)} />
                      <Metric label="Responsibility" value={titleCase(selectedActor.footballDecision.responsibility)} />
                      <Metric label="Duty" value={selectedActor.footballDecision.duty} />
                      <Metric label="Forward run" value={selectedActor.footballDecision.forwardRunAllowed ? 'Cover ready' : 'Hold / protect'} />
                    </>}
                    <Metric label="Intent" value={selectedActor.intent ? titleCase(selectedActor.intent.kind) : 'None'} />
                    <Metric
                      label="Intent Target"
                      value={selectedIntentTarget?.displayName ??
                        (selectedTargetPosition
                          ? `${selectedTargetPosition.x.toFixed(1)}, ${selectedTargetPosition.y.toFixed(1)}m`
                          : 'None')}
                    />
                    <Metric label="Reason" value={selectedActor.intent ? titleCase(selectedActor.intent.reason) : 'None'} />
                    <Metric label="Pressure" value={`${((selectedActor.pressure ?? 0) * 100).toFixed(0)}%`} />
                    <Metric label="Position" value={`${selectedActor.position.x.toFixed(2)}, ${selectedActor.position.y.toFixed(2)}m`} />
                    <Metric label="Speed / Action" value={`${planarSpeed(selectedActor).toFixed(2)} m/s · ${selectedActor.action ? titleCase(selectedActor.action.kind) : 'None'}`} />
                    <Metric label="Target Distance" value={selectedTargetDistance === null ? '—' : `${selectedTargetDistance.toFixed(2)}m`} />
                    <Metric label="Ball Distance" value={selectedBallDistance === null ? '—' : `${selectedBallDistance.toFixed(2)}m`} />
                  </div>
                </>
              ) : (
                <p className="text-xs leading-5 text-white/45">Select an actor on the pitch to inspect its authoritative state.</p>
              )}
            </section>

            <section className="flex min-h-[240px] shrink-0 flex-col overflow-hidden rounded-xl border border-white/8 bg-[#0a1018]">
              <div className="flex shrink-0 items-center justify-between border-b border-white/7 px-3 py-2.5">
                <h2 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/70">Event Delta Stream</h2>
                <span className="font-mono text-[9px] text-white/35">{events.length} events</span>
              </div>
              <div className="scroll-region min-h-0 flex-1 p-2">
                {events.length === 0 ? (
                  <div className="flex h-full min-h-24 items-center justify-center text-center text-[10px] uppercase tracking-[0.12em] text-white/25">
                    Run or step the simulation<br />to produce event deltas
                  </div>
                ) : (
                  <ol className="space-y-1.5">
                    {[...events].reverse().map(event => (
                      <li
                        className={cn(
                          'rounded-lg border border-l-2 border-white/6 bg-white/[0.025] p-2.5',
                          eventAccent(event.type),
                        )}
                        key={event.sequence}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-white/85">{titleCase(event.type)}</span>
                          <span className="font-mono text-[9px] text-gold-300">#{event.sequence}</span>
                        </div>
                        <div className="mt-1 truncate text-[9px] font-medium text-white/52">
                          {event.actorIds
                            .map(id => participants.get(id)?.displayName ?? String(id))
                            .join(' → ')}
                        </div>
                        <div className="mt-0.5 truncate font-mono text-[8px] text-white/30">
                          {(event.simTimeMs / 1000).toFixed(2)}s · {titleCase(event.outcome ?? 'recorded')}
                          {event.decisionId ? ` · Decision ${event.decisionId}` : ''}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </section>
          </aside>
        </main>

        <footer className="sticky bottom-0 z-20 shrink-0 border-t border-white/8 bg-[#090e15] px-4 py-3">
          <div className="mb-2 flex items-center gap-3">
            <span className="w-20 font-mono text-[10px] tabular-nums text-white/45">{formatClock(frame.simTimeMs)}</span>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
              <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold-500 to-gold-300 transition-[width] duration-100" style={{ width: `${progress}%` }} />
            </div>
            <span className="w-20 text-right font-mono text-[10px] tabular-nums text-white/45">{formatClock(durationMs)}</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button aria-label="Reset deterministic tape" onClick={reset} silent size="icon" variant="secondary">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                aria-label="Advance one simulation tick"
                disabled={isPlaying || isFinished}
                onClick={stepOnce}
                silent
                size="icon"
                variant="secondary"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button
                aria-label={isPlaying ? 'Pause deterministic tape' : 'Play deterministic tape'}
                className="min-w-[112px]"
                disabled={isFinished}
                onClick={togglePlayback}
                silent
                variant="gold"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Pause' : isFinished ? 'Complete' : 'Run Tape'}
              </Button>
            </div>

            <div className="flex items-center gap-2" aria-label="Playback speed">
              <span className="mr-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white/35">Playback</span>
              {([1, 2, 4] as const).map(speed => (
                <Button
                  aria-pressed={playbackSpeed === speed}
                  className="w-12"
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  silent
                  size="sm"
                  variant={playbackSpeed === speed ? 'outline' : 'ghost'}
                >
                  {speed}×
                </Button>
              ))}
            </div>

            <div className="hidden items-center gap-5 text-[10px] text-white/40 lg:flex">
              <span><kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-1 font-mono text-white/65">Space</kbd> Play/Pause</span>
              <span><kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-1 font-mono text-white/65">→</kbd> Step</span>
              <span><kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-1 font-mono text-white/65">R</kbd> Reset</span>
            </div>
          </div>
        </footer>

        <div aria-atomic="true" aria-live="polite" className="sr-only">
          {lastEvent ? eventSummary(lastEvent, participants) : 'Match Lab ready'}
        </div>
      </div>
    </div>
  );
}

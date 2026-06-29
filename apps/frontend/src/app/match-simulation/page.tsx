'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, FastForward, RotateCcw, ChevronLeft, Volume2, VolumeX } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { playSfx } from '@/lib/audio';
import { SimulationEngine } from '@tactico/simulation-engine';
import { MatchRenderer } from '@/lib/match-renderer';
import type { MatchEvent, SimulationState, PhaseState } from '@tactico/simulation-engine';
import { getOfflineClub, getOfflineSquad } from '@/lib/game-data';
import { cn } from '@/lib/utils';

// ============================================================
// MATCH SIMULATION PAGE
// ============================================================

export default function MatchSimulationPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SimulationEngine | null>(null);
  const rendererRef = useRef<MatchRenderer | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [matchState, setMatchState] = useState<SimulationState | null>(null);
  const [phaseState, setPhaseState] = useState<PhaseState | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [commentary, setCommentary] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [matchSpeed, setMatchSpeed] = useState<'slow' | 'normal' | 'fast' | 'instant'>('normal');
  const [showCommentary, setShowCommentary] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [matchTime, setMatchTime] = useState(0);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [possession, setPossession] = useState({ home: 50, away: 50 });

  const store = useAppStore();
  const selectedClubId = store.selectedClubId;
  const fixtures = store.fixtures;
  const tactics = store.tactics;

  // Find the next live fixture
  const currentFixture = fixtures.find(f => f.status === 'live' || f.status === 'scheduled');

  const homeClub = currentFixture ? getOfflineClub(currentFixture.homeClubId) : null;
  const awayClub = currentFixture ? getOfflineClub(currentFixture.awayClubId) : null;
  const homeSquad = currentFixture ? getOfflineSquad(currentFixture.homeClubId) : [];
  const awaySquad = currentFixture ? getOfflineSquad(currentFixture.awayClubId) : [];
  const isUserHome = currentFixture ? currentFixture.homeClubId === selectedClubId : false;
  const isUserAway = currentFixture ? currentFixture.awayClubId === selectedClubId : false;

  // Initialize match
  useEffect(() => {
    if (!currentFixture || !canvasRef.current) return;

    const engine = new SimulationEngine({
      matchSpeed: 'normal',
      enablePhysics: true,
      enableCommentary: true,
      enableStats: true,
    });

    engineRef.current = engine;

    // Initialize with squads and tactics
    const homeInstructions = {
      formation: homeClub?.coach === 'Pep Guardiola' ? '4-3-3' : '4-4-2',
      pressingIntensity: 'high',
      pressingTrigger: 'aggressive',
      defensiveLine: 'high',
      lineOfEngagement: 'higher',
      passingStyle: 'short',
      passingDirectness: 'standard',
      tempo: 'high',
      timeWasting: false,
      offsideTrap: true,
      counterPress: true,
      counterAttack: false,
      playForSetPieces: false,
      beMoreExpressive: true,
      stayOnFeet: false,
      tackleHarder: false,
    };

    const awayInstructions = {
      formation: awayClub?.coach === 'Diego Simeone' ? '5-3-2' : '4-3-3',
      pressingIntensity: 'medium',
      pressingTrigger: 'standard',
      defensiveLine: 'medium',
      lineOfEngagement: 'standard',
      passingStyle: 'mixed',
      passingDirectness: 'standard',
      tempo: 'standard',
      timeWasting: false,
      offsideTrap: false,
      counterPress: false,
      counterAttack: true,
      playForSetPieces: false,
      beMoreExpressive: false,
      stayOnFeet: true,
      tackleHarder: false,
    };

    engine.initializeMatch(
      currentFixture.homeClubId,
      currentFixture.awayClubId,
      homeSquad,
      awaySquad,
      homeInstructions,
      awayInstructions,
      'clear'
    );

    // Create renderer
    const renderer = new MatchRenderer(canvasRef.current, engine, {
      homeColor: parseInt(homeClub?.homeKitColor.replace('#', '0x') || '0x6CABDD'),
      awayColor: parseInt(awayClub?.homeKitColor.replace('#', '0x') || '0xDA0E20'),
      homeFormation: homeInstructions.formation,
      awayFormation: awayInstructions.formation,
    });

    rendererRef.current = renderer;

    // Get initial team states and create players
    const homeTeamState = engine.getAITeamState(currentFixture.homeClubId);
    const awayTeamState = engine.getAITeamState(currentFixture.awayClubId);
    if (homeTeamState && awayTeamState) {
      const teamStates = new Map();
      teamStates.set(currentFixture.homeClubId, homeTeamState);
      teamStates.set(currentFixture.awayClubId, awayTeamState);
      renderer.createPlayers(homeTeamState, awayTeamState);
    }

    // Set up event callback
    renderer.setOnEventCallback((event: MatchEvent) => {
      setEvents(prev => [...prev, event]);
      if (event.commentary) {
        setCommentary(prev => [...prev.slice(-4), event.commentary!]);
      }

      // Update scores
      if (event.type === 'goal') {
        const isHomeGoal = event.teamId === currentFixture.homeClubId;
        if (isHomeGoal) {
          setHomeScore(s => s + 1);
        } else {
          setAwayScore(s => s + 1);
        }
        playSfx('goal');
      }
    });

    // Cleanup
    return () => {
      engine.destroy();
      renderer.destroy();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentFixture]);

  // Update loop
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    intervalRef.current = setInterval(() => {
      if (engineRef.current) {
        const state = engineRef.current.getState();
        setMatchState(state);
        setMatchTime(state.currentTime);
        setPossession(state.stats.possession);

        const phase = engineRef.current.getPhaseState();
        setPhaseState(phase);

        // Check for half-time / full-time
        if (state.isHalfTime) {
          setIsPaused(true);
          playSfx('whistle');
        }
        if (state.isFullTime) {
          setIsPlaying(false);
          setIsPaused(false);
          playSfx('whistle');

          // Record result
          if (currentFixture) {
            store.recordMatchResult(currentFixture.id, homeScore, awayScore);
          }
        }
      }
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, isPaused, homeScore, awayScore, currentFixture]);

  // Speed control
  useEffect(() => {
    if (engineRef.current) {
      // Engine speed is set via config, would need restart for instant
      // For now, we control UI update frequency
    }
  }, [matchSpeed]);

  const handlePlay = useCallback(() => {
    if (!engineRef.current) return;

    if (isPaused) {
      engineRef.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else if (!isPlaying) {
      engineRef.current.start();
      setIsPlaying(true);
      setIsPaused(false);
    }
    playSfx('click');
  }, [isPlaying, isPaused]);

  const handlePause = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.pause();
    setIsPaused(true);
    playSfx('click');
  }, []);

  const handleStop = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.stop();
    setIsPlaying(false);
    setIsPaused(false);
    playSfx('click');
  }, []);

  const handleSpeedChange = useCallback((speed: 'slow' | 'normal' | 'fast' | 'instant') => {
    setMatchSpeed(speed);
    playSfx('tab-switch');
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentFixture) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-tertiary-c text-sm mb-4">No match scheduled</p>
          <button
            onClick={() => router.push('/matches')}
            className="game-btn-secondary"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Match Header */}
      <div className="glass-heavy px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/matches')}
            className="game-btn-ghost p-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            {/* Home team */}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: homeClub?.homeKitColor || '#6CABDD' }}
              >
                {homeClub?.shortName?.slice(0, 2)}
              </div>
              <span className="font-display text-sm font-semibold hidden sm:block">
                {homeClub?.shortName}
              </span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-2 px-4 py-1.5 bg-surface-2 rounded-lg">
              <span className="text-2xl font-mono font-bold tabular-nums">{homeScore}</span>
              <span className="text-tertiary-c text-sm">-</span>
              <span className="text-2xl font-mono font-bold tabular-nums">{awayScore}</span>
            </div>

            {/* Away team */}
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-semibold hidden sm:block">
                {awayClub?.shortName}
              </span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: awayClub?.homeKitColor || '#DA0E20' }}
              >
                {awayClub?.shortName?.slice(0, 2)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Time */}
          <div className="text-center">
            <span className="text-xl font-mono font-bold tabular-nums">{formatTime(matchTime)}</span>
            <span className="text-xs text-tertiary-c block">
              {matchTime < 45 * 60 ? '1st Half' : matchTime < 90 * 60 ? '2nd Half' : 'FT'}
            </span>
          </div>

          {/* Possession */}
          <div className="hidden md:block w-24">
            <div className="flex justify-between text-xs text-tertiary-c mb-1">
              <span>{possession.home}%</span>
              <span>POS</span>
              <span>{possession.away}%</span>
            </div>
            <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold-300 rounded-full transition-all"
                style={{ width: `${possession.home}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Match Canvas */}
        <div className="flex-1 relative bg-surface-base">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ imageRendering: 'auto' }}
          />

          {/* Overlay: Phase indicator */}
          <AnimatePresence>
            {phaseState && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-full"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-gold-300">
                  {phaseState.phase.replace('_', ' ')}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Overlay: Commentary */}
          <AnimatePresence>
            {showCommentary && commentary.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-20 left-4 right-4 md:left-1/4 md:right-1/4"
              >
                <div className="glass p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="live-dot mt-1.5 shrink-0" />
                    <p className="text-sm leading-relaxed">{commentary[commentary.length - 1]}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Overlay: Match controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 glass px-4 py-2 rounded-full">
            <button
              onClick={handlePlay}
              disabled={isPlaying && !isPaused}
              className={cn(
                "p-2 rounded-full transition-all",
                isPlaying && !isPaused ? "bg-surface-3 text-tertiary-c" : "bg-gold-300 text-surface-base hover:bg-gold-200"
              )}
            >
              <Play className="w-5 h-5" />
            </button>

            <button
              onClick={handlePause}
              disabled={!isPlaying || isPaused}
              className={cn(
                "p-2 rounded-full transition-all",
                isPaused ? "bg-gold-300 text-surface-base" : "bg-surface-3 text-primary-c hover:bg-surface-4"
              )}
            >
              <Pause className="w-5 h-5" />
            </button>

            <button
              onClick={handleStop}
              className="p-2 rounded-full bg-surface-3 text-primary-c hover:bg-surface-4 transition-all"
            >
              <Square className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Speed controls */}
            {(['slow', 'normal', 'fast', 'instant'] as const).map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={cn(
                  "px-2 py-1 rounded text-xs font-semibold uppercase transition-all",
                  matchSpeed === speed
                    ? "bg-gold-300 text-surface-base"
                    : "text-tertiary-c hover:text-primary-c"
                )}
              >
                {speed === 'instant' ? <FastForward className="w-4 h-4" /> : speed[0]}
              </button>
            ))}

            <div className="w-px h-6 bg-white/10 mx-1" />

            <button
              onClick={() => setShowCommentary(!showCommentary)}
              className={cn(
                "p-2 rounded-full transition-all",
                showCommentary ? "text-gold-300" : "text-tertiary-c"
              )}
            >
              {showCommentary ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Right Panel: Stats & Events */}
        <div className="hidden lg:flex w-80 flex-col border-l border-white/5 bg-surface-1">
          {/* Match Stats */}
          <div className="p-4 border-b border-white/5">
            <h3 className="section-header mb-3">Match Stats</h3>

            {matchState && (
              <div className="space-y-3">
                <StatBar
                  label="Possession"
                  home={matchState.stats.possession.home}
                  away={matchState.stats.possession.away}
                  homeColor={homeClub?.homeKitColor}
                  awayColor={awayClub?.homeKitColor}
                />
                <StatBar
                  label="Shots"
                  home={matchState.stats.shots.home}
                  away={matchState.stats.shots.away}
                  homeColor={homeClub?.homeKitColor}
                  awayColor={awayClub?.homeKitColor}
                />
                <StatBar
                  label="On Target"
                  home={matchState.stats.shots.onTarget.home}
                  away={matchState.stats.shots.onTarget.away}
                  homeColor={homeClub?.homeKitColor}
                  awayColor={awayClub?.homeKitColor}
                />
                <StatBar
                  label="xG"
                  home={Math.round(matchState.stats.xg.home * 100) / 100}
                  away={Math.round(matchState.stats.xg.away * 100) / 100}
                  homeColor={homeClub?.homeKitColor}
                  awayColor={awayClub?.homeKitColor}
                  isDecimal
                />
                <StatBar
                  label="Passes"
                  home={matchState.stats.passes.home.completed}
                  away={matchState.stats.passes.away.completed}
                  homeColor={homeClub?.homeKitColor}
                  awayColor={awayClub?.homeKitColor}
                />
                <StatBar
                  label="Tackles"
                  home={matchState.stats.tackles.home.won}
                  away={matchState.stats.tackles.away.won}
                  homeColor={homeClub?.homeKitColor}
                  awayColor={awayClub?.homeKitColor}
                />
              </div>
            )}
          </div>

          {/* Event Feed */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <h3 className="section-header px-4 pt-4 pb-2">Event Feed</h3>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              <AnimatePresence>
                {events.slice(-20).map((event, index) => (
                  <motion.div
                    key={`${event.id}-${index}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "feed-row rounded-md",
                      event.type === 'goal' && "bg-gold-soft/30 border-l-2 border-gold-300",
                      event.type === 'shot' && "bg-surface-2",
                      event.type === 'foul' && event.card && "bg-danger-soft border-l-2 border-danger",
                    )}
                  >
                    <span className="text-xs font-mono text-tertiary-c w-8">
                      {event.minute}'
                    </span>
                    <span className={cn(
                      "text-xs font-semibold uppercase",
                      event.teamId === currentFixture?.homeClubId ? "text-primary-c" : "text-secondary-c"
                    )}>
                      {event.teamId === currentFixture?.homeClubId ? homeClub?.shortName : awayClub?.shortName}
                    </span>
                    <span className="text-xs text-secondary-c">
                      {event.type === 'goal' && '⚽ Goal'}
                      {event.type === 'shot' && (event.target === 'saved' ? '🧤 Saved' : event.target === 'off_target' ? '❌ Miss' : '🎯 Shot')}
                      {event.type === 'pass' && (event.success ? '✓ Pass' : '✗ Lost')}
                      {event.type === 'tackle' && (event.success ? '✓ Tackle' : '✗ Missed')}
                      {event.type === 'foul' && (event.card ? `🟨 ${event.card}` : 'Foul')}
                      {event.type === 'set_piece' && event.setPieceType}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STAT BAR COMPONENT
// ============================================================

function StatBar({
  label,
  home,
  away,
  homeColor,
  awayColor,
  isDecimal = false,
}: {
  label: string;
  home: number;
  away: number;
  homeColor?: string;
  awayColor?: string;
  isDecimal?: boolean;
}) {
  const total = home + away;
  const homePct = total > 0 ? (home / total) * 100 : 50;
  const awayPct = total > 0 ? (away / total) * 100 : 50;

  const format = (n: number) => isDecimal ? n.toFixed(2) : Math.round(n).toString();

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-mono font-semibold" style={{ color: homeColor }}>{format(home)}</span>
        <span className="text-tertiary-c uppercase tracking-wider">{label}</span>
        <span className="font-mono font-semibold" style={{ color: awayColor }}>{format(away)}</span>
      </div>
      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden flex">
        <div
          className="h-full rounded-l-full transition-all"
          style={{ width: `${homePct}%`, backgroundColor: homeColor || '#6CABDD' }}
        />
        <div
          className="h-full rounded-r-full transition-all"
          style={{ width: `${awayPct}%`, backgroundColor: awayColor || '#DA0E20' }}
        />
      </div>
    </div>
  );
}

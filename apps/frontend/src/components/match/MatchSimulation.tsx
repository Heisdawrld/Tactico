'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Matter from 'matter-js';
import { PhysicsEngine } from './PhysicsEngine';
import { useAppStore } from '@/lib/store';
import { getOfflineClub, getOfflineSquad, getOfflineFixtures, OFFLINE_CLUBS } from '@/lib/game-data';
import { playRawClick } from '@/lib/audio';
import { getCrowdAudio } from '@/lib/crowd-audio';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, ChevronRight, Volume2, VolumeX } from 'lucide-react';

interface MatchPlayer {
  id: number;
  name: string;
  position: string;
  team: 'home' | 'away';
  rating: number;
  positionX: number;
  positionY: number;
  body: any;
}

interface MatchState {
  score: { home: number; away: number };
  time: number;
  possession: 'home' | 'away';
  matchStatus: 'waiting' | 'playing' | 'paused' | 'finished';
  currentEvent: string;
  events: { minute: number; text: string; type: 'goal' | 'chance' | 'info' }[];
}

// 4-4-2 formation (home team attacks right)
const FORMATION_442 = [
  { x: 100, y: 340, pos: 'GK' },
  { x: 250, y: 170, pos: 'CB' }, { x: 250, y: 510, pos: 'CB' },
  { x: 300, y: 100, pos: 'LB' }, { x: 300, y: 580, pos: 'RB' },
  { x: 400, y: 200, pos: 'CM' }, { x: 400, y: 480, pos: 'CM' },
  { x: 500, y: 150, pos: 'RW' }, { x: 500, y: 530, pos: 'LW' },
  { x: 650, y: 280, pos: 'ST' }, { x: 650, y: 400, pos: 'ST' },
];
const FORMATION_AWAY = FORMATION_442.map(p => ({ ...p, x: 1050 - p.x }));

const PITCH_WIDTH = 1050;
const PITCH_HEIGHT = 680;

export default function MatchSimulation() {
  const selectedClubId = useAppStore((s) => s.selectedClubId);
  const audioEnabled = useAppStore((s) => s.audioEnabled);

  // Get club + opponent from offline data
  const { homeClub, awayClub, homeSquad, awaySquad } = useMemo(() => {
    const home = getOfflineClub(selectedClubId || 1) || OFFLINE_CLUBS[0];
    const fixtures = getOfflineFixtures(home.id);
    const nextFixture = fixtures.find(f => f.status !== 'finished');
    const awayId = nextFixture
      ? (nextFixture.homeClubId === home.id ? nextFixture.awayClubId : nextFixture.homeClubId)
      : OFFLINE_CLUBS.find(c => c.id !== home.id)!.id;
    const away = getOfflineClub(awayId) || OFFLINE_CLUBS[1];
    return {
      homeClub: home,
      awayClub: away,
      homeSquad: getOfflineSquad(home.id),
      awaySquad: getOfflineSquad(away.id),
    };
  }, [selectedClubId]);

  // Build player rosters from offline squads
  const homePlayers = useMemo(() => {
    const sorted = [...homeSquad].sort((a, b) => b.overallRating - a.overallRating).slice(0, 11);
    return sorted.map((p, i) => ({
      id: p.id,
      name: p.firstName + (p.lastName ? ' ' + p.lastName : ''),
      position: FORMATION_442[i]?.pos || 'CM',
      team: 'home' as const,
      rating: p.overallRating,
      positionX: FORMATION_442[i]?.x || 400,
      positionY: FORMATION_442[i]?.y || 340,
    }));
  }, [homeSquad]);

  const awayPlayers = useMemo(() => {
    const sorted = [...awaySquad].sort((a, b) => b.overallRating - a.overallRating).slice(0, 11);
    return sorted.map((p, i) => ({
      id: p.id,
      name: p.firstName + (p.lastName ? ' ' + p.lastName : ''),
      position: FORMATION_AWAY[i]?.pos || 'CM',
      team: 'away' as const,
      rating: p.overallRating,
      positionX: FORMATION_AWAY[i]?.x || 650,
      positionY: FORMATION_AWAY[i]?.y || 340,
    }));
  }, [awaySquad]);

  // State
  const [matchState, setMatchState] = useState<MatchState>({
    score: { home: 0, away: 0 },
    time: 0,
    possession: 'home',
    matchStatus: 'waiting',
    currentEvent: 'Ready to kick off',
    events: [],
  });

  // Refs (avoid stale closures)
  const matchStatusRef = useRef(matchState.matchStatus);
  const playersRef = useRef<MatchPlayer[]>([]);
  const ballRef = useRef<any>(null);
  const engineRef = useRef<PhysicsEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastKickRef = useRef<number>(0);
  const crowdRef = useRef(getCrowdAudio());

  // Keep matchStatusRef in sync
  useEffect(() => {
    matchStatusRef.current = matchState.matchStatus;
  }, [matchState.matchStatus]);

  // Initialize physics + players
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new PhysicsEngine();
    engine.init(containerRef.current);
    engineRef.current = engine;

    // Convert hex color strings to numbers for Matter.js
    const homeColor = parseInt(homeClub.homeKitColor.replace('#', ''), 16);
    const awayColor = parseInt(awayClub.homeKitColor.replace('#', ''), 16);

    const allPlayers: MatchPlayer[] = [];
    [...homePlayers, ...awayPlayers].forEach(playerData => {
      const body = engine.addPlayer(
        playerData.positionX,
        playerData.positionY,
        playerData.team === 'home' ? homeColor : awayColor
      );
      allPlayers.push({ ...playerData, body });
    });
    playersRef.current = allPlayers;
    ballRef.current = engine.addBall(525, 340);

    Matter.Events.on((engine as any).engine, 'collisionStart', handleCollisions);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
      engine.destroy();
    };
  }, [homePlayers, awayPlayers, homeClub, awayClub]);

  const handleCollisions = (event: Matter.IEventCollision<Matter.Engine>) => {
    event.pairs.forEach(pair => {
      const { bodyA, bodyB } = pair;
      const ball = ballRef.current;
      if (!ball) return;

      const isBallA = bodyA.id === ball.id;
      const isBallB = bodyB.id === ball.id;
      if (!isBallA && !isBallB) return;

      const playerBody = isBallA ? bodyB : bodyA;
      const player = playersRef.current.find(p => p.body.id === playerBody.id);
      if (!player) return;

      lastKickRef.current = Date.now();

      const distToGoal = player.team === 'home'
        ? Math.hypot(player.body.position.x - 1000, player.body.position.y - 340)
        : Math.hypot(player.body.position.x - 50, player.body.position.y - 340);

      if (distToGoal < 250 && Math.random() < 0.25) {
        shoot(player, ball);
      } else if (Math.random() < 0.35) {
        pass(player, ball);
      } else {
        dribble(player, ball);
      }
    });
  };

  const shoot = (player: MatchPlayer, ball: any) => {
    const targetX = player.team === 'home' ? 1050 : 0;
    const targetY = 280 + Math.random() * 120;
    const power = 0.08 + player.rating * 0.001;
    Matter.Body.setVelocity(ball, {
      x: (targetX - ball.position.x) * power,
      y: (targetY - ball.position.y) * power,
    });

    const minute = Math.floor(matchState.time / 60);
    setMatchState(prev => ({
      ...prev,
      currentEvent: `SHOT! ${player.name} strikes!`,
      events: [...prev.events, { minute, text: `${player.name} shoots`, type: 'chance' }],
    }));

    // Check goal after 2s
    setTimeout(() => checkGoal(player), 2000);
  };

  const pass = (player: MatchPlayer, ball: any) => {
    const teammates = playersRef.current.filter(p => p.team === player.team && p.id !== player.id);
    const target = teammates[Math.floor(Math.random() * teammates.length)];
    if (!target) { dribble(player, ball); return; }

    const power = 0.05 + player.rating * 0.0008;
    Matter.Body.setVelocity(ball, {
      x: (target.body.position.x - ball.position.x) * power,
      y: (target.body.position.y - ball.position.y) * power,
    });
  };

  const dribble = (player: MatchPlayer, ball: any) => {
    const targetX = player.team === 'home' ? ball.position.x + 30 : ball.position.x - 30;
    Matter.Body.setVelocity(ball, {
      x: (targetX - ball.position.x) * 0.03,
      y: (Math.random() - 0.5) * 3,
    });
  };

  const checkGoal = (lastPlayer: MatchPlayer) => {
    const ball = ballRef.current;
    if (!ball) return;

    const isGoal = lastPlayer.team === 'home'
      ? ball.position.x > 1020
      : ball.position.x < 30;

    if (isGoal && matchStatusRef.current === 'playing') {
      const minute = Math.floor(matchState.time / 60) + 1;
      setMatchState(prev => ({
        ...prev,
        score: lastPlayer.team === 'home'
          ? { ...prev.score, home: prev.score.home + 1 }
          : { ...prev.score, away: prev.score.away + 1 },
        currentEvent: `GOAL! ${lastPlayer.name} scores!`,
        events: [...prev.events, { minute, text: `⚽ ${lastPlayer.name} scores for ${lastPlayer.team === 'home' ? homeClub.name : awayClub.name}!`, type: 'goal' }],
      }));
      crowdRef.current.swell(1);
      resetBall();
    }
  };

  const resetBall = () => {
    if (ballRef.current) {
      Matter.Body.setPosition(ballRef.current, Matter.Vector.create(525, 340));
      Matter.Body.setVelocity(ballRef.current, Matter.Vector.create(0, 0));
    }
    playersRef.current.forEach(player => {
      const formation = player.team === 'home' ? FORMATION_442 : FORMATION_AWAY;
      const original = formation.find(p => p.pos === player.position);
      if (original && player.body) {
        Matter.Body.setPosition(player.body, Matter.Vector.create(original.x, original.y));
        Matter.Body.setVelocity(player.body, Matter.Vector.create(0, 0));
      }
    });
  };

  // AI loop — uses matchStatusRef (not stale closure)
  const startMatchLoop = () => {
    timeIntervalRef.current = setInterval(() => {
      setMatchState(prev => {
        const newTime = prev.time + 1;
        // Full time at 90 minutes (5400 seconds compressed to 90 for demo → 90s)
        if (newTime >= 90) {
          if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
          return { ...prev, time: 90, matchStatus: 'finished', currentEvent: 'Full Time' };
        }
        // Half time at 45
        if (newTime === 45) {
          return { ...prev, time: 45, currentEvent: 'Half Time' };
        }
        return { ...prev, time: newTime };
      });
    }, 1000);

    const updateAI = () => {
      // Read from REF — always current value, no stale closure
      if (matchStatusRef.current !== 'playing') {
        animationFrameRef.current = requestAnimationFrame(updateAI);
        return;
      }

      const ball = ballRef.current;
      if (ball) {
        playersRef.current.forEach(player => {
          const distToBall = Math.hypot(
            player.body.position.x - ball.position.x,
            player.body.position.y - ball.position.y
          );

          let targetX, targetY;
          if (distToBall < 120) {
            targetX = ball.position.x;
            targetY = ball.position.y;
          } else {
            const formation = player.team === 'home' ? FORMATION_442 : FORMATION_AWAY;
            const original = formation.find(p => p.pos === player.position);
            if (original) {
              targetX = original.x;
              targetY = original.y;
            } else {
              return;
            }
          }

          const speed = 0.0001 * player.rating;
          Matter.Body.setVelocity(player.body, {
            x: (targetX - player.body.position.x) * speed,
            y: (targetY - player.body.position.y) * speed,
          });
        });
      }

      animationFrameRef.current = requestAnimationFrame(updateAI);
    };
    updateAI();
  };

  // Controls
  const handleStart = () => {
    if (matchState.matchStatus === 'waiting') {
      setMatchState(prev => ({ ...prev, matchStatus: 'playing', currentEvent: 'Kick off!' }));
      startMatchLoop();
      if (audioEnabled) crowdRef.current.swell(0.6);
    } else if (matchState.matchStatus === 'paused') {
      setMatchState(prev => ({ ...prev, matchStatus: 'playing' }));
    }
    playRawClick(0.15);
  };

  const handlePause = () => {
    setMatchState(prev => ({ ...prev, matchStatus: 'paused' }));
    playRawClick(0.1);
  };

  const handleReset = () => {
    if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setMatchState({
      score: { home: 0, away: 0 },
      time: 0,
      possession: 'home',
      matchStatus: 'waiting',
      currentEvent: 'Ready to kick off',
      events: [],
    });
    resetBall();
    playRawClick(0.15);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds);
    return `${mins.toString().padStart(2, '0')}:00`;
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-3 sm:p-4 safe-area-top safe-area-bottom">
      {/* Scoreboard */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl mb-4 glass-heavy rounded-xl p-4 border border-white/8"
      >
        <div className="flex items-center justify-between gap-2">
          {/* Home */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-xs text-black shadow-lg shrink-0"
              style={{ background: `linear-gradient(135deg, ${homeClub.homeKitColor}, ${homeClub.awayKitColor})` }}
            >
              {homeClub.shortName?.slice(0, 3)}
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-lg font-bold text-primary-c truncate">{homeClub.name}</div>
              <div className="text-[10px] text-tertiary-c font-mono">HOME</div>
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="text-3xl sm:text-5xl font-black font-mono text-gold-300 tabular-nums">{matchState.score.home}</div>
            <div className="text-lg text-tertiary-c">-</div>
            <div className="text-3xl sm:text-5xl font-black font-mono text-gold-300 tabular-nums">{matchState.score.away}</div>
          </div>

          {/* Away */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 justify-end">
            <div className="min-w-0 text-right">
              <div className="text-sm sm:text-lg font-bold text-primary-c truncate">{awayClub.name}</div>
              <div className="text-[10px] text-tertiary-c font-mono">AWAY</div>
            </div>
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-xs text-black shadow-lg shrink-0"
              style={{ background: `linear-gradient(135deg, ${awayClub.homeKitColor}, ${awayClub.awayKitColor})` }}
            >
              {awayClub.shortName?.slice(0, 3)}
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold tabular-nums ${matchState.matchStatus === 'playing' ? 'text-danger animate-pulse' : 'text-tertiary-c'}`}>
              {matchState.matchStatus === 'playing' ? "● LIVE" : matchState.matchStatus === 'finished' ? 'FT' : matchState.matchStatus === 'paused' ? 'PAUSED' : 'PRE-MATCH'}
            </span>
            <span className="font-mono text-gold-300 tabular-nums">{formatTime(matchState.time)}</span>
          </div>
          <span className="text-tertiary-c text-truncate-1 max-w-[50%]">{matchState.currentEvent}</span>
        </div>
      </motion.div>

      {/* Pitch canvas */}
      <div className="w-full max-w-5xl mb-4 rounded-xl overflow-hidden border border-white/8 relative">
        <div ref={containerRef} className="w-full" style={{ aspectRatio: `${PITCH_WIDTH} / ${PITCH_HEIGHT}` }} />
        {matchState.matchStatus === 'waiting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-8 py-4 rounded-md font-display font-bold text-lg text-black transition-transform hover:scale-105 active:scale-100"
              style={{ background: 'linear-gradient(135deg, #FFD700 0%, #B0830C 100%)', boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4)' }}
            >
              <Play className="w-5 h-5" /> Kick Off
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full max-w-5xl flex items-center gap-2 mb-4">
        {matchState.matchStatus === 'playing' && (
          <button onClick={handlePause} className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-surface-3 text-primary-c text-sm font-medium hover:bg-surface-4 transition-colors">
            <Pause className="w-4 h-4" /> Pause
          </button>
        )}
        {matchState.matchStatus === 'paused' && (
          <button onClick={handleStart} className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-gold-soft text-gold-300 text-sm font-medium border border-gold-soft hover:bg-gold-300/20 transition-colors">
            <Play className="w-4 h-4" /> Resume
          </button>
        )}
        <button onClick={handleReset} className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-surface-3 text-tertiary-c text-sm font-medium hover:bg-surface-4 hover:text-primary-c transition-colors">
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
      </div>

      {/* Event feed */}
      {matchState.events.length > 0 && (
        <div className="w-full max-w-5xl">
          <div className="section-header">Match Events</div>
          <div className="space-y-1 max-h-40 overflow-y-auto scroll-region">
            <AnimatePresence>
              {matchState.events.slice().reverse().map((event, i) => (
                <motion.div
                  key={`${event.minute}-${i}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs ${
                    event.type === 'goal' ? 'bg-success/15 border border-success/25' : 'bg-surface-2/50'
                  }`}
                >
                  <span className="font-mono font-bold text-gold-300 tabular-nums shrink-0">{event.minute}'</span>
                  <span className={event.type === 'goal' ? 'text-success font-medium' : 'text-secondary-c'}>
                    {event.text}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Full time overlay */}
      <AnimatePresence>
        {matchState.matchStatus === 'finished' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-modal flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-heavy rounded-2xl p-8 max-w-md text-center border border-gold-soft"
            >
              <div className="text-tertiary-c text-xs font-mono uppercase tracking-widest mb-2">Full Time</div>
              <div className="flex items-center justify-center gap-4 mb-4">
                <span className="text-4xl font-black font-mono text-gold-300">{matchState.score.home}</span>
                <span className="text-2xl text-tertiary-c">-</span>
                <span className="text-4xl font-black font-mono text-gold-300">{matchState.score.away}</span>
              </div>
              <p className="text-sm text-secondary-c mb-6">
                {matchState.score.home > matchState.score.away
                  ? `${homeClub.name} wins!`
                  : matchState.score.home < matchState.score.away
                  ? `${awayClub.name} wins!`
                  : "It's a draw!"}
              </p>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 rounded-md font-display font-bold text-black mx-auto"
                style={{ background: 'linear-gradient(135deg, #FFD700 0%, #B0830C 100%)' }}
              >
                <RotateCcw className="w-4 h-4" /> Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Matter from 'matter-js';
import { PhysicsEngine } from './PhysicsEngine';
import { useAppStore } from '@/lib/store';
import { getOfflineClub, getOfflineSquad, getOfflineFixtures, OFFLINE_CLUBS } from '@/lib/game-data';
import { playRawClick } from '@/lib/audio';
import { getCrowdAudio } from '@/lib/crowd-audio';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, ChevronRight } from 'lucide-react';

/**
 * MatchSimulation — the physics-based match engine.
 *
 * REBUILT with intentional, realistic player movement:
 * - Players have roles (GK stays, DEF holds line, MID supports, ATT attacks)
 * - Possession-based AI: team with ball attacks, other team defends
 * - Players move toward tactical positions that SHIFT based on ball location
 * - Closest player to ball presses/chases, others maintain formation shape
 * - Passing, shooting, dribbling decisions based on field position
 * - Off-ball runs: attackers make forward runs, defenders track back
 */

const PITCH_W = 1050;
const PITCH_H = 680;
const GOAL_Y_MIN = 250;
const GOAL_Y_MAX = 430;
const GOAL_X_HOME = 0;
const GOAL_X_AWAY = 1050;

type TeamSide = 'home' | 'away';

interface RoleConfig {
  pos: string;
  x: number; y: number; // Base formation position (home side, attacking right)
  role: 'GK' | 'DEF' | 'MID' | 'ATT';
  stayBackWeight: number; // 0-1, how much they stay back when team attacks
  pressWeight: number;    // 0-1, how aggressively they press when defending
}

// 4-3-3 formation — positions are for home team (attacking right)
const FORMATION: RoleConfig[] = [
  { pos: 'GK',  x: 80,  y: 340, role: 'GK',  stayBackWeight: 1.0, pressWeight: 0.0 },
  { pos: 'LB',  x: 200, y: 120, role: 'DEF', stayBackWeight: 0.8, pressWeight: 0.2 },
  { pos: 'CB',  x: 180, y: 280, role: 'DEF', stayBackWeight: 0.85, pressWeight: 0.3 },
  { pos: 'CB',  x: 180, y: 400, role: 'DEF', stayBackWeight: 0.85, pressWeight: 0.3 },
  { pos: 'RB',  x: 200, y: 560, role: 'DEF', stayBackWeight: 0.8, pressWeight: 0.2 },
  { pos: 'CDM', x: 350, y: 340, role: 'MID', stayBackWeight: 0.5, pressWeight: 0.5 },
  { pos: 'CM',  x: 450, y: 250, role: 'MID', stayBackWeight: 0.3, pressWeight: 0.6 },
  { pos: 'CM',  x: 450, y: 430, role: 'MID', stayBackWeight: 0.3, pressWeight: 0.6 },
  { pos: 'RW',  x: 650, y: 150, role: 'ATT', stayBackWeight: 0.1, pressWeight: 0.4 },
  { pos: 'ST',  x: 700, y: 340, role: 'ATT', stayBackWeight: 0.05, pressWeight: 0.3 },
  { pos: 'LW',  x: 650, y: 530, role: 'ATT', stayBackWeight: 0.1, pressWeight: 0.4 },
];

// Mirror for away team (attacking left)
const FORMATION_AWAY: RoleConfig[] = FORMATION.map(p => ({
  ...p,
  x: PITCH_W - p.x,
}));

interface MatchPlayer {
  id: number;
  name: string;
  position: string;
  team: TeamSide;
  rating: number;
  role: string;
  stayBackWeight: number;
  pressWeight: number;
  formationX: number;
  formationY: number;
  body: any;
}

interface MatchState {
  score: { home: number; away: number };
  time: number;
  possession: TeamSide;
  matchStatus: 'waiting' | 'playing' | 'paused' | 'finished';
  currentEvent: string;
  events: { minute: number; text: string; type: 'goal' | 'chance' | 'info' }[];
  stats: {
    homeShots: number; awayShots: number;
    homePossession: number; awayPossession: number;
  };
}

export default function MatchSimulation() {
  const selectedClubId = useAppStore((s) => s.selectedClubId);
  const audioEnabled = useAppStore((s) => s.audioEnabled);

  const { homeClub, awayClub, homeSquad, awaySquad } = useMemo(() => {
    const home = getOfflineClub(selectedClubId || 1) || OFFLINE_CLUBS[0];
    const fixtures = getOfflineFixtures(home.id);
    const nextFixture = fixtures.find(f => f.status !== 'finished');
    const awayId = nextFixture
      ? (nextFixture.homeClubId === home.id ? nextFixture.awayClubId : nextFixture.homeClubId)
      : OFFLINE_CLUBS.find(c => c.id !== home.id)!.id;
    const away = getOfflineClub(awayId) || OFFLINE_CLUBS[1];
    return { homeClub: home, awayClub: away, homeSquad: getOfflineSquad(home.id), awaySquad: getOfflineSquad(away.id) };
  }, [selectedClubId]);

  const homePlayers = useMemo(() => [...homeSquad].sort((a, b) => b.overallRating - a.overallRating).slice(0, 11), [homeSquad]);
  const awayPlayers = useMemo(() => [...awaySquad].sort((a, b) => b.overallRating - a.overallRating).slice(0, 11), [awaySquad]);

  const [matchState, setMatchState] = useState<MatchState>({
    score: { home: 0, away: 0 },
    time: 0,
    possession: 'home',
    matchStatus: 'waiting',
    currentEvent: 'Ready to kick off',
    events: [],
    stats: { homeShots: 0, awayShots: 0, homePossession: 0, awayPossession: 0 },
  });

  // Refs
  const matchStatusRef = useRef(matchState.matchStatus);
  const playersRef = useRef<MatchPlayer[]>([]);
  const ballRef = useRef<any>(null);
  const engineRef = useRef<PhysicsEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const possessionRef = useRef<TeamSide>('home');
  const lastTouchRef = useRef<{ playerId: number; team: TeamSide; time: number } | null>(null);
  const actionCooldownRef = useRef<Map<number, number>>(new Map()); // player id -> next action time
  const crowdRef = useRef(getCrowdAudio());

  useEffect(() => { matchStatusRef.current = matchState.matchStatus; }, [matchState.matchStatus]);

  // Build player objects from squads
  const buildPlayers = (): MatchPlayer[] => {
    const all: MatchPlayer[] = [];
    const formation = (team: TeamSide) => team === 'home' ? FORMATION : FORMATION_AWAY;

    homePlayers.forEach((p, i) => {
      const cfg = formation('home')[i];
      if (!cfg) return;
      all.push({
        id: p.id, name: `${p.firstName} ${p.lastName || ''}`.trim(),
        position: cfg.pos, team: 'home', rating: p.overallRating,
        role: cfg.role, stayBackWeight: cfg.stayBackWeight, pressWeight: cfg.pressWeight,
        formationX: cfg.x, formationY: cfg.y, body: null,
      });
    });
    awayPlayers.forEach((p, i) => {
      const cfg = formation('away')[i];
      if (!cfg) return;
      all.push({
        id: p.id + 10000, name: `${p.firstName} ${p.lastName || ''}`.trim(),
        position: cfg.pos, team: 'away', rating: p.overallRating,
        role: cfg.role, stayBackWeight: cfg.stayBackWeight, pressWeight: cfg.pressWeight,
        formationX: cfg.x, formationY: cfg.y, body: null,
      });
    });
    return all;
  };

  // Init physics
  useEffect(() => {
    if (!containerRef.current) return;
    const engine = new PhysicsEngine();
    engine.init(containerRef.current);
    engineRef.current = engine;

    const homeColor = parseInt(homeClub.homeKitColor.replace('#', ''), 16);
    const awayColor = parseInt(awayClub.homeKitColor.replace('#', ''), 16);

    const all = buildPlayers();
    all.forEach(p => {
      const body = engine.addPlayer(p.formationX, p.formationY, p.team === 'home' ? homeColor : awayColor);
      p.body = body;
    });
    playersRef.current = all;
    ballRef.current = engine.addBall(525, 340);

    Matter.Events.on((engine as any).engine, 'collisionStart', handleCollisions);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
      engine.destroy();
    };
  }, [homePlayers, awayPlayers, homeClub, awayClub]);

  // ========== COLLISION HANDLING ==========
  const handleCollisions = (event: Matter.IEventCollision<Matter.Engine>) => {
    if (matchStatusRef.current !== 'playing') return;
    const ball = ballRef.current;
    if (!ball) return;

    event.pairs.forEach(pair => {
      const { bodyA, bodyB } = pair;
      const isBallA = bodyA.id === ball.id;
      const isBallB = bodyB.id === ball.id;
      if (!isBallA && !isBallB) return;

      const playerBody = isBallA ? bodyB : bodyA;
      const player = playersRef.current.find(p => p.body.id === playerBody.id);
      if (!player) return;

      // Cooldown: don't trigger action too frequently for same player
      const now = Date.now();
      const cooldown = actionCooldownRef.current.get(player.id) || 0;
      if (now < cooldown) return;

      lastTouchRef.current = { playerId: player.id, team: player.team, time: now };
      possessionRef.current = player.team;

      // Decide action based on position + rating
      const attackingGoalX = player.team === 'home' ? GOAL_X_AWAY : GOAL_X_HOME;
      const distToGoal = Math.abs(player.body.position.x - attackingGoalX);

      // 30% shoot if close to goal
      if (distToGoal < 250 && Math.random() < 0.3) {
        actionCooldownRef.current.set(player.id, now + 800);
        shoot(player, ball);
      }
      // 40% pass if there's a good option
      else if (Math.random() < 0.45) {
        actionCooldownRef.current.set(player.id, now + 400);
        pass(player, ball);
      }
      // Otherwise dribble forward
      else {
        actionCooldownRef.current.set(player.id, now + 300);
        dribble(player, ball);
      }
    });
  };

  // ========== ACTIONS ==========
  const shoot = (player: MatchPlayer, ball: any) => {
    const goalX = player.team === 'home' ? GOAL_X_AWAY : GOAL_X_HOME;
    const goalY = GOAL_Y_MIN + Math.random() * (GOAL_Y_MAX - GOAL_Y_MIN);
    const dx = goalX - ball.position.x;
    const dy = goalY - ball.position.y;
    const dist = Math.hypot(dx, dy);
    const power = 12 + player.rating * 0.08;

    Matter.Body.setVelocity(ball, {
      x: (dx / dist) * power,
      y: (dy / dist) * power,
    });

    const minute = matchState.time;
    setMatchState(prev => ({
      ...prev,
      currentEvent: `${player.name} shoots!`,
      events: [...prev.events.slice(-15), { minute, text: `${player.name} shoots`, type: 'chance' }],
      stats: {
        ...prev.stats,
        homeShots: player.team === 'home' ? prev.stats.homeShots + 1 : prev.stats.homeShots,
        awayShots: player.team === 'away' ? prev.stats.awayShots + 1 : prev.stats.awayShots,
      },
    }));

    // Check goal after ball travels
    setTimeout(() => checkGoal(player), 1500);
  };

  const pass = (player: MatchPlayer, ball: any) => {
    const teammates = playersRef.current.filter(p => p.team === player.team && p.id !== player.id);
    if (teammates.length === 0) { dribble(player, ball); return; }

    // Find best pass target: forward-leaning, not too far, not marked
    const attackDir = player.team === 'home' ? 1 : -1;
    let bestTarget = teammates[0];
    let bestScore = -Infinity;

    teammates.forEach(t => {
      const dx = (t.body.position.x - player.body.position.x) * attackDir; // positive = forward
      const dy = t.body.position.y - player.body.position.y;
      const dist = Math.hypot(dx, dy);

      // Prefer forward passes, reasonable distance
      let score = dx * 0.5 - Math.abs(dy) * 0.2;
      if (dist > 50 && dist < 400) score += 50;
      if (dist > 400) score -= 100;
      score += Math.random() * 20; // randomness

      if (score > bestScore) { bestScore = score; bestTarget = t; }
    });

    const dx = bestTarget.body.position.x - ball.position.x;
    const dy = bestTarget.body.position.y - ball.position.y;
    const dist = Math.hypot(dx, dy);
    const power = 8 + player.rating * 0.06;

    // Add slight inaccuracy for lower-rated players
    const accuracy = 0.85 + (player.rating - 50) * 0.003;
    const offsetY = (Math.random() - 0.5) * (1 - accuracy) * 60;

    Matter.Body.setVelocity(ball, {
      x: (dx / dist) * power,
      y: (dy / dist) * power + offsetY,
    });
  };

  const dribble = (player: MatchPlayer, ball: any) => {
    const attackDir = player.team === 'home' ? 1 : -1;
    const power = 3 + player.rating * 0.03;

    // Dribble toward goal with some lateral movement
    const goalX = player.team === 'home' ? GOAL_X_AWAY : GOAL_X_HOME;
    const dx = (goalX - ball.position.x) * 0.3;
    const lateralY = (Math.random() - 0.5) * 4;

    Matter.Body.setVelocity(ball, {
      x: attackDir * power + dx * 0.01,
      y: lateralY,
    });
  };

  const checkGoal = (lastPlayer: MatchPlayer) => {
    const ball = ballRef.current;
    if (!ball || matchStatusRef.current !== 'playing') return;

    const scored = (lastPlayer.team === 'home' && ball.position.x > GOAL_X_AWAY - 15 && ball.position.y > GOAL_Y_MIN && ball.position.y < GOAL_Y_MAX)
                || (lastPlayer.team === 'away' && ball.position.x < GOAL_X_HOME + 15 && ball.position.y > GOAL_Y_MIN && ball.position.y < GOAL_Y_MAX);

    if (scored) {
      const minute = matchState.time;
      const teamName = lastPlayer.team === 'home' ? homeClub.name : awayClub.name;
      setMatchState(prev => ({
        ...prev,
        score: lastPlayer.team === 'home'
          ? { ...prev.score, home: prev.score.home + 1 }
          : { ...prev.score, away: prev.score.away + 1 },
        currentEvent: `GOAL! ${lastPlayer.name} scores for ${teamName}!`,
        events: [...prev.events.slice(-15), { minute, text: `⚽ GOAL — ${lastPlayer.name} (${teamName})`, type: 'goal' }],
      }));
      crowdRef.current.swell(1);
      resetBall(lastPlayer.team === 'home' ? 'away' : 'home');
    }
  };

  const resetBall = (kickoffTeam: TeamSide = 'home') => {
    if (ballRef.current) {
      Matter.Body.setPosition(ballRef.current, Matter.Vector.create(525, 340));
      Matter.Body.setVelocity(ballRef.current, Matter.Vector.create(0, 0));
    }
    // Reset players to formation
    playersRef.current.forEach(p => {
      if (p.body) {
        Matter.Body.setPosition(p.body, Matter.Vector.create(p.formationX, p.formationY));
        Matter.Body.setVelocity(p.body, Matter.Vector.create(0, 0));
      }
    });
    possessionRef.current = kickoffTeam;
  };

  // ========== AI MOVEMENT LOOP ==========
  const startMatchLoop = () => {
    // Timer
    timeIntervalRef.current = setInterval(() => {
      setMatchState(prev => {
        const newTime = prev.time + 1;
        if (newTime >= 90) {
          if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
          return { ...prev, time: 90, matchStatus: 'finished', currentEvent: 'Full Time' };
        }
        if (newTime === 45) {
          return { ...prev, time: 45, currentEvent: 'Half Time' };
        }
        // Update possession stats
        const possession = possessionRef.current;
        return {
          ...prev, time: newTime,
          stats: {
            ...prev.stats,
            homePossession: possession === 'home' ? prev.stats.homePossession + 1 : prev.stats.homePossession,
            awayPossession: possession === 'away' ? prev.stats.awayPossession + 1 : prev.stats.awayPossession,
          },
        };
      });
    }, 1000);

    // AI Movement
    const updateAI = () => {
      if (matchStatusRef.current !== 'playing') {
        animationFrameRef.current = requestAnimationFrame(updateAI);
        return;
      }

      const ball = ballRef.current;
      if (!ball) { animationFrameRef.current = requestAnimationFrame(updateAI); return; }

      const ballX = ball.position.x;
      const ballY = ball.position.y;
      const possession = possessionRef.current;
      const attackDir = possession === 'home' ? 1 : -1;

      // Find closest player to ball for each team
      let closestHome: MatchPlayer | null = null;
      let closestAway: MatchPlayer | null = null;
      let minDistHome = Infinity;
      let minDistAway = Infinity;

      playersRef.current.forEach((p: MatchPlayer) => {
        const d = Math.hypot(p.body.position.x - ballX, p.body.position.y - ballY);
        if (p.team === 'home' && d < minDistHome) { minDistHome = d; closestHome = p; }
        if (p.team === 'away' && d < minDistAway) { minDistAway = d; closestAway = p; }
      });

      // Move all players
      playersRef.current.forEach(p => {
        const distToBall = Math.hypot(p.body.position.x - ballX, p.body.position.y - ballY);
        const isClosest = (p.team === possession && p === closestHome) || (p.team === possession && p === closestAway);
        const isDefending = p.team !== possession;
        const isClosestDefender = isDefending && ((p.team === 'home' && p === closestHome) || (p.team === 'away' && p === closestAway));

        let targetX: number, targetY: number;

        // === GK: stays near goal, tracks ball Y ===
        if (p.role === 'GK') {
          const goalX = p.team === 'home' ? 80 : PITCH_W - 80;
          targetX = goalX;
          // Track ball Y but stay near goal
          const ballToGoalY = Math.max(GOAL_Y_MIN - 20, Math.min(GOAL_Y_MAX + 20, ballY));
          targetY = goalX + (ballToGoalY * 0.3); // Partial tracking
          targetY = Math.max(250, Math.min(430, ballY * 0.5 + 340 * 0.5));
        }
        // === CLOSEST PLAYER TO BALL (possessing team): chase ball ===
        else if (isClosest && distToBall < 200) {
          targetX = ballX;
          targetY = ballY;
        }
        // === CLOSEST DEFENDER: press the ball carrier ===
        else if (isClosestDefender) {
          targetX = ballX;
          targetY = ballY;
        }
        // === POSSESSING TEAM: shift formation toward attacking goal ===
        else if (!isDefending) {
          // Shift formation forward based on ball position
          const ballAdvance = (possession === 'home' ? (ballX - 525) : (525 - ballX)) * 0.4;
          const shift = ballAdvance * attackDir * p.stayBackWeight;
          targetX = p.formationX + shift * (1 - p.stayBackWeight);
          // Attacking players make runs forward
          if (p.role === 'ATT') {
            targetX = p.formationX + ballAdvance * 0.6;
          } else if (p.role === 'MID') {
            targetX = p.formationX + ballAdvance * 0.3;
          }
          // Lateral shift toward ball
          const lateralShift = (ballY - 340) * 0.3 * (1 - p.stayBackWeight);
          targetY = p.formationY + lateralShift;
        }
        // === DEFENDING TEAM: shift formation toward own goal, compact ===
        else {
          // Drop back toward own goal
          const ballAdvance = (possession === 'home' ? (ballX - 525) : (525 - ballX)) * 0.5;
          const dropBack = ballAdvance * attackDir * 0.5;
          targetX = p.formationX - dropBack * (1 - p.stayBackWeight) * attackDir;
          // Defenders drop more
          if (p.role === 'DEF' || p.role === 'GK') {
            targetX = p.formationX - dropBack * 0.3 * attackDir;
          }
          // Compact toward ball Y
          const lateralShift = (ballY - 340) * 0.4;
          targetY = p.formationY + lateralShift;
        }

        // Clamp to pitch
        targetX = Math.max(30, Math.min(PITCH_W - 30, targetX));
        targetY = Math.max(30, Math.min(PITCH_H - 30, targetY));

        // Move with speed based on rating
        const speed = 0.0008 + (p.rating - 50) * 0.00003;
        const dx = (targetX - p.body.position.x) * speed;
        const dy = (targetY - p.body.position.y) * speed;

        Matter.Body.setVelocity(p.body, { x: dx, y: dy });
      });

      // Ball out of bounds → reset
      if (ballX < -20 || ballX > PITCH_W + 20 || ballY < -20 || ballY > PITCH_H + 20) {
        resetBall(possession);
      }

      // If no one has touched the ball in 10s, give it to nearest player
      if (lastTouchRef.current && Date.now() - lastTouchRef.current.time > 10000) {
        const nearest = (minDistHome < minDistAway ? closestHome : closestAway) as MatchPlayer | null;
        if (nearest && nearest.body) {
          Matter.Body.setVelocity(ball, {
            x: (nearest.body.position.x - ballX) * 0.05,
            y: (nearest.body.position.y - ballY) * 0.05,
          });
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateAI);
    };
    updateAI();
  };

  // ========== CONTROLS ==========
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
      score: { home: 0, away: 0 }, time: 0, possession: 'home',
      matchStatus: 'waiting', currentEvent: 'Ready to kick off',
      events: [], stats: { homeShots: 0, awayShots: 0, homePossession: 0, awayPossession: 0 },
    });
    resetBall('home');
    playRawClick(0.15);
  };

  const totalPossession = matchState.stats.homePossession + matchState.stats.awayPossession;
  const homePossPct = totalPossession > 0 ? Math.round((matchState.stats.homePossession / totalPossession) * 100) : 50;

  return (
    <div className="flex flex-col items-center min-h-screen p-3 sm:p-4 safe-area-top safe-area-bottom relative z-10">
      {/* Scoreboard */}
      <div className="w-full max-w-5xl mb-3 glass-heavy rounded-xl p-3 sm:p-4 border border-white/8 relative z-10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs text-black shadow-lg shrink-0"
              style={{ background: `linear-gradient(135deg, ${homeClub.homeKitColor}, ${homeClub.awayKitColor})` }}>
              {homeClub.shortName?.slice(0, 3)}
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-base font-bold text-primary-c truncate">{homeClub.name}</div>
              <div className="text-[9px] text-tertiary-c font-mono">HOME</div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="text-xl sm:text-3xl lg:text-4xl font-black font-mono text-gold-300 tabular-nums">{matchState.score.home}</div>
            <div className="text-sm text-tertiary-c">-</div>
            <div className="text-xl sm:text-3xl lg:text-4xl font-black font-mono text-gold-300 tabular-nums">{matchState.score.away}</div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 justify-end">
            <div className="min-w-0 text-right">
              <div className="text-xs sm:text-base font-bold text-primary-c truncate">{awayClub.name}</div>
              <div className="text-[9px] text-tertiary-c font-mono">AWAY</div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs text-black shadow-lg shrink-0"
              style={{ background: `linear-gradient(135deg, ${awayClub.homeKitColor}, ${awayClub.awayKitColor})` }}>
              {awayClub.shortName?.slice(0, 3)}
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-2 flex items-center justify-between text-[10px] sm:text-xs">
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold tabular-nums ${matchState.matchStatus === 'playing' ? 'text-danger animate-pulse' : 'text-tertiary-c'}`}>
              {matchState.matchStatus === 'playing' ? '● LIVE' : matchState.matchStatus === 'finished' ? 'FT' : matchState.matchStatus === 'paused' ? 'PAUSED' : 'PRE-MATCH'}
            </span>
            <span className="font-mono text-gold-300 tabular-nums">{matchState.time}:00</span>
          </div>
          <span className="text-tertiary-c truncate max-w-[40%]">{matchState.currentEvent}</span>
        </div>

        {/* Possession bar */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[9px] font-mono text-tertiary-c">{homePossPct}%</span>
          <div className="flex-1 h-1 rounded-full overflow-hidden flex">
            <div className="bg-blue-400/60" style={{ width: `${homePossPct}%` }} />
            <div className="bg-red-400/60" style={{ width: `${100 - homePossPct}%` }} />
          </div>
          <span className="text-[9px] font-mono text-tertiary-c">{100 - homePossPct}%</span>
        </div>
      </div>

      {/* Pitch */}
      <div className="w-full max-w-5xl mb-3 rounded-xl overflow-hidden border border-white/8 relative">
        <div ref={containerRef} className="w-full" style={{ aspectRatio: `${PITCH_W} / ${PITCH_H}` }} />
        {matchState.matchStatus === 'waiting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <button onClick={handleStart}
              className="flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-md font-display font-bold text-base sm:text-lg text-black transition-transform hover:scale-105 active:scale-100"
              style={{ background: 'linear-gradient(135deg, #FFD700 0%, #B0830C 100%)', boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4)' }}>
              <Play className="w-5 h-5" /> Kick Off
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full max-w-5xl flex items-center gap-2 mb-3">
        {matchState.matchStatus === 'playing' && (
          <button onClick={handlePause} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md bg-surface-3 text-primary-c text-xs sm:text-sm font-medium hover:bg-surface-4 transition-colors">
            <Pause className="w-4 h-4" /> Pause
          </button>
        )}
        {matchState.matchStatus === 'paused' && (
          <button onClick={handleStart} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md bg-gold-300/15 text-gold-300 text-xs sm:text-sm font-medium border border-gold-300/30 hover:bg-gold-300/20 transition-colors">
            <Play className="w-4 h-4" /> Resume
          </button>
        )}
        <button onClick={handleReset} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md bg-surface-3 text-tertiary-c text-xs sm:text-sm font-medium hover:bg-surface-4 hover:text-primary-c transition-colors">
          <RotateCcw className="w-4 h-4" /> Reset
        </button>

        {/* Stats */}
        {matchState.time > 0 && (
          <div className="ml-auto flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs font-mono text-tertiary-c">
            <span>SHOTS {matchState.stats.homeShots}-{matchState.stats.awayShots}</span>
          </div>
        )}
      </div>

      {/* Event feed */}
      {matchState.events.length > 0 && (
        <div className="w-full max-w-5xl">
          <div className="text-[10px] font-mono uppercase tracking-widest text-tertiary-c font-bold mb-1">Match Events</div>
          <div className="space-y-1 max-h-32 overflow-y-auto scroll-region">
            <AnimatePresence>
              {matchState.events.slice().reverse().map((event, i) => (
                <motion.div key={`${event.minute}-${i}`}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] sm:text-xs ${event.type === 'goal' ? 'bg-success/15 border border-success/25' : 'bg-surface-2/50'}`}>
                  <span className="font-mono font-bold text-gold-300 tabular-nums shrink-0">{event.minute}'</span>
                  <span className={event.type === 'goal' ? 'text-success font-medium' : 'text-secondary-c'}>{event.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Full time overlay */}
      <AnimatePresence>
        {matchState.matchStatus === 'finished' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-modal flex items-center justify-center bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="glass-heavy rounded-2xl p-6 sm:p-8 max-w-md text-center border border-gold-300/30">
              <div className="text-tertiary-c text-xs font-mono uppercase tracking-widest mb-2">Full Time</div>
              <div className="flex items-center justify-center gap-4 mb-4">
                <span className="text-3xl sm:text-4xl font-black font-mono text-gold-300">{matchState.score.home}</span>
                <span className="text-xl text-tertiary-c">-</span>
                <span className="text-3xl sm:text-4xl font-black font-mono text-gold-300">{matchState.score.away}</span>
              </div>
              <p className="text-xs sm:text-sm text-secondary-c mb-4">
                {matchState.score.home > matchState.score.away ? `${homeClub.name} wins!`
                  : matchState.score.home < matchState.score.away ? `${awayClub.name} wins!`
                  : "It's a draw!"}
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4 text-[10px] sm:text-xs font-mono">
                <div className="p-2 rounded bg-surface-2/50">
                  <div className="text-tertiary-c">SHOTS</div>
                  <div className="text-primary-c">{matchState.stats.homeShots} - {matchState.stats.awayShots}</div>
                </div>
                <div className="p-2 rounded bg-surface-2/50">
                  <div className="text-tertiary-c">POSSESSION</div>
                  <div className="text-primary-c">{homePossPct}% - {100 - homePossPct}%</div>
                </div>
              </div>
              <button onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 rounded-md font-display font-bold text-black mx-auto"
                style={{ background: 'linear-gradient(135deg, #FFD700 0%, #B0830C 100%)' }}>
                <RotateCcw className="w-4 h-4" /> Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

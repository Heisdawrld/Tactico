'use client';

import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { PhysicsEngine } from './PhysicsEngine';

interface Player {
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
}

const formation442 = [
  { x: 100, y: 340, pos: 'GK' },
  { x: 250, y: 170, pos: 'CB' },
  { x: 250, y: 510, pos: 'CB' },
  { x: 300, y: 100, pos: 'LB' },
  { x: 300, y: 580, pos: 'RB' },
  { x: 400, y: 200, pos: 'CM' },
  { x: 400, y: 480, pos: 'CM' },
  { x: 500, y: 150, pos: 'RW' },
  { x: 500, y: 530, pos: 'LW' },
  { x: 650, y: 280, pos: 'ST' },
  { x: 650, y: 400, pos: 'ST' },
];

const formationAway442 = formation442.map(p => ({
  ...p,
  x: 1050 - p.x,
}));

const homePlayers: Omit<Player, 'body'>[] = [
  { id: 1, name: 'Ederson', position: 'GK', team: 'home', rating: 88, positionX: formation442[0].x, positionY: formation442[0].y },
  { id: 2, name: 'Rúben Dias', position: 'CB', team: 'home', rating: 89, positionX: formation442[1].x, positionY: formation442[1].y },
  { id: 3, name: 'Akanji', position: 'CB', team: 'home', rating: 85, positionX: formation442[2].x, positionY: formation442[2].y },
  { id: 4, name: 'Grealish', position: 'LB', team: 'home', rating: 84, positionX: formation442[3].x, positionY: formation442[3].y },
  { id: 5, name: 'Walker', position: 'RB', team: 'home', rating: 85, positionX: formation442[4].x, positionY: formation442[4].y },
  { id: 6, name: 'De Bruyne', position: 'CM', team: 'home', rating: 90, positionX: formation442[5].x, positionY: formation442[5].y },
  { id: 7, name: 'Rodri', position: 'CM', team: 'home', rating: 89, positionX: formation442[6].x, positionY: formation442[6].y },
  { id: 8, name: 'Sterling', position: 'RW', team: 'home', rating: 86, positionX: formation442[7].x, positionY: formation442[7].y },
  { id: 9, name: 'Foden', position: 'LW', team: 'home', rating: 88, positionX: formation442[8].x, positionY: formation442[8].y },
  { id: 10, name: 'Haaland', position: 'ST', team: 'home', rating: 94, positionX: formation442[9].x, positionY: formation442[9].y },
  { id: 11, name: 'Gundogan', position: 'ST', team: 'home', rating: 85, positionX: formation442[10].x, positionY: formation442[10].y },
];

const awayPlayers: Omit<Player, 'body'>[] = [
  { id: 101, name: 'Onana', position: 'GK', team: 'away', rating: 86, positionX: formationAway442[0].x, positionY: formationAway442[0].y },
  { id: 102, name: 'Maguire', position: 'CB', team: 'away', rating: 80, positionX: formationAway442[1].x, positionY: formationAway442[1].y },
  { id: 103, name: 'Lindelöf', position: 'CB', team: 'away', rating: 79, positionX: formationAway442[2].x, positionY: formationAway442[2].y },
  { id: 104, name: 'Dalot', position: 'LB', team: 'away', rating: 78, positionX: formationAway442[3].x, positionY: formationAway442[3].y },
  { id: 105, name: 'Shaw', position: 'RB', team: 'away', rating: 82, positionX: formationAway442[4].x, positionY: formationAway442[4].y },
  { id: 106, name: 'Casemiro', position: 'CM', team: 'away', rating: 87, positionX: formationAway442[5].x, positionY: formationAway442[5].y },
  { id: 107, name: 'Fernandes', position: 'CM', team: 'away', rating: 88, positionX: formationAway442[6].x, positionY: formationAway442[6].y },
  { id: 108, name: 'Antony', position: 'RW', team: 'away', rating: 82, positionX: formationAway442[7].x, positionY: formationAway442[7].y },
  { id: 109, name: 'Sancho', position: 'LW', team: 'away', rating: 83, positionX: formationAway442[8].x, positionY: formationAway442[8].y },
  { id: 110, name: 'Rashford', position: 'ST', team: 'away', rating: 87, positionX: formationAway442[9].x, positionY: formationAway442[9].y },
  { id: 111, name: 'Hojlund', position: 'ST', team: 'away', rating: 82, positionX: formationAway442[10].x, positionY: formationAway442[10].y },
];

export default function MatchSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [matchState, setMatchState] = useState<MatchState>({
    score: { home: 0, away: 0 },
    time: 0,
    possession: 'home',
    matchStatus: 'waiting',
    currentEvent: 'Ready to kick off!',
  });
  const engineRef = useRef<PhysicsEngine | null>(null);
  const playersRef = useRef<Player[]>([]);
  const ballRef = useRef<any>(null);
  const lastKickRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();
  const timeIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!containerRef.current) return;

    engineRef.current = new PhysicsEngine();
    engineRef.current.init(containerRef.current);

    // Create players
    const allPlayers: Player[] = [];
    [...homePlayers, ...awayPlayers].forEach(playerData => {
      const body = engineRef.current!.addPlayer(
        playerData.positionX,
        playerData.positionY,
        playerData.team === 'home' ? 0x6cabdd : 0xda291c
      );
      allPlayers.push({
        ...playerData,
        body,
      });
    });
    playersRef.current = allPlayers;

    // Create ball
    ballRef.current = engineRef.current!.addBall(525, 340);

    // Set up collision detection
    const world = (engineRef.current as any).world;
    Matter.Events.on(
      (engineRef.current as any).engine,
      'collisionStart',
      handleCollisions
    );

    // Start match loop
    setMatchState(prev => ({ ...prev, matchStatus: 'playing' }));
    startMatchLoop();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
      if (engineRef.current) engineRef.current.destroy();
    };
  }, []);

  const handleCollisions = (event: Matter.IEventCollision<Matter.Engine>) => {
    const pairs = event.pairs;
    pairs.forEach(pair => {
      const { bodyA, bodyB } = pair;
      const ball = ballRef.current;
      if (!ball) return;

      // Check if collision involves ball and player
      const isBallA = bodyA.id === ball.id;
      const isBallB = bodyB.id === ball.id;

      if (isBallA || isBallB) {
        const playerBody = isBallA ? bodyB : bodyA;
        const player = playersRef.current.find(p => p.body.id === playerBody.id);

        if (player) {
          lastKickRef.current = Date.now();
          setMatchState(prev => ({
            ...prev,
            possession: player.team,
            currentEvent: `${player.name} has the ball`,
          }));

          // 20% chance to shoot if near goal
          const distToGoal =
            player.team === 'home'
              ? Math.hypot(player.body.position.x - 900, player.body.position.y - 340)
              : Math.hypot(player.body.position.x - 150, player.body.position.y - 340);

          if (distToGoal < 200 && Math.random() < 0.2) {
            shoot(player, ball);
          } else if (Math.random() < 0.3) {
            pass(player, ball);
          } else {
            dribble(player, ball);
          }
        }
      }
    });
  };

  const shoot = (player: Player, ball: any) => {
    const targetX = player.team === 'home' ? 1050 : 0;
    const targetY = 300 + Math.random() * 80;
    const power = 0.08 + player.rating * 0.001;

    Matter.Body.setVelocity(ball, {
      x: (targetX - ball.position.x) * power,
      y: (targetY - ball.position.y) * power,
    });

    setMatchState(prev => ({
      ...prev,
      currentEvent: `${player.name} takes a shot!`,
    }));

    checkGoal(ball);
  };

  const pass = (player: Player, ball: any) => {
    const teammates = playersRef.current.filter(p => p.team === player.team && p.id !== player.id);
    const randomTeammate = teammates[Math.floor(Math.random() * teammates.length)];

    const power = 0.05;
    Matter.Body.setVelocity(ball, {
      x: (randomTeammate.body.position.x - ball.position.x) * power,
      y: (randomTeammate.body.position.y - ball.position.y) * power,
    });

    setMatchState(prev => ({
      ...prev,
      currentEvent: `${player.name} passes to ${randomTeammate.name}`,
    }));
  };

  const dribble = (player: Player, ball: any) => {
    const targetX =
      player.team === 'home' ? player.body.position.x + 100 : player.body.position.x - 100;
    const targetY = player.body.position.y + (Math.random() - 0.5) * 100;

    Matter.Body.setVelocity(ball, {
      x: (targetX - ball.position.x) * 0.03,
      y: (targetY - ball.position.y) * 0.03,
    });
  };

  const checkGoal = (ball: any) => {
    setTimeout(() => {
      if (!ball || !ball.position) return;

      const isHomeGoal = ball.position.x > 1020 && ball.position.y > 240 && ball.position.y < 440;
      const isAwayGoal = ball.position.x < 30 && ball.position.y > 240 && ball.position.y < 440;

      if (isHomeGoal) {
        setMatchState(prev => ({
          ...prev,
          score: { ...prev.score, home: prev.score.home + 1 },
          currentEvent: 'GOAL! Manchester City score!',
        }));
        resetBall();
      } else if (isAwayGoal) {
        setMatchState(prev => ({
          ...prev,
          score: { ...prev.score, away: prev.score.away + 1 },
          currentEvent: 'GOAL! Manchester United score!',
        }));
        resetBall();
      }
    }, 2000);
  };

  const resetBall = () => {
    if (ballRef.current) {
      Matter.Body.setPosition(ballRef.current, Matter.Vector.create(525, 340));
      Matter.Body.setVelocity(ballRef.current, Matter.Vector.create(0, 0));
    }

    playersRef.current.forEach(player => {
      const originalPosition =
        player.team === 'home'
          ? formation442.find(p => p.pos === player.position)
          : formationAway442.find(p => p.pos === player.position);
      if (originalPosition && player.body) {
        Matter.Body.setPosition(player.body, Matter.Vector.create(originalPosition.x, originalPosition.y));
        Matter.Body.setVelocity(player.body, Matter.Vector.create(0, 0));
      }
    });
  };

  const startMatchLoop = () => {
    timeIntervalRef.current = setInterval(() => {
      setMatchState(prev => ({
        ...prev,
        time: prev.time + 1,
      }));
    }, 1000);

    const updateAI = () => {
      if (matchState.matchStatus !== 'playing') {
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

          // Home team attacks right, away left
          const targetGoalX = player.team === 'home' ? 1000 : 50;

          if (distToBall < 100) {
            // Move towards ball
            targetX = ball.position.x;
            targetY = ball.position.y;
          } else {
            // Hold formation
            const originalPos =
              player.team === 'home'
                ? formation442.find(p => p.pos === player.position)
                : formationAway442.find(p => p.pos === player.position);
            if (originalPos) {
              targetX = originalPos.x;
              targetY = originalPos.y;
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d1117] p-4 font-sans">
      {/* Scoreboard */}
      <div className="w-full max-w-5xl mb-4 bg-[#161b22] backdrop-blur-sm rounded-xl p-6 border border-[#30363d]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#6cabdd] flex items-center justify-center font-bold text-white shadow-lg">
              MC
            </div>
            <div className="text-left">
              <div className="text-2xl font-black text-[#e6edf3]">Manchester City</div>
              <div className="text-sm text-[#8b949e]">Premier League</div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-5xl font-black text-[#e6edf3]">{matchState.score.home}</div>
            <div className="text-2xl text-[#8b949e]">-</div>
            <div className="text-5xl font-black text-[#e6edf3]">{matchState.score.away}</div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-black text-[#e6edf3]">Manchester United</div>
              <div className="text-sm text-[#8b949e]">Premier League</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#da291c] flex items-center justify-center font-bold text-white shadow-lg">
              MU
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-[#21262d] border border-[#30363d]">
            <div className="text-[10px] uppercase text-[#8b949e] font-bold mb-1">Time</div>
            <div className="text-xl font-mono text-[#e6edf3]">{formatTime(matchState.time)}</div>
          </div>

          <div className="p-3 rounded-lg bg-[#21262d] border border-[#30363d]">
            <div className="text-[10px] uppercase text-[#8b949e] font-bold mb-1">Possession</div>
            <div className="text-sm font-bold text-[#e6edf3]">
              {matchState.possession === 'home' ? 'City' : 'United'}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#21262d] border border-[#30363d]">
            <div className="text-[10px] uppercase text-[#8b949e] font-bold mb-1">Event</div>
            <div className="text-sm font-semibold text-[#58a6ff]">{matchState.currentEvent}</div>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="border-4 border-[#30363d] shadow-2xl rounded-xl overflow-hidden" />
    </div>
  );
}

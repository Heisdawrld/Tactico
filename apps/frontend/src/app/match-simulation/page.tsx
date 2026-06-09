"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as PIXI from "pixi.js";
import * as Matter from "matter-js";
import { clubs } from "@/types/club";
import { matches } from "@/types/match";
import { players } from "@/types/player";
import { Club } from "@/types/club";
import { Match } from "@/types/match";
import { Player } from "@/types/player";
import {
  MatchState, BallState, PlayerMatchState,
  MATCH_CONSTANTS, POSITION_MODIFIERS,
} from "@/types/match-simulation";

export default function MatchSimulationPage() {
  const pitchRef = useRef<HTMLDivElement>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [homeClub, setHomeClub] = useState<Club | null>(null);
  const [awayClub, setAwayClub] = useState<Club | null>(null);
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [matchState, setMatchState] = useState<MatchState>({
    homeClubId: 0, awayClubId: 0, homeScore: 0, awayScore: 0,
    time: 0, isPlaying: false, isPaused: false, isHalfTime: false, isFullTime: false,
    possession: "none", lastTouch: "none", matchEvents: [],
    stats: {
      home: { shots: 0, shotsOnTarget: 0, possession: 0, fouls: 0, yellowCards: 0, redCards: 0, corners: 0, offsides: 0, passesCompleted: 0, passesAttempted: 0, passAccuracy: 0 },
      away: { shots: 0, shotsOnTarget: 0, possession: 0, fouls: 0, yellowCards: 0, redCards: 0, corners: 0, offsides: 0, passesCompleted: 0, passesAttempted: 0, passAccuracy: 0 },
      total: { shots: 0, shotsOnTarget: 0, possession: 50, fouls: 0, corners: 0, offsides: 0 },
    },
  });
  const [commentary, setCommentary] = useState<{ time: number; text: string }[]>([]);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [showTacticsMenu, setShowTacticsMenu] = useState(false);

  const engineRef = useRef<Matter.Engine | null>(null);
  const rendererRef = useRef<PIXI.Application | null>(null);
  const bodiesRef = useRef<Matter.Body[]>([]);
  const spritesRef = useRef<(PIXI.Graphics | PIXI.Text)[]>([]);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const matchId = localStorage.getItem("currentMatchId");
    if (matchId) {
      const currentMatch = matches.find((m) => m.id === parseInt(matchId));
      if (currentMatch) {
        setMatch(currentMatch);
        setHomeClub(clubs.find((c) => c.id === currentMatch.homeClubId) || null);
        setAwayClub(clubs.find((c) => c.id === currentMatch.awayClubId) || null);
        setHomePlayers(players.filter((p) => p.clubId === currentMatch.homeClubId).slice(0, 11));
        setAwayPlayers(players.filter((p) => p.clubId === currentMatch.awayClubId).slice(0, 11));
        setMatchState(prev => ({ ...prev, homeClubId: currentMatch.homeClubId, awayClubId: currentMatch.awayClubId }));
      }
    }
  }, []);

  useEffect(() => {
    if (!pitchRef.current || !homeClub || !awayClub || homePlayers.length === 0 || awayPlayers.length === 0) return;

    const engine = Matter.Engine.create();
    engineRef.current = engine;

    const app = new PIXI.Application({
      width: pitchRef.current.clientWidth,
      height: pitchRef.current.clientHeight,
      backgroundColor: 0x1B5E20,
      antialias: true,
    });
    rendererRef.current = app;
    pitchRef.current.appendChild(app.view as HTMLCanvasElement);

    // Walls
    const walls = [
      Matter.Bodies.rectangle(app.screen.width / 2, app.screen.height + 10, app.screen.width * 2, 20, { isStatic: true }),
      Matter.Bodies.rectangle(-10, app.screen.height / 2, 20, app.screen.height * 2, { isStatic: true }),
      Matter.Bodies.rectangle(app.screen.width + 10, app.screen.height / 2, 20, app.screen.height * 2, { isStatic: true }),
      Matter.Bodies.rectangle(app.screen.width / 2, -10, app.screen.width * 2, 20, { isStatic: true }),
    ];
    Matter.World.add(engine.world, walls);
    bodiesRef.current = [...walls];

    // Ball
    const ball = Matter.Bodies.circle(app.screen.width / 2, app.screen.height / 2, 6, { restitution: 0.8, friction: 0.01, frictionAir: 0.01 });
    Matter.World.add(engine.world, [ball]);
    bodiesRef.current.push(ball);

    const ballSprite = new PIXI.Graphics();
    ballSprite.beginFill(0xFFFFFF);
    ballSprite.drawCircle(0, 0, 6);
    ballSprite.endFill();
    app.stage.addChild(ballSprite);
    spritesRef.current.push(ballSprite);

    // Players
    const allPlayers = [...homePlayers, ...awayPlayers];
    allPlayers.forEach((player) => {
      const isHome = homePlayers.includes(player);
      const x = isHome ? app.screen.width * 0.3 + Math.random() * 200 : app.screen.width * 0.7 + Math.random() * 200;
      const y = app.screen.height * 0.3 + Math.random() * 200;

      const playerBody = Matter.Bodies.circle(x, y, 10, { restitution: 0.5, friction: 0.1, frictionAir: 0.05, label: `player_${player.id}` });
      Matter.World.add(engine.world, [playerBody]);
      bodiesRef.current.push(playerBody);

      const playerSprite = new PIXI.Graphics();
      playerSprite.beginFill(isHome ? 0x3B82F6 : 0xEF4444);
      playerSprite.drawCircle(0, 0, 10);
      playerSprite.endFill();

      const nameText = new PIXI.Text(player.lastName, { fontSize: 8, fill: 0xFFFFFF, align: "center" });
      nameText.anchor.set(0.5, 0);
      nameText.y = 13;
      playerSprite.addChild(nameText);

      app.stage.addChild(playerSprite);
      spritesRef.current.push(playerSprite);
    });

    // Pitch lines
    const lines = new PIXI.Graphics();
    lines.lineStyle(1.5, 0xFFFFFF, 0.3);
    lines.drawRect(0, 0, app.screen.width, app.screen.height);
    lines.moveTo(app.screen.width / 2, 0);
    lines.lineTo(app.screen.width / 2, app.screen.height);
    lines.drawCircle(app.screen.width / 2, app.screen.height / 2, 40);
    lines.drawRect(app.screen.width * 0.1, app.screen.height * 0.3, app.screen.width * 0.3, app.screen.height * 0.4);
    lines.drawRect(app.screen.width * 0.6, app.screen.height * 0.3, app.screen.width * 0.3, app.screen.height * 0.4);
    app.stage.addChild(lines);

    setMatchState(prev => ({ ...prev, isPlaying: true }));

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      Matter.Engine.update(engine, delta);

      for (let i = 0; i < bodiesRef.current.length; i++) {
        if (i < spritesRef.current.length) {
          if (i < 4) continue;
          const body = bodiesRef.current[i];
          const sprite = spritesRef.current[i];
          sprite.x = body.position.x;
          sprite.y = body.position.y;
        }
      }

      if (matchState.isPlaying && !matchState.isPaused && !matchState.isFullTime) {
        setMatchState(prev => {
          const newTime = prev.time + (delta / 1000);
          if (newTime >= MATCH_CONSTANTS.HALF_TIME && !prev.isHalfTime) return { ...prev, time: newTime, isHalfTime: true, isPlaying: false };
          if (newTime >= MATCH_CONSTANTS.MATCH_DURATION && !prev.isFullTime) return { ...prev, time: MATCH_CONSTANTS.MATCH_DURATION, isFullTime: true, isPlaying: false };
          return { ...prev, time: newTime };
        });
      }

      if (matchState.isPlaying && !matchState.isPaused && Date.now() % 2000 < delta) {
        simulateAIAction();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      Matter.Engine.clear(engine);
      app.destroy(true);
    };
  }, [homeClub, awayClub, homePlayers, awayPlayers]);

  const simulateAIAction = useCallback(() => {
    if (!engineRef.current || !rendererRef.current) return;
    const app = rendererRef.current;
    const ballBody = bodiesRef.current[4];
    const ballPosition = ballBody.position;

    let closestIdx = -1, minDist = Infinity;
    for (let i = 5; i < bodiesRef.current.length; i++) {
      const dist = Matter.Vector.magnitude(Matter.Vector.sub(bodiesRef.current[i].position, ballPosition));
      if (dist < minDist) { minDist = dist; closestIdx = i; }
    }

    if (closestIdx === -1 || minDist > 100) return;

    const playerBody = bodiesRef.current[closestIdx];
    const playerId = parseInt(playerBody.label.replace("player_", ""));
    const player = [...homePlayers, ...awayPlayers].find(p => p.id === playerId);
    if (!player) return;

    const isHome = homePlayers.some(p => p.id === playerId);
    const team = isHome ? "home" : "away";
    const mods = POSITION_MODIFIERS[player.position] || POSITION_MODIFIERS["CM"];
    const rand = Math.random();

    if (minDist < 30) {
      if (rand < mods.passFrequency) simulatePass(playerId, team);
      else if (rand < mods.passFrequency + mods.shootFrequency) simulateShot(playerId, team);
      else simulateDribble(playerId, team);
    } else {
      const dir = Matter.Vector.normalise(Matter.Vector.sub(ballPosition, playerBody.position));
      Matter.Body.setVelocity(playerBody, { x: dir.x * MATCH_CONSTANTS.PLAYER_SPEED, y: dir.y * MATCH_CONSTANTS.PLAYER_SPEED });
    }
  }, [homePlayers, awayPlayers, matchState]);

  const simulatePass = useCallback((playerId: number, team: string) => {
    if (!engineRef.current) return;
    const targetTeam = team === "home" ? homePlayers : awayPlayers;
    const target = targetTeam.find(p => p.id !== playerId);
    if (!target) return;
    const playerBody = bodiesRef.current.find(b => b.label === `player_${playerId}`);
    const targetBody = bodiesRef.current.find(b => b.label === `player_${target.id}`);
    if (!playerBody || !targetBody) return;

    const dir = Matter.Vector.normalise(Matter.Vector.sub(targetBody.position, playerBody.position));
    const ballBody = bodiesRef.current[4];
    Matter.Body.setPosition(ballBody, { x: playerBody.position.x + dir.x * 15, y: playerBody.position.y + dir.y * 15 });
    Matter.Body.setVelocity(ballBody, { x: dir.x * MATCH_CONSTANTS.BALL_SPEED * 2, y: dir.y * MATCH_CONSTANTS.BALL_SPEED * 2 });

    const player = [...homePlayers, ...awayPlayers].find(p => p.id === playerId);
    if (player) setCommentary(prev => [...prev, { time: matchState.time, text: `${player.lastName} passes to ${target.lastName}...` }]);
  }, [matchState.time, homePlayers, awayPlayers]);

  const simulateShot = useCallback((playerId: number, team: string) => {
    if (!engineRef.current || !rendererRef.current) return;
    const app = rendererRef.current;
    const playerBody = bodiesRef.current.find(b => b.label === `player_${playerId}`);
    const ballBody = bodiesRef.current[4];
    if (!playerBody) return;

    const goalX = team === "home" ? app.screen.width : 0;
    const dir = Matter.Vector.normalise({ x: goalX - playerBody.position.x, y: app.screen.height / 2 - playerBody.position.y });

    Matter.Body.setPosition(ballBody, { x: playerBody.position.x + dir.x * 15, y: playerBody.position.y + dir.y * 15 });
    Matter.Body.setVelocity(ballBody, { x: dir.x * MATCH_CONSTANTS.BALL_SPEED * 2.5, y: dir.y * MATCH_CONSTANTS.BALL_SPEED * 2.5 });

    const player = [...homePlayers, ...awayPlayers].find(p => p.id === playerId);
    if (player) setCommentary(prev => [...prev, { time: matchState.time, text: `${player.lastName} takes a shot!` }]);

    setTimeout(() => {
      const ball = bodiesRef.current[4];
      if ((team === "home" && ball.position.x > app.screen.width * 0.95) || (team === "away" && ball.position.x < app.screen.width * 0.05)) {
        if (team === "home") {
          setMatchState(prev => ({ ...prev, homeScore: prev.homeScore + 1, stats: { ...prev.stats, home: { ...prev.stats.home, shotsOnTarget: prev.stats.home.shotsOnTarget + 1 } } }));
          setCommentary(prev => [...prev, { time: matchState.time, text: `GOAL! ${player?.lastName} scores for ${homeClub?.name}!` }]);
        } else {
          setMatchState(prev => ({ ...prev, awayScore: prev.awayScore + 1, stats: { ...prev.stats, away: { ...prev.stats.away, shotsOnTarget: prev.stats.away.shotsOnTarget + 1 } } }));
          setCommentary(prev => [...prev, { time: matchState.time, text: `GOAL! ${player?.lastName} scores for ${awayClub?.name}!` }]);
        }
        Matter.Body.setPosition(ball, { x: app.screen.width / 2, y: app.screen.height / 2 });
        Matter.Body.setVelocity(ball, { x: 0, y: 0 });
      }
    }, 1000);
  }, [matchState.time, homeClub, awayClub, homePlayers, awayPlayers]);

  const simulateDribble = useCallback((playerId: number, _team: string) => {
    const playerBody = bodiesRef.current.find(b => b.label === `player_${playerId}`);
    const ballBody = bodiesRef.current[4];
    if (!playerBody) return;

    const dir = Matter.Vector.normalise({ x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 50 });
    Matter.Body.setVelocity(playerBody, { x: dir.x * MATCH_CONSTANTS.PLAYER_SPEED * 1.5, y: dir.y * MATCH_CONSTANTS.PLAYER_SPEED * 1.5 });
    Matter.Body.setPosition(ballBody, { x: playerBody.position.x + dir.x * 15, y: playerBody.position.y + dir.y * 15 });
    Matter.Body.setVelocity(ballBody, { x: dir.x * MATCH_CONSTANTS.BALL_SPEED * 0.5, y: dir.y * MATCH_CONSTANTS.BALL_SPEED * 0.5 });

    const player = [...homePlayers, ...awayPlayers].find(p => p.id === playerId);
    if (player) setCommentary(prev => [...prev, { time: matchState.time, text: `${player.lastName} dribbles forward!` }]);
  }, [matchState.time, homePlayers, awayPlayers]);

  const togglePlayPause = () => setMatchState(prev => ({ ...prev, isPlaying: !prev.isPlaying, isPaused: !prev.isPaused }));
  const continueFromHalfTime = () => setMatchState(prev => ({ ...prev, isPlaying: true, isPaused: false, isHalfTime: false }));
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  if (!match || !homeClub || !awayClub) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <p className="text-offwhite-500 text-sm">No match selected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top HUD — Score & Time */}
      <div className="glass-heavy border-b border-white/5 px-6 py-3 flex items-center justify-between shrink-0">
        {/* Home */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: homeClub.homeKitColor + '20' }}>
            <div className="w-4 h-4 rounded" style={{ backgroundColor: homeClub.homeKitColor }} />
          </div>
          <span className="font-semibold text-sm">{homeClub.name}</span>
        </div>

        {/* Score + Time */}
        <div className="text-center">
          <div className="flex items-center gap-4">
            <span className="text-3xl font-black text-offwhite">{matchState.homeScore}</span>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold uppercase text-offwhite-500">
                {matchState.isHalfTime ? "HT" : matchState.isFullTime ? "FT" : "LIVE"}
              </span>
              <span className="text-lg font-mono font-bold text-gold">{formatTime(matchState.time)}</span>
            </div>
            <span className="text-3xl font-black text-offwhite">{matchState.awayScore}</span>
          </div>
          {/* Momentum bar */}
          <div className="w-48 h-1 rounded-full bg-white/5 mt-1.5 mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 via-gold to-red-400 animate-momentum-pulse" style={{ width: '60%' }} />
          </div>
        </div>

        {/* Away */}
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">{awayClub.name}</span>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: awayClub.awayKitColor + '20' }}>
            <div className="w-4 h-4 rounded" style={{ backgroundColor: awayClub.awayKitColor }} />
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Pitch */}
        <div className="flex-1 relative">
          <div ref={pitchRef} className="w-full h-full" />

          {/* Commentary Overlay */}
          <div className="absolute bottom-0 left-0 right-0 glass p-3">
            <div className="h-16 overflow-y-auto space-y-0.5">
              {commentary.slice().reverse().map((c, i) => (
                <p key={i} className={`text-[11px] ${i === 0 ? 'text-gold font-medium' : 'text-offwhite-500'}`}>
                  <span className="text-offwhite-500/50 font-mono text-[10px]">[{formatTime(c.time)}]</span> {c.text}
                </p>
              ))}
            </div>
          </div>

          {/* Sub Menu Overlay */}
          {showSubMenu && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-heavy rounded-xl p-6 w-80 z-20 animate-scale-in">
              <h3 className="text-sm font-bold mb-3">Substitutions</h3>
              <p className="text-xs text-offwhite-500 text-center py-4">Coming in Phase 2</p>
              <button onClick={() => setShowSubMenu(false)} className="game-btn-secondary text-xs w-full">Close</button>
            </div>
          )}

          {showTacticsMenu && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-heavy rounded-xl p-6 w-80 z-20 animate-scale-in">
              <h3 className="text-sm font-bold mb-3">In-Game Tactics</h3>
              <p className="text-xs text-offwhite-500 text-center py-4">Coming in Phase 2</p>
              <button onClick={() => setShowTacticsMenu(false)} className="game-btn-secondary text-xs w-full">Close</button>
            </div>
          )}

          {/* Full Time Overlay */}
          {matchState.isFullTime && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-heavy rounded-xl p-8 w-96 z-20 text-center animate-scale-in">
              <p className="text-[10px] uppercase tracking-widest text-offwhite-500 mb-2">Full Time</p>
              <p className="text-5xl font-black gradient-text mb-2">{matchState.homeScore} - {matchState.awayScore}</p>
              <p className="text-sm text-offwhite-300 mb-4">
                {matchState.homeScore > matchState.awayScore ? `${homeClub.name} Win!` : matchState.homeScore < matchState.awayScore ? `${awayClub.name} Win!` : "Draw"}
              </p>
              <button onClick={() => window.location.href = "/matches"} className="game-btn text-xs">Return to Matches</button>
            </div>
          )}
        </div>

        {/* Right Panel — Stats */}
        <div className="w-64 glass-heavy border-l border-white/5 p-4 overflow-y-auto shrink-0">
          {/* Controls */}
          <div className="space-y-2 mb-4">
            {!matchState.isHalfTime && !matchState.isFullTime && (
              <button onClick={togglePlayPause} className="game-btn w-full text-xs">
                {matchState.isPlaying && !matchState.isPaused ? "Pause" : "Play"}
              </button>
            )}
            {matchState.isHalfTime && (
              <button onClick={continueFromHalfTime} className="game-btn w-full text-xs">2nd Half</button>
            )}
            <button onClick={() => setShowSubMenu(!showSubMenu)} className="game-btn-secondary w-full text-xs">Subs</button>
            <button onClick={() => setShowTacticsMenu(!showTacticsMenu)} className="game-btn-secondary w-full text-xs">Tactics</button>
            <button onClick={() => setMatchState(prev => ({ ...prev, isFullTime: true, isPlaying: false }))} className="game-btn-danger w-full text-xs">End Match</button>
          </div>

          {/* Stats */}
          <div>
            <p className="section-header">Match Stats</p>
            <div className="space-y-3">
              {[
                { label: "Shots", home: matchState.stats.home.shots, away: matchState.stats.away.shots },
                { label: "On Target", home: matchState.stats.home.shotsOnTarget, away: matchState.stats.away.shotsOnTarget },
                { label: "Possession", home: matchState.stats.total.possession, away: 100 - matchState.stats.total.possession, suffix: "%" },
                { label: "Fouls", home: matchState.stats.home.fouls, away: matchState.stats.away.fouls },
                { label: "Corners", home: matchState.stats.home.corners, away: matchState.stats.away.corners },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className={`font-bold ${stat.home > stat.away ? 'text-blue-400' : 'text-offwhite-500'}`}>{stat.home}{stat.suffix || ''}</span>
                    <span className="text-offwhite-500 text-[9px]">{stat.label}</span>
                    <span className={`font-bold ${stat.away > stat.home ? 'text-red-400' : 'text-offwhite-500'}`}>{stat.away}{stat.suffix || ''}</span>
                  </div>
                  <div className="flex gap-1 h-1 mt-1 rounded-full overflow-hidden">
                    <div className="bg-blue-400 rounded-l-full" style={{ width: `${stat.home / (stat.home + stat.away || 1) * 100}%` }} />
                    <div className="bg-red-400 rounded-r-full" style={{ width: `${stat.away / (stat.home + stat.away || 1) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

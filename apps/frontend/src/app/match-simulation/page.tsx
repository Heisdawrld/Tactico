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
  MatchState,
  MatchEvent,
  MatchStats,
  BallState,
  PlayerMatchState,
  MATCH_CONSTANTS,
  WEATHER_EFFECTS,
  POSITION_MODIFIERS,
} from "@/types/match-simulation";

export default function MatchSimulationPage() {
  const pitchRef = useRef<HTMLDivElement>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [homeClub, setHomeClub] = useState<Club | null>(null);
  const [awayClub, setAwayClub] = useState<Club | null>(null);
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [matchState, setMatchState] = useState<MatchState>({
    homeClubId: 0,
    awayClubId: 0,
    homeScore: 0,
    awayScore: 0,
    time: 0,
    isPlaying: false,
    isPaused: false,
    isHalfTime: false,
    isFullTime: false,
    possession: "none",
    lastTouch: "none",
    matchEvents: [],
    stats: {
      home: {
        shots: 0,
        shotsOnTarget: 0,
        possession: 0,
        fouls: 0,
        yellowCards: 0,
        redCards: 0,
        corners: 0,
        offsides: 0,
        passesCompleted: 0,
        passesAttempted: 0,
        passAccuracy: 0,
      },
      away: {
        shots: 0,
        shotsOnTarget: 0,
        possession: 0,
        fouls: 0,
        yellowCards: 0,
        redCards: 0,
        corners: 0,
        offsides: 0,
        passesCompleted: 0,
        passesAttempted: 0,
        passAccuracy: 0,
      },
      total: {
        shots: 0,
        shotsOnTarget: 0,
        possession: 50,
        fouls: 0,
        corners: 0,
        offsides: 0,
      },
    },
  });
  const [ballState, setBallState] = useState<BallState>({
    x: 0.5,
    y: 0.5,
    vx: 0,
    vy: 0,
    inPlay: true,
    lastTouchedBy: null,
  });
  const [playerStates, setPlayerStates] = useState<PlayerMatchState[]>([]);
  const [commentary, setCommentary] = useState<{ time: number; text: string }[]>([]);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [showTacticsMenu, setShowTacticsMenu] = useState(false);

  // Refs for Matter.js and PixiJS
  const engineRef = useRef<Matter.Engine | null>(null);
  const rendererRef = useRef<PIXI.Application | null>(null);
  const bodiesRef = useRef<Matter.Body[]>([]);
  const spritesRef = useRef<(PIXI.Graphics | PIXI.Text)[]>([]);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Load match data
  useEffect(() => {
    const matchId = localStorage.getItem("currentMatchId");
    if (matchId) {
      const currentMatch = matches.find((m) => m.id === parseInt(matchId));
      if (currentMatch) {
        setMatch(currentMatch);
        const home = clubs.find((c) => c.id === currentMatch.homeClubId);
        const away = clubs.find((c) => c.id === currentMatch.awayClubId);
        setHomeClub(home || null);
        setAwayClub(away || null);
        setHomePlayers(players.filter((p) => p.clubId === currentMatch.homeClubId).slice(0, 11));
        setAwayPlayers(players.filter((p) => p.clubId === currentMatch.awayClubId).slice(0, 11));
        
        // Initialize match state
        setMatchState({
          ...matchState,
          homeClubId: currentMatch.homeClubId,
          awayClubId: currentMatch.awayClubId,
          homeScore: currentMatch.homeScore,
          awayScore: currentMatch.awayScore,
        });
      }
    }
  }, []);

  // Initialize physics and renderer
  useEffect(() => {
    if (!pitchRef.current || !homeClub || !awayClub || homePlayers.length === 0 || awayPlayers.length === 0) return;

    // Create Matter.js engine
    const engine = Matter.Engine.create();
    engineRef.current = engine;

    // Create PixiJS renderer
    const app = new PIXI.Application({
      width: pitchRef.current.clientWidth,
      height: pitchRef.current.clientHeight,
      backgroundColor: 0x2e7d32,
      antialias: true,
    });
    rendererRef.current = app;
    pitchRef.current.appendChild(app.view as HTMLCanvasElement);

    // Create ground
    const ground = Matter.Bodies.rectangle(
      app.screen.width / 2,
      app.screen.height + 10,
      app.screen.width * 2,
      20,
      { isStatic: true }
    );
    
    // Create walls
    const walls = [
      Matter.Bodies.rectangle(-10, app.screen.height / 2, 20, app.screen.height * 2, { isStatic: true }),
      Matter.Bodies.rectangle(app.screen.width + 10, app.screen.height / 2, 20, app.screen.height * 2, { isStatic: true }),
      Matter.Bodies.rectangle(app.screen.width / 2, -10, app.screen.width * 2, 20, { isStatic: true }),
    ];

    Matter.World.add(engine.world, [ground, ...walls]);
    bodiesRef.current = [ground, ...walls];

    // Create ball
    const ball = Matter.Bodies.circle(
      app.screen.width / 2,
      app.screen.height / 2,
      8,
      { restitution: 0.8, friction: 0.01, frictionAir: 0.01 }
    );
    Matter.World.add(engine.world, [ball]);
    bodiesRef.current.push(ball);

    // Create ball sprite
    const ballSprite = new PIXI.Graphics();
    ballSprite.beginFill(0xffffff);
    ballSprite.drawCircle(0, 0, 8);
    ballSprite.endFill();
    app.stage.addChild(ballSprite);
    spritesRef.current.push(ballSprite);

    // Create players
    const allPlayers = [...homePlayers, ...awayPlayers];
    const newPlayerStates: PlayerMatchState[] = [];

    allPlayers.forEach((player, index) => {
      const isHome = homePlayers.includes(player);
      const x = isHome 
        ? app.screen.width * 0.3 + Math.random() * 200 
        : app.screen.width * 0.7 + Math.random() * 200;
      const y = app.screen.height * 0.3 + Math.random() * 200;

      const playerBody = Matter.Bodies.circle(x, y, 12, {
        restitution: 0.5,
        friction: 0.1,
        frictionAir: 0.05,
        label: `player_${player.id}`,
      });
      Matter.World.add(engine.world, [playerBody]);
      bodiesRef.current.push(playerBody);

      const playerSprite = new PIXI.Graphics();
      playerSprite.beginFill(isHome ? homeClub.homeKitColor : awayClub.awayKitColor);
      playerSprite.drawCircle(0, 0, 12);
      playerSprite.endFill();
      
      const playerText = new PIXI.Text(player.lastName, {
        fontSize: 10,
        fill: 0xffffff,
        align: "center",
      });
      playerText.anchor.set(0.5, 0);
      playerText.y = 15;
      playerSprite.addChild(playerText);

      app.stage.addChild(playerSprite);
      spritesRef.current.push(playerSprite);

      newPlayerStates.push({
        id: player.id,
        x: x / app.screen.width,
        y: y / app.screen.height,
        vx: 0,
        vy: 0,
        stamina: 100,
        hasBall: false,
        isTackling: false,
        isSprinting: false,
        isInjured: false,
        isBooked: false,
        isSentOff: false,
        minutesPlayed: 0,
      });
    });

    setPlayerStates(newPlayerStates);

    // Draw pitch lines
    const pitchLines = new PIXI.Graphics();
    pitchLines.lineStyle(2, 0xffffff);
    pitchLines.drawRect(0, 0, app.screen.width, app.screen.height);
    
    // Center line
    pitchLines.moveTo(app.screen.width / 2, 0);
    pitchLines.lineTo(app.screen.width / 2, app.screen.height);
    
    // Center circle
    pitchLines.drawCircle(app.screen.width / 2, app.screen.height / 2, 50);
    
    // Penalty areas
    pitchLines.drawRect(
      app.screen.width * 0.1,
      app.screen.height * 0.3,
      app.screen.width * 0.3,
      app.screen.height * 0.4
    );
    pitchLines.drawRect(
      app.screen.width * 0.6,
      app.screen.height * 0.3,
      app.screen.width * 0.3,
      app.screen.height * 0.4
    );
    
    // Penalty spots
    pitchLines.beginFill(0xffffff);
    pitchLines.drawCircle(app.screen.width * 0.2, app.screen.height / 2, 3);
    pitchLines.drawCircle(app.screen.width * 0.8, app.screen.height / 2, 3);
    pitchLines.endFill();

    app.stage.addChild(pitchLines);

    // Start the match
    setMatchState({ ...matchState, isPlaying: true });

    // Animation loop
    const animate = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
      }
      
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      // Update physics
      Matter.Engine.update(engine, delta);

      // Update sprites
      for (let i = 0; i < bodiesRef.current.length; i++) {
        if (i < spritesRef.current.length) {
          const body = bodiesRef.current[i];
          const sprite = spritesRef.current[i];
          
          // Skip ground and walls
          if (i < 4) continue;
          
          sprite.x = body.position.x;
          sprite.y = body.position.y;
          
          // Update ball state
          if (i === 4) { // Ball is index 4
            setBallState({
              x: body.position.x / app.screen.width,
              y: body.position.y / app.screen.height,
              vx: body.velocity.x,
              vy: body.velocity.y,
              inPlay: true,
              lastTouchedBy: null,
            });
          }
        }
      }

      // Update match time
      if (matchState.isPlaying && !matchState.isPaused && !matchState.isFullTime) {
        setMatchState((prev) => {
          const newTime = prev.time + (delta / 1000);
          
          // Check for half-time
          if (newTime >= MATCH_CONSTANTS.HALF_TIME && !prev.isHalfTime) {
            return {
              ...prev,
              time: newTime,
              isHalfTime: true,
              isPlaying: false,
            };
          }
          
          // Check for full-time
          if (newTime >= MATCH_CONSTANTS.MATCH_DURATION && !prev.isFullTime) {
            return {
              ...prev,
              time: MATCH_CONSTANTS.MATCH_DURATION,
              isFullTime: true,
              isPlaying: false,
            };
          }
          
          return {
            ...prev,
            time: newTime,
          };
        });
      }

      // Update player states (stamina, etc.)
      setPlayerStates((prev) => {
        return prev.map((player) => ({
          ...player,
          stamina: Math.max(0, player.stamina - (player.isSprinting ? 0.05 : 0.01) * (delta / 100)),
          minutesPlayed: player.minutesPlayed + (delta / 1000 / 60),
        }));
      });

      // Simulate AI decisions periodically
      if (matchState.isPlaying && !matchState.isPaused && Date.now() % 2000 < delta) {
        simulateAIAction();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationRef.current);
      Matter.Engine.clear(engine);
      app.destroy(true);
    };
  }, [homeClub, awayClub, homePlayers, awayPlayers]);

  // Simulate AI action
  const simulateAIAction = useCallback(() => {
    if (!engineRef.current || !rendererRef.current || playerStates.length === 0) return;

    const app = rendererRef.current;
    const engine = engineRef.current;
    
    // Find player with ball
    const ballBody = bodiesRef.current[4]; // Ball is index 4
    const ballPosition = ballBody.position;
    
    // Find closest player to ball
    let closestPlayerIndex = -1;
    let minDistance = Infinity;
    
    for (let i = 5; i < bodiesRef.current.length; i++) { // Players start at index 5
      const playerBody = bodiesRef.current[i];
      const distance = Matter.Vector.magnitude(
        Matter.Vector.sub(playerBody.position, ballPosition)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPlayerIndex = i;
      }
    }

    if (closestPlayerIndex === -1 || minDistance > 100) return;

    const playerBody = bodiesRef.current[closestPlayerIndex];
    const playerId = parseInt(playerBody.label.toString().replace("player_", ""));
    const playerState = playerStates.find((p) => p.id === playerId);
    if (!playerState) return;

    const player = [...homePlayers, ...awayPlayers].find((p) => p.id === playerId);
    if (!player) return;

    const isHome = homePlayers.some((p) => p.id === playerId);
    const team = isHome ? "home" : "away";

    // Random AI decision based on position
    const positionModifiers = POSITION_MODIFIERS[player.position] || POSITION_MODIFIERS["CM"];
    const random = Math.random();
    
    // Decide action
    if (minDistance < 30) {
      // Player has the ball
      if (random < positionModifiers.passFrequency) {
        // Pass
        simulatePass(playerId, team);
      } else if (random < positionModifiers.passFrequency + positionModifiers.shootFrequency) {
        // Shoot
        simulateShot(playerId, team);
      } else if (random < positionModifiers.passFrequency + positionModifiers.shootFrequency + positionModifiers.dribbleFrequency) {
        // Dribble
        simulateDribble(playerId, team);
      }
    } else {
      // Player is chasing the ball
      const direction = Matter.Vector.normalise(
        Matter.Vector.sub(ballPosition, playerBody.position)
      );
      Matter.Body.setVelocity(playerBody, {
        x: direction.x * (playerState.stamina > 50 ? MATCH_CONSTANTS.PLAYER_SPEED * 1.5 : MATCH_CONSTANTS.PLAYER_SPEED),
        y: direction.y * (playerState.stamina > 50 ? MATCH_CONSTANTS.PLAYER_SPEED * 1.5 : MATCH_CONSTANTS.PLAYER_SPEED),
      });
    }
  }, [playerStates, homePlayers, awayPlayers]);

  // Simulate pass
  const simulatePass = useCallback((playerId: number, team: string) => {
    if (!engineRef.current || !rendererRef.current) return;

    const engine = engineRef.current;
    const app = rendererRef.current;
    
    // Find target teammate
    const targetTeam = team === "home" ? homePlayers : awayPlayers;
    const targetPlayer = targetTeam.find((p) => p.id !== playerId);
    if (!targetPlayer) return;

    const playerBody = bodiesRef.current.find((b) => 
      b.label === `player_${playerId}`
    );
    const targetBody = bodiesRef.current.find((b) => 
      b.label === `player_${targetPlayer.id}`
    );
    
    if (!playerBody || !targetBody) return;

    // Calculate direction and distance
    const direction = Matter.Vector.normalise(
      Matter.Vector.sub(targetBody.position, playerBody.position)
    );
    const distance = Matter.Vector.magnitude(
      Matter.Vector.sub(targetBody.position, playerBody.position)
    );

    // Apply pass accuracy
    const passAccuracy = 0.85;
    const accuracyFactor = passAccuracy + (Math.random() - 0.5) * 0.2;
    
    // Apply ball velocity
    const ballBody = bodiesRef.current[4];
    Matter.Body.setPosition(ballBody, {
      x: playerBody.position.x + direction.x * 20,
      y: playerBody.position.y + direction.y * 20,
    });
    Matter.Body.setVelocity(ballBody, {
      x: direction.x * MATCH_CONSTANTS.BALL_SPEED * distance * accuracyFactor,
      y: direction.y * MATCH_CONSTANTS.BALL_SPEED * distance * accuracyFactor,
    });

    // Update stats
    setMatchState((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        [team]: {
          ...prev.stats[team],
          passesAttempted: prev.stats[team].passesAttempted + 1,
        },
      },
    }));

    // Add commentary
    const player = [...homePlayers, ...awayPlayers].find((p) => p.id === playerId);
    if (player) {
      setCommentary((prev) => [
        ...prev,
        {
          time: matchState.time,
          text: `${player.lastName} attempts a pass to ${targetPlayer.lastName}...`,
        },
      ]);
    }
  }, [matchState.time, homePlayers, awayPlayers]);

  // Simulate shot
  const simulateShot = useCallback((playerId: number, team: string) => {
    if (!engineRef.current || !rendererRef.current) return;

    const engine = engineRef.current;
    const app = rendererRef.current;

    const playerBody = bodiesRef.current.find((b) => 
      b.label === `player_${playerId}`
    );
    const ballBody = bodiesRef.current[4];
    
    if (!playerBody) return;

    // Calculate direction to goal
    const goalX = team === "home" ? app.screen.width : 0;
    const direction = Matter.Vector.normalise({
      x: goalX - playerBody.position.x,
      y: app.screen.height / 2 - playerBody.position.y,
    });

    // Apply shot accuracy
    const shotAccuracy = 0.75;
    const accuracyFactor = shotAccuracy + (Math.random() - 0.5) * 0.3;
    
    // Apply ball velocity
    Matter.Body.setPosition(ballBody, {
      x: playerBody.position.x + direction.x * 20,
      y: playerBody.position.y + direction.y * 20,
    });
    Matter.Body.setVelocity(ballBody, {
      x: direction.x * MATCH_CONSTANTS.BALL_SPEED * 2 * accuracyFactor,
      y: direction.y * MATCH_CONSTANTS.BALL_SPEED * 2 * accuracyFactor,
    });

    // Update stats
    setMatchState((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        [team]: {
          ...prev.stats[team],
          shots: prev.stats[team].shots + 1,
        },
        total: {
          ...prev.total,
          shots: prev.total.shots + 1,
        },
      },
    }));

    // Add commentary
    const player = [...homePlayers, ...awayPlayers].find((p) => p.id === playerId);
    if (player) {
      setCommentary((prev) => [
        ...prev,
        {
          time: matchState.time,
          text: `${player.lastName} takes a shot!`,
        },
      ]);
    }

    // Check for goal (simplified - will improve later)
    setTimeout(() => {
      const ball = bodiesRef.current[4];
      if (team === "home" && ball.position.x > app.screen.width * 0.95) {
        // Goal for home
        setMatchState((prev) => ({
          ...prev,
          homeScore: prev.homeScore + 1,
          stats: {
            ...prev.stats,
            home: {
              ...prev.stats.home,
              shotsOnTarget: prev.stats.home.shotsOnTarget + 1,
            },
            total: {
              ...prev.total,
              shotsOnTarget: prev.total.shotsOnTarget + 1,
            },
          },
        }));
        
        if (player) {
          setCommentary((prev) => [
            ...prev,
            {
              time: matchState.time,
              text: `GOAL! ${player.lastName} scores for ${homeClub?.name}!`,
            },
          ]);
        }
        
        // Add event
        setMatchState((prev) => ({
          ...prev,
          matchEvents: [
            ...prev.matchEvents,
            {
              id: prev.matchEvents.length + 1,
              type: "goal",
              time: prev.time,
              playerId,
              playerName: player?.lastName || "Unknown",
              clubId: homeClub?.id || 0,
              description: `${player?.lastName || "Unknown"} scores!`,
              x: ball.position.x / app.screen.width,
              y: ball.position.y / app.screen.height,
            },
          ],
        }));
        
        // Reset ball to center
        Matter.Body.setPosition(ball, {
          x: app.screen.width / 2,
          y: app.screen.height / 2,
        });
        Matter.Body.setVelocity(ball, { x: 0, y: 0 });
      } else if (team === "away" && ball.position.x < app.screen.width * 0.05) {
        // Goal for away
        setMatchState((prev) => ({
          ...prev,
          awayScore: prev.awayScore + 1,
          stats: {
            ...prev.stats,
            away: {
              ...prev.stats.away,
              shotsOnTarget: prev.stats.away.shotsOnTarget + 1,
            },
            total: {
              ...prev.total,
              shotsOnTarget: prev.total.shotsOnTarget + 1,
            },
          },
        }));
        
        if (player) {
          setCommentary((prev) => [
            ...prev,
            {
              time: matchState.time,
              text: `GOAL! ${player.lastName} scores for ${awayClub?.name}!`,
            },
          ]);
        }
        
        // Add event
        setMatchState((prev) => ({
          ...prev,
          matchEvents: [
            ...prev.matchEvents,
            {
              id: prev.matchEvents.length + 1,
              type: "goal",
              time: prev.time,
              playerId,
              playerName: player?.lastName || "Unknown",
              clubId: awayClub?.id || 0,
              description: `${player?.lastName || "Unknown"} scores!`,
              x: ball.position.x / app.screen.width,
              y: ball.position.y / app.screen.height,
            },
          ],
        }));
        
        // Reset ball to center
        Matter.Body.setPosition(ball, {
          x: app.screen.width / 2,
          y: app.screen.height / 2,
        });
        Matter.Body.setVelocity(ball, { x: 0, y: 0 });
      }
    }, 1000);
  }, [matchState.time, homeClub, awayClub, homePlayers, awayPlayers]);

  // Simulate dribble
  const simulateDribble = useCallback((playerId: number, team: string) => {
    if (!engineRef.current || !rendererRef.current) return;

    const playerBody = bodiesRef.current.find((b) => 
      b.label === `player_${playerId}`
    );
    const ballBody = bodiesRef.current[4];
    
    if (!playerBody) return;

    // Move player with ball
    const direction = Math.random() > 0.5 ? 1 : -1;
    const targetX = playerBody.position.x + (Math.random() * 100 - 50);
    const targetY = playerBody.position.y + (Math.random() * 50 - 25);
    
    const normalizedDirection = Matter.Vector.normalise({
      x: targetX - playerBody.position.x,
      y: targetY - playerBody.position.y,
    });

    Matter.Body.setVelocity(playerBody, {
      x: normalizedDirection.x * MATCH_CONSTANTS.PLAYER_SPEED * 1.5,
      y: normalizedDirection.y * MATCH_CONSTANTS.PLAYER_SPEED * 1.5,
    });

    // Move ball with player
    Matter.Body.setPosition(ballBody, {
      x: playerBody.position.x + normalizedDirection.x * 20,
      y: playerBody.position.y + normalizedDirection.y * 20,
    });
    Matter.Body.setVelocity(ballBody, {
      x: normalizedDirection.x * MATCH_CONSTANTS.BALL_SPEED * 0.5,
      y: normalizedDirection.y * MATCH_CONSTANTS.BALL_SPEED * 0.5,
    });

    // Add commentary
    const player = [...homePlayers, ...awayPlayers].find((p) => p.id === playerId);
    if (player) {
      setCommentary((prev) => [
        ...prev,
        {
          time: matchState.time,
          text: `${player.lastName} dribbles forward!`,
        },
      ]);
    }
  }, [matchState.time, homePlayers, awayPlayers]);

  // Toggle play/pause
  const togglePlayPause = () => {
    setMatchState((prev) => ({
      ...prev,
      isPlaying: !prev.isPlaying,
      isPaused: !prev.isPaused,
    }));
  };

  // Continue from half-time
  const continueFromHalfTime = () => {
    setMatchState((prev) => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
      isHalfTime: false,
    }));
  };

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (!match || !homeClub || !awayClub) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-8">
        <p className="text-center">No match selected. Please select a match from the Matches page.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="flex h-screen">
        {/* Match Info Sidebar */}
        <div className="w-80 bg-gray-800 p-4 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-4">Match Simulation</h1>
            
            {/* Teams */}
            <div className="flex justify-between items-center mb-4">
              <div className="text-center">
                <p className="font-bold">{homeClub.name}</p>
                <div
                  className="w-16 h-10 mx-auto mt-1 rounded"
                  style={{ backgroundColor: homeClub.homeKitColor }}
                ></div>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {matchState.homeScore} - {matchState.awayScore}
                </p>
              </div>
              <div className="text-center">
                <p className="font-bold">{awayClub.name}</p>
                <div
                  className="w-16 h-10 mx-auto mt-1 rounded"
                  style={{ backgroundColor: awayClub.awayKitColor }}
                ></div>
              </div>
            </div>

            {/* Match Time */}
            <div className="text-center mb-6">
              <p className="text-4xl font-bold">
                {formatTime(matchState.time)}
              </p>
              <p className="text-sm text-gray-400">
                {matchState.isHalfTime ? "Half-Time" : matchState.isFullTime ? "Full-Time" : ""}
              </p>
            </div>

            {/* Match Status */}
            <div className="bg-gray-700 rounded-lg p-3 mb-6">
              <p className="font-medium mb-2">Status</p>
              <p>
                {matchState.isPlaying && !matchState.isPaused 
                  ? "In Play" 
                  : matchState.isPaused 
                    ? "Paused" 
                    : matchState.isHalfTime 
                      ? "Half-Time Break" 
                      : matchState.isFullTime 
                        ? "Match Finished" 
                        : "Not Started"}
              </p>
              <p className="text-sm text-gray-400">
                Possession: {matchState.possession === "none" ? "50%" : matchState.possession === "home" ? "Home" : "Away"}
              </p>
            </div>

            {/* Match Stats */}
            <div className="bg-gray-700 rounded-lg p-3 mb-6">
              <p className="font-medium mb-3">Match Stats</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Shots</span>
                  <span>
                    {matchState.stats.home.shots} - {matchState.stats.away.shots}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shots on Target</span>
                  <span>
                    {matchState.stats.home.shotsOnTarget} - {matchState.stats.away.shotsOnTarget}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Possession</span>
                  <span>
                    {matchState.stats.total.possession}% - {100 - matchState.stats.total.possession}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Fouls</span>
                  <span>
                    {matchState.stats.home.fouls} - {matchState.stats.away.fouls}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Corners</span>
                  <span>
                    {matchState.stats.home.corners} - {matchState.stats.away.corners}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-2">
              {!matchState.isHalfTime && !matchState.isFullTime && (
                <button
                  onClick={togglePlayPause}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold"
                >
                  {matchState.isPlaying && !matchState.isPaused ? "Pause" : "Play"}
                </button>
              )}
              
              {matchState.isHalfTime && (
                <button
                  onClick={continueFromHalfTime}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold"
                >
                  Continue (2nd Half)
                </button>
              )}

              <button
                onClick={() => setShowSubMenu(!showSubMenu)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-bold"
              >
                Substitutions
              </button>
              
              <button
                onClick={() => setShowTacticsMenu(!showTacticsMenu)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-bold"
              >
                Tactics
              </button>
              
              <button
                onClick={() => {
                  // End match early
                  setMatchState((prev) => ({
                    ...prev,
                    isFullTime: true,
                    isPlaying: false,
                  }));
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold"
              >
                End Match
              </button>
            </div>
          </div>
        </div>

        {/* Pitch */}
        <div className="flex-1 relative">
          {/* Pitch Container */}
          <div
            ref={pitchRef}
            className="w-full h-full"
          ></div>

          {/* Commentary */}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-4">
            <div className="h-24 overflow-y-auto">
              {commentary.slice().reverse().map((c, i) => (
                <p key={i} className="text-sm">
                  <span className="text-gray-400">[{formatTime(c.time)}]</span> {c.text}
                </p>
              ))}
            </div>
          </div>

          {/* Substitutions Menu */}
          {showSubMenu && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-lg p-6 w-96 z-20">
              <h2 className="text-xl font-bold mb-4">Substitutions</h2>
              <p className="text-center text-gray-400">
                Substitution system coming soon in Phase 2.
              </p>
              <button
                onClick={() => setShowSubMenu(false)}
                className="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          )}

          {/* Tactics Menu */}
          {showTacticsMenu && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-lg p-6 w-96 z-20">
              <h2 className="text-xl font-bold mb-4">Tactics</h2>
              <p className="text-center text-gray-400">
                In-game tactic changes coming soon in Phase 2.
              </p>
              <button
                onClick={() => setShowTacticsMenu(false)}
                className="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          )}

          {/* Match Events */}
          {matchState.isFullTime && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-lg p-6 w-96 z-20">
              <h2 className="text-xl font-bold mb-4">Match Finished</h2>
              <p className="text-center text-2xl font-bold mb-4">
                {matchState.homeScore} - {matchState.awayScore}
              </p>
              <p className="text-center mb-4">
                {matchState.homeScore > matchState.awayScore 
                  ? `${homeClub.name} Win!` 
                  : matchState.homeScore < matchState.awayScore 
                    ? `${awayClub.name} Win!` 
                    : "Draw"}
              </p>
              <button
                onClick={() => {
                  // Return to matches page
                  window.location.href = "/matches";
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold"
              >
                Return to Matches
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import * as Matter from "matter-js";
import { clubs } from "@/types/club";
import { matches } from "@/types/match";
import { players } from "@/types/player";
import { Club } from "@/types/club";
import { Match } from "@/types/match";
import { Player } from "@/types/player";

export default function MatchSimulationPage() {
  const pitchRef = useRef<HTMLDivElement>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [homeClub, setHomeClub] = useState<Club | null>(null);
  const [awayClub, setAwayClub] = useState<Club | null>(null);
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize Matter.js engine and PixiJS renderer
  const engineRef = useRef<Matter.Engine | null>(null);
  const rendererRef = useRef<PIXI.Application | null>(null);
  const bodiesRef = useRef<Matter.Body[]>([]);
  const spritesRef = useRef<PIXI.Sprite[]>([]);

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
        setHomePlayers(players.filter((p) => p.clubId === currentMatch.homeClubId));
        setAwayPlayers(players.filter((p) => p.clubId === currentMatch.awayClubId));
      }
    }
  }, []);

  useEffect(() => {
    if (!pitchRef.current || !match || !homeClub || !awayClub) return;

    // Initialize Matter.js engine
    const engine = Matter.Engine.create();
    engineRef.current = engine;

    // Initialize PixiJS renderer
    const app = new PIXI.Application({
      width: pitchRef.current.clientWidth,
      height: pitchRef.current.clientHeight,
      backgroundColor: 0x2e7d32,
      antialias: true,
    });
    rendererRef.current = app;
    pitchRef.current.appendChild(app.view as HTMLCanvasElement);

    // Create a ground for the pitch
    const ground = Matter.Bodies.rectangle(
      app.screen.width / 2,
      app.screen.height,
      app.screen.width,
      20,
      { isStatic: true }
    );
    Matter.World.add(engine.world, [ground]);

    // Create walls for the pitch boundaries
    const walls = [
      Matter.Bodies.rectangle(0, app.screen.height / 2, 10, app.screen.height, {
        isStatic: true,
      }),
      Matter.Bodies.rectangle(
        app.screen.width,
        app.screen.height / 2,
        10,
        app.screen.height,
        { isStatic: true }
      ),
      Matter.Bodies.rectangle(
        app.screen.width / 2,
        0,
        app.screen.width,
        10,
        { isStatic: true }
      ),
    ];
    Matter.World.add(engine.world, walls);
    bodiesRef.current = [...walls, ground];

    // Create a ball
    const ball = Matter.Bodies.circle(app.screen.width / 2, app.screen.height / 2, 8, {
      restitution: 0.8,
      friction: 0.01,
      frictionAir: 0.01,
    });
    Matter.World.add(engine.world, [ball]);
    bodiesRef.current.push(ball);

    // Create a sprite for the ball
    const ballSprite = new PIXI.Graphics();
    ballSprite.beginFill(0xffffff);
    ballSprite.drawCircle(0, 0, 8);
    ballSprite.endFill();
    app.stage.addChild(ballSprite);
    spritesRef.current.push(ballSprite);

    // Create players (simplified for now)
    const homeTeamColor = 0xff0000;
    const awayTeamColor = 0x0000ff;

    // Add 5 home players
    for (let i = 0; i < 5; i++) {
      const x = app.screen.width * 0.3 + Math.random() * 100;
      const y = app.screen.height * 0.3 + Math.random() * 100;
      const playerBody = Matter.Bodies.circle(x, y, 10, {
        restitution: 0.5,
        friction: 0.1,
        frictionAir: 0.05,
      });
      Matter.World.add(engine.world, [playerBody]);
      bodiesRef.current.push(playerBody);

      const playerSprite = new PIXI.Graphics();
      playerSprite.beginFill(homeTeamColor);
      playerSprite.drawCircle(0, 0, 10);
      playerSprite.endFill();
      app.stage.addChild(playerSprite);
      spritesRef.current.push(playerSprite);
    }

    // Add 5 away players
    for (let i = 0; i < 5; i++) {
      const x = app.screen.width * 0.7 + Math.random() * 100;
      const y = app.screen.height * 0.3 + Math.random() * 100;
      const playerBody = Matter.Bodies.circle(x, y, 10, {
        restitution: 0.5,
        friction: 0.1,
        frictionAir: 0.05,
      });
      Matter.World.add(engine.world, [playerBody]);
      bodiesRef.current.push(playerBody);

      const playerSprite = new PIXI.Graphics();
      playerSprite.beginFill(awayTeamColor);
      playerSprite.drawCircle(0, 0, 10);
      playerSprite.endFill();
      app.stage.addChild(playerSprite);
      spritesRef.current.push(playerSprite);
    }

    // Draw pitch lines
    const pitchLines = new PIXI.Graphics();
    pitchLines.lineStyle(2, 0xffffff);
    pitchLines.drawRect(0, 0, app.screen.width, app.screen.height);
    pitchLines.moveTo(app.screen.width / 2, 0);
    pitchLines.lineTo(app.screen.width / 2, app.screen.height);
    pitchLines.drawCircle(
      app.screen.width / 2,
      app.screen.height / 2,
      50
    );
    app.stage.addChild(pitchLines);

    // Animation loop
    let lastTime = 0;
    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      Matter.Engine.update(engine, delta);

      // Update sprites to match body positions
      for (let i = 0; i < bodiesRef.current.length; i++) {
        if (i < spritesRef.current.length) {
          spritesRef.current[i].x = bodiesRef.current[i].position.x;
          spritesRef.current[i].y = bodiesRef.current[i].position.y;
        }
      }

      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    // Start the match simulation
    setIsPlaying(true);
    const matchTimer = setInterval(() => {
      setTime((prev) => {
        if (prev >= 90) {
          clearInterval(matchTimer);
          setIsPlaying(false);
          return 90;
        }
        return prev + 1;
      });
    }, 1000);

    // Cleanup
    return () => {
      clearInterval(matchTimer);
      Matter.Engine.clear(engine);
      app.destroy(true);
    };
  }, [match, homeClub, awayClub]);

  if (!match || !homeClub || !awayClub) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-8">
        <p className="text-center">No match selected.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="p-4">
        {/* Match Info */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-8 rounded"
              style={{ backgroundColor: homeClub.homeKitColor }}
            ></div>
            <span className="font-bold">{homeClub.name}</span>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {score.home} - {score.away}
            </p>
            <p className="text-sm">{time}'</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-bold">{awayClub.name}</span>
            <div
              className="w-12 h-8 rounded"
              style={{ backgroundColor: awayClub.homeKitColor }}
            ></div>
          </div>
        </div>

        {/* Pitch */}
        <div
          ref={pitchRef}
          className="w-full h-[calc(100vh-150px)] bg-green-600 relative"
        ></div>

        {/* Controls */}
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => {
              // Simulate a goal
              setScore((prev) => ({
                ...prev,
                home: prev.home + 1,
              }));
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Test Goal
          </button>
        </div>
      </div>
    </main>
  );
}
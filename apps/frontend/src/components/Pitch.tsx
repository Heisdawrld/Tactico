"use client";

import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

export default function Pitch() {
  const pitchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pitchRef.current) return;

    // Create the PixiJS application
    const app = new PIXI.Application({
      width: pitchRef.current.clientWidth,
      height: pitchRef.current.clientHeight,
      backgroundColor: 0x2e7d32, // Green pitch
      antialias: true,
    });

    // Append the PixiJS canvas to the DOM
    pitchRef.current.appendChild(app.view as HTMLCanvasElement);

    // Draw the pitch boundary
    const pitch = new PIXI.Graphics();
    pitch.lineStyle(2, 0xffffff); // White lines
    pitch.drawRect(0, 0, app.screen.width, app.screen.height);
    app.stage.addChild(pitch);

    // Draw the center circle
    const centerCircle = new PIXI.Graphics();
    centerCircle.lineStyle(2, 0xffffff);
    centerCircle.drawCircle(
      app.screen.width / 2,
      app.screen.height / 2,
      50
    );
    app.stage.addChild(centerCircle);

    // Draw the center line
    const centerLine = new PIXI.Graphics();
    centerLine.lineStyle(2, 0xffffff);
    centerLine.moveTo(app.screen.width / 2, 0);
    centerLine.lineTo(app.screen.width / 2, app.screen.height);
    app.stage.addChild(centerLine);

    // Draw penalty areas (simplified)
    const penaltyArea = new PIXI.Graphics();
    penaltyArea.lineStyle(2, 0xffffff);
    penaltyArea.drawRect(
      app.screen.width * 0.1,
      app.screen.height * 0.3,
      app.screen.width * 0.3,
      app.screen.height * 0.4
    );
    penaltyArea.drawRect(
      app.screen.width * 0.6,
      app.screen.height * 0.3,
      app.screen.width * 0.3,
      app.screen.height * 0.4
    );
    app.stage.addChild(penaltyArea);

    // Cleanup function
    return () => {
      app.destroy(true);
    };
  }, []);

  return <div ref={pitchRef} className="w-full h-full" />;
}
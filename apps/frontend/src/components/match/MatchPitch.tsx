'use client';

import { useEffect, useRef } from 'react';
import { PhysicsEngine } from './PhysicsEngine';

export default function MatchPitch() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PhysicsEngine | null>(null);

  useEffect(() => {
    if (containerRef.current && !engineRef.current) {
      const engine = new PhysicsEngine();
      engineRef.current = engine;
      
      const initPromise = engine.init(containerRef.current);
      
      // Handle both sync (v7) and async (v8) init
      Promise.resolve(initPromise).then(() => {
        engine.addBall(525, 340);
        engine.addPlayer(200, 340);
        engine.addPlayer(850, 340);
      });
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <h1 className="text-3xl font-bold text-white mb-4">2D Physics Match Engine</h1>
      <div 
        ref={containerRef} 
        className="border-4 border-white shadow-2xl rounded-lg overflow-hidden"
      />
      <p className="text-gray-400 mt-4">Powered by Matter.js & PixiJS</p>
    </div>
  );
}
